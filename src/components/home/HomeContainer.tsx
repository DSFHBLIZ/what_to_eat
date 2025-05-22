'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import HomeListView from './HomeListView';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import { Recipe } from '../../types/recipe';
import RecipeCard from '../RecipeCard';
import WithSkeleton from '../ui/WithSkeleton';

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
  
  // 获取过滤状态
  const { searchState, executeSearch, setSearchState } = useUnifiedSearchController({
    syncWithUrl: true,
    autoExecuteSearch: false,
    preserveHistory: true
  });

  // 添加接口定义，用于ing参数类型
  interface TagItem {
    tag: string;
    [key: string]: any;
  }

  /**
   * 构建搜索参数 - 统一处理所有参数构建
   * @param page 页码
   */
  const buildSearchParams = (page: number): URLSearchParams => {
    const params = new URLSearchParams();
    
    // 添加搜索词
    if (typeof searchState.searchQuery === 'string') {
      params.append('query', searchState.searchQuery.trim());
    } else {
      params.append('query', '');
    }
    
    // 添加必选食材
    if (Array.isArray(searchState.requiredIngredients)) {
      searchState.requiredIngredients.forEach((ing: TagItem) => {
        if (ing && typeof ing === 'object' && ing.tag && typeof ing.tag === 'string') {
          params.append('requiredIngredient', ing.tag.trim());
        }
      });
    }
    
    // 添加可选食材
    if (Array.isArray(searchState.optionalIngredients)) {
      searchState.optionalIngredients.forEach((ing: TagItem) => {
        if (ing && typeof ing === 'object' && ing.tag && typeof ing.tag === 'string') {
          params.append('optionalIngredient', ing.tag.trim());
        }
      });
    }
    
    // 添加忌口食材
    if (Array.isArray(searchState.avoidIngredients)) {
      searchState.avoidIngredients.forEach((ing: TagItem) => {
        if (ing && typeof ing === 'object' && ing.tag && typeof ing.tag === 'string') {
          params.append('avoid', ing.tag.trim());
        }
      });
    }
    
    // 添加筛选条件
    if (Array.isArray(searchState.cuisines)) {
      searchState.cuisines.forEach(cuisine => {
        if (cuisine && typeof cuisine === 'string') {
          params.append('cuisine', cuisine.trim());
        }
      });
    }
    
    if (Array.isArray(searchState.flavors)) {
      searchState.flavors.forEach(flavor => {
        if (flavor && typeof flavor === 'string') {
          params.append('flavor', flavor.trim());
        }
      });
    }
    
    if (Array.isArray(searchState.difficulties)) {
      searchState.difficulties.forEach(difficulty => {
        if (difficulty && typeof difficulty === 'string') {
          params.append('difficulty', difficulty.trim());
        }
      });
    }
    
    if (Array.isArray(searchState.dietaryRestrictions)) {
      searchState.dietaryRestrictions.forEach(diet => {
        if (diet && typeof diet === 'string') {
          params.append('dietary', diet.trim());
        }
      });
    }
    
    // 添加标签逻辑 - 使用统一的逻辑
    const validTagLogic = searchState.tagLogic === 'AND' || searchState.tagLogic === 'OR' 
      ? searchState.tagLogic 
      : 'OR';
    params.append('tagLogic', validTagLogic);
    
    // 添加分页参数
    params.append('page', page.toString());
    params.append('limit', '50'); // 每页50条结果
    
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
            } else {
              setRecipes(searchResults);
            }
            
            // 更新页码
            setCurrentPage(page);
          }
          
          setError(null);
          setShowResults(true);
          
          // 第一页加载完成时滚动到结果区域
          if (page === 1) {
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
      // 构建搜索参数
      const params = buildSearchParams(currentPage + 1);
      
      // 记录加载更多的搜索参数
      console.log('前端: 加载更多的搜索参数:', params.toString());
      
      // 直接使用params执行API请求
      setIsLoadingMore(true);
      
      fetch(`/api/recipes/search?${params.toString()}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`加载更多失败: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const newRecipes = data.recipes || [];
          const pagination = data.pagination || { hasNextPage: false, total: 0 };
          
          console.log(`前端: 加载更多获取到 ${newRecipes.length} 条结果，总共 ${pagination.total || 0} 条`);
          
          // 检查是否获取到新数据
          if (newRecipes.length === 0) {
            console.warn('前端: 加载更多未获取到新数据，停止分页');
            setHasMore(false);
            return;
          }
          
          // 追加结果
          setRecipes(prev => [...prev, ...newRecipes]);
          setCurrentPage(prev => prev + 1);
          
          // 更新总记录数（优先使用filtered_count）
          const filteredTotal = pagination.filtered_count || pagination.total;
          if (filteredTotal && filteredTotal > 0) {
            setTotalRecords(filteredTotal);
          }
          
          // 计算是否还有更多数据，使用更可靠的方法
          const currentTotalLoaded = recipes.length + newRecipes.length;
          const hasMorePages = pagination.hasNextPage !== false && 
                              currentTotalLoaded < (filteredTotal || 0);
          
          setHasMore(hasMorePages);
        })
        .catch(error => {
          console.error('前端: 加载更多出错:', error);
          setError(`加载更多失败: ${error.message}`);
        })
        .finally(() => {
          setIsLoadingMore(false);
        });
    }
  }, [currentPage, hasMore, isLoadingMore, searchState, totalRecords]);
  
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

  // 监听搜索事件
  useEffect(() => {
    // 监听搜索事件
    const handleExecuteSearch = (event: CustomEvent) => {
      console.log('HomeContainer: 接收到execute-search事件，开始执行搜索', event.detail);
      
      // 标记为正在处理事件，避免状态变化时重复触发搜索
      isHandlingEventRef.current = true;

      // 确保显示结果区域
      setShowResults(true);
      
      // 直接从事件中获取筛选条件执行搜索
      if (event.detail && event.detail.filters) {
        console.log('HomeContainer: 使用事件中的筛选条件执行搜索:', event.detail.filters);
        
        // 获取事件中的筛选条件
        const { 
          cuisines = [], 
          flavors = [], 
          difficulties = [], 
          dietaryRestrictions = [],
          searchQuery = '',
          requiredIngredients = [],
          optionalIngredients = [],
          avoidIngredients = []
        } = event.detail.filters;
        
        // 设置加载状态
        setLoading(true);
        
        // 直接基于事件中的筛选条件执行搜索
        const params = new URLSearchParams();
        
        // 添加搜索词
        params.append('query', typeof searchQuery === 'string' ? searchQuery.trim() : '');
        
        // 添加必选食材
        if (Array.isArray(requiredIngredients)) {
          requiredIngredients.forEach((ing) => {
            if (ing && typeof ing === 'object' && ing.tag && typeof ing.tag === 'string') {
              params.append('requiredIngredient', ing.tag.trim());
            }
          });
        }
        
        // 添加可选食材
        if (Array.isArray(optionalIngredients)) {
          optionalIngredients.forEach((ing) => {
            if (ing && typeof ing === 'object' && ing.tag && typeof ing.tag === 'string') {
              params.append('optionalIngredient', ing.tag.trim());
            }
          });
        }
        
        // 添加忌口食材
        if (Array.isArray(avoidIngredients)) {
          avoidIngredients.forEach((ing) => {
            if (ing && typeof ing === 'object' && ing.tag && typeof ing.tag === 'string') {
              params.append('avoid', ing.tag.trim());
            }
          });
        }
        
        // 添加筛选条件
        if (Array.isArray(cuisines)) {
          cuisines.forEach(cuisine => {
            if (cuisine && typeof cuisine === 'string') {
              params.append('cuisine', cuisine.trim());
            }
          });
        }
        
        // 更新搜索控制器状态以匹配事件中的筛选条件
        // 这确保了后续的loadMore操作会使用相同的筛选条件
        // 注意：这里会触发状态变更，但不会直接导致搜索执行
        setSearchState(prev => ({
          ...prev,
          searchQuery: typeof searchQuery === 'string' ? searchQuery.trim() : '',
          cuisines: Array.isArray(cuisines) ? [...cuisines] : [],
          flavors: Array.isArray(flavors) ? [...flavors] : [],
          difficulties: Array.isArray(difficulties) ? [...difficulties] : [],
          dietaryRestrictions: Array.isArray(dietaryRestrictions) ? [...dietaryRestrictions] : [],
          requiredIngredients: Array.isArray(requiredIngredients) ? [...requiredIngredients] : [],
          optionalIngredients: Array.isArray(optionalIngredients) ? [...optionalIngredients] : [],
          avoidIngredients: Array.isArray(avoidIngredients) ? [...avoidIngredients] : []
        }));
        
        if (Array.isArray(flavors)) {
          flavors.forEach(flavor => {
            if (flavor && typeof flavor === 'string') {
              params.append('flavor', flavor.trim());
            }
          });
        }
        
        if (Array.isArray(difficulties)) {
          difficulties.forEach(difficulty => {
            if (difficulty && typeof difficulty === 'string') {
              params.append('difficulty', difficulty.trim());
            }
          });
        }
        
        if (Array.isArray(dietaryRestrictions)) {
          dietaryRestrictions.forEach(diet => {
            if (diet && typeof diet === 'string') {
              params.append('dietary', diet.trim());
            }
          });
        }
        
        // 添加标签逻辑和分页
        params.append('tagLogic', 'OR');
        params.append('page', '1');
        params.append('limit', '50');
        
        // 执行搜索请求
        fetch(`/api/recipes/search?${params.toString()}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`搜索失败: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            const searchResults = data.recipes || [];
            const pagination = data.pagination || { hasNextPage: false, total: 0 };
            
            console.log(`前端: 获取到 ${searchResults.length} 条结果，总共 ${pagination.total || searchResults.length} 条`);
            
            // 检查结果是否为空或数量异常
            if (searchResults.length === 0) {
              console.warn('前端: 获取到0条搜索结果，但总数为', pagination.total);
              if (pagination.total > 0) {
                setError(`搜索成功但无法显示结果，实际总条数: ${pagination.total}`);
              } else {
                setError('没有找到匹配的菜谱，请尝试其他搜索条件');
              }
            }
            
            // 确保总记录数合理
            if (pagination.total === 0 && searchResults.length > 0) {
              // 如果总记录数为0但实际有结果，使用实际结果数量
              setTotalRecords(searchResults.length);
            } else if (pagination.total < searchResults.length) {
              // 如果总记录数小于当前页记录数，也使用实际结果数量
              setTotalRecords(searchResults.length);
            } else {
              // 否则使用API返回的总记录数
              setTotalRecords(pagination.total || searchResults.length);
            }
            
            setRecipes(searchResults);
            setCurrentPage(1);
            // 只有当总数大于当前结果数量时才显示有更多数据
            setHasMore(pagination.total > searchResults.length && pagination.hasNextPage !== false);
            
            setError(null);
            setShowResults(true);
            
            // 搜索完成后滚动到结果区域
            setTimeout(() => {
              resultsAreaRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }, 100);
          })
          .catch(error => {
            console.error('前端: 搜索出错:', error);
            setError(`搜索失败: ${error.message}`);
            setRecipes([]);
          })
          .finally(() => {
            setLoading(false);
            
            // 搜索完成后，移除标记
            setTimeout(() => {
              isHandlingEventRef.current = false;
            }, 500);
          });
      } else {
        // 使用当前状态执行搜索
        performSearch(1, false)
          .finally(() => {
            setTimeout(() => {
              isHandlingEventRef.current = false;
            }, 500);
          });
      }
    };

    // 添加事件监听
    window.addEventListener('execute-search', handleExecuteSearch as EventListener);

    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('execute-search', handleExecuteSearch as EventListener);
    };
  }, [performSearch, setSearchState]);

  // 添加对搜索控制器的监听，当executeSearch被调用时执行搜索
  useEffect(() => {
    // 搜索状态变化时触发处理
    if (searchState && searchState.searchResults && !isHandlingEventRef.current) {
      console.log('HomeContainer: 检测到搜索结果更新，执行页面搜索');
      console.log('HomeContainer: 当前搜索状态:', {
        searchQuery: searchState.searchQuery,
        requiredIngredients: searchState.requiredIngredients.map((i: TagItem) => i.tag),
        optionalIngredients: searchState.optionalIngredients.map((i: TagItem) => i.tag),
        avoidIngredients: searchState.avoidIngredients.map((i: TagItem) => i.tag),
        cuisines: searchState.cuisines,
        flavors: searchState.flavors,
        difficulties: searchState.difficulties,
        dietaryRestrictions: searchState.dietaryRestrictions
      });
      
      // 确保显示结果区域
      setShowResults(true);
      
      // 显示搜索结果
      if (searchState.searchResults && searchState.searchResults.length > 0) {
        setRecipes(searchState.searchResults);
        setTotalRecords(searchState.totalResults || searchState.searchResults.length);
        setCurrentPage(1);
        setHasMore(searchState.searchResults.length < (searchState.totalResults || 0));
      } else {
        setRecipes([]);
        setTotalRecords(0);
      }
    }
  }, [searchState, performSearch]);

  // 初始化
  useEffect(() => {
    setShowResults(false);
  }, []);



  return (
    <div className="container">
      {/* 搜索筛选区域 */}
      <HomeListView totalResults={totalRecords} />
      
      {/* 搜索结果区域 */}
      {showResults && (
        <div 
          ref={resultsAreaRef}
          className="results-area mt-8"
        >
          {/* 搜索结果反馈 */}
          {!loading && !error && recipes.length > 0 && (
            <div className="text-sm text-gray-600 mb-4">
              共找到 <span className="text-blue-600 font-bold">{totalRecords}</span> 个相关菜品
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe, index) => (
                  <RecipeCard 
                    key={`recipe-${recipe.id || ''}-${index}`} 
                    recipe={recipe} 
                    showMatchPercentage={false}
                    onClick={(e) => {
                      // 在新标签页中打开菜谱详情
                      window.open(`/recipe/${recipe.id}`, '_blank');
                    }}
                  />
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
      )}
    </div>
  );
} 