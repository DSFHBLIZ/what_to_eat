/**
 * 环境配置系统
 * 管理不同环境的配置参数
 */

// 环境类型
export type Environment = 'development' | 'test' | 'production';

// 环境变量接口
export interface EnvVariables {
  // API基础URL
  API_BASE_URL: string;
  // API版本
  API_VERSION: string;
  // 是否启用API缓存
  API_CACHE_ENABLED: boolean;
  // 是否使用模拟数据
  USE_MOCK_DATA: boolean;
  // 是否启用调试模式
  DEBUG_MODE: boolean;
  // 是否启用性能监控
  PERFORMANCE_MONITORING: boolean;
  // 是否启用错误跟踪
  ERROR_TRACKING: boolean;
  // 是否启用分析
  ANALYTICS_ENABLED: boolean;
  // 分析服务ID
  ANALYTICS_ID?: string;
  // 是否启用全局错误处理
  GLOBAL_ERROR_HANDLING: boolean;
  // 是否启用国际化
  I18N_ENABLED: boolean;
  // 默认语言
  DEFAULT_LANGUAGE: string;
  // 是否启用离线支持
  OFFLINE_SUPPORT: boolean;
  // 是否启用服务工作线程
  SERVICE_WORKER_ENABLED: boolean;
  // 是否启用通知
  NOTIFICATIONS_ENABLED: boolean;
  // 是否启用日志
  LOGGING_ENABLED: boolean;
  // 日志级别 (debug, info, warn, error)
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  // 是否是私有部署版本
  IS_PRIVATE_DEPLOYMENT: boolean;
  // 当前环境
  ENVIRONMENT: Environment;
  // 是否是客户端 (浏览器) 环境
  IS_CLIENT: boolean;
  // 是否是服务器端环境
  IS_SERVER: boolean;
  // 构建版本
  BUILD_VERSION?: string;
  // 构建时间
  BUILD_TIME?: string;
  // 是否启用图像优化
  IMAGE_OPTIMIZATION_ENABLED: boolean;
  // 图像优化服务URL
  IMAGE_OPTIMIZATION_URL?: string;
  // 自定义变量
  [key: string]: any;
}

// 默认配置
const defaultConfig: EnvVariables = {
  API_BASE_URL: '',
  API_VERSION: 'v1',
  API_CACHE_ENABLED: true,
  USE_MOCK_DATA: false,
  DEBUG_MODE: false,
  PERFORMANCE_MONITORING: false,
  ERROR_TRACKING: false,
  ANALYTICS_ENABLED: false,
  ANALYTICS_ID: undefined,
  GLOBAL_ERROR_HANDLING: true,
  I18N_ENABLED: true,
  DEFAULT_LANGUAGE: 'zh-CN',
  OFFLINE_SUPPORT: false,
  SERVICE_WORKER_ENABLED: false,
  NOTIFICATIONS_ENABLED: false,
  LOGGING_ENABLED: true,
  LOG_LEVEL: 'info',
  IS_PRIVATE_DEPLOYMENT: false,
  ENVIRONMENT: 'production',
  IS_CLIENT: typeof window !== 'undefined',
  IS_SERVER: typeof window === 'undefined',
  BUILD_VERSION: undefined,
  BUILD_TIME: undefined,
  IMAGE_OPTIMIZATION_ENABLED: false,
  IMAGE_OPTIMIZATION_URL: undefined,
};

// 环境特定配置
const envConfigs: Record<Environment, Partial<EnvVariables>> = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    DEBUG_MODE: true,
    USE_MOCK_DATA: true,
    LOG_LEVEL: 'debug',
    PERFORMANCE_MONITORING: true,
  },
  test: {
    API_BASE_URL: 'https://test-api.whattoeat.example.com',
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    PERFORMANCE_MONITORING: true,
  },
  production: {
    API_BASE_URL: 'https://api.whattoeat.example.com',
    DEBUG_MODE: false,
    ERROR_TRACKING: true,
    ANALYTICS_ENABLED: true,
    LOG_LEVEL: 'error',
    SERVICE_WORKER_ENABLED: true,
    OFFLINE_SUPPORT: true,
    IMAGE_OPTIMIZATION_ENABLED: true,
  },
};

