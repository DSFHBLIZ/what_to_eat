/**
 * 应用核心提供器
 * 为应用提供全局状态管理、主题、国际化等基础功能
 */

'use client';

import React, { useEffect, useState } from 'react';
import { initializeApp, InitPhase, getPhaseDescription, cleanupApp } from './init';
import { eventBus } from './eventBus';
import { ErrorBoundary } from '../components/error';

interface AppProviderProps {
  children: React.ReactNode;
  initialLocale?: string;
  initialTheme?: 'light' | 'dark' | 'system';
}

interface InitState {
  initialized: boolean;
  error: Error | null;
  phase: InitPhase;
  progress: number;
}

/**
 * 应用核心提供器组件
 */
export function AppProvider({ 
  children, 
  initialLocale = 'zh-CN', 
  initialTheme = 'system' 
}: AppProviderProps) {
  // 初始化状态
  const [initState, setInitState] = useState<InitState>({
    initialized: false,
    error: null,
    phase: InitPhase.NOT_STARTED,
    progress: 0,
  });
  
  // 初始化应用
  useEffect(() => {
    let isMounted = true;
    
    // 初始化回调
    const handleProgress = ({ phase, progress, error }: any) => {
      if (!isMounted) return;
      
      setInitState(prev => ({
        ...prev,
        phase,
        progress,
        error: error || null,
      }));
    };
    
    const handleComplete = () => {
      if (!isMounted) return;
      
      setInitState(prev => ({
        ...prev,
        initialized: true,
      }));
      
      // 触发应用准备就绪事件
      eventBus.emit('app:ready', { timestamp: Date.now() });
    };
    
    const handleError = (error: Error) => {
      if (!isMounted) return;
      
      setInitState(prev => ({
        ...prev,
        error,
        initialized: false,
      }));
      
      // 触发应用初始化失败事件
      eventBus.emit('app:init:failed', { error });
    };
    
    // 执行初始化
    initializeApp({
      debug: process.env.NODE_ENV === 'development',
      enableAutoRefresh: true,
      onProgress: handleProgress,
      onComplete: handleComplete,
      onError: handleError,
    });
    
    // 清理函数
    return () => {
      isMounted = false;
      cleanupApp(); // 使用统一的清理函数
    };
  }, []);
  
  // 初始化过程中显示加载状态
  if (!initState.initialized && !initState.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">应用程序初始化中...</h1>
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${initState.progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {getPhaseDescription(initState.phase)} ({initState.progress}%)
          </p>
        </div>
      </div>
    );
  }
  
  // 显示初始化错误
  if (initState.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-500">初始化失败</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{initState.error.message}</p>
          </div>
          <p className="mb-4">请尝试刷新页面或联系管理员。</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }
  
  // 应用已初始化，渲染子组件
  return (
    <ErrorBoundary
      theme="default"
      enableLogging={true}
      errorTitle="应用程序错误"
      errorMessage="应用程序遇到了问题。这可能是临时性的问题，我们已经记录了错误信息。"
    >
      {children}
    </ErrorBoundary>
  );
}

export default AppProvider; 