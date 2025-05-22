import React, { useMemo } from 'react';
import { usePreferenceTheme } from '../../theme/themeStore';
import { useResponsive } from '../../hooks/useResponsive';

export type TitleLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type TitleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type TitleWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TitleVariant = 'default' | 'section' | 'page' | 'card' | 'subtitle';

export interface TitleUIProps {
  /**
   * 标题内容
   */
  children: React.ReactNode;
  
  /**
   * 标题级别（HTML标签）
   * @default 'h2'
   */
  level?: TitleLevel;
  
  /**
   * 标题大小
   * @default 根据level和variant自动设置
   */
  size?: TitleSize;
  
  /**
   * 字体粗细
   * @default 'bold'
   */
  weight?: TitleWeight;
  
  /**
   * 标题变体，预设不同类型的标题样式
   * @default 'default'
   */
  variant?: TitleVariant;
  
  /**
   * 是否添加底部边距
   * @default true
   */
  withMargin?: boolean;
  
  /**
   * 额外的CSS类名
   */
  className?: string;
  
  /**
   * 额外的数据属性
   */
  dataAttributes?: Record<string, string>;
  
  /**
   * 是否应用暗色模式样式
   * @default 自动检测
   */
  darkMode?: boolean;
  
  /**
   * 移动端字体大小调整
   * @default false
   */
  responsiveSizing?: boolean;
}

/**
 * 统一的标题组件，用于替代PageTitle, SectionTitle和各处重复的标题样式
 */
export default function TitleUI({
  children,
  level = 'h2',
  size,
  weight = 'bold',
  variant = 'default',
  withMargin = true,
  className = '',
  dataAttributes = {},
  darkMode,
  responsiveSizing = false
}: TitleUIProps) {
  // 使用通用的主题和响应式钩子
  const { isDarkMode } = usePreferenceTheme();
  const { isMobile } = useResponsive();
  
  // 确定当前是否为深色模式
  const isCurrentDarkMode = darkMode !== undefined ? darkMode : isDarkMode;
  
  // 根据变体和级别确定默认大小
  const getDefaultSize = (): TitleSize => {
    if (size) return size;
    
    // 基于变体的默认大小
    switch (variant) {
      case 'page':
        return '3xl';
      case 'section':
        return '2xl';
      case 'card':
        return 'xl';
      case 'subtitle':
        return 'md';
      default:
        // 基于级别的默认大小
        switch (level) {
          case 'h1': return '3xl';
          case 'h2': return '2xl';
          case 'h3': return 'xl';
          case 'h4': return 'lg';
          case 'h5': return 'md';
          case 'h6': return 'sm';
          default: return 'lg';
        }
    }
  };
  
  // 获取字体大小类名，考虑响应式
  const getFontSizeClass = (): string => {
    const sizeClass = getDefaultSize();
    
    // 根据是否移动端以及是否需要响应式调整大小
    const shouldReduceSize = isMobile && responsiveSizing;
    
    switch (sizeClass) {
      case 'xs': return shouldReduceSize ? 'text-xs' : 'text-xs';
      case 'sm': return shouldReduceSize ? 'text-xs' : 'text-sm';
      case 'md': return shouldReduceSize ? 'text-sm' : 'text-base';
      case 'lg': return shouldReduceSize ? 'text-base' : 'text-lg';
      case 'xl': return shouldReduceSize ? 'text-lg' : 'text-xl';
      case '2xl': return shouldReduceSize ? 'text-xl' : 'text-2xl';
      case '3xl': return shouldReduceSize ? 'text-2xl' : 'text-3xl md:text-4xl';
      case '4xl': return shouldReduceSize ? 'text-3xl' : 'text-4xl md:text-5xl';
      default: return shouldReduceSize ? 'text-lg' : 'text-xl';
    }
  };
  
  // 获取字体粗细类名
  const getFontWeightClass = (): string => {
    switch (weight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-bold';
    }
  };
  
  // 获取边距类名
  const getMarginClass = (): string => {
    if (!withMargin) return '';
    
    // 移动端边距可能较小
    const mobileFactor = isMobile && responsiveSizing ? 0.5 : 1;
    
    switch (variant) {
      case 'page':
        return isMobile ? 'mb-6' : 'mb-8';
      case 'section':
        return isMobile ? 'mb-4' : 'mb-6';
      case 'card':
        return 'mb-4';
      case 'subtitle':
        return 'mb-2';
      default:
        return 'mb-4';
    }
  };
  
  // 获取颜色类名，考虑主题
  const getColorClass = (): string => {
    if (isCurrentDarkMode) {
      switch (variant) {
        case 'subtitle':
          return 'text-gray-400';
        default:
          return 'text-gray-200';
      }
    } else {
      switch (variant) {
        case 'subtitle':
          return 'text-gray-600';
        default:
          return 'text-gray-800';
      }
    }
  };
  
  // 组合所有样式类
  const combinedClassName = `
    ${getFontSizeClass()}
    ${getFontWeightClass()}
    ${getMarginClass()}
    ${getColorClass()}
    ${className}
  `;
  
  // 构建数据属性对象
  const dataProps: Record<string, string> = {
    'data-title-variant': variant,
    'data-title-level': level,
    ...dataAttributes
  };
  
  // 根据级别渲染不同的标题标签
  switch (level) {
    case 'h1':
      return <h1 className={combinedClassName} {...dataProps}>{children}</h1>;
    case 'h2':
      return <h2 className={combinedClassName} {...dataProps}>{children}</h2>;
    case 'h3':
      return <h3 className={combinedClassName} {...dataProps}>{children}</h3>;
    case 'h4':
      return <h4 className={combinedClassName} {...dataProps}>{children}</h4>;
    case 'h5':
      return <h5 className={combinedClassName} {...dataProps}>{children}</h5>;
    case 'h6':
      return <h6 className={combinedClassName} {...dataProps}>{children}</h6>;
    default:
      return <h2 className={combinedClassName} {...dataProps}>{children}</h2>;
  }
} 