/**
 * 状态同步器工具
 * 用于安全地处理React组件间的状态同步和防止异步竞态条件
 */

import { useRef, useEffect, useCallback } from 'react';
import { logError, logWarning } from '../common/errorLogger';

// 全局请求限流控制
const globalRequestCounter = {
  active: 0,
  maxConcurrent: 3,
  queued: new Map<string, (() => void)[]>()
};

/**
 * 用于管理可取消的请求，防止内存泄漏和请求堆积
 * @returns 一组用于创建和管理可取消请求的函数
 */
export function useCancellableRequests() {
  // 使用ref存储所有活跃的AbortController实例
  const activeRequestsRef = useRef<Map<string, AbortController>>(new Map());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // 清理函数 - 组件卸载时取消所有请求
  useEffect(() => {
    return () => {
      cancelAllRequests();
      // 清理所有防抖定时器
      debounceTimersRef.current.forEach(timer => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, []);
  
  /**
   * 创建防抖请求
   * @param requestId 请求的唯一标识符
   * @param requestFn 执行请求的函数
   * @param debounceMs 防抖时间(毫秒)
   * @returns 请求结果的Promise
   */
  const createDebouncedRequest = useCallback(<T>(
    requestId: string,
    requestFn: (signal: AbortSignal) => Promise<T>,
    debounceMs: number = 300
  ): Promise<T> => {
    // 取消同ID的已有请求和防抖定时器
    cancelRequest(requestId);
    
    if (debounceTimersRef.current.has(requestId)) {
      clearTimeout(debounceTimersRef.current.get(requestId)!);
    }
    
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        debounceTimersRef.current.delete(requestId);
        
        // 检查是否已达到最大并发数
        if (globalRequestCounter.active >= globalRequestCounter.maxConcurrent) {
          // 将请求加入队列
          if (!globalRequestCounter.queued.has(requestId)) {
            globalRequestCounter.queued.set(requestId, []);
          }
          
          globalRequestCounter.queued.get(requestId)!.push(() => {
            executeRequest(requestId, requestFn).then(resolve).catch(reject);
          });
          return;
        }
        
        executeRequest(requestId, requestFn).then(resolve).catch(reject);
      }, debounceMs);
      
      debounceTimersRef.current.set(requestId, timer);
    });
  }, []);
  
  /**
   * 执行请求，管理AbortController
   */
  const executeRequest = useCallback(async <T>(
    requestId: string,
    requestFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    // 增加活跃请求计数
    globalRequestCounter.active++;
    
    // 创建新的AbortController
    const controller = new AbortController();
    activeRequestsRef.current.set(requestId, controller);
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      if (activeRequestsRef.current.has(requestId)) {
        controller.abort('请求超时');
        activeRequestsRef.current.delete(requestId);
        
        // 确保超时时减少活跃请求计数
        globalRequestCounter.active = Math.max(0, globalRequestCounter.active - 1);
        
        // 处理队列中的下一个请求
        processNextQueuedRequest();
      }
    }, 30000); // 30秒超时
    
    try {
      // 执行请求
      const result = await requestFn(controller.signal);
      return result;
    } catch (error) {
      throw error;
    } finally {
      // 请求完成，清理
      clearTimeout(timeoutId);
      activeRequestsRef.current.delete(requestId);
      
      // 减少活跃请求计数
      globalRequestCounter.active = Math.max(0, globalRequestCounter.active - 1);
      
      // 处理队列中的下一个请求
      processNextQueuedRequest();
    }
  }, []);
  
  /**
   * 处理队列中的下一个请求
   */
  const processNextQueuedRequest = useCallback(() => {
    if (globalRequestCounter.active < globalRequestCounter.maxConcurrent && 
        globalRequestCounter.queued.size > 0) {
      // 获取第一个队列
      const firstKey = Array.from(globalRequestCounter.queued.keys())[0];
      const callbacks = globalRequestCounter.queued.get(firstKey)!;
      
      if (callbacks.length > 0) {
        // 取出第一个回调并执行
        const callback = callbacks.shift()!;
        callback();
        
        // 如果没有更多回调，删除这个键
        if (callbacks.length === 0) {
          globalRequestCounter.queued.delete(firstKey);
        }
      }
    }
  }, []);
  
  /**
   * 创建一个新的请求，并返回AbortSignal
   * @param requestId 请求的唯一标识符
   * @param timeoutMs 超时时间(毫秒)，默认为30秒
   * @returns 包含signal的对象，用于fetch请求
   */
  const createRequest = useCallback((requestId: string, timeoutMs: number = 30000) => {
    // 取消同ID的已有请求
    cancelRequest(requestId);
    
    // 创建新的AbortController
    const controller = new AbortController();
    activeRequestsRef.current.set(requestId, controller);
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      if (activeRequestsRef.current.has(requestId)) {
        controller.abort('请求超时');
        activeRequestsRef.current.delete(requestId);
      }
    }, timeoutMs);
    
    // 当请求完成或取消时，清除超时定时器
    const originalAbort = controller.abort;
    controller.abort = function(reason?: any) {
      clearTimeout(timeoutId);
      return originalAbort.call(this, reason);
    };
    
    return { signal: controller.signal };
  }, []);
  
  /**
   * 取消特定ID的请求
   * @param requestId 请求的唯一标识符
   */
  const cancelRequest = useCallback((requestId: string) => {
    const controller = activeRequestsRef.current.get(requestId);
    if (controller) {
      controller.abort('用户取消请求');
      activeRequestsRef.current.delete(requestId);
    }
    
    // 同时从队列中删除
    if (globalRequestCounter.queued.has(requestId)) {
      globalRequestCounter.queued.delete(requestId);
    }
  }, []);
  
  /**
   * 取消所有活跃的请求
   */
  const cancelAllRequests = useCallback(() => {
    activeRequestsRef.current.forEach((controller, id) => {
      controller.abort('取消所有请求');
    });
    activeRequestsRef.current.clear();
    
    // 清空队列
    globalRequestCounter.queued.clear();
  }, []);
  
  return {
    createRequest,
    createDebouncedRequest,
    executeRequest,
    cancelRequest,
    cancelAllRequests,
    getActiveRequestCount: () => activeRequestsRef.current.size
  };
}

