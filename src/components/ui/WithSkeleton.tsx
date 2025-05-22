'use client';

import React, { ReactNode } from 'react';
import Skeleton, { SkeletonVariant } from './SkeletonLoader';

interface WithSkeletonProps {
  // 是否正在加载
  loading: boolean;
  // 骨架屏变体
  variant?: SkeletonVariant;
  // 骨架屏项目数量
  count?: number;
  // 自定义骨架屏组件
  customSkeleton?: ReactNode;
  // 子元素
  children: ReactNode;
  // 自定义类名
  className?: string;
  // 骨架屏高度
  height?: number | string;
  // 骨架屏宽度
  width?: number | string;
  // 动画效果
  animate?: boolean;
  // 骨架屏组件的其他属性
  skeletonProps?: React.ComponentProps<typeof Skeleton>;
}

/**
 * 通用骨架屏包装组件
 * 根据loading状态决定是否显示骨架屏
 * 使用新的Skeleton组件系统
 */
const WithSkeleton: React.FC<WithSkeletonProps> = ({
  loading,
  variant = 'card',
  count = 1,
  customSkeleton,
  children,
  className = '',
  height,
  width,
  animate = true,
  skeletonProps = {}
}) => {
  if (!loading) {
    return <>{children}</>;
  }

  // 使用自定义骨架屏
  if (customSkeleton) {
    return <div className={className}>{customSkeleton}</div>;
  }

  // 使用内置骨架屏
  return (
    <div className={className} style={{ height, width }}>
      <Skeleton 
        variant={variant} 
        count={count} 
        animate={animate}
        {...skeletonProps}
      />
    </div>
  );
};

/**
 * 文本骨架屏
 */
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3,
  className = ''
}) => {
  return (
    <Skeleton 
      variant="text"
      count={lines}
      className={className}
    />
  );
};

/**
 * 元素骨架屏 - 适用于单个UI元素
 */
export const ElementSkeleton: React.FC<{
  width?: string | number;
  height?: string | number;
  rounded?: boolean | string;
  className?: string;
}> = ({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = ''
}) => {
  const roundedClass = typeof rounded === 'string' 
    ? `rounded-${rounded}` 
    : rounded 
      ? 'rounded-md' 
      : '';

  return (
    <div 
      className={`bg-gray-200 animate-pulse ${roundedClass} ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  );
};

export default WithSkeleton; 