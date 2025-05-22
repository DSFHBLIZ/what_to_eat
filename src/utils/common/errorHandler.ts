'use client';

/**
 * 统一错误处理系统
 * 整合了所有错误处理功能，提供全面的错误捕获、处理和日志记录
 */

// 错误级别枚举
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'network',
  DOM = 'dom',
  API = 'api',
  RENDER = 'render',
  RUNTIME = 'runtime',
  VALIDATION = 'validation',
  AUTH = 'auth',
  DATA = 'data'
}

// 错误类型对应的用户友好消息
const errorTypeMap: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络连接错误，请检查您的网络连接',
  [ErrorType.DOM]: '页面渲染错误，请刷新页面重试',
  [ErrorType.API]: '服务请求失败，请稍后再试',
  [ErrorType.RENDER]: '界面渲染错误，请刷新页面重试',
  [ErrorType.RUNTIME]: '应用运行错误，请刷新页面重试',
  [ErrorType.VALIDATION]: '输入数据验证失败，请检查您的输入',
  [ErrorType.AUTH]: '身份验证错误，请重新登录',
  [ErrorType.DATA]: '数据处理错误，请刷新页面重试'
};

// 错误信息接口
export interface ErrorInfo {
  message: string;
  level: ErrorLevel;
  type: ErrorType;
  timestamp: number;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * 错误处理类
 */
class ErrorHandler {
  private readonly maxErrors: number = 100;
  private errors: ErrorInfo[] = [];
  private listeners: Array<(error: ErrorInfo) => void> = [];

  /**
   * 构造函数
   */
  constructor() {
    // 捕获未处理的全局错误
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.captureError({
          message: String(message),
          level: ErrorLevel.ERROR,
          type: ErrorType.RUNTIME,
          timestamp: Date.now(),
          stack: error?.stack,
          context: { source, lineno, colno }
        });
        return false; // 让错误继续传播
      };

      // 捕获未处理的Promise错误
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError({
          message: `未处理的Promise错误: ${event.reason}`,
          level: ErrorLevel.ERROR,
          type: ErrorType.RUNTIME,
          timestamp: Date.now(),
          stack: event.reason?.stack,
          context: { reason: event.reason }
        });
      });
    }
  }

  /**
   * 处理错误并追踪
   * @param error 错误对象或错误消息
   * @param source 错误来源
   * @param details 错误详情
   */
  handleError(error: unknown, source: string = 'unknown', details: any = {}): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // 创建错误信息对象
    const errorInfo: ErrorInfo = {
      message: errorMessage,
      level: ErrorLevel.ERROR,
      type: this.determineErrorType(error, source),
      timestamp: Date.now(),
      stack: errorStack,
      context: {
        source,
        ...details
      }
    };
    
    // 捕获错误
    this.captureError(errorInfo);
  }
  
  /**
   * 根据错误和来源确定错误类型
   * @param error 错误对象
   * @param source 错误来源
   * @returns 错误类型
   */
  private determineErrorType(error: unknown, source: string): ErrorType {
    if (source.includes('network') || source.includes('fetch') || source.includes('http')) {
      return ErrorType.NETWORK;
    }
    
    if (source.includes('api') || source.includes('service')) {
      return ErrorType.API;
    }
    
    if (source.includes('render') || source.includes('component')) {
      return ErrorType.RENDER;
    }
    
    if (source.includes('auth') || source.includes('login') || source.includes('user')) {
      return ErrorType.AUTH;
    }
    
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return ErrorType.RUNTIME;
    }
    
    return ErrorType.RUNTIME;
  }

  /**
   * 捕获错误信息
   * @param error 错误信息对象或简单错误消息
   * @returns 返回原始错误，方便链式调用
   */
  captureError(error: ErrorInfo | string | Error): Error | string | ErrorInfo {
    try {
      let errorInfo: ErrorInfo;

      if (typeof error === 'string') {
        errorInfo = {
          message: error,
          level: ErrorLevel.ERROR,
          type: ErrorType.RUNTIME,
          timestamp: Date.now()
        };
      } else if (error instanceof Error) {
        errorInfo = {
          message: error.message,
          level: ErrorLevel.ERROR,
          type: ErrorType.RUNTIME,
          timestamp: Date.now(),
          stack: error.stack
        };
      } else {
        errorInfo = {
          ...error,
          timestamp: error.timestamp || Date.now()
        };
      }

      // 添加错误到队列
      this.errors.push(errorInfo);
      
      // 限制错误数量
      if (this.errors.length > this.maxErrors) {
        this.errors.shift();
      }

      // 调用所有监听器
      this.notifyListeners(errorInfo);

      // 在控制台记录
      console.error(`[ErrorHandler] ${errorInfo.type}: ${errorInfo.message}`, errorInfo.context);

      return error;
    } catch (e) {
      // 处理错误处理器本身的错误
      console.error('错误处理器发生错误:', e);
      return error;
    }
  }

  /**
   * 处理错误，并返回用户友好的错误消息
   * @param error 错误信息对象、Error实例或错误消息
   * @returns 用户友好的错误消息
   */
  handle(error: ErrorInfo | string | Error): string {
    // 先捕获错误
    const capturedError = this.captureError(error);
    
    // 获取错误类型和消息
    let errorType: ErrorType = ErrorType.RUNTIME;
    let errorMessage: string = '应用出现未知错误';
    
    if (typeof capturedError === 'string') {
      errorMessage = capturedError;
    } else if (capturedError instanceof Error) {
      errorMessage = capturedError.message;
    } else {
      errorType = capturedError.type;
      errorMessage = capturedError.message;
    }
    
    // 获取最后捕获的错误信息
    const lastError = this.getLastError();
    
    // 返回用户友好的错误消息
    if (lastError) {
      return errorTypeMap[lastError.type] || errorMessage;
    }
    
    return errorTypeMap[errorType] || errorMessage;
  }

  /**
   * 添加错误监听器
   * @param listener 监听器函数
   * @returns 移除监听器的函数
   */
  addEventListener(listener: (error: ErrorInfo) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有监听器
   * @param error 错误信息
   */
  private notifyListeners(error: ErrorInfo): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('错误监听器执行错误:', err);
      }
    });
  }

  /**
   * 获取所有已捕获的错误
   * @returns 错误列表
   */
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  /**
   * 清空错误列表
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 获取最后一个捕获的错误
   * @returns 最后一个错误或null
   */
  getLastError(): ErrorInfo | null {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
  }
}

// 创建单例并导出
const errorHandler = new ErrorHandler();
export { errorHandler }; 