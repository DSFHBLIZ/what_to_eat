import React, { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

// 按钮尺寸类型
export type ButtonSize = 'sm' | 'md' | 'lg';

// 按钮类型定义
export type ButtonProps = ButtonUIProps;

// 按钮变体类型
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

// 按钮颜色类型
export type ButtonColor = 'blue' | 'amber' | 'green' | 'red' | 'gray';

// 变体和颜色的类型映射
type ThemeColorMap = {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
};

export interface ButtonUIProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /**
   * 按钮内容
   */
  children: ReactNode;
  
  /**
   * 按钮尺寸
   */
  size?: ButtonSize;
  
  /**
   * 按钮变体
   */
  variant?: ButtonVariant;
  
  /**
   * 按钮颜色
   */
  color?: ButtonColor;
  
  /**
   * 是否占满容器宽度
   */
  isFullWidth?: boolean;
  
  /**
   * 左侧图标
   */
  leftIconElement?: ReactNode;
  
  /**
   * 右侧图标
   */
  rightIconElement?: ReactNode;
  
  /**
   * 是否为仅图标按钮
   */
  iconOnly?: boolean;
  
  /**
   * 是否处于加载状态
   */
  isLoading?: boolean;
  
  /**
   * 加载时显示的文本
   */
  loadingText?: string;
  
  /**
   * 是否禁用
   */
  isDisabled?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 基础按钮UI组件
 * 提供样式和基础交互，包含所有视觉样式处理逻辑
 */
const ButtonUI = forwardRef<HTMLButtonElement, ButtonUIProps>(
  ({
    children,
    size = 'md',
    variant = 'primary',
    color = 'blue',
    isFullWidth = false,
    leftIconElement,
    rightIconElement,
    iconOnly = false,
    isLoading = false,
    loadingText,
    isDisabled = false,
    className = '',
    
    // HTML button props
    disabled,
    type = 'button',
    ...rest
  }, ref) => {
    // 合并禁用状态
    const isButtonDisabled = isDisabled || disabled || isLoading;
    
    // 尺寸样式映射
    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    };

    // 按钮变体-背景色
    const bgClasses: ThemeColorMap = {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-transparent',
      success: 'bg-green-500 hover:bg-green-600 text-white border-transparent',
      danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent',
      info: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
    };

    // 轻量变体样式
    const lightClasses: ThemeColorMap = {
      primary: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-transparent',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-transparent', 
      success: 'bg-green-100 hover:bg-green-200 text-green-800 border-transparent',
      danger: 'bg-red-100 hover:bg-red-200 text-red-800 border-transparent',
      warning: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-transparent',
      info: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-transparent',
    };

    // 描边变体样式
    const outlineClasses: ThemeColorMap = {
      primary: 'bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-500',
      secondary: 'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-500',
      success: 'bg-transparent hover:bg-green-50 text-green-600 border border-green-500',
      danger: 'bg-transparent hover:bg-red-50 text-red-600 border border-red-500',
      warning: 'bg-transparent hover:bg-yellow-50 text-yellow-600 border border-yellow-500',
      info: 'bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-500',
    };
    
    // 幽灵变体样式
    const ghostClasses: ThemeColorMap = {
      primary: 'bg-transparent hover:bg-blue-50 text-blue-600 border-transparent',
      secondary: 'bg-transparent hover:bg-gray-50 text-gray-700 border-transparent',
      success: 'bg-transparent hover:bg-green-50 text-green-600 border-transparent',
      danger: 'bg-transparent hover:bg-red-50 text-red-600 border-transparent',
      warning: 'bg-transparent hover:bg-yellow-50 text-yellow-600 border-transparent',
      info: 'bg-transparent hover:bg-blue-50 text-blue-600 border-transparent',
    };
    
    // 链接变体样式
    const linkClasses: ThemeColorMap = {
      primary: 'bg-transparent text-blue-600 hover:underline border-transparent p-0',
      secondary: 'bg-transparent text-gray-700 hover:underline border-transparent p-0',
      success: 'bg-transparent text-green-600 hover:underline border-transparent p-0',
      danger: 'bg-transparent text-red-600 hover:underline border-transparent p-0',
      warning: 'bg-transparent text-yellow-600 hover:underline border-transparent p-0',
      info: 'bg-transparent text-blue-600 hover:underline border-transparent p-0',
    };

    // 禁用状态样式
    const disabledClasses = 'opacity-50 cursor-not-allowed';

    // 组合所有类名
    const buttonClasses = [
      // 基础样式
      'flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50',
      // 仅图标样式
      iconOnly ? (
        size === 'sm' ? 'p-1' : 
        size === 'lg' ? 'p-3' : 'p-2'
      ) : (
        // 非仅图标样式 - 使用尺寸样式
        sizeClasses[size]
      ),
      // 变体和颜色样式
      bgClasses[variant],
      // 全宽样式
      isFullWidth ? 'w-full' : '',
      // 禁用样式
      isButtonDisabled ? disabledClasses : '',
      // 聚焦环颜色
      `focus:ring-${color}-500`,
      // 自定义样式
      className
    ].join(' ');

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isButtonDisabled}
        type={type}
        {...rest}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        
        {!isLoading && leftIconElement && (
          <span className={`${!iconOnly && children ? 'mr-2' : ''}`}>
            {leftIconElement}
          </span>
        )}
        
        {(!iconOnly || !isLoading) && children && (
          <span>{loadingText && isLoading ? loadingText : children}</span>
        )}
        
        {!isLoading && rightIconElement && (
          <span className={`${!iconOnly && children ? 'ml-2' : ''}`}>
            {rightIconElement}
          </span>
        )}
      </button>
    );
  }
);

ButtonUI.displayName = 'ButtonUI';

export default ButtonUI; 