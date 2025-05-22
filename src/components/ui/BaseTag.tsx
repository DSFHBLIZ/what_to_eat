'use client';

import React from 'react';
import ClearButton from '../common/ClearButton';

// 标签类型 - 保留这些类型但样式处理将移至TagWrapper
export type TagType = 'default' | 'filter' | 'filter-selected' | 'badge' | 'custom' | 
                      'ingredient-required' | 'ingredient-optional' | 'ingredient-excluded';

// 标签颜色
export type TagColor = 'blue' | 'green' | 'red' | 'gray' | 'amber' | 'purple' | 'orange' | 'custom';

// 标签尺寸
export type TagSize = 'sm' | 'md' | 'lg';

// 徽章变体
export type BadgeVariant = 'custom' | 'flavor' | 'cuisine' | 'difficulty';

// 自定义颜色配置
export interface TagCustomColors {
  bg?: string;
  text?: string;
  border?: string;
  hover?: string;
}

// 简化的BaseTagProps接口
export interface BaseTagProps {
  /**
   * 标签显示文本
   */
  label: string;
  
  /**
   * 标签值(用于传递给回调)
   */
  value?: string;
  
  /**
   * CSS类名 - 这是BaseTag的核心属性，由上层组件提供具体样式
   */
  className?: string;
  
  /**
   * 尺寸样式：小、中、大
   */
  size?: TagSize;
  
  /**
   * 是否为圆角设计
   */
  rounded?: boolean;
  
  /**
   * 是否可点击
   */
  isClickable?: boolean;
  
  /**
   * 图标元素
   */
  iconElement?: React.ReactNode;
  
  /**
   * 是否显示标签内容
   */
  showLabel?: boolean;
  
  /**
   * 是否显示移除按钮
   */
  hasRemoveButton?: boolean;
  
  /**
   * 点击事件
   */
  onClick?: () => void;
  
  /**
   * 移除事件
   */
  onRemove?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  
  /**
   * 子元素
   */
  children?: React.ReactNode;
  
  /**
   * 为测试和调试保留的属性
   */
  'data-testid'?: string;
}

/**
 * 基础标签组件
 * 提供最核心的标签UI结构和交互逻辑，样式由上层组件通过className提供
 */
const BaseTag: React.FC<BaseTagProps> = ({
  // 基本内容
  label,
  value,
  children,
  
  // 样式配置
  className = '',
  size = 'md',
  rounded = true,
  
  // 交互状态
  isClickable = false,
  
  // 内容控制
  iconElement,
  showLabel = true,
  hasRemoveButton = false,
  
  // 事件处理
  onClick,
  onRemove,
  
  // 测试属性
  'data-testid': testId = 'tag',
}) => {
  // 尺寸样式映射
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  // 基础样式类
  const baseClasses = `
    inline-flex items-center justify-center
    transition-colors 
    ${rounded ? 'rounded-full' : 'rounded-md'} 
    ${sizeStyles[size]}
    ${isClickable ? 'cursor-pointer' : ''}
    ${className}
  `;
  
  // 处理点击事件
  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };
  
  // 处理移除事件
  const handleRemove = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation();
    }
    if (onRemove) {
      onRemove(e);
    }
  };
  
  return (
    <div className="inline-flex items-center">
      <div
        className={baseClasses}
        onClick={isClickable ? handleClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        data-value={value}
        data-testid={testId}
      >
        {iconElement && (
          <span className={`${showLabel ? 'mr-1.5' : ''} flex-shrink-0`}>
            {iconElement}
          </span>
        )}
        
        {showLabel && <span>{label}</span>}
        
        {children}
        
        {/* 将移除按钮放在气泡内部 */}
        {hasRemoveButton && (
          <ClearButton
            onClick={handleRemove}
            size={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
            className="ml-1.5"
            label="移除"
          />
        )}
      </div>
      
      {/* 移除外部的ClearButton */}
    </div>
  );
};

export default BaseTag; 