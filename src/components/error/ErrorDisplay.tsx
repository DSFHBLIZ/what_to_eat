'use client';

import React from 'react';
import { FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { ErrorFallbackProps } from './ErrorBoundary';

// 自定义ValidationStats接口，避免依赖外部模块
export interface ValidationStats {
  isValid: boolean;
  invalidItemsCount: number;
  totalItems: number;
  errors: Array<{
    index: number;
    path: string;
    message: string;
  }>;
  validationTime: number;
  fromCache: boolean;
}

/**
 * 统一错误显示组件类型
 */
export type ErrorDisplayType = 'recipe' | 'validation' | 'generic' | 'api';

interface ValidationErrorProps {
  stats: ValidationStats;
  showDetails?: boolean;
  showDevInfo?: boolean;
  className?: string;
  title?: string;
}

interface GenericErrorProps {
  message: string;
  title?: string;
  className?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

interface ErrorDisplayProps {
  type: ErrorDisplayType;
  validationProps?: ValidationErrorProps;
  genericProps?: GenericErrorProps;
  errorBoundaryProps?: ErrorFallbackProps;
}

/**
 * 统一错误显示组件 - 兼容多种错误类型的展示
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  type, 
  validationProps, 
  genericProps,
  errorBoundaryProps
}) => {
  // 根据类型渲染不同的错误UI
  switch (type) {
    case 'recipe':
      return errorBoundaryProps ? <RecipeErrorUI {...errorBoundaryProps} /> : null;
    
    case 'validation':
      return validationProps ? <ValidationErrorUI {...validationProps} /> : null;
    
    case 'api':
    case 'generic':
    default:
      return genericProps ? <GenericErrorUI {...genericProps} /> : null;
  }
};

/**
 * 菜谱错误UI
 */
const RecipeErrorUI: React.FC<ErrorFallbackProps> = ({ 
  error,
  errorInfo,
  resetError,
  theme
}) => {
  return (
    <div className="container">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <FiAlertTriangle className="mx-auto w-12 h-12 text-amber-500 mb-3" />
        
        <h2 className="text-xl font-bold text-amber-800 mb-2">
          加载菜谱失败
        </h2>
        
        <p className="text-amber-700 mb-4 max-w-md mx-auto">
          {error?.message || '获取菜谱信息时出现了问题，请稍后再试。'}
        </p>
        
        {process.env.NODE_ENV !== 'production' && error && (
          <div className="mb-4 bg-white p-3 rounded border border-amber-200 text-left overflow-auto max-h-[200px]">
            <p className="font-medium text-red-600">{error.toString()}</p>
          </div>
        )}
        
        <div className="flex justify-center gap-3">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-3 py-1.5 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-100"
          >
            返回首页
          </button>
          
          <button 
            onClick={resetError} 
            className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            重新加载
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 验证错误UI
 */
const ValidationErrorUI: React.FC<ValidationErrorProps> = ({
  stats,
  showDetails = true,
  showDevInfo = process.env.NODE_ENV === 'development',
  className = '',
  title = '数据验证警告'
}) => {
  // 如果数据有效且没有错误，不显示任何内容
  if (stats.isValid && stats.errors.length === 0) {
    return null;
  }
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          
          <div className="mt-2 text-sm text-red-700">
            <p>发现 {stats.invalidItemsCount} 个无效数据项，共 {stats.totalItems} 项</p>
            
            {showDetails && stats.errors.length > 0 && (
              <div className="mt-2">
                <h4 className="font-semibold mb-1">错误详情:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {stats.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-xs">
                      项目 {error.index}: {error.path} - {error.message}
                    </li>
                  ))}
                  {stats.errors.length > 5 && (
                    <li className="text-xs italic">
                      ...及其他 {stats.errors.length - 5} 个错误
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {showDevInfo && (
            <div className="mt-3 text-xs text-gray-500">
              验证时间: {stats.validationTime.toFixed(2)}ms | 
              缓存命中: {stats.fromCache ? '是' : '否'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 通用错误UI
 */
const GenericErrorUI: React.FC<GenericErrorProps> = ({
  message,
  title = '操作失败',
  className = '',
  onRetry,
  showHomeButton = false
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertCircle className="h-5 w-5 text-gray-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-base font-medium text-gray-800">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
          
          {(onRetry || showHomeButton) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button 
                  onClick={onRetry}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  重试
                </button>
              )}
              
              {showHomeButton && (
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  返回首页
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 