'use client';

import React, { forwardRef, useCallback, useState, useEffect } from 'react';
import { Recipe } from '../../types/recipe';
import RecipeCard from '../RecipeCard';
import { VirtualItem } from '@tanstack/react-virtual';
import Skeleton from './SkeletonLoader';
import { logError } from '../../utils';
import { useResponsive } from '../../hooks/useResponsive';

interface RecipeListUIProps {
  displayedRecipes: Recipe[];
  loading?: boolean;
  isInternalLoading?: boolean;
  emptyMessage?: string;
  searchTerm?: string;
  onSelectRecipe?: (recipeId: string) => void;
  totalCount?: number;
  layout?: 'list' | 'grid';
  gridColumns?: number;
  className?: string;
  parentRef?: React.RefObject<HTMLDivElement>;
  virtualListProps?: {
    getTotalSize: () => number;
    getVirtualItems: () => VirtualItem[];
  };
  useVirtualization?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * 菜谱列表UI组件 - 负责渲染菜谱列表的各种状态和显示
 */
const RecipeListUI = forwardRef<HTMLDivElement, RecipeListUIProps>(
  ({
    displayedRecipes,
    loading = false,
    isInternalLoading = false,
    emptyMessage = '没有找到菜谱',
    searchTerm = '',
    onSelectRecipe,
    totalCount = 0,
    layout = 'list',
    gridColumns = 2,
    className = '',
    parentRef,
    virtualListProps,
    useVirtualization = false,
    error = null,
    onRetry
  }, ref) => {
    const containerRef = parentRef || (ref as React.RefObject<HTMLDivElement>);
    
    // 获取窗口大小，用于响应式网格布局
    const [windowWidth, setWindowWidth] = useState(0);
    const [responsiveColumns, setResponsiveColumns] = useState(gridColumns);

    // 在组件内部：
    const { isMobile, isTablet, isDesktop } = useResponsive();

    // 使用响应式状态自动调整列数
    useEffect(() => {
      if (layout !== 'grid') return;
      
      let columns = gridColumns;
      if (isMobile) columns = 1; // 小屏幕
      else if (isTablet) columns = Math.min(2, gridColumns); // 中等屏幕
      else columns = gridColumns; // 大屏幕
      
      setResponsiveColumns(columns);
    }, [isMobile, isTablet, isDesktop, gridColumns, layout]);

    // 处理加载占位符
    const renderLoadingState = useCallback(() => {
      const count = 6; // 显示6个加载占位符
      
      try {
        return (
          <div className={`grid gap-4 ${
            layout === 'grid' 
              ? `grid-cols-1 sm:grid-cols-${Math.min(2, responsiveColumns)} lg:grid-cols-${responsiveColumns}` 
              : 'grid-cols-1'
          }`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={`skeleton-${index}`} className="w-full">
                <Skeleton 
                  variant="card"
                  className={`w-full ${layout === 'list' ? 'h-32' : 'aspect-[4/3]'}`} 
                />
              </div>
            ))}
          </div>
        );
      } catch (error) {
        logError('RecipeListUI', 'renderLoadingState', String(error));
        return (
          <div className="flex justify-center p-4">
            <Skeleton variant="spinner" showText={true} text="加载中..." />
          </div>
        );
      }
    }, [layout, responsiveColumns]);

