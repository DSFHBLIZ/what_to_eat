'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import HomeListView from './HomeListView';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import { Recipe } from '../../types/recipe';
import RecipeCard from '../RecipeCard';
import BanquetRecipeCard from '../banquet/BanquetRecipeCard';
import WithSkeleton from '../ui/WithSkeleton';
import { useRouter } from 'next/navigation';
import BanquetFloatingRules from '../banquet/BanquetFloatingRules';
import { ChefHat } from 'lucide-react';
import RecipeList from '../../components/RecipeList';
import Footer from '../../components/Footer';

/**
 * 首页容器组件 - 集成了搜索和结果显示功能
 * 实现无限滚动分页加载和搜索结果区域平滑显示
 */
export default function HomeContainer() {
  // 引用
  const resultsAreaRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 状态
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  
  // 统一搜索控制器
  const controller = useUnifiedSearchController({
    syncWithUrl: true,
    autoExecuteSearch: false,
    preserveHistory: true
  });

  const { 
    searchState, 
    executeSearch, 
    setSearchState, 
    toggleRecipeSelection,
    clearSelectedRecipes 
  } = controller;

  // 路由导航
  const router = useRouter();

  // 添加接口定义，用于ing参数类型
  interface TagItem {
    tag: string;
    [key: string]: any;
  }

  // 宴会模式相关状态
  const banquetMode = searchState.banquetMode;
  const selectedRecipeIds = banquetMode?.selectedRecipes || [];
  const selectedRecipes = recipes.filter(recipe => selectedRecipeIds.includes(recipe.id));

  // 添加调试日志
  useEffect(() => {
    console.log('HomeContainer: 宴会模式状态变化', {
      isEnabled: banquetMode?.isEnabled,
      guestCount: banquetMode?.guestCount,
      selectedRecipesCount: selectedRecipeIds.length,
      allocation: banquetMode?.allocation
    });
  }, [banquetMode, selectedRecipeIds]);

  /**
   * 构建搜索参数 - 统一处理所有参数构建
   * @param page 页码
   */
  const buildSearchParams = (page: number): URLSearchParams => {
    const params = new URLSearchParams();
    
    // 添加搜索词
    if (searchState.searchQuery && searchState.searchQuery.trim()) {
      params.append('query', searchState.searchQuery.trim());
    }
    
    // 添加必选食材
    if (searchState.requiredIngredients && searchState.requiredIngredients.length > 0) {
      searchState.requiredIngredients.forEach((ingredient: TagItem) => {
        if (ingredient.tag) {
          params.append('requiredIngredient', ingredient.tag.trim());
        }
      });
    }
    
    // 添加可选食材
    if (searchState.optionalIngredients && searchState.optionalIngredients.length > 0) {
      searchState.optionalIngredients.forEach((ingredient: TagItem) => {
        if (ingredient.tag) {
          params.append('optionalIngredient', ingredient.tag.trim());
        }
      });
    }
    
    // 添加忌口食材
    if (searchState.avoidIngredients && searchState.avoidIngredients.length > 0) {
      searchState.avoidIngredients.forEach((ingredient: TagItem) => {
        if (ingredient.tag) {
          params.append('avoid', ingredient.tag.trim());
        }
      });
    }
    
    // 添加菜系
    if (searchState.cuisines && searchState.cuisines.length > 0) {
      searchState.cuisines.forEach((cuisine: string) => {
        params.append('cuisine', cuisine.trim());
      });
    }
    
    // 添加口味
    if (searchState.flavors && searchState.flavors.length > 0) {
      searchState.flavors.forEach((flavor: string) => {
        params.append('flavor', flavor.trim());
      });
    }
    
    // 添加难度
    if (searchState.difficulties && searchState.difficulties.length > 0) {
      searchState.difficulties.forEach((difficulty: string) => {
        params.append('difficulty', difficulty.trim());
      });
    }
    
    // 添加饮食限制
    if (searchState.dietaryRestrictions && searchState.dietaryRestrictions.length > 0) {
      searchState.dietaryRestrictions.forEach((diet: string) => {
        params.append('dietary', diet.trim());
      });
    }
    
    // 添加标签逻辑和分页 - 确保分页参数正确传递
    params.append('tagLogic', 'OR');
    params.append('page', page.toString());
    params.append('limit', '30');  // 每页获取30条记录
    
    return params;
  };

  /**
   * 执行搜索
   * @param page 页码
   * @param append 是否追加模式
   * @returns 搜索到的食谱数组的Promise
   */
  const performSearch = useCallback(async (page = 1, append = false): Promise<Recipe[]> => {
    try {
      // 设置加载状态
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      // 构建搜索参数 - 直接使用当前最新的状态
      const currentState = searchState;
      const params = buildSearchParams(page);
      
      console.log('前端: 开始构建搜索参数');
      
      // 记录搜索参数
      console.log('前端: 最终搜索参数:', {
        url: `/api/recipes/search?${params.toString()}`,
        params: {
          query: currentState.searchQuery,
          requiredIngredients: currentState.requiredIngredients.map((i: TagItem) => i.tag),
          optionalIngredients: currentState.optionalIngredients.map((i: TagItem) => i.tag),
          avoidIngredients: currentState.avoidIngredients.map((i: TagItem) => i.tag),
          cuisines: currentState.cuisines,
          flavors: currentState.flavors,
          difficulties: currentState.difficulties,
          dietaryRestrictions: currentState.dietaryRestrictions,
          tagLogic: currentState.tagLogic
        }
      });
      
      // 确保结果区域可见
      setShowResults(true);
      
      // 执行搜索 - 只要params有值就执行
      if (params.toString()) {
        try {
          console.log('前端: 开始API搜索请求');
          // 添加超时保护，避免长时间等待
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
          
          // 使用params直接构建URL
          const searchUrl = `/api/recipes/search?${params.toString()}`;
          
          const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            signal: controller.signal
          });
          
          // 清除超时
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error('前端: API请求失败，状态码:', response.status);
            
            // 尝试读取错误信息
            try {
              const errorData = await response.json();
              console.error('前端: 服务器返回错误信息:', errorData);
              throw new Error(`搜索失败: ${errorData.error || errorData.message || response.status}`);
            } catch (parseError) {
              throw new Error(`搜索失败: ${response.status}`);
            }
          }
          
          console.log('前端: API请求成功，开始解析数据');
          const data = await response.json();
          
          // 解析响应数据
          let searchResults: Recipe[] = [];
          let pagination = {
            hasNextPage: false,
            total: 0
          };
          
          // 处理响应格式
          if (data && data.recipes) {
            searchResults = data.recipes;
            pagination = data.pagination || { hasNextPage: false, total: 0 };
            if (pagination.total) {
              setTotalRecords(pagination.total);
            }
            
            console.log(`前端: 获取到 ${searchResults.length} 条结果，总共 ${pagination.total || searchResults.length} 条`);
          } 
          
          // 处理分页逻辑
          if (page > 1 && searchResults.length === 0) {
            setHasMore(false);
          } else {
            // 根据分页信息判断是否还有更多数据
            setHasMore(searchResults.length > 0 && pagination.hasNextPage !== false);
            
            // 更新结果列表
            if (append) {
              setRecipes(prevRecipes => [...prevRecipes, ...searchResults]);
              setCurrentPage(page); // 更新页码
            } else {
              setRecipes(searchResults);
              setCurrentPage(page);
            }
            
            // 更新总记录数
            if (pagination.total && pagination.total > 0) {
              setTotalRecords(pagination.total);
            }
          }
          
          setError(null);
          setShowResults(true);
          
          // 第一页加载完成时滚动到结果区域
          if (page === 1 && !append) {
            setTimeout(() => {
              resultsAreaRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 100);
          }

          return searchResults;
        } catch (apiError) {
          console.error('前端: API搜索出错:', apiError);
          setError(`搜索失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`);
          setRecipes([]);
          setShowResults(true);
          return [];
        }
      } else {
        // 没有有效的参数，显示空结果
        setRecipes([]);
        setError('搜索条件无效，请重新设置筛选条件');
        setShowResults(true);
        return [];
      }
    } catch (globalError) {
      console.error('前端: 搜索过程中发生错误:', globalError);
      setError('搜索过程中发生错误，请稍后重试');
      setRecipes([]);
      setShowResults(true);
      return [];
    } finally {
      // 无论如何，完成后清除加载状态
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchState, resultsAreaRef]);
  
  // 加载更多
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      
      // 使用performSearch来确保搜索参数一致性
      performSearch(currentPage + 1, true)
        .catch(error => {
          console.error('前端: 加载更多出错:', error);
          setError(`加载更多失败: ${error.message}`);
        })
        .finally(() => {
          setIsLoadingMore(false);
        });
    }
  }, [currentPage, hasMore, isLoadingMore, performSearch]);
  
  // 设置无限滚动
  useEffect(() => {
    if (!showResults) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          console.log('前端: 滚动到底部，准备加载更多');
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
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
  }, [hasMore, loading, isLoadingMore, loadMore, showResults]);
  
  // 监听筛选状态变化，确保筛选结果能够正确显示
  // 创建ref，放在Hook外部，避免条件语句中使用Hook
  const isFirstMountRef = useRef(true);
  const lastFilterStateRef = useRef<string>('');
  const isHandlingEventRef = useRef(false);
  
  // 监听筛选状态变化，只用于URL参数变化时的搜索
  useEffect(() => {
    // 跳过首次渲染
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    
    // 如果是事件中触发的状态更新，则跳过
    if (isHandlingEventRef.current) {
      console.log('HomeContainer: 跳过状态变化触发的搜索（由事件处理中）');
      return;
    }
    
    // 检查状态变化是否来自URL参数变化（这通常是没有用户交互的情况）
    // 这里可以添加URL参数解析逻辑，目前简化处理
    console.log('HomeContainer: 检测到筛选状态变化，可能是URL参数导致');
    
    // 不自动触发搜索，如果需要可以手动触发一个事件
    // const searchEvent = new CustomEvent('execute-search', {...});
    // window.dispatchEvent(searchEvent);
  }, [
    searchState.searchQuery,
    searchState.requiredIngredients,
    searchState.optionalIngredients,
    searchState.cuisines,
    searchState.flavors,
    searchState.difficulties,
    searchState.dietaryRestrictions
  ]);

  // 监听搜索执行事件
  useEffect(() => {
    const handleExecuteSearch = (event: CustomEvent) => {
      console.log('[HOME-CONTAINER] 接收到搜索事件，但不执行重复搜索，由RecipesClient处理');
      
      // 只处理UI状态，不执行搜索（由RecipesClient负责）
      setShowResults(true);
      setError(null);
      setLoading(true);
    };

    // 添加事件监听器，指定正确的类型
    window.addEventListener('execute-search', handleExecuteSearch as EventListener);

    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('execute-search', handleExecuteSearch as EventListener);
    };
  }, []); // 移除performSearch依赖，避免不必要的重新注册

  // 监听搜索控制器的状态更新
  useEffect(() => {
    // 只在搜索结果更新时同步状态，不执行搜索
    if (searchState && searchState.searchResults && !isHandlingEventRef.current) {
      console.log('[HOME-CONTAINER] 同步搜索结果状态');
      
      // 确保显示结果区域
      setShowResults(true);
      
      // 同步搜索结果到本地状态
      if (searchState.searchResults && searchState.searchResults.length > 0) {
        setRecipes(searchState.searchResults);
        setTotalRecords(searchState.totalResults || searchState.searchResults.length);
        setCurrentPage(1);
        setHasMore(searchState.searchResults.length < (searchState.totalResults || 0));
        setError(null);
      } else {
        setRecipes([]);
        setTotalRecords(0);
        setHasMore(false);
      }
      
      setLoading(false);
    }
  }, [searchState?.searchResults, searchState?.totalResults]);

  // 监听加载状态
  useEffect(() => {
    if (searchState?.loading !== undefined) {
      setLoading(searchState.loading);
    }
    if (searchState?.error) {
      setError(searchState.error);
    }
  }, [searchState?.loading, searchState?.error]);

  // 初始化
  useEffect(() => {
    setShowResults(false);
  }, []);

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
      {/* 搜索筛选区域 */}
      <HomeListView 
        totalResults={totalRecords} 
        controller={controller}
      />
      
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
      
      {/* 搜索结果区域 */}
      {showResults && (
        <div 
          ref={resultsAreaRef}
          className="results-area mt-8"
        >
          {/* 搜索结果反馈 */}
          {!loading && !error && recipes.length > 0 && (
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
          )}
          
          {loading ? (
            <div className="py-10 text-center">
              <WithSkeleton loading={true} variant="spinner">
                <p className="mt-4 text-gray-600">正在搜索中，请稍候...</p>
              </WithSkeleton>
            </div>
          ) : error ? (
            <div className="py-10 text-center bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-md mb-6">
              <p className="text-yellow-700">没有找到匹配的菜谱。请尝试其他搜索条件。</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {recipes.map((recipe, index) => {
                  if (banquetMode?.isEnabled) {
                    // 宴会模式下使用多选卡片
                    return (
                      <BanquetRecipeCard
                        key={`banquet-recipe-${recipe.id || ''}-${index}`}
                        recipe={recipe}
                        isSelected={selectedRecipeIds.includes(recipe.id)}
                        onToggleSelection={toggleRecipeSelection}
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
                        className="h-full"
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
      )}
    </div>
  );
} 