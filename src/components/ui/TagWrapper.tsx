'use client';

import React, { useMemo } from 'react';
import { CheckCircle, Circle, XCircle, Tag as TagIcon } from 'lucide-react';
import BaseTag, { TagType, BadgeVariant, TagSize, TagColor, TagCustomColors } from './BaseTag';

export type { TagType, BadgeVariant, TagSize, TagColor, TagCustomColors };

export interface TagWrapperProps {
  /**
   * 标签显示文本
   */
  label: string;
  
  /**
   * 标签值(用于传递给回调)
   */
  value?: string;
  
  /**
   * 标签类型
   */
  type?: TagType;
  
  /**
   * 徽章变体
   */
  badgeVariant?: BadgeVariant;
  
  /**
   * 标签颜色
   */
  color?: TagColor;
  
  /**
   * 自定义颜色配置
   */
  customColors?: TagCustomColors;
  
  /**
   * 移除标签的回调函数
   */
  onRemove?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  
  /**
   * 点击标签的回调函数
   */
  onClick?: () => void;
  
  /**
   * 切换标签类型的回调函数 (用于 ingredient-* 类型标签)
   */
  onTypeChange?: (newType: TagType) => void;
  
  /**
   * 是否显示图标
   * @default true for ingredient types, false for others
   */
  showIcon?: boolean;
  
  /**
   * 自定义图标
   */
  customIcon?: React.ReactNode;
  
  /**
   * 标签尺寸
   */
  size?: TagSize;
  
  /**
   * 是否显示标签文本
   */
  showLabel?: boolean;
  
  /**
   * 是否选中
   */
  isSelected?: boolean;
  
  /**
   * 是否可点击
   */
  isClickable?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 是否使用圆角
   */
  rounded?: boolean;
  
  /**
   * 为测试和调试保留的属性
   */
  'data-testid'?: string;
}

/**
 * 标签包装组件
 * 包装BaseTag组件，添加交互功能和图标
 * 可用于替代 Badge, TagUI, IngredientTag, FilterTag, FlavorTag, DifficultyBadge 等组件
 */
