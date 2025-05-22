'use client';

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * 上下文提供者工厂函数
 * 
 * @param options 上下文选项
 * @returns 上下文提供者组件和钩子函数
 */
export function createContextProvider<T>(options: {
  /**
   * 上下文的名称，用于错误信息
   */
  name: string;
  /**
   * 上下文的默认值，可选
   */
  defaultValue?: T;
  /**
   * 初始化上下文值的函数
   */
  useValue: () => T;
}) {
  // 创建上下文
  const Context = createContext<T | undefined>(options.defaultValue);
  
  // 自定义上下文钩子
  const useCustomContext = () => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(`use${options.name} must be used within a ${options.name}Provider`);
    }
    return context;
  };
  
  // 上下文提供者组件
  const Provider = ({ children }: { children: ReactNode }) => {
    // 使用传入的钩子获取上下文值
    const value = options.useValue();
    
    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    );
  };
  
  Provider.displayName = `${options.name}Provider`;
  
  return {
    Context,
    Provider,
    useContext: useCustomContext,
  };
} 