    // 处理空状态
    const renderEmptyState = useCallback(() => {
      const message = searchTerm 
        ? `没有找到与"${searchTerm}"相关的菜谱。请尝试其他搜索词或调整筛选条件。`
        : emptyMessage;
      
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-2">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            没有找到菜谱
          </h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      );
    }, [searchTerm, emptyMessage]);

    // 处理错误状态
    const renderErrorState = useCallback(() => {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg">
          <div className="h-12 w-12 text-red-500 mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            出现错误
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error || '加载菜谱时出现问题，请稍后再试。'}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重试
            </button>
          )}
        </div>
      );
    }, [error, onRetry]);

    // 渲染标准列表（非虚拟化）
    const renderStandardList = useCallback(() => {
      if (displayedRecipes.length === 0 && !loading && !isInternalLoading) {
        return renderEmptyState();
      }
      
      return (
        <div className={`grid gap-4 ${
          layout === 'grid' 
            ? `grid-cols-1 sm:grid-cols-${Math.min(2, responsiveColumns)} lg:grid-cols-${responsiveColumns}` 
            : 'grid-cols-1'
        }`}>
          {displayedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id || `recipe-${recipe.name}`}
              recipe={recipe}
              onClick={(e) => {
                // 在新标签页中打开菜谱详情
                window.open(`/recipe/${recipe.id}`, '_blank');
                // 如果有回调，依然调用它（可能用于分析或其他目的）
                if (onSelectRecipe) {
                  onSelectRecipe(recipe.id);
                }
              }}
              highlightTerms={searchTerm ? searchTerm.split(/\s+/).filter(Boolean) : []}
              showMatchPercentage={true}
              className={layout === 'grid' ? 'h-full' : ''}
            />
          ))}
        </div>
      );
    }, [displayedRecipes, loading, isInternalLoading, renderEmptyState, layout, responsiveColumns, onSelectRecipe, searchTerm]);

    // 渲染虚拟化列表
    const renderVirtualList = useCallback(() => {
      if (!virtualListProps || displayedRecipes.length === 0) {
        return null;
      }
      
      const { getTotalSize, getVirtualItems } = virtualListProps;
      const items = getVirtualItems();
      
      if (items.length === 0 && !loading) {
        return renderEmptyState();
      }
      
      return (
        <div
          style={{
            height: `${getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
          className="recipe-list-inner"
        >
          {items.map((virtualItem) => {
            const recipe = displayedRecipes[virtualItem.index];
            
            // 安全检查以防止渲染不存在的菜谱
            if (!recipe) return null;
            
            return (
              <div
                key={`${recipe.id || virtualItem.index}-recipe-item`}
                data-index={virtualItem.index}
                data-recipe-id={recipe.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`
                }}
                className="recipe-virtual-item px-1 py-2"
              >
                <RecipeCard
                  recipe={recipe}
                  onClick={(e) => {
                    // 在新标签页中打开菜谱详情
                    window.open(`/recipe/${recipe.id}`, '_blank');
                    // 如果有回调，依然调用它
                    if (onSelectRecipe) {
                      onSelectRecipe(recipe.id);
                    }
                  }}
                  highlightTerms={searchTerm ? searchTerm.split(/\s+/).filter(Boolean) : []}
                  showMatchPercentage={true}
                  className={layout === 'grid' ? 'h-full' : ''}
                />
              </div>
            );
          })}
        </div>
      );
    }, [virtualListProps, displayedRecipes, loading, renderEmptyState, onSelectRecipe, searchTerm, layout]);

    // 底部加载更多指示器
    const renderLoadingMore = useCallback(() => {
      if (!isInternalLoading) return null;
      
      return (
        <div className="flex justify-center items-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
          <span className="ml-2 text-gray-600">加载更多...</span>
        </div>
      );
    }, [isInternalLoading]);

    // 列表底部状态信息
    const renderListFooter = useCallback(() => {
      if (loading || isInternalLoading || displayedRecipes.length === 0) return null;
      
      return (
        <div className="mt-4 text-center text-sm text-gray-500">
          {displayedRecipes.length === totalCount
            ? `已显示全部 ${totalCount} 个菜谱`
            : `已显示 ${displayedRecipes.length} 个，共 ${totalCount} 个菜谱`}
        </div>
      );
    }, [displayedRecipes.length, totalCount, loading, isInternalLoading]);

    // 条件渲染主要内容
    const renderContent = useCallback(() => {
      // 如果有错误则显示错误状态
      if (error) {
        return renderErrorState();
      }
      
      // 加载状态
      if (loading) {
        return renderLoadingState();
      }
      
      // 虚拟列表
      if (useVirtualization) {
        return renderVirtualList();
      }
      
      // 标准列表
      return renderStandardList();
    }, [error, renderErrorState, loading, renderLoadingState, useVirtualization, renderVirtualList, renderStandardList]);

    return (
      <div
        ref={containerRef}
        className={`overflow-auto h-full w-full ${className}`}
        data-testid="recipe-list"
      >
        {renderContent()}
        {renderLoadingMore()}
        {renderListFooter()}
      </div>
    );
  }
);

RecipeListUI.displayName = 'RecipeListUI';

export default RecipeListUI; 