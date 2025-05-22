import React from 'react';

// 骨架屏类型
export type SkeletonVariant = 
  | 'spinner'     // 简单旋转加载
  | 'list'        // 列表骨架屏
  | 'card'        // 卡片骨架屏
  | 'detail'      // 详情页骨架屏
  | 'grid'        // 网格骨架屏
  | 'search'      // 搜索页骨架屏
  | 'text'        // 文本骨架屏
  | 'image'       // 图片骨架屏
  | 'combined';   // 组合骨架屏

// 骨架屏尺寸
export type SkeletonSize = 'sm' | 'md' | 'lg' | 'full'; 

// 骨架屏颜色
export type SkeletonColor = 'gray' | 'blue' | 'green' | 'custom'; 

export interface SkeletonLoaderProps {
  /**
   * 骨架屏变体
   * @default 'spinner'
   */
  variant?: SkeletonVariant;
  
  /**
   * 骨架屏大小
   * @default 'md'
   */
  size?: SkeletonSize;
  
  /**
   * 骨架屏颜色
   * @default 'gray'
   */
  color?: SkeletonColor;
  
  /**
   * 要显示的项目数量（用于列表类型）
   * @default 3
   */
  count?: number;
  
  /**
   * 是否添加脉冲动画
   * @default true
   */
  animate?: boolean;
  
  /**
   * 是否显示文本（例如"加载中..."）
   * @default true for 'spinner', false for others
   */
  showText?: boolean;
  
  /**
   * 加载文本
   * @default "加载中..."
   */
  text?: string;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 自定义颜色配置
   */
  customColors?: {
    base?: string;
    highlight?: string;
  };
}

/**
 * 获取基础骨架元素的类名
 */
function getBaseColorClass(color?: SkeletonColor, customBase?: string): string {
  if (customBase) return customBase;
  
  switch (color) {
    case 'blue': return 'bg-blue-200';
    case 'green': return 'bg-green-200';
    default: return 'bg-gray-200';
  }
}

/**
 * 获取高亮颜色类名（用于spinner）
 */
function getHighlightColorClass(color?: SkeletonColor, customHighlight?: string): string {
  if (customHighlight) return customHighlight;
  
  switch (color) {
    case 'blue': return 'border-blue-500 border-t-transparent';
    case 'green': return 'border-green-500 border-t-transparent';
    default: return 'border-gray-500 border-t-transparent';
  }
}

/**
 * 统一的骨架加载器组件
 * 提供各种类型的骨架屏布局，通过variant参数配置
 */
