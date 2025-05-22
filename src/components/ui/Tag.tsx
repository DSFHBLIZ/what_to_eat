'use client';

import React from 'react';
import BaseTag, { TagSize } from './BaseTag';

// 轻量级Tag组件Props接口
export interface TagProps {
  /**
   * 标签显示文本
   */
  label: string;
  
  /**
   * 标签值(可选)
   */
  value?: string;
  
  /**
   * 标签尺寸
   */
  size?: TagSize;
  
  /**
   * 是否为圆角设计
   */
  rounded?: boolean;
  
  /**
   * 图标元素
   */
  iconElement?: React.ReactNode;
  
  /**
   * 移除标签的回调函数
   */
  onRemove?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  
  /**
   * 点击标签的回调函数
   */
  onClick?: () => void;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 子元素
   */
  children?: React.ReactNode;
}

/**
 * 轻量级标签组件
 * 简单封装BaseTag，适用于基础标签场景
 * 更复杂的场景请使用TagWrapper组件
 */
const Tag: React.FC<TagProps> = ({
  label,
  value,
  size = 'md',
  rounded = true,
  iconElement,
  onRemove,
  onClick,
  className = '',
  children,
}) => {
  return (
    <BaseTag
      label={label}
      value={value}
      size={size}
      rounded={rounded}
      isClickable={!!onClick}
      hasRemoveButton={!!onRemove}
      iconElement={iconElement}
      className={className}
      onClick={onClick}
      onRemove={onRemove}
    >
      {children}
    </BaseTag>
  );
};

export default Tag; 