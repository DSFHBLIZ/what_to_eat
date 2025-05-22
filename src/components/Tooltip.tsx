'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import TooltipBox, { TooltipPosition, TooltipStyle } from './ui/TooltipBox';
import { useClickOutside } from '../hooks/useClickOutside';

export interface TooltipProps {
  // 内容和子元素
  content: ReactNode;
  children: ReactNode;
  
  // 行为控制
  showOnHover?: boolean;
  showOnClick?: boolean;
  initialVisible?: boolean;
  hideOnEscape?: boolean;
  hideOnClickOutside?: boolean;
  hideAfter?: number; // 毫秒
  
  // 样式和位置
  position?: TooltipPosition;
  offset?: number;
  style?: TooltipStyle;
  
  // 自定义类
  className?: string;
  contentClassName?: string;
}

/**
 * 客户端Tooltip组件
 * 包装TooltipBox，添加交互逻辑
 */
const Tooltip: React.FC<TooltipProps> = ({
  // 内容和子元素
  content,
  children,
  
  // 行为控制
  showOnHover = true,
  showOnClick = false,
  initialVisible = false,
  hideOnEscape = true,
  hideOnClickOutside = true,
  hideAfter,
  
  // 样式和位置
  position = 'top',
  offset,
  style,
  
  // 自定义类
  className,
  contentClassName
}) => {
  // 状态
  const [isVisible, setIsVisible] = useState(initialVisible);
  
  // 引用
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 显示Tooltip
  const showTooltip = () => {
    // 如果有正在执行的隐藏计时器，清除它
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    setIsVisible(true);
    
    // 如果设置了自动隐藏
    if (hideAfter && hideAfter > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        hideTimeoutRef.current = null;
      }, hideAfter);
    }
  };
  
  // 隐藏Tooltip
  const hideTooltip = () => {
    setIsVisible(false);
  };
  
  // 切换Tooltip显示状态
  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };
  
  // 使用useClickOutside隐藏tooltip
  useClickOutside(tooltipRef, (event) => {
    if (hideOnClickOutside && isVisible && !targetRef.current?.contains(event.target as Node)) {
      hideTooltip();
    }
  });
  
  // 处理Escape键事件
  useEffect(() => {
    if (!hideOnEscape || !isVisible) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltip();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hideOnEscape, isVisible]);
  
  // 清理计时器
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);
  
  // 构建事件处理器
  const eventHandlers = {
    ...(showOnHover ? {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
    } : {}),
    ...(showOnClick ? {
      onClick: toggleTooltip,
    } : {})
  };
  
  return (
    <div
      ref={targetRef}
      className={`tooltip-wrapper inline-block ${className || ''}`}
      {...eventHandlers}
    >
      <TooltipBox
        ref={tooltipRef}
        content={content}
        isVisible={isVisible}
        position={position}
        offset={offset}
        style={style}
        className=""
        contentClassName={contentClassName}
        tooltipId={`tooltip-${Math.random().toString(36).substr(2, 9)}`}
      >
        {children}
      </TooltipBox>
    </div>
  );
};

export default Tooltip; 