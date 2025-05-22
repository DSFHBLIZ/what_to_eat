/**
 * 离线支持和同步队列模块
 * 管理离线状态下的API请求，并在网络恢复时自动同步
 */

import { eventBus } from '../core/eventBus';

/** 队列项状态 */
export enum QueueItemStatus {
  /** 等待中 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 成功 */
  SUCCESS = 'success',
  /** 失败 */
  FAILED = 'failed',
  /** 取消 */
  CANCELLED = 'cancelled'
}

/** 队列项结构 */
export interface QueueItem<T = any> {
  /** 唯一标识 */
  id: string;
  /** API请求URL */
  url: string;
  /** HTTP方法 */
  method: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: any;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 优先级 */
  priority: number;
  /** 状态 */
  status: QueueItemStatus;
  /** 创建时间 */
  createdAt: number;
  /** 上次尝试时间 */
  lastAttemptAt?: number;
  /** 完成时间 */
  completedAt?: number;
  /** 错误信息 */
  error?: Error;
  /** 响应数据 */
  response?: T;
  /** 冲突策略 */
  conflictStrategy: ConflictStrategy;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
}

/** 冲突策略 */
export enum ConflictStrategy {
  /** 覆盖服务器数据 */
  OVERWRITE = 'overwrite',
  /** 合并数据 */
  MERGE = 'merge',
  /** 保留最新 */
  KEEP_LATEST = 'keep_latest',
  /** 要求用户解决 */
  REQUIRE_USER_RESOLUTION = 'require_user_resolution'
}

/** 同步处理器选项 */
export interface OfflineQueueOptions {
  /** 存储键名 */
  storageKey?: string;
  /** 自动处理间隔 (毫秒) */
  processingInterval?: number;
  /** 默认最大重试次数 */
  defaultMaxRetries?: number;
  /** 默认冲突策略 */
  defaultConflictStrategy?: ConflictStrategy;
  /** 并发处理数量 */
  concurrentRequests?: number;
  /** 默认请求超时 (毫秒) */
  defaultTimeout?: number;
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 是否自动清理成功项 */
  autoCleanSuccessful?: boolean;
  /** 是否启用网络监听 */
  enableNetworkDetection?: boolean;
  /** 是否启用后台同步 */
  enableBackgroundSync?: boolean;
  /** 是否压缩存储 */
  compressStorage?: boolean;
}

/** 添加项配置 */
export interface AddQueueItemOptions {
  /** 优先级 */
  priority?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 冲突策略 */
  conflictStrategy?: ConflictStrategy;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
}

/** 错误类型 */
export class OfflineQueueError extends Error {
  /** 原始错误 */
  originalError?: Error;
  /** 队列项ID */
  itemId?: string;
  /** 状态码 */
  statusCode?: number;

  constructor(message: string, options?: { originalError?: Error; itemId?: string; statusCode?: number }) {
    super(message);
    this.name = 'OfflineQueueError';
    this.originalError = options?.originalError;
    this.itemId = options?.itemId;
    this.statusCode = options?.statusCode;
  }
}

/**
 * 离线队列管理器
 */
export class OfflineQueueManager {
  /** 队列项集合 */
  private queue: Map<string, QueueItem> = new Map();
  /** 是否在线 */
  private isOnline: boolean = navigator.onLine;
  /** 是否暂停 */
  private isPaused: boolean = false;
  /** 是否正在处理 */
  private isProcessing: boolean = false;
  /** 处理定时器ID */
  private processingTimer: number | null = null;
  /** 配置选项 */
  private options: Required<OfflineQueueOptions>;
  /** 网络监听器已添加 */
  private networkListenersAdded: boolean = false;

  /** 默认配置 */
  private static readonly DEFAULT_OPTIONS: Required<OfflineQueueOptions> = {
    storageKey: 'offline_queue',
    processingInterval: 60000, // 1分钟
    defaultMaxRetries: 3,
    defaultConflictStrategy: ConflictStrategy.KEEP_LATEST,
    concurrentRequests: 3,
    defaultTimeout: 30000, // 30秒
    autoStart: true,
    autoCleanSuccessful: true,
    enableNetworkDetection: true,
    enableBackgroundSync: false,
    compressStorage: false
  };

