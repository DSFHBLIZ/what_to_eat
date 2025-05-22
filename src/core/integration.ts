/**
 * 核心集成层
 * 将缓存系统、状态管理和事件总线连接起来，形成统一的数据流动架构
 */

import { cacheManager } from './cache/cacheManager';
import localCache from './cache/localCache';
import sessionCache from './cache/sessionCache';
import { eventBus } from './eventBus';
import { useStore } from './store';
import api from '../api/unified';
import { errorHandler } from '../utils/common/errorHandler';

// API结构中的具体方法
// 注意: 这是为了类型安全添加的，实际结构可能有所不同
interface ApiMethods {
  addRequestInterceptor: (fn: any) => any;
  addResponseInterceptor: (fn: any) => any;
  processOfflineQueue?: () => void;
  // 添加真实API的其他方法
  recipes?: {
    getPopular: () => Promise<any>;
    getRecommended: () => Promise<any>;
  };
}

// 扩展api类型以适应实际使用
const apiWithMethods = api as unknown as ApiMethods;

/**
 * 集成配置选项
 */
export interface IntegrationOptions {
  /** 是否启用状态-缓存同步 */
  enableStateCacheSync?: boolean;
  /** 是否启用API缓存集成 */
  enableApiCacheIntegration?: boolean;
  /** 是否启用事件总线网络状态监听 */
  enableNetworkStatusEvents?: boolean;
  /** 是否启用全局错误捕获 */
  enableGlobalErrorCapture?: boolean;
  /** 是否启用数据自动刷新 */
  enableAutoRefresh?: boolean;
  /** 数据自动刷新间隔（毫秒） */
  autoRefreshInterval?: number;
}

/**
 * 默认集成配置
 */
const DEFAULT_OPTIONS: IntegrationOptions = {
  enableStateCacheSync: true,
  enableApiCacheIntegration: true,
  enableNetworkStatusEvents: true,
  enableGlobalErrorCapture: true,
  enableAutoRefresh: false,
  autoRefreshInterval: 5 * 60 * 1000, // 5分钟
};

/**
 * 设置状态与缓存的同步
 */
function setupStateCacheSync() {
  // 监听状态更新事件，同步到缓存
  (eventBus as any).on('store:updated', (data: any) => {
    const { store, state, path } = data;
    if (!state) return;

    // 根据store和path生成缓存键
    const cacheKey = `store:${store}:${path || 'root'}`;
    
    // 保存到缓存
    cacheManager.set(cacheKey, state, {
      ttl: 24 * 60 * 60 * 1000, // 24小时
      tags: [`store:${store}`, 'state']
    });
    
    // 记录最后更新时间
    cacheManager.set(`${cacheKey}:lastUpdated`, Date.now());
  });

  // 监听系统初始化事件，从缓存恢复状态
  (eventBus as any).on('app:initialized', () => {
    // 可以选择在这里实现应用初始化时的状态恢复逻辑
    console.log('应用已初始化，可以从缓存恢复状态');
  });

  return () => {
    // 清理函数，移除事件监听
    (eventBus as any).off('store:updated', () => {});
    (eventBus as any).off('app:initialized', () => {});
  };
}

/**
 * 设置API缓存集成
 * 注意：API客户端应该提供拦截器功能
 */
function setupApiCacheIntegration() {
  // API客户端应当支持拦截器，这里做类型安全检查
  if (typeof apiWithMethods.addRequestInterceptor !== 'function' || 
      typeof apiWithMethods.addResponseInterceptor !== 'function') {
    console.warn('API客户端不支持拦截器，缓存集成功能不可用');
    return () => {}; // 返回空清理函数
  }

  // 为API客户端添加请求拦截器
  const requestInterceptor = apiWithMethods.addRequestInterceptor((config: any) => {
    // 如果请求配置中有cacheTags，则将其添加到请求头中
    if (config.cacheTags && Array.isArray(config.cacheTags)) {
      config.headers = config.headers || {};
      config.headers['X-Cache-Tags'] = config.cacheTags.join(',');
    }
    return config;
  });

  // 为API客户端添加响应拦截器
  const responseInterceptor = apiWithMethods.addResponseInterceptor((response: any) => {
    // 如果响应中包含缓存标签信息，更新缓存标签
    const cacheTags = response.headers?.['x-cache-tags'];
    if (cacheTags && typeof cacheTags === 'string') {
      const tags = cacheTags.split(',');
      const cacheKey = `api:${response.config.url}:${JSON.stringify(response.config.params || {})}`;
      
      // 为每个标签添加缓存键
      tags.forEach(tag => {
        // 使用标签关联缓存键
        cacheManager.set(`tag:${tag}:${cacheKey}`, true);
      });
    }
    
    return response;
  });

  // 监听网络状态变化，管理API缓存
  const networkStatusHandler = () => {
    if (navigator.onLine) {
      // 网络恢复在线，处理离线队列
      if (apiWithMethods.processOfflineQueue) {
        apiWithMethods.processOfflineQueue();
      }
    }
  };
  
  window.addEventListener('online', networkStatusHandler);

  return () => {
    // 清理拦截器（如果API提供了清理方法）
    if (typeof requestInterceptor === 'function') {
      requestInterceptor();
    }
    if (typeof responseInterceptor === 'function') {
      responseInterceptor();
    }
    
    // 移除网络状态监听
    window.removeEventListener('online', networkStatusHandler);
  };
}

