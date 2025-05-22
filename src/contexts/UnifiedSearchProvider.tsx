'use client';

import { ReactNode, createContext, useContext } from 'react';
import { useUnifiedSearchController } from '../controllers/useUnifiedSearchController';
import { UnifiedSearchControllerOptions } from '../controllers/useUnifiedSearchController';

// 创建上下文
const UnifiedSearchContext = createContext<ReturnType<typeof useUnifiedSearchController> | null>(null);

// 提供默认配置
const defaultOptions: UnifiedSearchControllerOptions = {
  syncWithUrl: true,
  preserveHistory: true,
  autoExecuteSearch: false
};

interface UnifiedSearchProviderProps {
  children: ReactNode;
  options?: UnifiedSearchControllerOptions;
}

/**
 * 统一搜索提供者组件
 * 为整个应用提供搜索和过滤状态
 */
export const UnifiedSearchProvider = ({ 
  children, 
  options = defaultOptions 
}: UnifiedSearchProviderProps) => {
  // 使用统一搜索控制器
  const controller = useUnifiedSearchController(options);
  
  return (
    <UnifiedSearchContext.Provider value={controller}>
      {children}
    </UnifiedSearchContext.Provider>
  );
};

/**
 * 使用统一搜索钩子
 * 在组件中访问统一搜索和过滤状态
 */
export function useUnifiedSearch() {
  const context = useContext(UnifiedSearchContext);
  
  if (!context) {
    throw new Error('useUnifiedSearch 必须在 UnifiedSearchProvider 内部使用');
  }
  
  return context;
} 