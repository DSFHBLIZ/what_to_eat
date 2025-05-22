'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Recipe } from '../types/recipe';
import { useVirtualizer } from '@tanstack/react-virtual';
import RecipeListUI from './ui/RecipeListUI';
import { usePagination } from '../hooks/usePagination';
import WithSkeleton from './ui/WithSkeleton';

interface RecipeListProps {
  recipes: Recipe[] | any[];
  emptyMessage?: string;
  useInfiniteScroll?: boolean; // 是否使用无限滚动
  useVirtualization?: boolean; // 是否使用虚拟化列表
  itemHeight?: number; // 虚拟化列表项高度
  loading?: boolean;
  searchTerm?: string;
  onSelectRecipe?: (recipeId: string) => void;
  totalCount?: number;
  loadMoreRecipes?: () => void;
  hasMoreRecipes?: boolean;
  layout?: 'list' | 'grid'; // 添加布局模式选项
  gridColumns?: number; // 网格布局的列数
  className?: string;
  
  // 新增属性
  error?: string | null; // 错误信息
  onRetry?: () => void; // 重试回调
  page?: number; // 当前页码
  pageSize?: number; // 每页显示数量
  onPageChange?: (page: number) => void; // 页码变化回调
  showPagination?: boolean; // 是否显示分页控件
}

// 确保recipe对象符合Recipe类型要求
const ensureRecipeType = (recipe: any): Recipe => {
  // 简单的数组安全处理辅助函数
  const safeArray = <T,>(value: any): T[] => {
    if (Array.isArray(value)) return value;
    return [];
  };
  
  return {
    id: recipe.id || '',
    name: recipe.name || '未命名菜谱',
    description: recipe.description || '',
    ingredients: safeArray(recipe.ingredients),
    seasonings: safeArray(recipe.seasonings),
    flavors: safeArray(recipe.flavors),
    difficulty: recipe.difficulty as any || '未知',
    cookingTime: recipe.cookingTime || '',
    steps: safeArray(recipe.steps),
    preparationSteps: safeArray(recipe.preparationSteps),
    cookingSteps: safeArray(recipe.cookingSteps),
    cookingTips: safeArray(recipe.cookingTips),
    imageUrl: recipe.imageUrl || '',
    cuisine: recipe.cuisine || '',
    cookingMethod: safeArray(recipe.cookingMethod),
    dietaryRestrictions: safeArray(recipe.dietaryRestrictions),
    tags: safeArray(recipe.tags),
    matchScore: recipe.matchScore || 0,
    matchedIngredients: safeArray(recipe.matchedIngredients)
  } as Recipe;
};

/**
 * 菜谱列表组件 - 负责数据处理和逻辑
 * UI渲染交由RecipeListUI处理
 */
export default function RecipeList({ 
  recipes, 
  emptyMessage = '没有找到菜谱',
  useInfiniteScroll = true,
  useVirtualization = false,
  itemHeight = 150,
  loading = false,
  searchTerm = '',
  onSelectRecipe,
  totalCount = 0,
  loadMoreRecipes,
  hasMoreRecipes = false,
  layout = 'list', // 默认为列表布局
  gridColumns = 2, // 默认网格有2列
  className = '',
  
  // 新增属性
  error = null,
  onRetry,
  page = 1,
  pageSize = 12,
  onPageChange,
  showPagination = false
}: RecipeListProps) {
  // 确保recipes是数组类型
  const safeRecipes = Array.isArray(recipes) ? recipes.map(ensureRecipeType) : [];
  
  // 按匹配度从高到低排序（如果有matchScore）
  const sortedRecipes = [...safeRecipes].sort((a, b) => {
    const scoreA = a.matchScore !== undefined ? a.matchScore : 0;
    const scoreB = b.matchScore !== undefined ? b.matchScore : 0;
    return scoreB - scoreA;
  });
  
  const parentRef = useRef<HTMLDivElement>(null);
  const [isInternalLoading, setIsInternalLoading] = useState(false);

  // 使用通用分页hook
  const pagination = usePagination<Recipe>({
    initialPage: page,
    pageSize: pageSize,
    totalItems: sortedRecipes.length,
    useInfiniteScroll: useInfiniteScroll,
    onPageChange: onPageChange
  });

  // 根据分页获取当前页的菜谱
  const displayedRecipes = useVirtualization
    ? sortedRecipes // 虚拟化模式使用全部数据
    : pagination.paginatedItems(sortedRecipes);
  
  // 加载更多菜谱
  const handleLoadMore = useCallback(() => {
    if (showPagination) return; // 显示分页控件时不使用无限加载
    if (!pagination.hasMore || loading || isInternalLoading) return;
    
    if (loadMoreRecipes && hasMoreRecipes && useVirtualization) {
      // 使用外部提供的加载函数
      loadMoreRecipes();
      return;
    }
    
    setIsInternalLoading(true);
    
    // 加载下一页
    setTimeout(() => {
      pagination.loadMore();
      setIsInternalLoading(false);
    }, 300);
  }, [pagination, loading, isInternalLoading, loadMoreRecipes, useVirtualization, hasMoreRecipes, showPagination]);
  
  // 处理滚动并加载更多
  useEffect(() => {
    if (!useInfiniteScroll || !parentRef.current || showPagination) return;
    
    const handleScroll = () => {
      if (!parentRef.current || loading || isInternalLoading) return;
      
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
      
      // 当滚动到距离底部100px或更近时，加载更多
      if (scrollHeight - scrollTop - clientHeight < 200) {
        handleLoadMore();
      }
    };
    
    const scrollElement = parentRef.current;
    scrollElement.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [useInfiniteScroll, handleLoadMore, loading, isInternalLoading, showPagination]);
  
  // 创建虚拟列表（无论useVirtualization是否为true，总是创建，但可能不使用）
  const rowVirtualizer = useVirtualizer({
    count: displayedRecipes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // 预渲染的项数
  });
  
  // 将UI渲染委托给RecipeListUI组件
  return (
    <WithSkeleton
      loading={loading}
      variant="list"
      count={pageSize}
    >
      <div className="flex flex-col">
        <RecipeListUI
          displayedRecipes={displayedRecipes}
          loading={loading}
          isInternalLoading={isInternalLoading && !showPagination}
          emptyMessage={emptyMessage}
          searchTerm={searchTerm}
          onSelectRecipe={onSelectRecipe}
          totalCount={totalCount || sortedRecipes.length}
          layout={layout}
          gridColumns={gridColumns}
          className={className}
          parentRef={parentRef}
          virtualListProps={useVirtualization ? {
            getTotalSize: () => rowVirtualizer.getTotalSize(),
            getVirtualItems: () => rowVirtualizer.getVirtualItems()
          } : undefined}
          useVirtualization={useVirtualization}
          error={error}
          onRetry={onRetry}
        />
        
        {pagination.showPagination && (
          <div className="flex justify-center items-center mt-4 py-2 space-x-2">
            <button
              onClick={pagination.prevPage}
              disabled={pagination.currentPage === 1}
              className={`px-3 py-1 rounded ${
                pagination.currentPage === 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              上一页
            </button>
            
            <div className="flex space-x-1">
              {pagination.pageNumbers.map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => pagination.setPage(pageNum)}
                  className={`w-8 h-8 rounded flex items-center justify-center ${
                    pagination.currentPage === pageNum 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            
            <button
              onClick={pagination.nextPage}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`px-3 py-1 rounded ${
                pagination.currentPage === pagination.totalPages 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </WithSkeleton>
  );
} 