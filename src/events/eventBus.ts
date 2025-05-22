/**
 * 领域事件总线
 * 基于类型安全的系统间通信机制
 */

import { DomainEventKey, DomainEventMap, EventHandler } from '../types/observability';
import { observability } from '../observability/core';

class DomainEventBus {
  private listeners: Map<DomainEventKey, Set<EventHandler<any>>> = new Map();
  private middlewares: Array<(eventName: DomainEventKey, event: any) => void> = [];
  private eventHistory: Array<{ eventName: DomainEventKey; event: any; timestamp: number }> = [];
  private maxEventHistory: number = 100;
  private isDebugMode: boolean = process.env.NODE_ENV !== 'production';
  
  /**
   * 添加事件中间件
   * @param middleware 事件中间件函数
   * @returns 移除中间件的函数
   */
  addMiddleware(middleware: (eventName: DomainEventKey, event: any) => void): () => void {
    this.middlewares.push(middleware);
    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index !== -1) {
        this.middlewares.splice(index, 1);
      }
    };
  }
  
  /**
   * 订阅领域事件
   * @param eventName 事件名称
   * @param handler 事件处理函数
   * @returns 取消订阅的函数
   */
  on<K extends DomainEventKey>(
    eventName: K,
    handler: EventHandler<DomainEventMap[K]>
  ): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    const handlers = this.listeners.get(eventName)!;
    handlers.add(handler);
    
    // 返回取消订阅的函数
    return () => {
      const handlers = this.listeners.get(eventName);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }
  
  /**
   * 一次性订阅领域事件
   * @param eventName 事件名称
   * @param handler 事件处理函数
   * @returns 取消订阅的函数
   */
  once<K extends DomainEventKey>(
    eventName: K,
    handler: EventHandler<DomainEventMap[K]>
  ): () => void {
    // 创建一个包装器，在调用一次后自动取消订阅
    const wrappedHandler: EventHandler<DomainEventMap[K]> = (event) => {
      // 先取消订阅，再调用处理函数
      unsubscribe();
      handler(event);
    };
    
    // 订阅包装后的处理函数
    const unsubscribe = this.on(eventName, wrappedHandler);
    return unsubscribe;
  }
  
  /**
   * 发布领域事件
   * @param eventName 事件名称
   * @param eventData 事件数据
   */
  emit<K extends DomainEventKey>(
    eventName: K,
    eventData: Omit<DomainEventMap[K], 'timestamp'> & { timestamp?: number }
  ): void {
    // 确保事件数据包含时间戳
    const event = {
      ...eventData,
      timestamp: eventData.timestamp || Date.now(),
    } as DomainEventMap[K];
    
    // 执行所有中间件
    for (const middleware of this.middlewares) {
      try {
        middleware(eventName, event);
      } catch (error) {
        console.error(`[EventBus] 中间件执行错误:`, error);
      }
    }
    
    // 添加到事件历史
    if (this.isDebugMode) {
      this.eventHistory.unshift({ 
        eventName, 
        event, 
        timestamp: event.timestamp 
      });
      
      // 限制历史记录大小
      if (this.eventHistory.length > this.maxEventHistory) {
        this.eventHistory = this.eventHistory.slice(0, this.maxEventHistory);
      }
    }
    
    // 发送到可观测性系统
    observability.emitEvent(eventName as string, event);
    
    // 获取事件的所有处理器
    const handlers = this.listeners.get(eventName);
    if (!handlers || handlers.size === 0) {
      return;
    }
    
    // 执行所有处理器
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`[EventBus] 事件处理错误 [${String(eventName)}]:`, error);
      }
    });
  }
  
  /**
   * 检查是否有特定事件的监听器
   * @param eventName 事件名称
   * @returns 是否有监听器
   */
  hasListeners(eventName: DomainEventKey): boolean {
    const handlers = this.listeners.get(eventName);
    return !!handlers && handlers.size > 0;
  }
  
  /**
   * 获取特定事件的监听器数量
   * @param eventName 事件名称
   * @returns 监听器数量
   */
  listenerCount(eventName: DomainEventKey): number {
    const handlers = this.listeners.get(eventName);
    return handlers ? handlers.size : 0;
  }
  
  /**
   * 获取所有已注册的事件名称
   * @returns 事件名称数组
   */
  eventNames(): DomainEventKey[] {
    return Array.from(this.listeners.keys());
  }
  
  /**
   * 获取事件历史
   * @param limit 限制返回的事件数量
   * @returns 事件历史记录
   */
  getEventHistory(limit?: number): Array<{ eventName: DomainEventKey; event: any; timestamp: number }> {
    return limit ? this.eventHistory.slice(0, limit) : [...this.eventHistory];
  }
  
  /**
   * 清除事件历史
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }
  
  /**
   * 设置事件历史的最大记录数
   * @param maxHistory 最大历史记录数
   */
  setMaxEventHistory(maxHistory: number): void {
    this.maxEventHistory = maxHistory;
    // 如果当前历史记录超过新的最大值，则裁剪
    if (this.eventHistory.length > maxHistory) {
      this.eventHistory = this.eventHistory.slice(0, maxHistory);
    }
  }
  
  /**
   * 设置调试模式
   * @param isDebug 是否为调试模式
   */
  setDebugMode(isDebug: boolean): void {
    this.isDebugMode = isDebug;
  }
  
  /**
   * 移除所有监听器
   * @param eventName 可选的事件名称，如不提供则移除所有事件的监听器
   */
  removeAllListeners(eventName?: DomainEventKey): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }
}

// 创建单例实例
export const domainEvents = new DomainEventBus(); 