/**
 * 用于防止竞态条件，确保只处理最新请求的结果
 * @returns 一组用于管理竞态条件安全的函数
 */
export function useRaceConditionSafety() {
  // 使用递增的计数器标识最新的请求
  const requestCounterRef = useRef(0);
  const latestRequestIdRef = useRef(0);
  
  /**
   * 包装异步操作，确保只处理最新请求的结果
   * @param asyncOperation 要执行的异步操作
   * @returns 异步操作的结果，如果请求已过时则抛出异常
   */
  const safeguardRequest = useCallback(async <T>(asyncOperation: () => Promise<T>): Promise<T> => {
    // 为这个操作分配一个新的请求ID
    const thisRequestId = ++requestCounterRef.current;
    latestRequestIdRef.current = thisRequestId;
    
    try {
      // 执行实际的异步操作
      const result = await asyncOperation();
      
      // 检查这个请求是否仍然是最新的
      if (thisRequestId !== latestRequestIdRef.current) {
        throw new Error('OUTDATED_REQUEST');
      }
      
      return result;
    } catch (error) {
      // 如果这不是最新的请求，或者是OUTDATED_REQUEST错误，则向上传播错误
      if (thisRequestId !== latestRequestIdRef.current || 
          (error instanceof Error && error.message === 'OUTDATED_REQUEST')) {
        throw new Error('OUTDATED_REQUEST');
      }
      // 否则，向上传播原始错误
      throw error;
    }
  }, []);
  
  return { safeguardRequest };
}

/**
 * 用于在相关组件之间安全地共享和同步状态
 * @param stateKey 用于标识共享状态的唯一键
 * @param initialValue 初始状态值
 * @returns 一组用于管理共享状态的函数和当前状态值
 */
