'use client';

import { RefObject, useEffect } from 'react';

/**
 * 自定义钩子，用于检测点击元素外部的事件
 * @param ref 要检测点击外部的元素引用
 * @param handler 点击外部时触发的回调函数
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // 如果元素不存在或者点击的是元素内部，不执行任何操作
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      handler(event);
    };
    
    // 添加鼠标点击和触摸事件监听器
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // 清理函数
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // 依赖项包括ref和handler
} 