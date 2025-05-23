'use client';

import { memo, ReactNode } from 'react';

interface RecipeLayoutProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
  padding?: string;
  className?: string;
  printClassName?: string;
}

/**
 * 菜谱布局组件 - 提供统一的页面布局结构
 */
const RecipeLayout = ({
  children,
  maxWidth = '3xl',
  padding = 'p-4 sm:p-6',
  className = '',
  printClassName = 'print:p-0'
}: RecipeLayoutProps) => {
  // 最大宽度映射
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    'full': 'max-w-full'
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto ${padding} ${printClassName} ${className}`}>
      {children}
      
      {/* 打印时显示的页脚 */}
      <div className="hidden print:block print-footer">
        <p>打印于 {new Date().toLocaleDateString()} - 冰箱里有什么</p>
      </div>
    </div>
  );
};

export default memo(RecipeLayout); 