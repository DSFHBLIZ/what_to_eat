'use client';

import React, { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { IconType } from 'react-icons';
import ButtonUI, { ButtonUIProps, ButtonVariant, ButtonSize, ButtonColor } from './ButtonUI';

export type { ButtonVariant, ButtonSize, ButtonColor };

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /**
   * 按钮内容
   */
  children: ReactNode;
  
  /**
   * 按钮样式变体
   */
  variant?: ButtonVariant;
  
  /**
   * 按钮颜色
   */
  color?: ButtonColor;
  
  /**
   * 按钮尺寸
   */
  size?: ButtonSize;
  
  /**
   * 是否占满容器宽度
   */
  isFullWidth?: boolean;
  
  /**
   * 是否处于加载状态
   */
  isLoading?: boolean;
  
  /**
   * 加载时显示的文本
   */
  loadingText?: string;
  
  /**
   * 按钮左侧图标
   */
  leftIcon?: IconType;
  
  /**
   * 按钮右侧图标
   */
  rightIcon?: IconType;
  
  /**
   * 是否为仅图标按钮
   */
  iconOnly?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 按钮类型
   */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * 客户端按钮组件
 * 封装ButtonUI并添加客户端交互功能
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  // 外观props
  children,
  variant = 'primary',
  color = 'blue',
  size = 'md',
  isFullWidth = false,
  isLoading = false,
  loadingText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconOnly = false,
  className = '',
  
  // HTML button props
  disabled,
  type = 'button',
  onClick,
  ...rest
}, ref) => {
  // 处理图标元素
  const leftIconElement = LeftIcon ? <LeftIcon /> : undefined;
  const rightIconElement = RightIcon ? <RightIcon /> : undefined;
  
  return (
    <ButtonUI
      ref={ref}
      variant={variant}
      color={color}
      size={size}
      isFullWidth={isFullWidth}
      isLoading={isLoading}
      loadingText={loadingText}
      isDisabled={disabled}
      leftIconElement={leftIconElement}
      rightIconElement={rightIconElement}
      iconOnly={iconOnly}
      className={className}
      type={type}
      onClick={onClick}
      {...rest}
    >
      {children}
    </ButtonUI>
  );
});

Button.displayName = 'Button';

export default Button; 