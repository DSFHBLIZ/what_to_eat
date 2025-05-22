/**
 * 全局状态管理系统
 * 集中管理和访问所有状态存储
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { env, envUtils } from './env';
import { useThemeStore, usePreferenceTheme } from '../theme/themeStore';
import { useI18nStore } from '../i18n';
import { useAuthStore } from '../domain/auth/authStore';
import { eventBus } from './eventBus';
import { withCache, WithCache } from './stateCacheBinding';

// 全局应用状态接口
export interface AppState {
  // 应用是否初始化完成
  initialized: boolean;
  // 应用初始化时间
  initTime: number | null;
  // 系统加载状态
  isLoading: boolean;
  // 全局错误信息
  error: string | null;
  // 网络连接状态
  isOnline: boolean;
  // 最后一次心跳检测时间
  lastHeartbeat: number | null;
  // 全局通知
  notifications: Notification[];
  // app版本信息
  version: string;
  
  // 方法: 设置初始化状态
  setInitialized: (initialized: boolean) => void;
  // 方法: 设置加载状态
  setLoading: (isLoading: boolean) => void;
  // 方法: 设置错误信息
  setError: (error: string | null) => void;
  // 方法: 设置网络状态
  setOnlineStatus: (isOnline: boolean) => void;
  // 方法: 更新心跳时间
  updateHeartbeat: () => void;
  // 方法: 添加通知
  addNotification: (notification: Notification) => void;
  // 方法: 移除通知
  removeNotification: (id: string) => void;
  // 方法: 清除所有通知
  clearNotifications: () => void;
}

// 通知接口
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  title?: string;
  autoClose?: boolean;
  duration?: number;
  timestamp: number;
}

// 创建应用状态存储
export const useAppStore = create<AppState & WithCache>()(
  devtools(
    withCache(
      (set: any, get: any) => ({
        initialized: false,
        initTime: null,
        isLoading: false,
        error: null,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        lastHeartbeat: null,
        notifications: [],
        version: env.BUILD_VERSION || '0.0.1',
        
        setInitialized: (initialized: boolean) => set({ 
          initialized,
          initTime: initialized ? Date.now() : get().initTime
        }),
        
        setLoading: (isLoading: boolean) => set({ isLoading }),
        
        setError: (error: string | null) => set({ error }),
        
        setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
        
        updateHeartbeat: () => set({ lastHeartbeat: Date.now() }),
        
        addNotification: (notification: Notification) => set({
          notifications: [...get().notifications, {
            ...notification,
            id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: notification.timestamp || Date.now(),
            autoClose: notification.autoClose !== undefined ? notification.autoClose : true,
            duration: notification.duration || 5000
          }]
        }),
        
        removeNotification: (id: string) => set({
          notifications: get().notifications.filter((notification: Notification) => notification.id !== id)
        }),
        
        clearNotifications: () => set({ notifications: [] })
      }),
      {
        prefix: 'app-store',
        blacklist: ['isLoading', 'error'],
        whitelist: ['notifications'],
        storage: 'local',
        version: 1
      }
    ),
    { name: 'AppStore' }
  )
);

// 集中存储访问接口
export interface StoreApi {
  app: typeof useAppStore;
  theme: typeof useThemeStore;
  themePreference: typeof usePreferenceTheme;
  i18n: typeof useI18nStore;
  auth: typeof useAuthStore;
  
  // 额外存储可以在这里添加
  // user: typeof useUserStore;
  // settings: typeof useSettingsStore;
  // ...
}

// 全局存储访问
export const useStore: StoreApi = {
  app: useAppStore,
  theme: useThemeStore,
  themePreference: usePreferenceTheme,
  i18n: useI18nStore,
  auth: useAuthStore,
};

// 初始化所有存储
export const initStore = () => {
  // 记录存储初始化
  envUtils.log('info', '初始化全局状态管理系统');
  
  let cleanupFunctions: Array<() => void> = [];
  
  // 设置网络状态监听
  if (typeof window !== 'undefined') {
    const onlineHandler = () => {
      useAppStore.getState().setOnlineStatus(true);
      // 使用原始eventBus.emit，避免类型检查问题
      (eventBus as any).emit('network:online', { timestamp: Date.now() });
      envUtils.log('info', '网络连接已恢复');
    };
    
    const offlineHandler = () => {
      useAppStore.getState().setOnlineStatus(false);
      // 使用原始eventBus.emit，避免类型检查问题
      (eventBus as any).emit('network:offline', { timestamp: Date.now() });
      envUtils.log('warn', '网络连接已断开');
    };
    
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    cleanupFunctions.push(() => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    });
  }
  
  // 设置心跳检测
  const HEARTBEAT_INTERVAL = 30000; // 30秒
  
  // 初始心跳
  useAppStore.getState().updateHeartbeat();
  
  // 设置定期心跳
  const heartbeatIntervalId = setInterval(() => {
    useAppStore.getState().updateHeartbeat();
  }, HEARTBEAT_INTERVAL);
  
  cleanupFunctions.push(() => {
    clearInterval(heartbeatIntervalId);
  });
  
  // 设置应用为已初始化
  useAppStore.getState().setInitialized(true);
  
  // 触发存储初始化完成事件，使用原始eventBus.emit
  (eventBus as any).emit('store:initialized', { timestamp: Date.now() });
  
  // 返回清理函数
  return () => {
    // 执行所有清理函数
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
    
    envUtils.log('info', '清理全局状态管理系统');
  };
};

export default useStore; 