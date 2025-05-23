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
import BanquetRecipeCard from '../../components/banquet/BanquetRecipeCard';
import BanquetFloatingRules from '../../components/banquet/BanquetFloatingRules';
import BanquetGenerateButton from '../../components/banquet/BanquetGenerateButton';
import HomeListView from '../../components/home/HomeListView';
import { fetchRecipes } from '../../utils/data/dataService';
import { FilterType } from '../../types/search';
import Footer from '../../components/Footer';
import { RecipeListSkeleton } from '../../components/ui/SkeletonLoader';
import { useRouter } from 'next/navigation';
import { ChefHat } from 'lucide-react';

/**
 * 菜谱页面客户端组件
 */
export default function RecipesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSearched = useRef(false);
  
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // 添加总记录数跟踪
  const [totalRecords, setTotalRecords] = useState(0);
  
  // 用于无限滚动的观察器
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastRequestsRef = useRef<Map<string, number>>(new Map()); // 用于请求去重
  
  // 使用统一的搜索状态
  const controller = useUnifiedSearchController({
    syncWithUrl: true, // 启用 URL 同步，确保状态一致性
    autoExecuteSearch: false,
    preserveHistory: true,
    defaultPage: 1,
    defaultLimit: 50
  });
  
  // 宴会模式相关状态
  const banquetMode = controller.searchState.banquetMode;
  const selectedRecipeIds = banquetMode?.selectedRecipes || [];
  const selectedRecipes = recipes.filter(recipe => selectedRecipeIds.includes(recipe.id));
  
  // 添加调试日志
  useEffect(() => {
    console.log('RecipesClient: 宴会模式状态变化', {
      isEnabled: banquetMode?.isEnabled,
      guestCount: banquetMode?.guestCount,
      selectedRecipesCount: selectedRecipeIds.length,
      allocation: banquetMode?.allocation
    });
  }, [banquetMode, selectedRecipeIds]);
  
  // 使用请求安全工具
  const { createRequest, cancelAllRequests } = useCancellableRequests();
  const { safeguardRequest } = useRaceConditionSafety();
  
  // 获取搜索结果
  const fetchSearchResults = useCallback(async (page = 1, append = false) => {
    // 请求去重逻辑 - 防止短时间内重复请求
    const requestKey = `${page}-${append}-${JSON.stringify({
      searchQuery: controller.searchState.searchQuery,
      requiredIngredients: controller.searchState.requiredIngredients.map(item => item.tag),
      optionalIngredients: controller.searchState.optionalIngredients.map(item => item.tag),
      cuisines: controller.searchState.cuisines,
      difficulties: controller.searchState.difficulties,
      flavors: controller.searchState.flavors,
      dietaryRestrictions: controller.searchState.dietaryRestrictions
    })}`;
    
    const now = Date.now();
    const lastRequestTime = lastRequestsRef.current.get(requestKey);
    
    // 如果2秒内有相同的请求，跳过
    if (lastRequestTime && (now - lastRequestTime) < 2000) {
      console.log(`[SEARCH-DEDUP] 跳过重复请求 (${now - lastRequestTime}ms内重复):`, requestKey.substring(0, 100));
      return;
    }
    
    lastRequestsRef.current.set(requestKey, now);
    
    console.log(`[DEBUG] fetchSearchResults 开始 - 页码=${page}, 追加模式=${append}`);
    console.log(`[DEBUG] 当前搜索状态:`, {
      searchQuery: controller.searchState.searchQuery,
      requiredIngredients: controller.searchState.requiredIngredients.length,
      optionalIngredients: controller.searchState.optionalIngredients.length,
      cuisines: controller.searchState.cuisines.length,
      difficulties: controller.searchState.difficulties.length,
      flavors: controller.searchState.flavors.length,
      dietaryRestrictions: controller.searchState.dietaryRestrictions.length
    });
    
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
      
      // 直接使用当前搜索状态，不再进行复杂的保存和恢复
      const searchState = controller.searchState;
      
      console.log(`[DEBUG] 第${page}页请求使用的搜索状态:`, {
        searchQuery: searchState.searchQuery,
        requiredIngredients: searchState.requiredIngredients.map(item => item.tag),
        optionalIngredients: searchState.optionalIngredients.map(item => item.tag),
        cuisines: searchState.cuisines,
        difficulties: searchState.difficulties,
        flavors: searchState.flavors,
        dietaryRestrictions: searchState.dietaryRestrictions
      });
      
      // 添加搜索输入
      if (searchState.searchQuery) {
        params.append('q', searchState.searchQuery);
        console.log('recipes-client: 添加搜索关键词:', searchState.searchQuery);
        // 同时也添加query参数，与API端保持一致
        params.append('query', searchState.searchQuery);
      }
      
      // 添加必需食材
      if (searchState.requiredIngredients.length > 0) {
        const requiredTags = searchState.requiredIngredients.map(item => item.tag);
        // 使用与API端一致的参数名：requiredIngredient
        requiredTags.forEach(tag => params.append('requiredIngredient', tag));
      }
      
      // 添加可选食材
      if (searchState.optionalIngredients.length > 0) {
        const optionalTags = searchState.optionalIngredients.map(item => item.tag);
        // 使用与API端一致的参数名：optionalIngredient
        optionalTags.forEach(tag => params.append('optionalIngredient', tag));
      }
      
      // 添加其他筛选条件
      if (searchState.cuisines.length > 0) {
        searchState.cuisines.forEach(cuisine => params.append('cuisine', cuisine));
      }
      
      if (searchState.difficulties.length > 0) {
        console.log('添加难度参数到搜索请求:', searchState.difficulties);
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
      
      // 添加标准参数确保与API端一致
      params.append('tagLogic', 'OR');
      params.append('sortField', 'relevance_score');
      params.append('sortDirection', 'desc');
      params.append('enableSemanticSearch', 'true');

      // 使用safeguardRequest确保只处理最新的请求结果
      await safeguardRequest(async () => {
        let data: Recipe[] = [];
        
        // 所有请求都使用搜索API，保持一致性
        const apiUrl = `/api/recipes/search?${params.toString()}`;
        
        console.log(`[DEBUG] 请求API: ${apiUrl}`); // 添加日志
        
        // 检查是否缺少搜索条件，如果是则添加必要的默认条件以确保一致性
        const hasAnySearchConditions = params.has('q') || params.has('query') || 
          params.has('requiredIngredient') || params.has('optionalIngredient') || 
          params.has('cuisine') || params.has('difficulty') || 
          params.has('flavor') || params.has('dietary');
        
        if (!hasAnySearchConditions && page > 1) {
          console.log(`[DEBUG] 第${page}页请求缺少搜索条件，但继续执行请求以获取默认数据`);
        }
        
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
          
          // 获取分页信息
          let totalItems = 0;
          let hasNextPage = false;
          
          // 优先从API返回的pagination对象中获取分页信息
          if (responseData && typeof responseData === 'object' && 'pagination' in responseData) {
            const pagination = (responseData as any).pagination;
            if (pagination) {
              totalItems = pagination.total || 0;
              hasNextPage = pagination.hasNextPage || false;
              
              setTotalRecords(totalItems);
              const calculatedTotalPages = Math.ceil(totalItems / 50);
              setTotalPages(calculatedTotalPages);
              setHasMore(hasNextPage);
              
              console.log(`[DEBUG] 使用API分页信息: 总记录数=${totalItems}, 总页数=${calculatedTotalPages}, 当前页=${page}, 还有更多=${hasNextPage}`);
            }
            
            // 从responseData中提取recipes数据
            if ('recipes' in responseData) {
              data = (responseData as any).recipes || [];
            }
          } 
          // 兼容旧的API格式，从顶级total字段获取总数
          else if (responseData && typeof responseData === 'object' && 'total' in responseData) {
            totalItems = (responseData as {total: number}).total;
            setTotalRecords(totalItems);
            const calculatedTotalPages = Math.ceil(totalItems / 50);
            setTotalPages(calculatedTotalPages);
            setHasMore(page < calculatedTotalPages);
            
            console.log(`[DEBUG] 使用兼容模式分页信息: 总记录数=${totalItems}, 总页数=${calculatedTotalPages}, 当前页=${page}, 还有更多=${page < calculatedTotalPages}`);
            
            // 兼容模式下，responseData本身可能就是recipes数组，或者在recipes字段中
            if (Array.isArray(responseData)) {
              data = responseData;
            } else if ('recipes' in responseData) {
              data = (responseData as any).recipes || [];
            } else {
              data = [];
            }
          } else {
            // 如果responseData直接是recipes数组
            if (Array.isArray(responseData)) {
              data = responseData;
              setTotalRecords(data.length);
              setTotalPages(1);
              setHasMore(false);
            } else {
              data = [];
            }
          }
          
          // 如果是第二页以后且没有数据，设置没有更多数据
          if (page > 1 && (!data || (Array.isArray(data) && data.length === 0))) {
            console.log(`[DEBUG] 第${page}页没有数据，已到达菜谱列表末尾`);
            setHasMore(false);
            return;
          }
          
          console.log(`[DEBUG] 解析后的数据长度: ${Array.isArray(data) ? data.length : 0}`);
          
          if (!data || (Array.isArray(data) && data.length === 0)) {
            if (page === 1) {
              setRecipes([]);
            }
            setHasMore(false);
            console.log(`[DEBUG] 没有数据返回，设置hasMore=false`);
          } else {
            const dataArray = Array.isArray(data) ? data : [];
            
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
  }, [controller, cancelAllRequests, createRequest, safeguardRequest]);
  
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
  
  // 自动搜索逻辑 - 合并重复的useEffect并添加去重机制
  useEffect(() => {
    let searchExecuted = false;
    
    const executeInitialSearch = () => {
      if (!searchExecuted && fetchSearchResults && !hasSearched.current) {
        searchExecuted = true;
        hasSearched.current = true;
        
        console.log('[SEARCH-DEDUP] 执行初始搜索');
        
        // 重置分页状态
        setCurrentPage(1);
        setHasMore(true);
        fetchSearchResults(1, false);
      }
    };
    
    const handleSearchEvent = (event: Event) => {
      if (searchExecuted) {
        console.log('[SEARCH-DEDUP] 跳过重复的搜索事件');
        return;
      }
      
      searchExecuted = true;
      
      const customEvent = event as CustomEvent;
      const searchDetails = customEvent.detail || {};
      
      console.log('[SEARCH-DEDUP] 处理搜索事件:', {
        searchQuery: searchDetails.searchQuery || '',
        hasFilters: !!searchDetails.filters
      });
      
      // 重置分页状态
      setCurrentPage(1);
      setHasMore(true);
      
      // 使用最新的搜索条件执行搜索
      fetchSearchResults(1, false);
    };
    
    // 添加搜索事件监听器
    window.addEventListener('execute-search', handleSearchEvent);
    
    // 初始搜索延迟执行
    const timeoutId = setTimeout(executeInitialSearch, 500);
    
    // 清理函数
    return () => {
      window.removeEventListener('execute-search', handleSearchEvent);
      clearTimeout(timeoutId);
    };
  }, [fetchSearchResults, controller]);

  /**
   * 导航到宴会汇总页面
   */
  const handleNavigateToSummary = useCallback(() => {
    if (!banquetMode?.isEnabled || selectedRecipes.length === 0) return;
    
    try {
      // 保存状态到sessionStorage
      sessionStorage.setItem('banquet-selected-recipes', JSON.stringify(selectedRecipes));
      sessionStorage.setItem('banquet-config', JSON.stringify(banquetMode));
      
      // 跳转到汇总页面
      router.push('/banquet-summary');
    } catch (error) {
      console.error('保存宴会数据失败:', error);
    }
  }, [banquetMode, selectedRecipes, router]);

  return (
    <div className="container">
      
      <div className="mb-6">
        <HomeListView controller={controller} />
      </div>

      {/* 宴会模式悬浮规则提示窗口 */}
      <BanquetFloatingRules
        selectedRecipes={selectedRecipes}
        banquetConfig={{
          isEnabled: banquetMode?.isEnabled || false,
          guestCount: banquetMode?.guestCount || 8,
          allocation: banquetMode?.allocation || null
        }}
        onNavigateToSummary={handleNavigateToSummary}
        isVisible={banquetMode?.isEnabled || false}
      />

      {/* 独立的生成宴会菜单按钮 */}
      <BanquetGenerateButton
        selectedRecipes={selectedRecipes}
        banquetConfig={{
          isEnabled: banquetMode?.isEnabled || false,
          guestCount: banquetMode?.guestCount || 8,
          allocation: banquetMode?.allocation || null
        }}
        isVisible={banquetMode?.isEnabled || false}
      />
  
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
            {/* 搜索结果反馈 - 与首页保持一致 */}
            <div className="mb-4">
              {banquetMode?.isEnabled ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-400">
                  <div className="flex items-center gap-3">
                    <ChefHat size={20} className="text-amber-600" />
                    <div>
                      <div className="font-semibold text-amber-800">宴会模式配菜中</div>
                      <div className="text-sm text-gray-600">
                        从 <span className="font-bold text-blue-600">{totalRecords}</span> 道菜中选择
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-700">
                      {selectedRecipeIds.length}
                      {banquetMode.allocation && (
                        <span className="text-lg text-gray-500">
                          /{banquetMode.allocation.totalDishes}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">已选菜品</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  共找到 <span className="text-blue-600 font-bold">{totalRecords}</span> 个相关菜品
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, index) => {
                if (banquetMode?.isEnabled) {
                  // 宴会模式下使用多选卡片
                  return (
                    <BanquetRecipeCard
                      key={`banquet-recipe-${recipe.id || ''}-${index}`}
                      recipe={recipe}
                      isSelected={selectedRecipeIds.includes(recipe.id)}
                      onToggleSelection={controller.toggleRecipeSelection}
                      onCardClick={(e) => {
                        // 在新标签页中打开菜谱详情
                        window.open(`/recipe/${recipe.id}`, '_blank');
                      }}
                      showMatchPercentage={false}
                    />
                  );
                } else {
                  // 普通模式下使用标准卡片
                  return (
                    <RecipeCard 
                      key={`recipe-${recipe.id || ''}-${index}`} 
                      recipe={recipe} 
                      showMatchPercentage={false}
                      onClick={(e) => {
                        // 在新标签页中打开菜谱详情
                        window.open(`/recipe/${recipe.id}`, '_blank');
                      }}
                    />
                  );
                }
              })}
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
                <div className="text-gray-400 text-sm">
                  滚动到底部加载更多...
                </div>
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