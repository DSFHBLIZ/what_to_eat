import { useState, useEffect } from 'react';

// 默认响应式断点配置
const DEFAULT_BREAKPOINTS = {
  sm: 640,   // 小屏幕（手机）
  md: 768,   // 中屏幕（平板）
  lg: 1024,  // 大屏幕（笔记本）
  xl: 1280,  // 超大屏幕（桌面）
  '2xl': 1536 // 超大屏幕（大型显示器）
};

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type BreakpointConfig = Record<Breakpoint, number>;

// 创建一个静态的响应式状态对象
const defaultResponsiveState = {
  width: typeof window !== 'undefined' ? window.innerWidth : 0,
  height: typeof window !== 'undefined' ? window.innerHeight : 0,
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  isSmallScreen: false,
  isMediumScreen: false,
  isLargeScreen: false,
  breakpoint: '' as Breakpoint | '',
  orientation: '' as 'portrait' | 'landscape' | ''
};

// 处理状态更新的全局处理器函数，避免每个组件实例创建自己的处理函数
let globalListenerAttached = false;
const stateListeners: Function[] = [];

// 辅助函数：根据宽度计算响应式状态
function calculateResponsiveState(width: number, height: number, breakpoints = DEFAULT_BREAKPOINTS) {
  const orientation = width > height ? 'landscape' : 'portrait';
  
  // 确定当前断点
  let currentBreakpoint: Breakpoint | '' = '';
  if (width >= breakpoints['2xl']) currentBreakpoint = '2xl';
  else if (width >= breakpoints.xl) currentBreakpoint = 'xl';
  else if (width >= breakpoints.lg) currentBreakpoint = 'lg';
  else if (width >= breakpoints.md) currentBreakpoint = 'md';
  else if (width >= breakpoints.sm) currentBreakpoint = 'sm';
  
  return {
    width,
    height,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isSmallScreen: width < breakpoints.md,
    isMediumScreen: width >= breakpoints.md && width < breakpoints.xl,
    isLargeScreen: width >= breakpoints.xl,
    breakpoint: currentBreakpoint,
    orientation
  };
}

// 初始化默认状态
if (typeof window !== 'undefined') {
  const { width, height } = defaultResponsiveState;
  Object.assign(defaultResponsiveState, calculateResponsiveState(width, height));
}

/**
 * 响应式布局钩子 - 简化版本，避免无限循环
 */
export function useResponsive() {
  const [state, setState] = useState(defaultResponsiveState);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 添加到全局监听器列表
    stateListeners.push(setState);
    
    // 仅在第一次使用时添加全局事件监听器
    if (!globalListenerAttached) {
      const handleResize = () => {
        const newState = calculateResponsiveState(window.innerWidth, window.innerHeight);
        
        // 更新所有使用这个钩子的组件
        stateListeners.forEach(listener => listener(newState));
      };
      
      window.addEventListener('resize', handleResize);
      globalListenerAttached = true;
    }
    
    // 卸载时从监听器列表移除
    return () => {
      const index = stateListeners.indexOf(setState);
      if (index !== -1) {
        stateListeners.splice(index, 1);
      }
    };
  }, []); // 空依赖数组，确保只运行一次
  
  return state;
} 