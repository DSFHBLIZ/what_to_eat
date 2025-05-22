'use client';

import { eventBus } from '../../core/eventBus';
import { errorHandler } from './errorHandler';

/**
 * 初始化系统
 * 注册全局事件监听、缓存预热、错误处理器等
 */
export function initSystem(): () => void {
  console.log('系统初始化...');
  
  // 定义接收错误事件的处理函数
  const handleApiError = (data: { code: string; message: string; context?: any }) => {
    console.error(`API错误 [${data.code}]: ${data.message}`, data.context);
  };
  
  // 注册事件监听
  eventBus.on('error:api', handleApiError);
  
  // 设置错误处理器
  // @ts-ignore - 忽略可能的类型错误
  const unsetupErrors = errorHandler?.setup ? errorHandler.setup() : () => {};
  
  // 返回清理函数
  return () => {
    console.log('系统关闭...');
    eventBus.off('error:api', handleApiError);
    unsetupErrors();
  };
}

/**
 * 初始化应用开发环境
 * 用于开发时检测环境变量和依赖项
 */
export function initDevEnvironment(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  // 检查环境变量
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn(
      '⚠️ 缺少环境变量:\n' +
      missingVars.map(v => `  - ${v}`).join('\n') +
      '\n请检查.env.local文件'
    );
  }
  
  // 开发环境日志增强
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // 添加时间戳
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      originalConsoleError.apply(
        console, 
        [`[${timestamp}] 🔴`, ...args]
      );
    };
    
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      originalConsoleWarn.apply(
        console, 
        [`[${timestamp}] 🟠`, ...args]
      );
    };
  }
} 