export function useSharedState<T>(stateKey: string, initialValue: T) {
  // 使用ref存储当前状态值
  const valueRef = useRef<T>(initialValue);
  
  // 事件名称
  const updateEventName = `shared-state-update:${stateKey}`;
  
  // 初始化 - 尝试从sessionStorage获取已存在的状态
  useEffect(() => {
    try {
      const storedValue = sessionStorage.getItem(`shared-state:${stateKey}`);
      if (storedValue) {
        const parsedValue = JSON.parse(storedValue) as T;
        valueRef.current = parsedValue;
      }
    } catch (error) {
      console.error(`读取共享状态'${stateKey}'失败:`, error);
    }
    
    // 设置事件监听器以接收其他组件的更新
    const handleStateUpdate = (event: CustomEvent) => {
      try {
        const newValue = event.detail;
        valueRef.current = newValue;
        
        // 更新sessionStorage
        sessionStorage.setItem(`shared-state:${stateKey}`, JSON.stringify(newValue));
      } catch (error) {
        console.error(`处理共享状态'${stateKey}'更新失败:`, error);
      }
    };
    
    // 添加事件监听器
    window.addEventListener(updateEventName, handleStateUpdate as EventListener);
    
    // 清理函数
    return () => {
      window.removeEventListener(updateEventName, handleStateUpdate as EventListener);
    };
  }, [stateKey, updateEventName]);
  
  /**
   * 更新共享状态值
   * @param newValue 新的状态值或基于当前值的更新函数
   */
  const updateValue = useCallback((newValue: T | ((prevValue: T) => T)) => {
    try {
      // 计算新状态值
      const updatedValue = typeof newValue === 'function'
        ? (newValue as Function)(valueRef.current)
        : newValue;
      
      // 更新本地ref
      valueRef.current = updatedValue;
      
      // 更新sessionStorage
      sessionStorage.setItem(`shared-state:${stateKey}`, JSON.stringify(updatedValue));
      
      // 创建并分发自定义事件，通知其他组件
      const event = new CustomEvent(updateEventName, { detail: updatedValue });
      window.dispatchEvent(event);
    } catch (error) {
      console.error(`更新共享状态'${stateKey}'失败:`, error);
    }
  }, [stateKey, updateEventName]);
  
  return {
    value: valueRef.current,
    updateValue,
    resetValue: () => updateValue(initialValue)
  };
}

/**
 * 对对象进行深拷贝，防止引用问题
 * @param obj 要深拷贝的对象
 * @returns 深拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  try {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('深拷贝对象失败:', error);
    // 如果深拷贝失败，返回原始对象（不安全，但作为降级方案）
    return obj;
  }
}

/**
 * 创建一个带有超时功能的Promise
 * @param promise 原始Promise
 * @param timeoutMs 超时时间(毫秒)
 * @param errorMessage 超时错误消息
 * @returns 带有超时功能的Promise
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 10000, 
  errorMessage: string = '操作超时'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
    
    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * 创建一个带有重试功能的Promise
 * @param promiseFactory 返回Promise的函数
 * @param maxRetries 最大重试次数
 * @param backoffFactor 退避因子，每次重试等待时间会乘以这个因子
 * @param initialDelayMs 初始重试延迟(毫秒)
 * @returns 带有重试功能的Promise
 */
export function withRetry<T>(
  promiseFactory: () => Promise<T>,
  maxRetries: number = 3,
  backoffFactor: number = 1.5,
  initialDelayMs: number = 1000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const attempt = (retryCount: number) => {
      promiseFactory()
        .then(resolve)
        .catch(error => {
          if (retryCount < maxRetries) {
            const delay = initialDelayMs * Math.pow(backoffFactor, retryCount);
            console.log(`操作失败，${delay}ms后第${retryCount + 1}次重试:`, error);
            
            setTimeout(() => attempt(retryCount + 1), delay);
          } else {
            reject(error);
          }
        });
    };
    
    attempt(0);
  });
}

export default {
  useCancellableRequests,
  useRaceConditionSafety,
  useSharedState,
  deepClone,
  withTimeout,
  withRetry
}; 