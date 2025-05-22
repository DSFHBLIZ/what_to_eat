'use client';

import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { ErrorFallbackProps } from './ErrorBoundary';

/**
 * 菜谱错误UI组件 - 用作ErrorBoundary的fallback
 */
const RecipeError: React.FC<ErrorFallbackProps> = ({ 
  error,
  resetError,
  theme
}) => {
  return (
    <div className="container py-12">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <FiAlertTriangle className="mx-auto w-16 h-16 text-amber-500 mb-4" />
        
        <h2 className="text-2xl font-bold text-amber-800 mb-2">
          加载菜谱失败
        </h2>
        
        <p className="text-amber-700 mb-6 max-w-md mx-auto">
          {error?.message || '获取菜谱信息时出现了问题，请稍后再试。'}
        </p>
        
        {process.env.NODE_ENV !== 'production' && error && (
          <div className="mb-6 bg-white p-4 rounded border border-amber-200 text-left overflow-auto max-h-[200px]">
            <p className="font-medium text-red-600">{error.toString()}</p>
          </div>
        )}
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-100"
          >
            返回首页
          </button>
          
          <button 
            onClick={resetError} 
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            重新加载
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeError; 