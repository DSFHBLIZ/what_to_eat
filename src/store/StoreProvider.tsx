'use client';

import { ReactNode, useRef, useEffect } from 'react';
import { useStore } from './store';
import { cleanupBrowserSync } from './syncMiddleware';
import { eventBus } from '../core/eventBus';

// StoreProvider属性接口
interface StoreProviderProps {
  children: ReactNode;
  /** 是否自动同步状态 */
  autoSync?: boolean;
  /** 是否在网络连接时自动处理离线队列 */
  autoProcessOfflineQueue?: boolean;
}

/**
 * 状态管理提供者组件
 * 确保状态在服务器端渲染和客户端之间正确同步
 */
export function StoreProvider({ 
  children, 
  autoSync = true,
  autoProcessOfflineQueue = true 
}: StoreProviderProps) {
  const initialized = useRef(false);
  
  // 标记应用初始化状态
  if (!initialized.current && typeof window !== 'undefined') {
    const setInitialized = useStore.getState().setInitialized;
    setInitialized(true);
    initialized.current = true;
  }
  
  // 监听网络状态变化
  useEffect(() => {
    if (!autoProcessOfflineQueue || typeof window === 'undefined') return;
    
    const handleOnline = () => {
      // 网络恢复在线状态时处理离线队列
      const store = useStore.getState();
      if (typeof store.processOfflineQueue === 'function') {
        store.processOfflineQueue();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    // 组件卸载时清理事件监听器
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [autoProcessOfflineQueue]);
  
  // 清理同步中间件资源
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        cleanupBrowserSync();
      }
    };
  }, []);
  
  // 订阅存储变化事件
  useEffect(() => {
    if (!autoSync || typeof window === 'undefined') return;
    
    // 监听状态变化事件
    const unsubscribe = useStore.subscribe(
      (state) => {
        // 状态变化时触发事件
        eventBus.emit('store:stateChanged', {
          timestamp: Date.now()
        });
      }
    );
    
    return unsubscribe;
  }, [autoSync]);
  
  return <>{children}</>;
} 