// 从环境变量中获取当前环境
function getCurrentEnvironment(): Environment {
  // 尝试从环境变量获取
  const envFromVar = process.env.NODE_ENV;
  
  if (envFromVar === 'development' || envFromVar === 'test' || envFromVar === 'production') {
    return envFromVar;
  }
  
  // 尝试从URL获取（用于调试）
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const envFromUrl = urlParams.get('env');
    if (envFromUrl === 'development' || envFromUrl === 'test' || envFromUrl === 'production') {
      return envFromUrl;
    }
  }
  
  // 默认返回生产环境
  return 'production';
}

// 从环境变量中加载配置
function loadEnvVariables(env: Environment): EnvVariables {
  // 合并默认配置和环境特定配置
  const config = {
    ...defaultConfig,
    ...envConfigs[env],
    ENVIRONMENT: env,
  };
  
  // 从过程环境变量中加载
  if (typeof process !== 'undefined' && process.env) {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        // 删除前缀并转换为配置键格式
        const configKey = key.replace('NEXT_PUBLIC_', '');
        
        // 特殊处理布尔值
        if (process.env[key] === 'true') {
          (config as Record<string, any>)[configKey] = true;
        } else if (process.env[key] === 'false') {
          (config as Record<string, any>)[configKey] = false;
        } else {
          (config as Record<string, any>)[configKey] = process.env[key];
        }
      }
    });
  }
  
  // 添加构建信息
  if (typeof process !== 'undefined') {
    config.BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || process.env.BUILD_VERSION;
    config.BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || process.env.BUILD_TIME;
  }
  
  return config as EnvVariables;
}

// 当前环境
const currentEnv = getCurrentEnvironment();

// 加载当前环境的配置
export const env = loadEnvVariables(currentEnv);

/**
 * 环境工具函数
 */
export const envUtils = {
  // 判断是否为开发环境
  isDevelopment: () => env.ENVIRONMENT === 'development',
  
  // 判断是否为测试环境
  isTest: () => env.ENVIRONMENT === 'test',
  
  // 判断是否为生产环境
  isProduction: () => env.ENVIRONMENT === 'production',
  
  // 判断是否为客户端环境
  isClient: () => env.IS_CLIENT,
  
  // 判断是否为服务器环境
  isServer: () => env.IS_SERVER,
  
  // 判断是否启用调试模式
  isDebugMode: () => env.DEBUG_MODE,
  
  // 获取完整API URL
  getApiUrl: (path: string = '') => {
    // 移除路径开头的斜杠
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // 构建完整URL
    return `${env.API_BASE_URL}/${env.API_VERSION}/${cleanPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
  },
  
  // 获取图片优化URL
  getOptimizedImageUrl: (url: string, options?: { width?: number, quality?: number }) => {
    if (!env.IMAGE_OPTIMIZATION_ENABLED || !env.IMAGE_OPTIMIZATION_URL) {
      return url;
    }
    
    // 构建图片优化服务URL
    const params = new URLSearchParams();
    if (options?.width) params.append('w', options.width.toString());
    if (options?.quality) params.append('q', options.quality.toString());
    
    const queryString = params.toString();
    return `${env.IMAGE_OPTIMIZATION_URL}/${encodeURIComponent(url)}${queryString ? `?${queryString}` : ''}`;
  },
  
  // 记录日志（根据配置的日志级别）
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
    if (!env.LOGGING_ENABLED) return;
    
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = logLevels[env.LOG_LEVEL];
    const messageLevel = logLevels[level];
    
    // 只记录级别大于等于配置级别的日志
    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, ...args);
          break;
        case 'info':
          console.info(prefix, message, ...args);
          break;
        case 'warn':
          console.warn(prefix, message, ...args);
          break;
        case 'error':
          console.error(prefix, message, ...args);
          break;
      }
    }
  }
};

// 导出环境变量和工具函数
export default env; 