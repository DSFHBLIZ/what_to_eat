import React, { ReactNode, forwardRef } from 'react';

// Tooltip的位置类型
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

// 样式配置类型
export interface TooltipStyle {
  bg?: string;       // 背景色
  text?: string;     // 文字颜色
  border?: string;   // 边框颜色
  shadow?: string;   // 阴影样式
  rounded?: string;  // 圆角样式
  width?: string;    // 宽度
  zIndex?: string;   // 层级
}

// Tooltip组件属性
export interface TooltipBoxProps {
  // 内容和子元素
  content: ReactNode;
  children: ReactNode;
  
  // 显示控制
  isVisible?: boolean;
  
  // 位置和样式配置
  position?: TooltipPosition;
  offset?: number;
  style?: TooltipStyle;
  
  // 自定义类和ID
  tooltipId?: string;
  className?: string;
  contentClassName?: string;
}

/**
 * 统一的纯UI提示气泡盒子组件
 * 用于在悬停或交互时显示额外信息
 */
const TooltipBox = forwardRef<HTMLDivElement, TooltipBoxProps>(({
  // 内容和子元素
  content,
  children,
  
  // 显示控制
  isVisible = false,
  
  // 位置和样式配置
  position = 'top',
  offset = 8,
  style = {},
  
  // 自定义类和ID
  tooltipId,
  className = '',
  contentClassName = ''
}, ref) => {
  // 默认样式
  const defaultStyle: TooltipStyle = {
    bg: 'bg-gray-800',
    text: 'text-white',
    border: 'border border-gray-700',
    shadow: 'shadow-lg',
    rounded: 'rounded-md',
    width: 'max-w-xs',
    zIndex: 'z-50'
  };
  
  // 合并样式
  const mergedStyle = { ...defaultStyle, ...style };
  
  // 根据位置计算样式
  const positionStyles = {
    top: `bottom-full left-1/2 transform -translate-x-1/2 mb-${offset}`,
    right: `left-full top-1/2 transform -translate-y-1/2 ml-${offset}`,
    bottom: `top-full left-1/2 transform -translate-x-1/2 mt-${offset}`,
    left: `right-full top-1/2 transform -translate-y-1/2 mr-${offset}`
  };
  
  // 根据位置计算小三角形的位置
  const arrowStyles = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent'
  };
  
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      
      {isVisible && (
        <div 
          ref={ref}
          className={`
            absolute pointer-events-none 
            ${positionStyles[position]} 
            ${mergedStyle.width} 
            ${mergedStyle.zIndex}
          `}
          id={tooltipId}
        >
          {/* 主体内容 */}
          <div 
            className={`
              p-2 
              ${mergedStyle.bg} 
              ${mergedStyle.text} 
              ${mergedStyle.border} 
              ${mergedStyle.shadow} 
              ${mergedStyle.rounded}
              ${contentClassName}
            `}
          >
            {content}
          </div>
          
          {/* 小三角形 */}
          <div
            className={`
              absolute w-0 h-0 
              border-solid border-4
              ${arrowStyles[position]}
            `}
          />
        </div>
      )}
    </div>
  );
});

TooltipBox.displayName = 'TooltipBox';

export default TooltipBox; 