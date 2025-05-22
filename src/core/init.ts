/**
 * 应用程序初始化
 * 协调所有系统的初始化，确保正确的启动顺序
 */

import { eventBus } from './eventBus';
import { initSystem } from '../utils/common/systemInit';
import { api } from '../api/unified';
import { initI18n } from '../i18n/i18nStore';
import { initTheme } from '../theme/themeStore';
import { useStore } from '../store/store';
import { initIntegration } from './integration';
import { cacheManager } from './cache/cacheManager';

/**
 * 应用程序初始化阶段
 */
export enum InitPhase {
  NOT_STARTED = 'not_started',
  SYSTEM_INIT = 'system_init',
  CACHE_INIT = 'cache_init',
  THEME_INIT = 'theme_init',
  I18N_INIT = 'i18n_init',
  STORE_INIT = 'store_init',
  API_INIT = 'api_init',
  INTEGRATION_INIT = 'integration_init',
  AUTH_INIT = 'auth_init',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

/**
 * 获取初始化阶段的描述
 * @param phase 初始化阶段
 * @returns 阶段描述文本
 */
export function getPhaseDescription(phase: InitPhase): string {
  switch (phase) {
    case InitPhase.NOT_STARTED:
      return '准备初始化';
    case InitPhase.SYSTEM_INIT:
      return '系统初始化';
    case InitPhase.CACHE_INIT:
      return '缓存系统初始化';
    case InitPhase.THEME_INIT:
      return '主题初始化';
    case InitPhase.I18N_INIT:
      return '国际化初始化';
    case InitPhase.STORE_INIT:
      return '状态管理初始化';
    case InitPhase.API_INIT:
      return 'API系统初始化';
    case InitPhase.INTEGRATION_INIT:
      return '系统集成层初始化';
    case InitPhase.AUTH_INIT:
      return '用户认证初始化';
    case InitPhase.COMPLETE:
      return '初始化完成';
    case InitPhase.FAILED:
      return '初始化失败';
    default:
      return '正在初始化';
  }
}

/**
 * 初始化过程状态
 */
interface InitProgress {
  phase: InitPhase;
  progress: number;
  error?: Error;
}

/**
 * 初始化配置选项
 */
export interface InitOptions {
  // 是否启用调试模式
  debug?: boolean;
  // 是否启用自动刷新数据
  enableAutoRefresh?: boolean;
  // 初始化状态变更回调
  onProgress?: (progress: InitProgress) => void;
  // 初始化完成回调
  onComplete?: () => void;
  // 初始化失败回调
  onError?: (error: Error) => void;
}

/**
 * 初始化应用程序
 * @param options 初始化配置选项
 * @returns 初始化结果
 */
export async function initializeApp(options: InitOptions = {}): Promise<boolean> {
  const {
    debug = process.env.NODE_ENV === 'development',
    enableAutoRefresh = false,
    onProgress,
    onComplete,
    onError,
  } = options;

  // 清理函数数组，用于在应用程序卸载时执行
  const cleanupFunctions: Array<() => void> = [];

  // 更新初始化状态
  const updateProgress = (phase: InitPhase, progress: number, error?: Error) => {
    const progressInfo: InitProgress = { phase, progress, error };
    
    // 调用回调
    onProgress?.(progressInfo);
    
    // 触发事件
    eventBus.emit('app:init:progress', progressInfo);
    
    // 调试日志
    if (debug) {
      console.log(`初始化阶段: ${phase}, 进度: ${progress}%, 描述: ${getPhaseDescription(phase)}`);
      if (error) {
        console.error('初始化错误:', error);
      }
    }
  };

  try {
    // 初始化开始
    updateProgress(InitPhase.NOT_STARTED, 0);

    // 1. 系统初始化 - 设置基础环境
    updateProgress(InitPhase.SYSTEM_INIT, 10);
    const systemCleanup = initSystem();
    cleanupFunctions.push(systemCleanup);
    
    // 2. 缓存初始化 - 设置缓存系统
    updateProgress(InitPhase.CACHE_INIT, 20);
    // 清理过期缓存
    const purgedItems = cacheManager.purgeExpired();
    if (debug) {
      console.log(`已清理过期缓存项: ${purgedItems} 个`);
    }
    
    // 设置定期清理
    const cacheCleanupInterval = setInterval(() => {
      cacheManager.purgeExpired();
    }, 30 * 60 * 1000); // 每30分钟清理一次
    
    cleanupFunctions.push(() => clearInterval(cacheCleanupInterval));
    
    // 3. 主题初始化 - 设置用户界面外观
    updateProgress(InitPhase.THEME_INIT, 30);
    initTheme();
    
    // 4. 国际化初始化 - 加载语言文件
    updateProgress(InitPhase.I18N_INIT, 40);
    await initI18n();
    
    // 5. 存储初始化 - 准备应用状态
    updateProgress(InitPhase.STORE_INIT, 50);
    useStore.getState().setInitialized(true);
    
    // 6. API初始化 - 设置网络请求处理
    updateProgress(InitPhase.API_INIT, 60);
    
    // 设置网络状态变化监听
    if (typeof window !== 'undefined') {
      const handleNetworkChange = () => {
        useStore.getState().setNetworkStatus(navigator.onLine ? 'online' : 'offline');
        
        // 如果网络恢复，尝试处理离线队列
        if (navigator.onLine && 'processOfflineQueue' in api) {
          (api as any).processOfflineQueue?.();
        }
      };
      
      window.addEventListener('online', handleNetworkChange);
      window.addEventListener('offline', handleNetworkChange);
      
      // 添加到清理函数
      cleanupFunctions.push(() => {
        window.removeEventListener('online', handleNetworkChange);
        window.removeEventListener('offline', handleNetworkChange);
      });
      
      // 初始化网络状态
      useStore.getState().setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    }
    
    // 7. 集成层初始化 - 连接缓存、状态和事件系统
    updateProgress(InitPhase.INTEGRATION_INIT, 70);
    const integrationCleanup = initIntegration({
      enableAutoRefresh,
      enableStateCacheSync: true,
      enableApiCacheIntegration: true,
      enableNetworkStatusEvents: true,
      enableGlobalErrorCapture: true,
    });
    
    // 添加到清理函数
    cleanupFunctions.push(integrationCleanup);
    
    // 8. 认证初始化 - 检查用户登录状态
    updateProgress(InitPhase.AUTH_INIT, 85);
    const { user } = useStore.getState();
    
    if (user.isAuthenticated && user.user?.id) {
      // 如果已登录，尝试验证令牌有效性
      try {
        // 这里可以添加令牌验证逻辑
        // 例如: const currentUser = await api.auth.getCurrentUser();
      } catch (error) {
        // 令牌无效，注销用户
        useStore.getState().logout();
      }
    }
    
    // 初始化完成
    updateProgress(InitPhase.COMPLETE, 100);
    
    // 注册清理函数
    if (typeof window !== 'undefined') {
      const performCleanup = () => {
        // 执行所有清理函数
        for (const cleanup of cleanupFunctions) {
          try {
            cleanup();
          } catch (error) {
            console.error('清理过程出错:', error);
          }
        }
      };
      
      window.addEventListener('beforeunload', performCleanup);
      
      // 存储清理函数移除器，以便可以手动清理
      (window as any).__appCleanup = () => {
        performCleanup();
        window.removeEventListener('beforeunload', performCleanup);
        delete (window as any).__appCleanup;
      };
    }
    
    // 发送初始化完成事件
    eventBus.emit('app:initialized', { timestamp: Date.now() });
    
    // 调用完成回调
    onComplete?.();
    
    return true;
  } catch (error) {
    // 捕获初始化过程中的错误
    const typedError = error instanceof Error ? error : new Error(String(error));
    
    // 更新状态为失败
    updateProgress(InitPhase.FAILED, 0, typedError);
    
    // 触发初始化失败事件
    eventBus.emit('app:init:failed', { error: typedError });
    
    // 执行已注册的清理函数
    for (const cleanup of cleanupFunctions) {
      try {
        cleanup();
      } catch (cleanupError) {
        console.error('错误处理过程中的清理错误:', cleanupError);
      }
    }
    
    // 调用错误回调
    onError?.(typedError);
    
    return false;
  }
}

/**
 * 手动清理应用资源
 * 用于在不刷新页面的情况下重置应用状态
 */
export function cleanupApp(): void {
  if (typeof window !== 'undefined' && (window as any).__appCleanup) {
    (window as any).__appCleanup();
    console.log('应用资源已清理');
  }
}

export default initializeApp; 