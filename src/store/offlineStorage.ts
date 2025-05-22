import { type StateCreator, type StoreMutatorIdentifier } from 'zustand';
import { eventBus } from '../core/eventBus';

// 离线操作队列存储键
const OFFLINE_QUEUE_KEY = 'what_to_eat_offline_queue';

// 离线操作类型
export interface OfflineOperation {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

// 离线存储选项
export interface OfflineStorageOptions {
  /**
   * 最大重试次数
   */
  maxRetries?: number;
  
  /**
   * 重试延迟基数（毫秒）
   */
  retryDelayBase?: number;
  
  /**
   * 最大队列长度
   */
  maxQueueLength?: number;
  
  /**
   * 自定义存储键
   */
  storageKey?: string;
  
  /**
   * 操作处理器
   */
  operationHandlers?: Record<string, (payload: any) => Promise<any>>;
  
  /**
   * 是否在初始化时自动尝试处理队列
   */
  autoProcess?: boolean;
  
  /**
   * 是否启用网络状态监听
   */
  enableNetworkListener?: boolean;
}

/**
 * 离线状态中间件
 * 用于在离线状态下缓存用户操作，在网络恢复后自动执行
 */
export const offlineStorage = <
  T extends { offlineQueue: OfflineOperation[] },
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  options: OfflineStorageOptions = {}
) => {
  const {
    maxRetries = 5,
    retryDelayBase = 1000,
    maxQueueLength = 100,
    storageKey = OFFLINE_QUEUE_KEY,
    operationHandlers = {},
    autoProcess = true,
    enableNetworkListener = true,
  } = options;

  // 是否正在处理队列
  let isProcessingQueue = false;
  // 是否在线
  let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    f: StateCreator<T, Mps, Mcs>,
    get: () => T,
    api: { setState: (state: Partial<T>) => void; getState: () => T }
  ): StateCreator<T, Mps, Mcs> => {
    // 从localStorage加载队列
    if (typeof window !== 'undefined') {
      try {
        const storedQueue = localStorage.getItem(storageKey);
        if (storedQueue) {
          const queue = JSON.parse(storedQueue) as OfflineOperation[];
          api.setState({ offlineQueue: queue } as Partial<T>);
        }
      } catch (err) {
        console.error('加载离线操作队列失败', err);
        // 如果加载失败，初始化为空队列
        api.setState({ offlineQueue: [] } as unknown as Partial<T>);
      }
    }

    // 设置网络状态监听器
    if (typeof window !== 'undefined' && enableNetworkListener) {
      window.addEventListener('online', async () => {
        isOnline = true;
        // 网络恢复时触发事件
        eventBus.emit('network:online');
        // 自动处理队列
        if (autoProcess) {
          await processQueue();
        }
      });

      window.addEventListener('offline', () => {
        isOnline = false;
        // 网络断开时触发事件
        eventBus.emit('network:offline');
      });
    }

    /**
     * 将操作添加到离线队列
     */
    const addToOfflineQueue = (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => {
      const state = get();
      const { offlineQueue } = state;

      // 创建完整的操作记录
      const newOperation: OfflineOperation = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...operation,
        timestamp: Date.now(),
        retryCount: 0,
      };

      // 添加到队列
      const newQueue = [...offlineQueue, newOperation];

      // 如果队列超过最大长度，移除最旧的操作
      const trimmedQueue = newQueue.length > maxQueueLength 
        ? newQueue.slice(-maxQueueLength) 
        : newQueue;

      // 更新状态
      api.setState({ offlineQueue: trimmedQueue } as Partial<T>);

      // 保存到localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(trimmedQueue));
      } catch (err) {
        console.error('保存离线队列失败', err);
      }

      // 如果在线且启用了自动处理，尝试处理队列
      if (isOnline && autoProcess) {
        processQueue();
      }

      return newOperation.id;
    };

    /**
     * 从队列中移除操作
     */
    const removeFromOfflineQueue = (operationId: string) => {
      const state = get();
      const { offlineQueue } = state;

      // 过滤掉要移除的操作
      const newQueue = offlineQueue.filter(op => op.id !== operationId);

      // 更新状态
      api.setState({ offlineQueue: newQueue } as Partial<T>);

      // 保存到localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(newQueue));
      } catch (err) {
        console.error('保存离线队列失败', err);
      }
    };

    /**
     * 处理离线操作队列
     */
    const processQueue = async () => {
      // 如果已经在处理队列或不在线，退出
      if (isProcessingQueue || !isOnline) return;

      isProcessingQueue = true;
      eventBus.emit('offlineQueue:processing', { started: Date.now() });

      try {
        const state = get();
        const { offlineQueue } = state;

        // 如果队列为空，直接退出
        if (offlineQueue.length === 0) {
          isProcessingQueue = false;
          return;
        }

        // 逐个处理队列中的操作
        for (let i = 0; i < offlineQueue.length; i++) {
          const operation = offlineQueue[i];
          const handler = operationHandlers[operation.type];

          // 如果没有对应的处理器，跳过
          if (!handler) {
            console.warn(`未找到操作类型的处理器: ${operation.type}`);
            continue;
          }

          try {
            // 尝试执行操作
            await handler(operation.payload);
            // 执行成功，从队列中移除
            removeFromOfflineQueue(operation.id);
          } catch (err) {
            console.error(`处理离线操作失败: ${operation.type}`, err);
            
            // 增加重试计数
            const updatedOperation = {
              ...operation,
              retryCount: operation.retryCount + 1,
            };

            // 如果超过最大重试次数，从队列中移除
            if (updatedOperation.retryCount > maxRetries) {
              removeFromOfflineQueue(operation.id);
              eventBus.emit('offlineQueue:operationFailed', { 
                operation, 
                error: err 
              });
            } else {
              // 更新重试计数
              const newQueue = [...offlineQueue];
              newQueue[i] = updatedOperation;
              api.setState({ offlineQueue: newQueue } as Partial<T>);
              
              // 保存到localStorage
              try {
                localStorage.setItem(storageKey, JSON.stringify(newQueue));
              } catch (saveErr) {
                console.error('保存离线队列失败', saveErr);
              }
              
              // 指数退避重试延迟
              const retryDelay = retryDelayBase * Math.pow(2, updatedOperation.retryCount - 1);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
      } finally {
        isProcessingQueue = false;
        eventBus.emit('offlineQueue:processed', { finished: Date.now() });
      }
    };

    return (...args) => {
      // 调用原始状态创建函数
      const result = f(...(args as Parameters<typeof f>));

      // 添加离线队列方法到store
      Object.assign(result, {
        addToOfflineQueue,
        removeFromOfflineQueue,
        processOfflineQueue: processQueue,
      });

      return result;
    };
  };
};

/**
 * 创建离线操作队列的简化方法
 */
export const createOfflineOperation = (
  type: string, 
  payload: any
): Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'> => ({
  type,
  payload,
}); 