/**
 * 设置网络状态事件
 * 使用统一的事件发布系统
 */
function setupNetworkStatusEvents() {
  const onlineHandler = () => {
    // 使用统一的事件发布
    (eventBus as any).emit('network:online', { 
      timestamp: Date.now() 
    });
    
    // 更新应用状态
    useStore.app.getState().setOnlineStatus(true);
  };
  
  const offlineHandler = () => {
    // 使用统一的事件发布
    (eventBus as any).emit('network:offline', { 
      timestamp: Date.now() 
    });
    
    // 更新应用状态
    useStore.app.getState().setOnlineStatus(false);
  };
  
  // 添加网络状态监听
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  return () => {
    // 移除网络状态监听
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}

/**
 * 设置全局错误捕获
 */
function setupGlobalErrorCapture() {
  // 使用统一错误处理
  const originalHandleError = errorHandler.handleError;
  
  // 增强错误处理器
  errorHandler.handleError = (error: any, source?: string, details?: any) => {
    // 调用原始错误处理
    if (originalHandleError) {
      originalHandleError.call(errorHandler, error, source, details);
    }
    
    // 更新应用状态
    const errorMessage = error instanceof Error ? error.message : String(error);
    useStore.app.getState().setError(errorMessage);
    
    // 使用事件总线发布错误事件
    (eventBus as any).emit('error:occurred', { 
      error,
      source,
      details,
      timestamp: Date.now()
    });
  };
  
  // 设置未捕获异常处理
  const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    errorHandler.handleError(error, 'unhandledRejection');
  };
  
  window.addEventListener('unhandledrejection', unhandledRejectionHandler);
  
  return () => {
    // 恢复原始错误处理
    errorHandler.handleError = originalHandleError;
    
    // 移除未捕获异常处理
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
  };
}

/**
 * 设置数据自动刷新
 */
function setupAutoRefresh(interval: number) {
  // 需要自动刷新的数据
  const refreshableData: Array<{
    tag: string; 
    refresh: () => Promise<any>; 
    interval?: number
  }> = [];
  
  // 只有当API有recipes方法时才添加这些刷新数据
  if (apiWithMethods.recipes) {
    // 添加受欢迎的食谱
    if (typeof apiWithMethods.recipes.getPopular === 'function') {
      refreshableData.push({
        tag: 'popular-recipes',
        refresh: apiWithMethods.recipes.getPopular,
        interval: 10 * 60 * 1000, // 10分钟
      });
    }
    
    // 添加推荐的食谱
    if (typeof apiWithMethods.recipes.getRecommended === 'function') {
      refreshableData.push({
        tag: 'recommended-recipes',
        refresh: apiWithMethods.recipes.getRecommended,
        interval: 30 * 60 * 1000, // 30分钟
      });
    }
  }
  
  // 设置轮询
  const intervalIds: number[] = [];
  
  refreshableData.forEach(data => {
    const id = window.setInterval(() => {
      // 检查是否在线
      if (navigator.onLine) {
        data.refresh().catch((err: any) => {
          console.warn(`自动刷新 ${data.tag} 失败:`, err);
        });
      }
    }, data.interval || interval);
    
    intervalIds.push(id);
  });
  
  return () => {
    // 清理定时器
    intervalIds.forEach(id => clearInterval(id));
  };
}

/**
 * 初始化集成层
 * @param options 集成配置选项
 * @returns 清理函数
 */
export function initIntegration(options: IntegrationOptions = {}): () => void {
  // 合并默认选项
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // 存储清理函数
  const cleanupFunctions: Array<() => void> = [];
  
  // 状态-缓存同步
  if (mergedOptions.enableStateCacheSync) {
    const cleanup = setupStateCacheSync();
    cleanupFunctions.push(cleanup);
  }
  
  // API缓存集成
  if (mergedOptions.enableApiCacheIntegration) {
    const cleanup = setupApiCacheIntegration();
    cleanupFunctions.push(cleanup);
  }
  
  // 网络状态事件
  if (mergedOptions.enableNetworkStatusEvents) {
    const cleanup = setupNetworkStatusEvents();
    cleanupFunctions.push(cleanup);
  }
  
  // 全局错误捕获
  if (mergedOptions.enableGlobalErrorCapture) {
    const cleanup = setupGlobalErrorCapture();
    cleanupFunctions.push(cleanup);
  }
  
  // 自动刷新数据
  if (mergedOptions.enableAutoRefresh) {
    const cleanup = setupAutoRefresh(mergedOptions.autoRefreshInterval || DEFAULT_OPTIONS.autoRefreshInterval!);
    cleanupFunctions.push(cleanup);
  }
  
  // 清理所有事件监听和设置
  return () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('集成层清理出错:', error);
      }
    });
    
    // 清空清理函数列表
    cleanupFunctions.splice(0, cleanupFunctions.length);
    
    // 记录集成层关闭
    console.log('集成层已关闭');
  };
}

/**
 * 通过标签获取缓存键
 * @param tag 标签
 * @returns 缓存键列表
 */
function getCacheKeysByTag(tag: string): string[] {
  return cacheManager.getKeysByTag?.(tag) || [];
}

export default {
  initIntegration,
  getCacheKeysByTag,
}; 