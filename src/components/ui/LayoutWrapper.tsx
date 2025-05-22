import React, { ReactNode, useMemo } from 'react';
import { usePreferenceTheme } from '../../theme/themeStore';
import { useResponsive } from '../../hooks/useResponsive';

export type LayoutVariant = 
  | 'card'
  | 'grid'
  | 'container'
  | 'section'
  | 'flex'
  | 'flexColumn';

export type LayoutSpacing = 
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

export type LayoutRadius = 
  | 'none'
  | 'sm'
  | 'md'
  | 'lg'
  | 'full';

export interface LayoutWrapperProps {
  /**
   * 子元素内容
   */
  children: ReactNode;
  
  /**
   * 布局变体
   * @default 'container'
   */
  variant?: LayoutVariant;
  
  /**
   * 内边距大小
   * @default 'md'
   */
  padding?: LayoutSpacing;
  
  /**
   * 外边距大小
   * @default 'none'
   */
  margin?: LayoutSpacing;
  
  /**
   * 圆角大小
   * @default 'none'
   */
  radius?: LayoutRadius;
  
  /**
   * 是否适应移动端
   * @default true
   */
  responsive?: boolean;
  
  /**
   * 移动设备时的内边距，优先级高于padding
   */
  mobilePadding?: LayoutSpacing;
  
  /**
   * 桌面设备时的内边距，优先级高于padding
   */
  desktopPadding?: LayoutSpacing;
  
  /**
   * 响应式条件渲染配置
   */
  showOn?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
  
  /**
   * 是否应用暗色模式样式
   * @default 自动检测
   */
  darkMode?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 容器ID
   */
  id?: string;
  
  /**
   * 点击事件处理函数
   */
  onClick?: () => void;
}

// 获取内边距类名 - 使用静态映射而不是每次重新计算
const PADDING_CLASSES: Record<LayoutSpacing, string> = {
  'none': 'p-0',
  'xs': 'p-1',
  'sm': 'p-2',
  'md': 'p-4',
  'lg': 'p-6',
  'xl': 'p-8'
};

// 获取外边距类名 - 使用静态映射
const MARGIN_CLASSES: Record<LayoutSpacing, string> = {
  'none': 'm-0',
  'xs': 'm-1',
  'sm': 'm-2',
  'md': 'm-4',
  'lg': 'm-6',
  'xl': 'm-8'
};

// 获取圆角类名 - 使用静态映射
const RADIUS_CLASSES: Record<LayoutRadius, string> = {
  'none': 'rounded-none',
  'sm': 'rounded-sm',
  'md': 'rounded-md',
  'lg': 'rounded-lg',
  'full': 'rounded-full'
};

/**
 * 布局包装器组件 - 统一处理布局适配
 * 提供响应式、主题适配等通用布局功能
 */
const LayoutWrapper: React.FC<LayoutWrapperProps> = ({
  children,
  variant = 'container',
  padding = 'md',
  margin = 'none',
  radius = 'none',
  responsive = true, 
  mobilePadding,
  desktopPadding,
  showOn,
  darkMode,
  className = '',
  id,
  onClick
}) => {
  // 使用通用的主题和响应式钩子
  const { isDarkMode } = usePreferenceTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // 确定当前是否为深色模式
  const isCurrentDarkMode = darkMode !== undefined ? darkMode : isDarkMode;
  
  // 使用useMemo缓存是否应该隐藏组件的计算结果
  const shouldHideComponent = useMemo(() => {
    if (!showOn) return false;
    
    return (isMobile && showOn.mobile === false) || 
           (isTablet && showOn.tablet === false) || 
           (isDesktop && showOn.desktop === false);
  }, [isMobile, isTablet, isDesktop, showOn]);
  
  // 根据设备类型确定使用的内边距 - 移到条件判断之前
  const effectivePadding = useMemo(() => {
    if (isMobile && mobilePadding) return mobilePadding;
    if (isDesktop && desktopPadding) return desktopPadding;
    return padding;
  }, [isMobile, isDesktop, mobilePadding, desktopPadding, padding]);
  
  // 使用useMemo缓存主题相关的类名 - 移到条件判断之前
  const themeClass = useMemo(() => {
    return isCurrentDarkMode 
      ? 'text-gray-100 bg-gray-900' 
      : 'text-gray-900 bg-white';
  }, [isCurrentDarkMode]);
  
  // 使用useMemo缓存布局变体类名 - 移到条件判断之前
  const variantClass = useMemo(() => {
    if (variant === 'card') {
      const bgClass = isCurrentDarkMode ? 'bg-gray-800' : 'bg-white';
      const borderClass = isCurrentDarkMode ? 'border-gray-700' : 'border-gray-200';
      return `${bgClass} border ${borderClass} shadow-sm`;
    }
    
    const variantClasses = {
      'grid': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
      'container': 'w-full mx-auto max-w-7xl',
      'section': 'w-full',
      'flex': 'flex flex-row items-center',
      'flexColumn': 'flex flex-col'
    };
    
    return variantClasses[variant] || '';
  }, [variant, isCurrentDarkMode]);
  
  // 组合所有样式类 - 移到条件判断之前
  const combinedClassName = useMemo(() => {
    const paddingClass = PADDING_CLASSES[effectivePadding];
    const marginClass = MARGIN_CLASSES[margin];
    const radiusClass = RADIUS_CLASSES[radius];
    
    const classes = [
      paddingClass,
      marginClass,
      radiusClass,
      variantClass,
      variant === 'card' ? themeClass : '',
      className
    ].filter(Boolean).join(' ');
    
    return classes;
  }, [
    effectivePadding,
    margin,
    radius,
    variantClass,
    variant,
    themeClass,
    className
  ]);
  
  // 如果应该隐藏组件，提前返回null
  if (shouldHideComponent) {
    return null;
  }
  
  return (
    <div 
      id={id}
      className={combinedClassName}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default React.memo(LayoutWrapper); 