  /**
   * 创建离线队列管理器
   * @param options 配置选项
   */
  constructor(options: OfflineQueueOptions = {}) {
    this.options = { ...OfflineQueueManager.DEFAULT_OPTIONS, ...options };
    
    // 从本地存储加载队列
    this.loadFromStorage();

    // 添加网络监听器
    if (this.options.enableNetworkDetection) {
      this.setupNetworkListeners();
    }

    // 自动启动处理
    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * 设置网络监听器
   */
  private setupNetworkListeners(): void {
    if (this.networkListenersAdded || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);
    this.networkListenersAdded = true;
  }

  /**
   * 处理网络状态变更
   */
  private handleNetworkChange = (): void => {
    const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (this.isOnline !== isOnlineNow) {
      this.isOnline = isOnlineNow;
      
      // 触发网络状态变化事件
      eventBus.emit('offlineQueue:network-status-changed', { isOnline: this.isOnline });
      
      // 如果恢复在线，自动处理队列
      if (this.isOnline && !this.isPaused) {
        this.processQueue();
      }
    }
  };

  /**
   * 添加请求到队列
   * @param url API请求URL
   * @param method HTTP方法
   * @param options 配置选项
   * @param headers 请求头
   * @param body 请求体
   * @returns 队列项ID
   */
  public addToQueue(
    url: string,
    method: string,
    options: AddQueueItemOptions = {},
    headers?: Record<string, string>,
    body?: any
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const item: QueueItem = {
      id,
      url,
      method,
      headers,
      body,
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.options.defaultMaxRetries,
      priority: options.priority ?? 0,
      status: QueueItemStatus.PENDING,
      createdAt: Date.now(),
      conflictStrategy: options.conflictStrategy ?? this.options.defaultConflictStrategy,
      metadata: options.metadata
    };

    this.queue.set(id, item);
    this.saveToStorage();

    eventBus.emit('offlineQueue:item-added', { item });

    // 如果在线且未暂停，尝试立即处理
    if (this.isOnline && !this.isPaused && !this.isProcessing) {
      this.processQueue();
    }

    return id;
  }

  /**
   * 更新队列项状态
   * @param id 队列项ID
   * @param status 新状态
   * @param data 附加数据
   */
  private updateItemStatus(id: string, status: QueueItemStatus, data?: Partial<QueueItem>): void {
    const item = this.queue.get(id);
    
    if (item) {
      const oldStatus = item.status;
      
      item.status = status;
      
      if (data) {
        Object.assign(item, data);
      }

      if (status === QueueItemStatus.SUCCESS || status === QueueItemStatus.CANCELLED) {
        item.completedAt = Date.now();
      }

      eventBus.emit('offlineQueue:item-status-changed', { 
        id, 
        oldStatus, 
        newStatus: status,
        item 
      });

      this.saveToStorage();
    }
  }

  /**
   * 从队列中移除项
   * @param id 队列项ID
   * @returns 是否成功移除
   */
  public removeItem(id: string): boolean {
    const item = this.queue.get(id);
    
    if (item) {
      this.queue.delete(id);
      this.saveToStorage();
      
      eventBus.emit('offlineQueue:item-removed', { id, item });
      return true;
    }
    
    return false;
  }

  /**
   * 获取队列项
   * @param id 队列项ID
   * @returns 队列项
   */
  public getItem(id: string): QueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * 获取所有队列项
   * @returns 队列项列表
   */
  public getAllItems(): QueueItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * 获取特定状态的队列项
   * @param status 状态
   * @returns 队列项列表
   */
  public getItemsByStatus(status: QueueItemStatus): QueueItem[] {
    return this.getAllItems().filter(item => item.status === status);
  }

  /**
   * 获取队列长度
   * @returns 队列长度
   */
  public getQueueLength(): number {
    return this.queue.size;
  }

  /**
   * 清空队列
   */
  public clearQueue(): void {
    this.queue.clear();
    this.saveToStorage();
  }

  /**
   * 清理已完成的项
   */
  public clearCompleted(): void {
    let hasChanges = false;
    
    this.getAllItems().forEach(item => {
      if (item.status === QueueItemStatus.SUCCESS || item.status === QueueItemStatus.CANCELLED) {
        this.queue.delete(item.id);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveToStorage();
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const serialized = JSON.stringify(Array.from(this.queue.entries()));
        localStorage.setItem(this.options.storageKey, serialized);
      } catch (error) {
        console.error('Failed to save offline queue to storage:', error);
      }
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const serialized = localStorage.getItem(this.options.storageKey);
        
        if (serialized) {
          const entries = JSON.parse(serialized);
          this.queue = new Map(entries);
        }
      } catch (error) {
        console.error('Failed to load offline queue from storage:', error);
      }
    }
  }

  /**
   * 处理队列
   */
  private processQueue = async (): Promise<void> => {
    // 检查条件
    if (!this.isOnline || this.isPaused || this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    eventBus.emit('offlineQueue:processing-started');
    
    try {
      // 获取待处理的项
      const pendingItems = this.getAllItems()
        .filter(item => item.status === QueueItemStatus.PENDING)
        .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);

      if (pendingItems.length === 0) {
        this.isProcessing = false;
        eventBus.emit('offlineQueue:processing-completed', { processed: 0, succeeded: 0, failed: 0 });
        return;
      }
      
      // 处理队列
      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      
      // 根据并发请求设置，确定批量处理的大小
      const batchSize = this.options.concurrentRequests;
      
      // 分批处理队列
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        
        // 并行处理批次中的项
        const results = await Promise.allSettled(
          batch.map(item => this.processItem(item))
        );
        
        processed += batch.length;
        
        // 统计成功和失败的数量
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value === true) {
            succeeded++;
          } else {
            failed++;
          }
        });
        