export default function TagWrapper({
  // 基本数据
  label,
  value,
  
  // 类型控制
  type = 'custom',
  badgeVariant = 'custom',
  color = 'blue',
  
  // 交互状态
  isSelected = false,
  isClickable,
  
  // 事件处理
  onRemove,
  onClick,
  onTypeChange,
  
  // 图标配置
  showIcon,
  customIcon,
  
  // 显示配置
  size = 'md',
  showLabel = true,
  rounded = true,
  
  // 样式配置
  className = '',
  customColors,
  
  // 测试属性
  'data-testid': testId
}: TagWrapperProps) {
  // 自动设置showIcon的默认值
  const shouldShowIcon = showIcon ?? (
    type === 'ingredient-required' || 
    type === 'ingredient-optional' || 
    type === 'ingredient-excluded'
  );
  
  // 处理点击事件
  const handleClick = () => {
    // 如果设置了onClick回调，则触发
    if (onClick) {
      onClick();
    }
    // 如果是食材标签并且设置了类型切换回调，在点击时切换类型
    else if (onTypeChange && (
      type === 'ingredient-required' || 
      type === 'ingredient-optional' || 
      type === 'ingredient-excluded'
    )) {
      // 循环切换类型: required -> optional -> excluded -> required
      const newType: TagType = 
        type === 'ingredient-required' ? 'ingredient-optional' : 
        type === 'ingredient-optional' ? 'ingredient-excluded' : 'ingredient-required';
      
      onTypeChange(newType);
    }
  };
  
  // 获取图标
  const getIconElement = (): React.ReactNode => {
    // 如果不显示图标，返回null
    if (!shouldShowIcon) return null;
    
    // 如果提供了自定义图标，使用自定义图标
    if (customIcon) return customIcon;
    
    // 根据类型选择图标
    switch (type) {
      case 'ingredient-required':
        return <CheckCircle size={size === 'sm' ? 12 : 14} className="text-blue-600" />;
      case 'ingredient-optional':
        return <Circle size={size === 'sm' ? 12 : 14} className="text-green-600" />;
      case 'ingredient-excluded':
        return <XCircle size={size === 'sm' ? 12 : 14} className="text-red-600" />;
      case 'badge':
        // 根据徽章变体选择图标
        switch (badgeVariant) {
          case 'flavor':
            return <TagIcon size={size === 'sm' ? 12 : 14} className="text-amber-600" />;
          case 'cuisine':
            return <TagIcon size={size === 'sm' ? 12 : 14} className="text-indigo-600" />;
          default:
            return null;
        }
      default:
        return null;
    }
  };
  
  // 处理移除按钮点击
  const handleRemove = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation();
    }
    if (onRemove) {
      onRemove(e);
    }
  };
  
  // 确定是否可点击
  const clickable = isClickable !== undefined ? isClickable : !!(onClick || onTypeChange);
  
  // 根据类型和颜色获取样式
  const getTypeColorStyles = () => {
    // 如果提供了自定义颜色，优先使用
    if (type === 'custom' && customColors) {
      return `
        ${customColors.bg || 'bg-gray-100'} 
        ${customColors.text || 'text-gray-800'} 
        ${customColors.border ? `border ${customColors.border}` : 'border-transparent'} 
        ${clickable && customColors.hover ? customColors.hover : ''}
      `;
    }
    
    // 特殊类型：食材类型
    if (type.startsWith('ingredient-')) {
      switch (type) {
        case 'ingredient-required':
          return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
        case 'ingredient-optional':
          return 'bg-green-100 text-green-800 border border-green-300';
        case 'ingredient-excluded':
          return 'bg-red-100 text-red-800 border border-red-300';
        default:
          return 'bg-gray-100 text-gray-800 border border-gray-300';
      }
    }
    
    // 类型样式映射
    const typeStyles: Record<string, string> = {
      default: `bg-gray-100 text-gray-800 border border-transparent ${clickable ? 'hover:bg-gray-200' : ''}`,
      filter: `bg-gray-100 text-gray-800 border border-gray-200 ${clickable ? 'hover:bg-gray-200' : ''}`,
      'filter-selected': '', // 由颜色决定
      badge: `bg-opacity-10 border ${color === 'custom' ? 'border-gray-300' : ''}`,
      custom: 'bg-gray-100 text-gray-800',
    };
    
    // 选中状态由颜色决定
    if (type === 'filter-selected') {
      switch (color) {
        case 'blue':
          return 'bg-blue-500 text-white border border-blue-600 shadow-sm';
        case 'green':
          return 'bg-green-500 text-white border border-green-600 shadow-sm';
        case 'red':
          return 'bg-red-500 text-white border border-red-600 shadow-sm';
        case 'amber':
          return 'bg-amber-500 text-white border border-amber-600 shadow-sm';
        case 'purple':
          return 'bg-purple-500 text-white border border-purple-600 shadow-sm';
        case 'orange':
          return 'bg-orange-500 text-white border border-orange-600 shadow-sm';
        case 'gray':
        default:
          return 'bg-gray-600 text-white border border-gray-700 shadow-sm';
      }
    }
    
    // badge类型的颜色
    if (type === 'badge') {
      switch (color) {
        case 'blue':
          return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'green':
          return `bg-green-100 text-green-800 border border-green-300`;
        case 'red':
          return `bg-red-100 text-red-800 border border-red-300`;
        case 'amber':
          return `bg-amber-100 text-amber-800 border border-amber-300`;
        case 'purple':
          return `bg-purple-100 text-purple-800 border border-purple-300`;
        case 'orange':
          return `bg-orange-100 text-orange-800 border border-orange-300`;
        case 'gray':
        default:
          return `bg-gray-100 text-gray-800 border border-gray-300`;
      }
    }
    
    return typeStyles[type] || typeStyles.default;
  };
  
  // 组合标签样式
  const tagStyles = `${getTypeColorStyles()} ${className}`;
  
  // 渲染标签
  return (
    <BaseTag
      label={label}
      value={value}
      className={tagStyles}
      iconElement={getIconElement()}
      size={size}
      rounded={rounded}
      isClickable={clickable}
      onClick={handleClick}
      onRemove={handleRemove}
      hasRemoveButton={!!onRemove}
      showLabel={showLabel}
      data-testid={testId}
    />
  );
} 