export default function Skeleton({
  variant = 'spinner',
  size = 'md',
  color = 'gray',
  count = 3,
  animate = true,
  showText,
  text = '加载中...',
  className = '',
  customColors
}: SkeletonLoaderProps) {
  // 自动设置showText默认值
  const shouldShowText = showText ?? (variant === 'spinner');
  
  // 确定动画类名
  const animationClass = animate ? 'animate-pulse' : '';
  
  // 确定基础颜色类名
  const baseColorClass = getBaseColorClass(color, customColors?.base);
  
  // 确定高亮颜色类名（用于spinner）
  const highlightColorClass = getHighlightColorClass(color, customColors?.highlight);
  
  // 计算尺寸类名
  const getSizeClass = (): string => {
    switch (size) {
      case 'sm': return 'h-5 w-5 border-2';
      case 'lg': return 'h-12 w-12 border-3';
      case 'full': return 'w-full';
      default: return 'h-8 w-8 border-2';
    }
  };
  
  // 渲染加载旋转器
  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div 
          className={`${getSizeClass()} rounded-full animate-spin ${highlightColorClass}`} 
          role="status" 
          aria-label={text}
        ></div>
        {shouldShowText && <p className="mt-2 text-sm text-gray-600">{text}</p>}
      </div>
    );
  }
  
  // 渲染文本骨架屏
  if (variant === 'text') {
    return (
      <div className={`${animationClass} ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div 
            key={index} 
            className={`h-4 ${baseColorClass} rounded ${index === count - 1 ? 'w-4/5' : 'w-full'} mb-2`}
          ></div>
        ))}
      </div>
    );
  }
  
  // 渲染图片骨架屏
  if (variant === 'image') {
    const aspectRatio = size === 'sm' ? 'aspect-square' : size === 'full' ? 'aspect-video' : 'aspect-video';
    const width = size === 'full' ? 'w-full' : size === 'sm' ? 'w-24' : size === 'lg' ? 'w-64' : 'w-48';
    
    return (
      <div className={`${width} ${aspectRatio} ${baseColorClass} rounded-lg ${animationClass} ${className}`}></div>
    );
  }
  
  // 渲染卡片骨架屏
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${animationClass} ${className}`}>
        {/* 图片占位 */}
        <div className={`h-40 ${baseColorClass} rounded-lg mb-4`}></div>
        
        {/* 标题占位 */}
        <div className={`h-6 ${baseColorClass} rounded w-3/4 mb-3`}></div>
        
        {/* 描述占位 */}
        <div className={`h-4 ${baseColorClass} rounded w-full mb-1`}></div>
        <div className={`h-4 ${baseColorClass} rounded w-5/6 mb-4`}></div>
        
        {/* 标签占位 */}
        <div className="flex flex-wrap gap-2 mt-2">
          <div className={`h-5 ${baseColorClass} rounded-full w-16`}></div>
          <div className={`h-5 ${baseColorClass} rounded-full w-14`}></div>
        </div>
      </div>
    );
  }
  
  // 渲染详情页骨架屏
  if (variant === 'detail') {
    return (
      <div className={`container ${animationClass} ${className}`}>
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            {/* 标题骨架 */}
            <div className={`h-8 ${baseColorClass} rounded w-3/4 mb-4`}></div>
            
            {/* 标签栏 */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className={`h-6 ${baseColorClass} rounded-full w-24`}></div>
              <div className={`h-6 ${baseColorClass} rounded-full w-32`}></div>
              <div className={`h-6 ${baseColorClass} rounded-full w-28`}></div>
            </div>
          </div>
          
          {/* 图片占位 */}
          <div className={`h-48 ${baseColorClass} rounded w-full mb-6`}></div>
          
          {/* 描述骨架 */}
          <div className={`h-4 ${baseColorClass} rounded w-full mb-2`}></div>
          <div className={`h-4 ${baseColorClass} rounded w-full mb-2`}></div>
          <div className={`h-4 ${baseColorClass} rounded w-5/6 mb-6`}></div>
          
          {/* 食材部分骨架 */}
          <div className={`h-6 ${baseColorClass} rounded w-1/4 mb-3`}></div>
          <div className={`h-4 ${baseColorClass} rounded w-full mb-2`}></div>
          <div className={`h-4 ${baseColorClass} rounded w-full mb-6`}></div>
          
          {/* 步骤部分骨架 */}
          <div className={`h-6 ${baseColorClass} rounded w-1/4 mb-3`}></div>
          <div className={`h-4 ${baseColorClass} rounded w-full mb-2`}></div>
          <div className={`h-4 ${baseColorClass} rounded w-full mb-2`}></div>
          <div className={`h-4 ${baseColorClass} rounded w-full mb-2`}></div>
        </div>
      </div>
    );
  }
  
  // 渲染列表或网格骨架屏
  if (variant === 'list' || variant === 'grid' || variant === 'search') {
    // 网格布局类名
    const gridClass = variant === 'grid' 
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
      : 'space-y-4';
    
    // 渲染网格项目
    return (
      <div className={`${gridClass} ${animationClass} ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* 列表项内容 */}
            {variant === 'list' ? (
              <div className="flex flex-col md:flex-row gap-4">
                {/* 图片占位（列表项的图片较小） */}
                <div className={`h-24 md:w-32 shrink-0 ${baseColorClass} rounded-lg`}></div>
                
                <div className="flex-1">
                  {/* 标题占位 */}
                  <div className={`h-5 ${baseColorClass} rounded w-3/4 mb-2`}></div>
                  
                  {/* 描述占位 */}
                  <div className={`h-4 ${baseColorClass} rounded w-full mb-1`}></div>
                  <div className={`h-4 ${baseColorClass} rounded w-5/6 mb-2`}></div>
                  
                  {/* 标签占位 */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <div className={`h-4 ${baseColorClass} rounded-full w-14`}></div>
                    <div className={`h-4 ${baseColorClass} rounded-full w-12`}></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 网格项目（和卡片类似但更小） */}
                <div className={`h-32 ${baseColorClass} rounded-lg mb-3`}></div>
                <div className={`h-5 ${baseColorClass} rounded w-3/4 mb-2`}></div>
                <div className={`h-4 ${baseColorClass} rounded w-full mb-1`}></div>
                <div className={`h-4 ${baseColorClass} rounded w-4/5`}></div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // 默认渲染一个基础的占位符
  return (
    <div className={`${baseColorClass} rounded ${animate ? 'animate-pulse' : ''} ${className}`} style={{ height: '20px' }}></div>
  );
}

// 导出预设的特定骨架屏组件
export const RecipeListSkeleton = ({ count = 6, ...props }: Omit<SkeletonLoaderProps, 'variant' | 'count'> & { count?: number }) => (
  <Skeleton variant="list" count={count} {...props} />
);

export const RecipeSkeleton = (props: Omit<SkeletonLoaderProps, 'variant'>) => (
  <Skeleton variant="detail" {...props} />
);

export const RecipeGridSkeleton = ({ count = 6, ...props }: Omit<SkeletonLoaderProps, 'variant' | 'count'> & { count?: number }) => (
  <Skeleton variant="grid" count={count} {...props} />
);

export const SearchSkeleton = ({ count = 6, ...props }: Omit<SkeletonLoaderProps, 'variant' | 'count'> & { count?: number }) => (
  <Skeleton variant="search" count={count} {...props} />
); 