        // 如果暂停或离线，停止处理
        if (this.isPaused || !this.isOnline) {
          break;
        }
      }
      
      this.isProcessing = false;
      eventBus.emit('offlineQueue:processing-completed', { 
        processed, 
        succeeded, 
        failed 
      });
    } catch (error) {
      console.error('Failed to process queue:', error);
      this.isProcessing = false;
      eventBus.emit('offlineQueue:processing-completed', { 
        processed: 0, 
        succeeded: 0, 
        failed: 0
      });
    }
  }

  /**
   * 处理单个队列项
   * @param item 队列项
   * @returns 是否处理成功
   */
  private async processItem(item: QueueItem): Promise<boolean> {
    try {
      // 更新为处理中状态
      this.updateItemStatus(item.id, QueueItemStatus.PROCESSING, {
        lastAttemptAt: Date.now()
      });

      // 创建请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.options.defaultTimeout);

      // 发送请求
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body ? JSON.stringify(item.body) : undefined,
        signal: controller.signal
      });

      // 清除超时
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new OfflineQueueError(`HTTP error ${response.status}`, {
          statusCode: response.status,
          itemId: item.id
        });
      }

      // 解析响应
      const responseData = await response.json();

      // 更新为成功状态
      this.updateItemStatus(item.id, QueueItemStatus.SUCCESS, {
        response: responseData
      });

      return true;
    } catch (error) {
      // 增加重试计数
      const retryCount = (item.retryCount || 0) + 1;
      
      // 检查是否达到最大重试次数
      if (retryCount <= item.maxRetries) {
        // 更新重试计数，状态保持为PENDING
        this.updateItemStatus(item.id, QueueItemStatus.PENDING, {
          retryCount,
          error: error instanceof Error ? error : new Error(String(error))
        });
      } else {
        // 达到最大重试次数，标记为失败
        this.updateItemStatus(item.id, QueueItemStatus.FAILED, {
          error: error instanceof Error ? error : new Error(String(error))
        });
      }

      return false;
    }
  }

  /**
   * 启动队列处理
   */
  public start(): void {
    this.isPaused = false;
    
    // 清除现有定时器
    if (this.processingTimer !== null) {
      clearInterval(this.processingTimer);
    }

    // 立即处理一次
    if (this.isOnline) {
      this.processQueue();
    }

    // 设置定期处理
    this.processingTimer = window.setInterval(() => {
      if (this.isOnline && !this.isPaused) {
        this.processQueue();
      }
    }, this.options.processingInterval);
  }

  /**
   * 暂停队列处理
   */
  public pause(): void {
    this.isPaused = true;
    
    if (this.processingTimer !== null) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }

  /**
   * 恢复队列处理
   */
  public resume(): void {
    this.start();
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.pause();
    
    // 移除网络监听器
    if (this.networkListenersAdded && typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleNetworkChange);
      window.removeEventListener('offline', this.handleNetworkChange);
      this.networkListenersAdded = false;
    }
  }
}

/**
 * 创建离线队列管理器
 * @param options 配置选项
 * @returns 离线队列管理器实例
 */
export function createOfflineQueue(options?: OfflineQueueOptions): OfflineQueueManager {
  return new OfflineQueueManager(options);
}

/**
 * 使用示例:
 * 
 * ```typescript
 * // 创建离线队列管理器
 * const offlineQueue = createOfflineQueue({
 *   processingInterval: 30000, // 30秒
 *   defaultMaxRetries: 5,
 *   concurrentRequests: 2
 * });
 * 
 * // 添加请求到队列
 * const itemId = offlineQueue.addToQueue(
 *   'https://api.example.com/recipes',
 *   'POST',
 *   { priority: 10 },
 *   { 'Content-Type': 'application/json' },
 *   { name: '红烧肉', ingredients: ['五花肉', '酱油', '糖'] }
 * );
 * 
 * // 监听队列状态变化
 * eventBus.on('offlineQueue:item-status-changed', (data) => {
 *   console.log(`Item ${data.id} changed from ${data.oldStatus} to ${data.newStatus}`);
 *   
 *   if (data.newStatus === QueueItemStatus.SUCCESS) {
 *     console.log('Request completed successfully:', data.item.response);
 *   }
 * });
 * 
 * // 监听网络状态变化
 * eventBus.on('offlineQueue:network-status-changed', (data) => {
 *   console.log(`Network is ${data.isOnline ? 'online' : 'offline'}`);
 * });
 * 
 * // 暂停和恢复
 * function toggleProcessing(enabled: boolean) {
 *   if (enabled) {
 *     offlineQueue.resume();
 *   } else {
 *     offlineQueue.pause();
 *   }
 * }
 * 
 * // 获取队列状态
 * function getQueueStats() {
 *   const all = offlineQueue.getAllItems();
 *   const pending = offlineQueue.getItemsByStatus(QueueItemStatus.PENDING);
 *   const failed = offlineQueue.getItemsByStatus(QueueItemStatus.FAILED);
 *   
 *   return {
 *     total: all.length,
 *     pending: pending.length,
 *     failed: failed.length
 *   };
 * }
 * 
 * // 手动处理队列
 * async function syncNow() {
 *   await offlineQueue.processQueue();
 * }
 * 
 * // 销毁队列（组件卸载时）
 * function cleanup() {
 *   offlineQueue.destroy();
 * }
 * ```
 */ 