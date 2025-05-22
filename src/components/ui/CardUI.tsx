import React, { ReactNode } from 'react';
import { usePreferenceTheme } from '../../theme/themeStore';
import { useResponsive } from '../../hooks/useResponsive';

// 卡片变体类型
type CardVariant = 'elevated' | 'outlined' | 'filled' | 'plain';

// 卡片圆角类型
type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface CardUIProps {
  children: ReactNode;
  variant?: CardVariant;
  radius?: CardRadius;
  className?: string;
  bodyClassName?: string;
  hasShadow?: boolean;
  hasBorder?: boolean;
  isHoverable?: boolean;
  isFullWidth?: boolean;
  isInteractive?: boolean;
  onClick?: () => void;
  darkMode?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

// 主卡片组件
const CardUI = React.memo(({
  children,
  variant = 'elevated',
  radius = 'md',
  className = '',
  bodyClassName = '',
  hasShadow = true,
  hasBorder = true,
  isHoverable = false,
  isFullWidth = true,
  isInteractive = false,
  onClick,
  darkMode
}: CardUIProps) => {
  // 使用通用的主题和响应式钩子
  const { isDarkMode } = usePreferenceTheme();
  const { isMobile } = useResponsive();
  
  // 确定当前是否为深色模式
  const isCurrentDarkMode = darkMode !== undefined ? darkMode : isDarkMode;

  // 变体样式映射
  const variantClasses = {
    elevated: isCurrentDarkMode ? 'bg-gray-800' : 'bg-white',
    outlined: isCurrentDarkMode ? 'bg-gray-900' : 'bg-white',
    filled: isCurrentDarkMode ? 'bg-gray-700' : 'bg-gray-50',
    plain: 'bg-transparent'
  };

  // 圆角样式映射
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-2xl'
  };

  // 组合所有类名
  const cardClasses = [
    // 基础样式
    'overflow-hidden transition-all duration-200',
    // 变体样式
    variantClasses[variant],
    // 圆角样式
    radiusClasses[radius],
    // 阴影样式
    hasShadow && variant === 'elevated' ? isCurrentDarkMode ? 'shadow-dark-md' : 'shadow-md' : '',
    // 边框样式
    hasBorder && variant === 'outlined' ? isCurrentDarkMode ? 'border border-gray-700' : 'border border-gray-200' : '',
    // 悬浮效果
    isHoverable ? isCurrentDarkMode ? 'hover:shadow-dark-lg' : 'hover:shadow-lg' : '',
    // 宽度样式
    isFullWidth ? 'w-full' : '',
    // 交互样式
    isInteractive ? 'cursor-pointer' : '',
    // 文本颜色
    isCurrentDarkMode ? 'text-gray-100' : 'text-gray-800',
    // 自定义类名
    className
  ].join(' ');

  // 如果没有内容，渲染单个子元素
  if (React.Children.count(children) === 1) {
    return (
      <div 
        className={cardClasses}
        onClick={isInteractive ? onClick : undefined}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
      >
        <div className={`p-4 ${bodyClassName}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cardClasses}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {children}
    </div>
  );
});

// 卡片头部组件
const CardHeader = React.memo(({ 
  children, 
  className = '' 
}: CardHeaderProps) => {
  const { isDarkMode } = usePreferenceTheme();
  
  const headerClasses = [
    'p-4',
    isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200',
    className
  ].join(' ');

  return (
    <div className={headerClasses}>
      {children}
    </div>
  );
});

// 卡片主体组件
const CardBody = React.memo(({ 
  children, 
  className = '' 
}: CardBodyProps) => {
  const bodyClasses = [
    'p-4',
    className
  ].join(' ');

  return (
    <div className={bodyClasses}>
      {children}
    </div>
  );
});

// 卡片底部组件
const CardFooter = React.memo(({ 
  children, 
  className = '' 
}: CardFooterProps) => {
  const { isDarkMode } = usePreferenceTheme();
  
  const footerClasses = [
    'p-4',
    isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200',
    className
  ].join(' ');

  return (
    <div className={footerClasses}>
      {children}
    </div>
  );
});

// 设置displayName
CardUI.displayName = 'CardUI';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

// 导出组件和子组件
export { CardHeader, CardBody, CardFooter };
export default CardUI; 