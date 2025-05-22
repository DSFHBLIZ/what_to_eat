/**
 * 核心模块入口
 * 导出所有核心组件和初始化功能
 */

// 导出事件总线
export { eventBus } from './eventBus';

// 导出环境工具
export { env, envUtils } from './env';

// 导出初始化功能
export { 
  initializeApp, 
  cleanupApp, 
  InitPhase, 
  getPhaseDescription 
} from './init';

// 导出应用提供器
export { AppProvider } from './AppProvider';

// 导出缓存系统
export { cacheManager } from './cache/cacheManager';

// 导出集成功能
export { initIntegration } from './integration';

// 导出存储绑定
export { withCache } from './stateCacheBinding';

// 导出全局存储
export { useAppStore } from './store';

// 导出用户偏好设置
export { loadUserPreferences } from '../cache/userPreferences'; 