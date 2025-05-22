/**
 * 全局请求管理器
 * 解决请求风暴、重复请求和竞态条件问题
 */

// 创建全局单例请求管理器
class RequestManager {
  private static instance: RequestManager;
  private activeRequests = new Map<string, AbortController>();
  private requestQueue = new Map<string, {
    priority: number,
    enqueueTime: number,
    execute: () => Promise<any>
  }>();
  private maxConcurrentRequests = 3; // 最大并发请求数
  private debounceTimeouts = new Map<string, NodeJS.Timeout>();
  private processingQueue = false;

  private constructor() {
    // 初始化
    this.processQueue = this.processQueue.bind(this);
  }

  public static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  /**
   * 创建具有防抖功能的请求
   * @param key 请求唯一标识
   * @param requestFn 请求函数
   * @param debounceMs 防抖延迟时间
   * @param priority 优先级（1最高）
   */
  public debounce<T>(
    key: string,
    requestFn: () => Promise<T>,
    debounceMs: number = 300,
    priority: number = 5
  ): Promise<T> {
    // 取消同名的等待请求
    if (this.debounceTimeouts.has(key)) {
      clearTimeout(this.debounceTimeouts.get(key)!);
    }

    return new Promise<T>((resolve, reject) => {
      // 创建新的防抖超时
      const timeout = setTimeout(() => {
        this.debounceTimeouts.delete(key);
        this.enqueueRequest(key, requestFn, priority)
          .then(resolve)
          .catch(reject);
      }, debounceMs);

      this.debounceTimeouts.set(key, timeout);
    });
  }

  /**
   * 将请求加入队列
   * @param key 请求唯一标识
   * @param requestFn 请求函数
   * @param priority 优先级（1最高）
   */
  public enqueueRequest<T>(
    key: string, 
    requestFn: () => Promise<T>,
    priority: number = 5
  ): Promise<T> {
    // 取消同名的活跃请求
    this.cancelRequest(key);
    
    return new Promise<T>((resolve, reject) => {
      // 包装请求函数
      const execute = async () => {
        try {
          const controller = new AbortController();
          this.activeRequests.set(key, controller);
          
          // 执行请求
          const result = await requestFn();
          
          // 请求完成后从活跃请求列表中移除
          this.activeRequests.delete(key);
          resolve(result);
          return result;
        } catch (error) {
          this.activeRequests.delete(key);
          reject(error);
          throw error;
        }
      };
      
      // 添加到队列
      this.requestQueue.set(key, {
        priority,
        enqueueTime: Date.now(),
        execute
      });
      
      // 处理队列
      this.processQueue();
    });
  }

  /**
   * 取消单个请求
   * @param key 请求唯一标识
   */
  public cancelRequest(key: string): void {
    // 取消防抖中的请求
    if (this.debounceTimeouts.has(key)) {
      clearTimeout(this.debounceTimeouts.get(key)!);
      this.debounceTimeouts.delete(key);
    }
    
    // 从队列中删除
    this.requestQueue.delete(key);
    
    // 如果是活跃请求则中止
    if (this.activeRequests.has(key)) {
      this.activeRequests.get(key)!.abort();
      this.activeRequests.delete(key);
    }
  }

  /**
   * 取消所有请求
   */
  public cancelAllRequests(): void {
    // 取消所有防抖的请求
    this.debounceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.debounceTimeouts.clear();
    
    // 清空队列
    this.requestQueue.clear();
    
    // 取消所有活跃请求
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }

  /**
   * 处理请求队列
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.size === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      // 检查是否可以执行更多请求
      while (
        this.activeRequests.size < this.maxConcurrentRequests && 
        this.requestQueue.size > 0
      ) {
        // 获取最高优先级的请求
        const nextRequest = this.getHighestPriorityRequest();
        if (!nextRequest) break;
        
        const [key, { execute }] = nextRequest;
        
        // 从队列中移除
        this.requestQueue.delete(key);
        
        // 异步执行请求，不等待完成
        execute().catch((err: Error) => {
          console.error(`请求${key}执行失败:`, err);
        });
      }
    } finally {
      this.processingQueue = false;
      
      // 如果队列中还有请求，并且有空闲的并发槽，继续处理
      if (
        this.requestQueue.size > 0 && 
        this.activeRequests.size < this.maxConcurrentRequests
      ) {
        this.processQueue();
      }
    }
  }

  /**
   * 获取优先级最高的请求
   */
  private getHighestPriorityRequest(): [string, any] | null {
    if (this.requestQueue.size === 0) {
      return null;
    }
    
    let highestPriority: number = Infinity;
    let earliestTime: number = Infinity;
    let selectedKey: string | null = null;
    
    // 找出优先级最高的请求
    this.requestQueue.forEach((request, key) => {
      if (
        request.priority < highestPriority || 
        (request.priority === highestPriority && request.enqueueTime < earliestTime)
      ) {
        highestPriority = request.priority;
        earliestTime = request.enqueueTime;
        selectedKey = key;
      }
    });
    
    if (selectedKey) {
      return [selectedKey, this.requestQueue.get(selectedKey)!];
    }
    
    return null;
  }
}

// 导出单例实例
export const requestManager = RequestManager.getInstance();

// 导出React Hook版本，方便在组件中使用
import { useCallback } from 'react';

export function useRequestManager() {
  const debounce = useCallback(<T>(
    key: string,
    requestFn: () => Promise<T>, 
    debounceMs?: number,
    priority?: number
  ) => {
    return requestManager.debounce(key, requestFn, debounceMs, priority);
  }, []);
  
  const enqueue = useCallback(<T>(
    key: string,
    requestFn: () => Promise<T>,
    priority?: number
  ) => {
    return requestManager.enqueueRequest(key, requestFn, priority);
  }, []);
  
  const cancel = useCallback((key: string) => {
    requestManager.cancelRequest(key);
  }, []);
  
  const cancelAll = useCallback(() => {
    requestManager.cancelAllRequests();
  }, []);
  
  return { debounce, enqueue, cancel, cancelAll };
} 