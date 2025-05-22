import React, { ReactNode } from 'react';
import { useResponsive } from '../../hooks/useResponsive';

// 列数类型
type Columns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// 间距类型
type Gap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface GridLayoutUIProps {
  children: ReactNode;
  cols?: Columns | { sm?: Columns; md?: Columns; lg?: Columns; xl?: Columns; };
  gap?: Gap | { x?: Gap; y?: Gap; };
  autoFit?: boolean;
  minChildWidth?: string;
  className?: string;
}

const GridLayoutUI = React.memo(({
  children,
  cols = 1,
  gap = 'md',
  autoFit = false,
  minChildWidth = '250px',
  className = ''
}: GridLayoutUIProps) => {
  // 使用通用的响应式钩子
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  
  // 列数映射
  const getColumnsClass = () => {
    // 优先使用响应式断点判断
    if (typeof cols === 'object') {
      const parts = [];
      
      // 根据当前断点决定使用哪个列数
      if (breakpoint && cols[breakpoint as keyof typeof cols]) {
        const currentCols = cols[breakpoint as keyof typeof cols];
        return `grid-cols-${currentCols}`;
      }
      
      // 回退到传统响应式样式
      if (cols.sm) parts.push(`sm:grid-cols-${cols.sm}`);
      if (cols.md) parts.push(`md:grid-cols-${cols.md}`);
      if (cols.lg) parts.push(`lg:grid-cols-${cols.lg}`);
      if (cols.xl) parts.push(`xl:grid-cols-${cols.xl}`);
      return parts.join(' ');
    }
    
    // 根据设备类型自动判断列数
    if (typeof cols === 'number') {
      if (isMobile) return `grid-cols-1`;
      if (isTablet) return `grid-cols-${Math.min(cols, 2)}`;
      return `grid-cols-${cols}`;
    }
    
    // 固定列数
    return `grid-cols-${cols}`;
  };

  // 间距映射
  const getGapClass = () => {
    const gapSizes = {
      none: '0',
      xs: '1',
      sm: '2',
      md: '4',
      lg: '6',
      xl: '8'
    };

    // 响应式间距配置
    if (typeof gap === 'object') {
      const xGap = gap.x ? `gap-x-${gapSizes[gap.x]}` : '';
      const yGap = gap.y ? `gap-y-${gapSizes[gap.y]}` : '';
      return `${xGap} ${yGap}`;
    }
    
    // 根据设备类型自动调整间距
    const effectiveGap = isMobile && gap !== 'xs' && gap !== 'none' 
      ? (gap === 'xl' ? 'lg' : gap === 'lg' ? 'md' : gap === 'md' ? 'sm' : gap) as Gap 
      : gap;
    
    // 固定间距
    return `gap-${gapSizes[effectiveGap]}`;
  };

  // 自动适应配置
  const getAutoFitClass = () => {
    if (!autoFit) return '';
    
    // 移动设备上可能需要更小的最小宽度
    const effectiveMinWidth = isMobile && parseInt(minChildWidth) > 150 
      ? '150px' 
      : minChildWidth;
      
    return `grid-cols-[repeat(auto-fit,minmax(${effectiveMinWidth},1fr))]`;
  };

  // 组合所有类名
  const gridClasses = [
    // 基础样式
    'grid',
    // 列数样式
    autoFit ? getAutoFitClass() : getColumnsClass(),
    // 间距样式
    getGapClass(),
    // 自定义类名
    className
  ].join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
});

GridLayoutUI.displayName = 'GridLayoutUI';

export default GridLayoutUI; 