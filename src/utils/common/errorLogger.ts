'use client';

/**
 * 增强版错误日志记录系统
 * 支持客户端和服务器端错误收集、分析和显示
 */

// 定义错误日志接口
export interface ErrorLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  component: string;
  operation: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
  stack?: string;
}

// 定义应用状态接口
export interface AppState {
  id: string;
  timestamp: string;
  lastComponent: string;
  lastAction: string;
  lastData?: any;
}

// 存储错误日志
let errorLogs: ErrorLog[] = [];
const MAX_ERROR_LOGS = 50;

// 存储应用状态历史
let appStateHistory: AppState[] = [];
const MAX_APP_STATES = 20;

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * 记录错误
 * @param component 组件名称
 * @param operation 操作名称
 * @param error 错误对象或错误消息字符串
 * @param details 附加详情
 */
export const logError = (
  component: string, 
  operation: string, 
  error: Error | string | unknown,
  details?: any
): string => {
  // 安全地处理各种可能的错误类型
  let errorMessage: string;
  let errorStack: string | undefined;
  let errorType: string;

  if (typeof error === 'string') {
    errorMessage = error;
    errorStack = undefined;
    errorType = 'CustomError';
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
    errorType = error.name;
  } else if (error && typeof error === 'object') {
    // 处理可能具有message属性的对象
    const errorObj = error as any;
    errorMessage = errorObj.message || '未知错误对象';
    errorStack = errorObj.stack;
    errorType = errorObj.name || '未知类型';
  } else {
    // 处理其他类型
    errorMessage = String(error);
    errorStack = undefined;
    errorType = 'UnknownErrorType';
  }
  
  const errorLog: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: errorType,
    message: errorMessage,
    component,
    operation,
    severity: 'error',
    details,
    stack: errorStack
  };
  
  // 将新错误添加到列表开头
  errorLogs.unshift(errorLog);
  
  // 保持最大日志数量
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs = errorLogs.slice(0, MAX_ERROR_LOGS);
  }
  
  // 如果在浏览器环境，打印到控制台
  if (typeof window !== 'undefined') {
    console.error(`[${component}][${operation}] ${errorMessage}`, details || '');
  }
  
  return errorLog.id;
};

/**
 * 记录警告
 * @param component 组件名称
 * @param operation 操作名称
 * @param message 警告信息
 * @param details 附加详情
 */
export const logWarning = (
  component: string, 
  operation: string, 
  message: string,
  details?: any
): string => {
  const warningLog: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'Warning',
    message,
    component,
    operation,
    severity: 'warning',
    details
  };
  
  // 将新警告添加到列表开头
  errorLogs.unshift(warningLog);
  
  // 保持最大日志数量
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs = errorLogs.slice(0, MAX_ERROR_LOGS);
  }
  
  // 如果在浏览器环境，打印到控制台
  if (typeof window !== 'undefined') {
    console.warn(`[${component}][${operation}] ${message}`, details || '');
  }
  
  return warningLog.id;
};

/**
 * 记录信息
 * @param component 组件名称
 * @param operation 操作名称
 * @param message 信息
 * @param details 附加详情
 */
export const logInfo = (
  component: string, 
  operation: string, 
  message: string,
  details?: any
): string => {
  const infoLog: ErrorLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: 'Info',
    message,
    component,
    operation,
    severity: 'info',
    details
  };
  
  // 将新信息添加到列表开头
  errorLogs.unshift(infoLog);
  
  // 保持最大日志数量
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs = errorLogs.slice(0, MAX_ERROR_LOGS);
  }
  
  // 如果在浏览器环境，打印到控制台
  if (typeof window !== 'undefined') {
    console.info(`[${component}][${operation}] ${message}`, details || '');
  }
  
  return infoLog.id;
};

/**
 * 记录应用状态
 * @param component 组件名称
 * @param action 执行的操作
 * @param data 相关数据
 */
export const logAppState = (
  component: string,
  action: string,
  data?: any
): string => {
  const appState: AppState = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    lastComponent: component,
    lastAction: action,
    lastData: data
  };
  
  // 将新状态添加到列表开头
  appStateHistory.unshift(appState);
  
  // 保持最大状态数量
  if (appStateHistory.length > MAX_APP_STATES) {
    appStateHistory = appStateHistory.slice(0, MAX_APP_STATES);
  }
  
  return appState.id;
};

/**
 * 获取所有错误日志
 * @returns 错误日志数组
 */
export const getErrorLogs = (): ErrorLog[] => {
  return [...errorLogs];
};

/**
 * 获取应用状态历史
 * @returns 应用状态历史数组
 */
export const getAppStateHistory = (): AppState[] => {
  return [...appStateHistory];
};

/**
 * 获取特定错误日志
 * @param id 错误ID
 * @returns 错误日志或undefined
 */
export const getErrorLogById = (id: string): ErrorLog | undefined => {
  return errorLogs.find(log => log.id === id);
};

/**
 * 清除所有错误日志
 */
export const clearErrorLogs = (): void => {
  errorLogs = [];
};

/**
 * 清除应用状态历史
 */
export const clearAppStateHistory = (): void => {
  appStateHistory = [];
};

/**
 * 获取最近的错误
 * @param count 获取数量
 * @returns 错误日志数组
 */
export const getRecentErrors = (count: number = 5): ErrorLog[] => {
  return errorLogs.filter(log => log.severity === 'error').slice(0, count);
};

/**
 * 获取过去特定时间内的错误
 * @param minutes 过去的分钟数
 * @returns 错误日志数组
 */
export const getErrorsInLastMinutes = (minutes: number): ErrorLog[] => {
  const now = new Date();
  const timeThreshold = new Date(now.getTime() - minutes * 60000).toISOString();
  
  return errorLogs.filter(log => log.timestamp >= timeThreshold);
};

/**
 * 格式化错误消息，提供更友好的显示
 * @param error 错误对象或消息
 * @returns 格式化后的错误消息
 */
export const formatErrorMessage = (error: Error | string): string => {
  if (typeof error === 'string') return error;
  
  if (error.message.includes('network')) {
    return `网络连接问题：${error.message}`;
  }
  
  if (error.message.includes('timeout')) {
    return `请求超时：${error.message}`;
  }
  
  if (error.message.includes('permission')) {
    return `权限错误：${error.message}`;
  }
  
  return error.message;
};

/**
 * 全局错误处理函数，可在应用初始化时设置
 */
export const setupGlobalErrorHandler = (): void => {
  if (typeof window !== 'undefined') {
    // 处理未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      logError(
        'Global', 
        'UnhandledPromiseRejection', 
        event.reason || '未处理的Promise拒绝',
        { promiseReason: event.reason }
      );
    });
    
    // 处理全局JS错误
    window.addEventListener('error', (event) => {
      logError(
        'Global',
        'RuntimeError',
        event.error || event.message,
        {
          fileName: event.filename,
          lineNumber: event.lineno,
          columnNumber: event.colno
        }
      );
      
      // 不阻止默认行为
      return false;
    });
    
    console.log('全局错误处理器已设置');
  }
};

// 导出错误日志系统
export const errorLogger = {
  logError,
  logWarning,
  logInfo,
  logAppState,
  getErrorLogs,
  getAppStateHistory,
  clearErrorLogs,
  clearAppStateHistory,
  getErrorLogById,
  getRecentErrors,
  getErrorsInLastMinutes,
  formatErrorMessage,
  setupGlobalErrorHandler
}; 