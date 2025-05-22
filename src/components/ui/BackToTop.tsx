'use client';

import React, { useState, useEffect } from 'react';

/**
 * 回到顶部按钮组件
 * 当页面滚动超过指定高度时显示，点击后回到页面顶部
 */
export default function BackToTop({ scrollThreshold = 300 }: { scrollThreshold?: number }) {
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // 监听滚动事件，控制回顶部按钮显示
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > scrollThreshold) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollThreshold]);

  // 回到顶部功能
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {showBackToTop && (
        <button
          id="backToTop"
          className={`${showBackToTop ? 'show' : ''}`}
          onClick={scrollToTop}
          aria-label="回到顶部"
        >
          ↑
        </button>
      )}
    </>
  );
} 