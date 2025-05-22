/**
 * 错误消息管理模块
 * 集中管理应用中所有错误信息
 */

import { getValidationMessage } from '../config/validationSchema';
import { getCurrentLocale } from './index';

// 错误消息键
export enum ErrorKey {
  // 通用错误
  UNKNOWN_ERROR = 'error.unknown',
  SERVER_ERROR = 'error.server',
  NETWORK_ERROR = 'error.network',
  
  // 认证错误
  AUTH_REQUIRED = 'auth.required',
  AUTH_INVALID = 'auth.invalid',
  
  // 数据错误
  DATA_NOT_FOUND = 'data.notFound',
  DATA_INVALID = 'data.invalid',
  EMPTY_RESPONSE = 'data.emptyResponse',
  
  // 操作错误
  OPERATION_FAILED = 'operation.failed',
  
  // 特定功能错误
  RECIPE_ID_REQUIRED = 'recipe.idRequired',
  RECIPE_FETCH_FAILED = 'recipe.fetchFailed',
  RECIPE_DATA_INVALID = 'recipe.dataInvalid',
  
  // 上下文错误
  CONTEXT_INVALID = 'context.invalid',
  SEARCH_CONTEXT_REQUIRED = 'context.searchRequired',
  UNIFIED_SEARCH_CONTEXT_REQUIRED = 'context.unifiedSearchRequired',
  AUTH_CONTEXT_REQUIRED = 'context.authRequired',
  
  // 技术错误
  INDEXED_DB_UNAVAILABLE = 'tech.indexedDbUnavailable',
  WEB_WORKER_UNSUPPORTED = 'tech.webWorkerUnsupported',
  LOCALSTORAGE_DISABLED = 'tech.localStorageDisabled',
  
  // API错误
  API_KEY_MISSING = 'api.keyMissing',
  API_URL_MISSING = 'api.urlMissing',
  
  // 数据库错误
  DB_CONNECTION_FAILED = 'db.connectionFailed',
  DB_EMPTY_RESULT = 'db.emptyResult',
  DB_SEARCH_FIELD_REQUIRED = 'db.searchFieldRequired',

  // 模块错误
  MODULE_NOT_IMPLEMENTED = 'module.notImplemented',
  REQUEST_OUTDATED = 'request.outdated'
}

// 默认错误消息映射
const DEFAULT_ERROR_MESSAGES: Record<ErrorKey, string> = {
  // 通用错误
  [ErrorKey.UNKNOWN_ERROR]: '发生未知错误',
  [ErrorKey.SERVER_ERROR]: '服务器错误',
  [ErrorKey.NETWORK_ERROR]: '网络连接错误',
  
  // 认证错误
  [ErrorKey.AUTH_REQUIRED]: '请先登录',
  [ErrorKey.AUTH_INVALID]: '用户未登录',
  
  // 数据错误
  [ErrorKey.DATA_NOT_FOUND]: '未找到请求的数据',
  [ErrorKey.DATA_INVALID]: '数据无效',
  [ErrorKey.EMPTY_RESPONSE]: '服务器返回空响应',
  
  // 操作错误
  [ErrorKey.OPERATION_FAILED]: '操作失败',
  
  // 特定功能错误
  [ErrorKey.RECIPE_ID_REQUIRED]: '菜谱ID不能为空',
  [ErrorKey.RECIPE_FETCH_FAILED]: '获取菜谱详情失败',
  [ErrorKey.RECIPE_DATA_INVALID]: '未获取有效的菜谱数据',
  
  // 上下文错误
  [ErrorKey.CONTEXT_INVALID]: '上下文无效',
  [ErrorKey.SEARCH_CONTEXT_REQUIRED]: 'useSearch必须在SearchProvider内部使用',
  [ErrorKey.UNIFIED_SEARCH_CONTEXT_REQUIRED]: 'useUnifiedSearch必须在UnifiedSearchProvider内部使用',
  [ErrorKey.AUTH_CONTEXT_REQUIRED]: 'useAuth must be used within an AuthProvider',
  
  // 技术错误
  [ErrorKey.INDEXED_DB_UNAVAILABLE]: 'IndexedDB is not available in server environment',
  [ErrorKey.WEB_WORKER_UNSUPPORTED]: 'Web Worker is not supported',
  [ErrorKey.LOCALSTORAGE_DISABLED]: 'localStorage is disabled',
  
  // API错误
  [ErrorKey.API_KEY_MISSING]: 'API密钥缺失',
  [ErrorKey.API_URL_MISSING]: 'API地址缺失',
  
  // 数据库错误
  [ErrorKey.DB_CONNECTION_FAILED]: '数据库连接测试失败',
  [ErrorKey.DB_EMPTY_RESULT]: '数据库返回空数据',
  [ErrorKey.DB_SEARCH_FIELD_REQUIRED]: '必须提供至少一个搜索字段',

  // 模块错误
  [ErrorKey.MODULE_NOT_IMPLEMENTED]: '模块未实现',
  [ErrorKey.REQUEST_OUTDATED]: '请求已过期'
};

/**
 * 获取错误消息
 * @param key 错误键
 * @param params 错误消息参数
 * @param locale 语言代码（可选）
 * @returns 翻译后的错误消息
 */
export function getErrorMessage(
  key: ErrorKey | string,
  params: Record<string, string | number> = {},
  locale: string = getCurrentLocale()
): string {
  try {
    // 先尝试从验证消息架构中获取
    const schemaMessage = getValidationMessage(key, params, locale);
    
    // 如果返回的不是键本身，说明找到了消息
    if (schemaMessage !== key) {
      return schemaMessage;
    }
    
    // 否则从默认消息中获取
    if (key in ErrorKey && DEFAULT_ERROR_MESSAGES[key as ErrorKey]) {
      let message = DEFAULT_ERROR_MESSAGES[key as ErrorKey];
      
      // 替换参数
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        message = message.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
      
      return message;
    }
    
    // 如果都找不到，返回键本身
    return key;
  } catch (error) {
    // 出错时返回通用错误消息
    return DEFAULT_ERROR_MESSAGES[ErrorKey.UNKNOWN_ERROR];
  }
}

/**
 * 创建带有错误消息的错误对象
 * @param key 错误键
 * @param params 错误消息参数
 * @param locale 语言代码（可选）
 * @returns Error对象
 */
export function createError(
  key: ErrorKey | string,
  params: Record<string, string | number> = {},
  locale: string = getCurrentLocale()
): Error {
  const message = getErrorMessage(key, params, locale);
  return new Error(message);
}

export default {
  getErrorMessage,
  createError,
  ErrorKey
}; 