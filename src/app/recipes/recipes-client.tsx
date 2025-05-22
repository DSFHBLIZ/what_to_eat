'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import TitleUI from '../../components/ui/TitleUI';
import { Recipe } from '../../types/recipe';
import { safeJsonParse } from '../../utils/common/safeTypeConversions';
import { useCancellableRequests, useRaceConditionSafety } from '../../utils/state/stateSynchronizer';
import WithSkeleton from '../../components/ui/WithSkeleton';
import SearchCoordinator from '../../components/search/SearchCoordinator';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import RecipeCard from '../../components/RecipeCard';
import HomeListView from '../../components/home/HomeListView';
import { fetchRecipes } from '../../utils/data/dataService';
import { FilterType } from '../../types/search';
import Footer from '../../components/Footer';
import { RecipeListSkeleton } from '../../components/ui/SkeletonLoader';

/**
 * 菜谱页面客户端组件
 */
export default function RecipesClient() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSearched = useRef(false);
  
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // 用于无限滚动的观察器
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // 使用统一的搜索状态
  const { searchState } = useUnifiedSearchController({
    syncWithUrl: true,
    autoExecuteSearch: false,
    preserveHistory: true
  });
  
  // 使用请求安全工具
  const { createRequest, cancelAllRequests } = useCancellableRequests();
  const { safeguardRequest } = useRaceConditionSafety();
  
  // 获取搜索结果
  const fetchSearchResults = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    
    // 取消所有之前的请求
    cancelAllRequests();
    
    // 创建新的请求
    const { signal } = createRequest('search-recipes');
    
    try {
      // 构建URL参数
      const params = new URLSearchParams();
      
      // 添加分页参数
      params.append('page', page.toString());
      params.append('limit', '50'); // 从20改为50，增加每次加载的数据量
      
      // 添加搜索输入
      if (searchState.searchQuery) {
        params.append('q', searchState.searchQuery);
        console.log('recipes-client: 添加搜索关键词:', searchState.searchQuery);
        // 同时也添加query参数，与API端保持一致
        params.append('query', searchState.searchQuery);
      }
      
      // 添加必需食材
      const requiredIngredientTags = searchState.requiredIngredients.map(item => item.tag);
      if (requiredIngredientTags.length > 0) {
        params.append('required', requiredIngredientTags.join(','));
      }
      
      // 添加可选食材
      const optionalIngredientTags = searchState.optionalIngredients.map(item => item.tag);
      if (optionalIngredientTags.length > 0) {
        params.append('optional', optionalIngredientTags.join(','));
      }
      
      // 添加其他筛选条件
      if (searchState.cuisines.length > 0) {
        params.append('cuisine', searchState.cuisines.join(','));
      }
      
      if (searchState.difficulties.length > 0) {
        console.log('添加难度参数到搜索请求:', searchState.difficulties);
        // 直接使用difficulties值，不做映射转换
        searchState.difficulties.forEach(difficulty => {
          params.append('difficulty', difficulty);
        });
      }
      
      if (searchState.flavors.length > 0) {
        searchState.flavors.forEach(flavor => params.append('flavor', flavor));
      }
      
      if (searchState.dietaryRestrictions.length > 0) {
        searchState.dietaryRestrictions.forEach(diet => {
          params.append('dietary', diet);
        });
      }

      // 使用safeguardRequest确保只处理最新的请求结果
      await safeguardRequest(async () => {
        let data: any = null;
        let totalItems = 0;
        
        // 所有请求都使用搜索API，保持一致性
        const apiUrl = `/api/recipes/search?${params.toString()}`;
        
        console.log(`[DEBUG] 请求API: ${apiUrl}`); // 添加日志
        
        // 执行请求
        const response = await fetch(apiUrl, {
          signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const responseText = await response.text();
        
        if (!responseText) {
          throw new Error('服务器返回空响应');
        }
        
        try {
          const responseData = safeJsonParse(responseText, {}, 'RecipesPage');
          console.log(`[DEBUG] 响应数据:`, responseData); // 添加日志
          
          // 获取总数
          if (responseData && typeof responseData === 'object' && 'total' in responseData) {
            // 使用API返回的真实总数
            totalItems = (responseData as {total: number}).total;
            
            // 计算总页数，使用50作为分页大小而不是20
            const calculatedTotalPages = Math.ceil(totalItems / 50);
            setTotalPages(calculatedTotalPages);
            // 检查是否还有更多页
            setHasMore(page < calculatedTotalPages);
            console.log(`[DEBUG] 总记录数: ${totalItems}, 总页数: ${calculatedTotalPages}, 当前页: ${page}, 还有更多: ${page < calculatedTotalPages}`);
          } else {
            // 如果API未提供总数，则假设没有更多数据
            setHasMore(false);
            console.log(`[DEBUG] API未提供总记录数，假设没有更多数据`);
          }
          
          // 尝试从对象中提取菜谱数组
          if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)) {
            if ('data' in responseData && Array.isArray((responseData as {data: any[]}).data)) {
              data = (responseData as {data: any[]}).data;
            } else if ('recipes' in responseData && Array.isArray((responseData as {recipes: any[]}).recipes)) {
              data = (responseData as {recipes: any[]}).recipes;
            } else if ('results' in responseData && Array.isArray((responseData as {results: any[]}).results)) {
              data = (responseData as {results: any[]}).results;
            }
          } else {
            data = responseData;
          }
          
          // 如果是第二页以后且没有数据，不再模拟数据
          if (page > 1 && (!data || (Array.isArray(data) && data.length === 0))) {
            console.log(`[DEBUG] 第${page}页没有数据，已到达菜谱列表末尾`);
            setHasMore(false);
          }
          
          console.log(`[DEBUG] 解析后的数据长度: ${Array.isArray(data) ? data.length : 0}`); // 添加日志
          
          if (!data || (Array.isArray(data) && data.length === 0)) {
            if (page === 1) {
              setRecipes([]);
            }
            setHasMore(false);
            console.log(`[DEBUG] 没有数据返回，设置hasMore=false`);
          } else {
            // 判断是否还有更多数据
            const dataArray = Array.isArray(data) ? data : [];
            const expectedPageSize = 50; // 期望的每页数据量
            
            // 如果返回的数据少于期望的每页数据量，可能已经到达末尾
            if (dataArray.length < expectedPageSize && !('total' in responseData) && typeof responseData === 'object') {
              setHasMore(false);
              console.log(`[DEBUG] 数据不足一页(${dataArray.length} < ${expectedPageSize})，可能已到达末尾，设置hasMore=false`);
            }
            
            // 根据是否追加模式更新菜谱列表
            if (append) {
              setRecipes(prevRecipes => {
                const newRecipes = [...prevRecipes, ...dataArray];
                console.log(`[DEBUG] 追加${dataArray.length}条记录，总记录数: ${newRecipes.length}`);
                return newRecipes;
              });
            } else {
              setRecipes(dataArray);
              console.log(`[DEBUG] 重置记录，新记录数: ${dataArray.length}`);
            }
            // 更新当前页码
            setCurrentPage(page);
          }
        } catch (parseError) {
          data = [];
          setError('解析数据失败，请稍后再试');
          console.error('[ERROR] 解析响应失败:', parseError); // 添加日志
        }
      });
    } catch (error) {
      // 忽略取消的请求错误
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      
      // 忽略竞态条件错误
      if (error instanceof Error && error.message === 'OUTDATED_REQUEST') {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : '获取菜谱时发生未知错误';
      setError(errorMessage);
      console.error('[ERROR] 请求失败:', errorMessage); // 添加日志
      if (!append) {
        setRecipes([]);
      }
    } finally {
      if (page === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [searchState, cancelAllRequests, createRequest, safeguardRequest]);
  
  // 加载更多数据
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchSearchResults(currentPage + 1, true);
    }
  }, [currentPage, fetchSearchResults, hasMore, isLoadingMore]);
  
  // 设置交叉观察器，用于无限滚动
  useEffect(() => {
    // 重置搜索时，取消观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '300px' } // 增加提前加载的距离，从200px改为300px
    );
    
    observerRef.current = observer;
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMore]);
  
  // 自动搜索逻辑
  useEffect(() => {
    if (fetchSearchResults && !hasSearched.current) {
      hasSearched.current = true;
      setTimeout(() => {
        // 重置分页状态
        setCurrentPage(1);
        setHasMore(true);
        fetchSearchResults(1, false);
      }, 500);
    }
  }, [fetchSearchResults]);
  
  // 监听搜索执行事件，重置分页状态
  useEffect(() => {
    const handleSearch = (event: Event) => {
      // 获取自定义事件的详细信息，包括最新的筛选条件
      const customEvent = event as CustomEvent;
      const searchDetails = customEvent.detail || {};
      
      console.log('recipes-client: 接收到搜索事件:', {
        searchQuery: searchDetails.searchQuery || '',
        hasFilters: !!searchDetails.filters
      });
      
      // 重置分页状态
      setCurrentPage(1);
      setHasMore(true);
      
      // 使用最新的搜索条件执行搜索
      fetchSearchResults(1, false);
    };
    
    window.addEventListener('execute-search', handleSearch);
    
    return () => {
      window.removeEventListener('execute-search', handleSearch);
    };
  }, [fetchSearchResults]);

  return (
    <div className="container">
      
      <div className="mb-6">
        <HomeListView />
      </div>
  
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-12">
            <WithSkeleton loading={true} variant="spinner">
              <p>正在加载菜谱...</p>
            </WithSkeleton>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-md mb-6">
            <p className="text-yellow-700">没有找到匹配的菜谱。请尝试其他搜索条件。</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
            
            <div 
              ref={loadMoreRef} 
              className="w-full text-center py-6"
              style={{ minHeight: '100px' }}
            >
              {isLoadingMore ? (
                <WithSkeleton loading={true} variant="spinner" className="py-4">
                  <p>正在加载更多菜谱...</p>
                </WithSkeleton>
              ) : hasMore ? (
                <button 
                  onClick={loadMore}
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                >
                  加载更多菜谱
                </button>
              ) : (
                <p className="text-gray-500">已加载全部菜谱</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 