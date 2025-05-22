/**
 * 统一的错误边界组件
 * 捕获React组件树中的错误，防止整个应用崩溃
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { eventBus } from '../../core/eventBus';
import { logError } from '../../utils';

// 错误主题类型
export type ErrorTheme = 'default' | 'minimal' | 'recipe' | 'critical' | 'custom';

// 组件属性接口
export interface ErrorBoundaryProps {
  // 要渲染的子内容
  children: ReactNode;
  
  // 自定义UI
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  
  // 错误处理回调
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  // UI相关配置
  theme?: ErrorTheme;
  className?: string;
  
  // 功能控制
  enableReset?: boolean;
  enableReturnHome?: boolean;
  enableLogging?: boolean;
  
  // 文案定制
  errorTitle?: string;
  errorMessage?: string;
  resetButtonText?: string;
  homeButtonText?: string;
}

// 错误状态
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// 降级UI组件的属性
export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  theme: ErrorTheme;
}

/**
 * 统一的错误边界组件
 * 捕获子组件树中的JavaScript错误，并显示备用UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {
    theme: 'default',
    enableReset: true,
    enableReturnHome: true,
    enableLogging: true,
    errorTitle: '应用程序错误',
    errorMessage: '抱歉，应用程序遇到了未预期的错误。',
    resetButtonText: '重新加载',
    homeButtonText: '返回首页'
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新状态，以便下次渲染显示降级UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    this.setState({
      errorInfo
    });
    
    // 触发错误事件
    try {
      // 使用字符串字面量而不是类型，以避免类型检查问题
      (eventBus as any).emit('ui:error', {
        error,
        errorInfo,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error('错误事件发布失败', e);
    }
    
    // 记录错误到日志系统
    if (this.props.enableLogging) {
      logError(
        'ErrorBoundary',
        'componentDidCatch',
        error.message,
        {
          componentStack: errorInfo.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          timestamp: new Date().toISOString(),
          stack: error.stack
        }
      );
    }
    
    // 调用自定义错误处理函数
    this.props.onError?.(error, errorInfo);
  }

  // 重置错误状态
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  // 返回首页
  goToHome = (): void => {
    window.location.href = '/';
  };

  // 获取主题样式
  getThemeStyles = (): Record<string, string> => {
    const { theme } = this.props;
    
    switch (theme) {
      case 'minimal':
        return {
          container: 'p-4 bg-gray-50 border border-gray-200 rounded-md',
          title: 'text-lg font-medium text-gray-800',
          message: 'text-gray-600',
          errorBox: 'bg-white p-2 rounded border text-sm',
          buttonPrimary: 'px-3 py-1.5 bg-gray-200 text-gray-800 rounded',
          buttonSecondary: 'px-3 py-1.5 text-gray-600 underline'
        };
      case 'recipe':
        return {
          container: 'p-4 bg-amber-50 border border-amber-200 rounded-lg',
          title: 'text-xl font-semibold text-amber-800',
          message: 'text-amber-700',
          errorBox: 'bg-white p-3 rounded border border-amber-200 text-sm',
          buttonPrimary: 'px-4 py-2 bg-amber-600 text-white rounded-md',
          buttonSecondary: 'px-4 py-2 border border-amber-300 text-amber-700 rounded-md'
        };
      case 'critical':
        return {
          container: 'p-6 bg-red-50 border-l-4 border-red-500',
          title: 'text-xl font-bold text-red-700',
          message: 'text-red-600',
          errorBox: 'bg-white p-3 border border-red-200 rounded text-sm',
          buttonPrimary: 'px-4 py-2 bg-red-600 text-white rounded-md',
          buttonSecondary: 'px-4 py-2 bg-white text-red-600 border border-red-300 rounded-md'
        };
      case 'default':
      default:
        return {
          container: 'p-6 bg-white rounded-lg shadow-md border-t-4 border-indigo-500',
          title: 'text-xl font-semibold text-gray-800',
          message: 'text-gray-600',
          errorBox: 'bg-gray-50 p-3 rounded border border-gray-200 text-sm',
          buttonPrimary: 'px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700',
          buttonSecondary: 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300'
        };
    }
  };

  render(): ReactNode {
    const { 
      children, 
      fallback,
      className,
      enableReset,
      enableReturnHome,
      errorTitle,
      errorMessage,
      resetButtonText,
      homeButtonText,
      theme
    } = this.props;
    
    if (this.state.hasError) {
      // 如果提供了自定义降级UI
      if (fallback) {
        // 如果fallback是函数，则传入错误信息
        if (typeof fallback === 'function') {
          return fallback({
            error: this.state.error,
            errorInfo: this.state.errorInfo,
            resetError: this.resetError,
            theme: theme || 'default'
          });
        }
        // 否则直接渲染传入的UI
        return fallback;
      }
      
      // 默认降级UI
      const styles = this.getThemeStyles();
      
      return (
        <div className={`min-h-[300px] w-full flex flex-col items-center justify-center ${styles.container} ${className || ''}`}>
          <h2 className={`mb-3 ${styles.title}`}>{errorTitle}</h2>
          <p className={`mb-4 ${styles.message}`}>
            {errorMessage}
          </p>
          
          {this.state.error && (
            <div className={`max-w-full overflow-auto mb-4 ${styles.errorBox}`}>
              <p className="font-medium">{this.state.error.toString()}</p>
              {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
                <pre className="mt-2 text-xs text-gray-700 overflow-auto max-h-[200px]">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
          
          <div className="flex space-x-3 mt-2">
            {enableReset && (
              <button
                onClick={this.resetError}
                className={styles.buttonPrimary}
              >
                {resetButtonText}
              </button>
            )}
            
            {enableReturnHome && (
              <button
                onClick={this.goToHome}
                className={styles.buttonSecondary}
              >
                {homeButtonText}
              </button>
            )}
          </div>
        </div>
      );
    }
    
    return children;
  }
}

// 导出默认组件
export default ErrorBoundary; 