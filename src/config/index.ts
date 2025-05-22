/**
 * 配置中心入口文件
 * 统一导出所有配置模块和助手函数
 */

// 导出筛选器配置
export * from './filterSchema';

// 导出验证消息配置
export * from './validationSchema';

// 导出环境配置
export const ENV_CONFIG = {
  // 应用环境
  NODE_ENV: process.env.NODE_ENV || 'development',
  // API地址
  API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  // 是否开启调试
  DEBUG: process.env.NEXT_PUBLIC_DEBUG === 'true',
  // 默认语言
  DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'zh-CN',
  // 支持的语言
  SUPPORTED_LOCALES: ['zh-CN', 'en-US'],
  // 默认主题
  DEFAULT_THEME: process.env.NEXT_PUBLIC_DEFAULT_THEME || 'light',
  // 支持的主题
  SUPPORTED_THEMES: ['light', 'dark'],
  // 静态资源路径
  ASSETS_PATH: process.env.NEXT_PUBLIC_ASSETS_PATH || '/assets'
};

// 导出缓存配置
export const CACHE_CONFIG = {
  // 缓存有效期
  TTL: {
    SHORT: 60 * 1000, // 1分钟
    MEDIUM: 5 * 60 * 1000, // 5分钟
    LONG: 30 * 60 * 1000, // 30分钟
    VERY_LONG: 24 * 60 * 60 * 1000 // 1天
  },
  // 缓存键前缀
  KEY_PREFIX: 'what-to-eat:',
  // 默认缓存策略
  DEFAULT_STRATEGY: 'memory',
  // 版本号 (用于缓存失效)
  VERSION: '1.0.0'
};

// 导出应用常量
export const APP_CONSTANTS = {
  // 分页默认值
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
  },
  // 筛选默认值
  FILTERS: {
    MAX_SELECTED_TAGS: 10,
    MAX_SELECTED_INGREDIENTS: 20
  },
  // 搜索默认值
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 300,
    MAX_RECENT_SEARCHES: 10
  },
  // 文件上传限制
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    MAX_UPLOAD_COUNT: 10
  }
};

// 导出错误码映射
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'errors.unknown',
  NETWORK_ERROR: 'errors.network',
  TIMEOUT_ERROR: 'errors.timeout',
  
  // 授权错误
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  
  // 验证错误
  VALIDATION_ERROR: 'errors.validation',
  
  // 资源错误
  NOT_FOUND: 'errors.notFound',
  RESOURCE_EXISTS: 'errors.resourceExists',
  
  // 服务器错误
  SERVER_ERROR: 'errors.server'
};

// 导出一个统一的配置对象
export const Config = {
  env: ENV_CONFIG,
  cache: CACHE_CONFIG,
  app: APP_CONSTANTS,
  errors: ERROR_CODES,
  
  // 获取环境变量
  getEnv(key: string, defaultValue?: string): string {
    return (process.env[key] || defaultValue || '') as string;
  },
  
  // 是否为开发环境
  isDev(): boolean {
    return ENV_CONFIG.NODE_ENV === 'development';
  },
  
  // 是否为生产环境
  isProd(): boolean {
    return ENV_CONFIG.NODE_ENV === 'production';
  },
  
  // 是否为测试环境
  isTest(): boolean {
    return ENV_CONFIG.NODE_ENV === 'test';
  }
}; 