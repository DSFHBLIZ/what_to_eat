/**
 * 控制器层：统一搜索控制器
 * 整合搜索和过滤功能，提供统一的API，减少重复代码
 * 
 * 重要说明：
 * 1. 搜索只在用户明确点击搜索按钮时执行，不会自动触发
 * 2. 筛选条件变更不会自动触发搜索，以提高用户体验
 * 3. 使用全局事件 'execute-search' 统一触发搜索行为
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Recipe } from '../types/recipe';
import { 
  isSeasoningTag
} from '../utils/recipe/searchService';
import { useAsyncResourceController } from '../hooks/useAsyncResourceController';
import { eventBus, emitEvents } from '../core/eventBus';
import { IngredientTag, FilterType } from '../types/search';
import { logError } from '../utils/common/errorLogger';
import { produce } from 'immer';

// 为了简化，定义数据服务类型
interface FilterCriteria {
  searchQuery: string;
  requiredIngredients: IngredientTag[];
  optionalIngredients: IngredientTag[];
  avoidIngredients: IngredientTag[];
  cuisines: string[];
  flavors: string[];
  difficulties: string[];
  dietaryRestrictions: string[];
  tagLogic: 'AND' | 'OR';
}

interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

interface PaginationOptions {
  page: number;
  limit: number;
}

interface RecipeWithScore extends Recipe {
  score?: number;
}

// 统一的搜索状态接口
export interface UnifiedSearchState {
  // 搜索条件
  searchQuery: string;
  requiredIngredients: IngredientTag[];
  optionalIngredients: IngredientTag[];
  avoidIngredients: IngredientTag[];  // 添加忌口食材
  cuisines: string[];
  flavors: string[];
  difficulties: string[];
  dietaryRestrictions: string[];
  
  // 标签逻辑
  tagLogic: 'AND' | 'OR';
  
  // 已应用的过滤器类型
  appliedFilters: FilterType[];
  
  // 分页状态
  page: number;
  limit: number;
  
  // 排序状态
  sortField: string;
  sortDirection: 'asc' | 'desc';
  
  // 宴会模式状态
  banquetMode?: {
    isEnabled: boolean;
    guestCount: number;
    allocation: import('../types/banquet').DishAllocation | null;
    selectedRecipes: string[]; // 选中的菜谱ID数组
  };
  
  // 运行时状态
  loading?: boolean;
  searchResults?: RecipeWithScore[];
  totalResults?: number;
  resultsPage?: number;
  hasNextPage?: boolean;
  error?: string | null;
  lastSearchTimestamp?: number;
}

// 选项接口
export interface UnifiedSearchControllerOptions {
  /**
   * 自动同步URL参数
   */
  syncWithUrl?: boolean;
  
  /**
   * 是否自动执行搜索
   * 默认为false，确保搜索只在用户手动点击搜索按钮时执行
   * 这是为了统一搜索行为，避免不同页面有不同的搜索触发逻辑
   */
  autoExecuteSearch?: boolean;
  
  /**
   * 自动搜索延迟时间 (毫秒)
   */
  debounceTime?: number;
  
  /**
   * 是否保留搜索历史
   */
  preserveHistory?: boolean;
  
  /**
   * 初始页码 (默认1)
   */
  defaultPage?: number;
  
  /**
   * 每页数量 (默认50)
   */
  defaultLimit?: number;
  
  /**
   * 初始排序字段 (默认name)
   */
  defaultSortField?: string;
  
  /**
   * 初始排序方向 (默认asc)
   */
  defaultSortDirection?: 'asc' | 'desc';
  
  /**
   * 搜索回调
   */
  onSearch?: (recipes: Recipe[]) => void;
  
  /**
   * 过滤器变更回调
   */
  onFilterChange?: (updatedState: any) => void;
  
  /**
   * 自定义搜索函数
   */
  searchFunction?: (items: Recipe[], filterState: any) => Recipe[];
}

// 搜索结果接口
interface SearchResult {
  results: RecipeWithScore[];
  total: number;
  error?: string | null;
}

// 添加SearchParams接口定义
interface SearchParams {
  page?: number;
  limit?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * 把 IngredientTag 数组转换为字符串数组用于 URL 参数
 */
function ingredientTagsToStrings(tags: IngredientTag[]): string[] {
  return tags.map(tag => tag.tag);
}

/**
 * 从字符串数组创建 IngredientTag 数组
 */
function createIngredientTags(strings: string[]): IngredientTag[] {
  return strings.map(str => {
    const isSeasoning = isSeasoningTag(str);
    return {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tag: str,
      type: isSeasoning ? FilterType.SEASONING : FilterType.INGREDIENT
    };
  });
}

/**
 * 统一的搜索控制器钩子
 * 整合了搜索条件、排序、分页、过滤和数据获取
 * 
 * 该控制器实现了统一的搜索行为：
 * 1. 默认不自动执行搜索，只有当用户点击搜索按钮时才会执行
 * 2. 通过全局事件机制触发搜索，确保行为一致性
 * 3. 所有搜索相关组件都应该使用这个控制器来保持一致的用户体验
 */
export function useUnifiedSearchController(options: UnifiedSearchControllerOptions = {}) {
  // 设置默认值
  const {
    syncWithUrl = true,
    autoExecuteSearch = false,
    debounceTime = 500,
    preserveHistory = true,
    defaultPage = 1,
    defaultLimit = 50,
    defaultSortField = 'relevance',
    defaultSortDirection = 'desc',
    onSearch,
    onFilterChange,
    searchFunction
  } = options;
  
  // 初始化参数 - 先从URL获取，如果没有则使用默认值
  const initialFilterState = {
    searchQuery: '',
    requiredIngredients: [],
    optionalIngredients: [],
    avoidIngredients: [],  // 添加忌口食材
    cuisines: [],
    flavors: [],
    difficulties: [],
    dietaryRestrictions: [],
    tagLogic: 'OR' as const,
    appliedFilters: []
  };

  // 创建refs用于跟踪状态和防止重复操作
  // const lastOperationRef = useRef<string>('');
  // const isFirstRenderRef = useRef<boolean>(true);
  // const lastFilterStateRef = useRef<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 将searchResultCache移到Hook内部
  const searchResultCache = useRef<{
    results: RecipeWithScore[];
    total: number;
    error: string | null;
  } | null>(null);
  
  // 本地状态
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [lastSearch, setLastSearch] = useState<string>('');
  const [searchExecuted, setSearchExecuted] = useState<boolean>(false);
  const [lastSearchCacheId, setLastSearchCacheId] = useState<string>('');
  
  // 搜索状态
  const [searchIsLoading, setSearchIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);
  const [searchData, setSearchData] = useState<SearchResult | null>(null);
  
  // 设置初始的搜索状态
  const [searchState, setSearchState] = useState<UnifiedSearchState>({
    searchQuery: initialFilterState.searchQuery,
    requiredIngredients: initialFilterState.requiredIngredients,
    optionalIngredients: initialFilterState.optionalIngredients,
    avoidIngredients: initialFilterState.avoidIngredients,
    cuisines: initialFilterState.cuisines,
    flavors: initialFilterState.flavors,
    difficulties: initialFilterState.difficulties,
    dietaryRestrictions: initialFilterState.dietaryRestrictions,
    tagLogic: initialFilterState.tagLogic,
    appliedFilters: initialFilterState.appliedFilters,
    page: defaultPage,
    limit: defaultLimit,
    sortField: defaultSortField,
    sortDirection: defaultSortDirection,
    // 初始化宴会模式状态
    banquetMode: {
      isEnabled: false,
      guestCount: 8,
      allocation: null,
      selectedRecipes: []
    }
  });
  
  // 从URL同步状态 - 仅初始加载时
  useEffect(() => {
    if (syncWithUrl && searchParams) {
      // 获取查询参数
      const queryParam = searchParams.get('q') || '';
      
      // 获取必选食材
      const requiredParams = searchParams.getAll('required') || [];
      const requiredIngredients = requiredParams.map(tag => {
        const isSeasoningIngredient = isSeasoningTag(tag);
        return {
          id: `${isSeasoningIngredient ? 'seasoning' : 'ingredient'}-${Math.random().toString(36).substring(2, 9)}`,
          tag,
          type: isSeasoningIngredient ? FilterType.SEASONING : FilterType.INGREDIENT
        };
      });
      
      // 获取可选食材
      const optionalParams = searchParams.getAll('optional') || [];
      const optionalIngredients = optionalParams.map(tag => {
        const isSeasoningIngredient = isSeasoningTag(tag);
        return {
          id: `${isSeasoningIngredient ? 'seasoning' : 'ingredient'}-${Math.random().toString(36).substring(2, 9)}`,
          tag,
          type: isSeasoningIngredient ? FilterType.SEASONING : FilterType.INGREDIENT
        };
      });
      
      // 获取忌口食材
      const avoidParams = searchParams.getAll('avoid') || [];
      const avoidIngredients = avoidParams.map(tag => {
        const isSeasoningIngredient = isSeasoningTag(tag);
        return {
          id: `${isSeasoningIngredient ? 'seasoning' : 'ingredient'}-${Math.random().toString(36).substring(2, 9)}`,
          tag,
          type: isSeasoningIngredient ? FilterType.SEASONING : FilterType.AVOID
        };
      });
      
      // 获取其他筛选参数
      const cuisines = searchParams.getAll('cuisine') || [];
      const flavors = searchParams.getAll('flavor') || [];
      const difficulties = searchParams.getAll('difficulty') || [];
      const dietaryRestrictions = searchParams.getAll('dietary') || [];
      const tagLogic = (searchParams.get('tagLogic') as 'AND' | 'OR') || 'OR';
      
      // 获取分页和排序参数
      const page = Number(searchParams.get('page')) || defaultPage;
      const limit = Number(searchParams.get('limit')) || defaultLimit;
      const sortField = searchParams.get('sort') || defaultSortField;
      const sortDirection = (searchParams.get('order') as 'asc' | 'desc') || defaultSortDirection;
      
      // 更新状态
      setSearchState(prev => ({
        ...prev,
        searchQuery: queryParam,
        requiredIngredients,
        optionalIngredients,
        avoidIngredients,  // 添加忌口食材
        cuisines,
        flavors,
        difficulties,
        dietaryRestrictions,
        tagLogic,
        page,
        limit,
        sortField,
        sortDirection
      }));
    }
  }, [syncWithUrl, searchParams, defaultPage, defaultLimit, defaultSortField, defaultSortDirection]);
  
  // 构建当前搜索条件对象
  const currentFilters = useMemo<FilterCriteria>(() => {
    return {
      searchQuery: searchState.searchQuery,
      requiredIngredients: searchState.requiredIngredients,
      optionalIngredients: searchState.optionalIngredients,
      avoidIngredients: searchState.avoidIngredients,  // 添加忌口食材
      cuisines: searchState.cuisines,
      flavors: searchState.flavors,
      difficulties: searchState.difficulties,
      dietaryRestrictions: searchState.dietaryRestrictions,
      tagLogic: searchState.tagLogic
    };
  }, [
    searchState.searchQuery,
    searchState.requiredIngredients,
    searchState.optionalIngredients,
    searchState.avoidIngredients,  // 添加忌口食材
    searchState.cuisines,
    searchState.flavors,
    searchState.difficulties,
    searchState.dietaryRestrictions,
    searchState.tagLogic
  ]);
  
  // 构建当前排序选项
  const currentSort = useMemo<SortOptions>(() => {
    return {
      field: searchState.sortField,
      direction: searchState.sortDirection
    };
  }, [searchState.sortField, searchState.sortDirection]);
  
  // 构建当前分页选项
  const currentPagination = useMemo<PaginationOptions>(() => {
    return {
      page: searchState.page,
      limit: searchState.limit
    };
  }, [searchState.page, searchState.limit]);
  
  // 同步状态到URL参数
  const syncToUrl = useCallback(() => {
    if (!syncWithUrl || !router) return;
    
    try {
      const newParams = new URLSearchParams();
      
      // 只添加有值的参数
      if (searchState.searchQuery) newParams.set('q', searchState.searchQuery);
      
      // 将 IngredientTag 转换为字符串存储在 URL 参数中
      const requiredTags = ingredientTagsToStrings(searchState.requiredIngredients);
      const optionalTags = ingredientTagsToStrings(searchState.optionalIngredients);
      const avoidTags = ingredientTagsToStrings(searchState.avoidIngredients);  // 添加忌口食材
      
      requiredTags.forEach(ing => newParams.append('required', ing));
      optionalTags.forEach(ing => newParams.append('optional', ing));
      avoidTags.forEach(ing => newParams.append('avoid', ing));  // 添加忌口食材
      
      searchState.cuisines.forEach(cuisine => newParams.append('cuisine', cuisine));
      searchState.flavors.forEach(flavor => newParams.append('flavor', flavor));
      searchState.difficulties.forEach(difficulty => newParams.append('difficulty', difficulty));
      searchState.dietaryRestrictions.forEach(diet => newParams.append('dietary', diet));
      
      // 标签逻辑
      if (searchState.tagLogic !== 'AND') {
        newParams.set('tagLogic', searchState.tagLogic);
      }
      
      // 分页参数
      if (searchState.page !== defaultPage) newParams.set('page', searchState.page.toString());
      if (searchState.limit !== defaultLimit) newParams.set('limit', searchState.limit.toString());
      
      // 排序参数
      if (searchState.sortField !== defaultSortField) newParams.set('sort', searchState.sortField);
      if (searchState.sortDirection !== defaultSortDirection) newParams.set('order', searchState.sortDirection);
      
      // 更新URL，不刷新页面
      const queryString = newParams.toString();
      window.history.replaceState({}, '', queryString ? `?${queryString}` : window.location.pathname);
    } catch (error) {
      console.error('URL同步失败:', error);
    }
  }, [router, searchState, defaultPage, defaultLimit, defaultSortField, defaultSortDirection]);

  // 获取当前状态函数 - 移到Hook内部
  const getState = useCallback(() => {
    return searchState;
  }, [searchState]);

  /**
   * 执行搜索操作
   * @param searchQuery 搜索关键词
   * @param overrideParams 覆盖默认的搜索参数
   * @returns 搜索结果Promise
   */
  const executeSearch = useCallback(async (overrideParams: SearchParams = {}, searchQueryToUse?: string, preserveHistory = true): Promise<SearchResult | null> => {
    console.log('executeSearch: 开始执行搜索');
    
    // 确保必要的搜索条件
    const currentState = getState();
    
    // 使用传入的参数或当前状态
    const finalSearchQuery = searchQueryToUse !== undefined 
      ? searchQueryToUse 
      : currentState.searchQuery;
    
    const requiredIngredients = currentState.requiredIngredients;
    const optionalIngredients = currentState.optionalIngredients;
    const avoidIngredients = currentState.avoidIngredients;
    
    // 搜索参数检查
    const hasSearchTerm = !!finalSearchQuery && finalSearchQuery.trim().length > 0;
    const hasRequiredIngredients = requiredIngredients.length > 0;
    const hasOptionalIngredients = optionalIngredients.length > 0;
    const hasAvoidIngredients = avoidIngredients.length > 0;
    const hasCuisines = currentState.cuisines.length > 0;
    const hasFlavors = currentState.flavors.length > 0;
    const hasDifficulties = currentState.difficulties.length > 0;
    const hasDietaryRestrictions = currentState.dietaryRestrictions.length > 0;
    
    // 确定是否有效搜索（至少有一个搜索条件）- 但保留自由搜索的能力
    const hasAnySearchCriteria = 
      hasSearchTerm || 
      hasRequiredIngredients || 
      hasOptionalIngredients ||
      hasAvoidIngredients ||
      hasCuisines || 
      hasFlavors || 
      hasDifficulties || 
      hasDietaryRestrictions;
    
    // 搜索记录唯一标识符 - 使用所有搜索条件构建唯一标识
    const searchCacheId = [
      finalSearchQuery,
      ...requiredIngredients.map(i => i.tag),
      ...optionalIngredients.map(i => i.tag),
      ...avoidIngredients.map(i => i.tag),
      ...currentState.cuisines,
      ...currentState.flavors,
      ...currentState.difficulties,
      ...currentState.dietaryRestrictions
    ].join('|');
    
    // 减少重复搜索
    if (searchCacheId === lastSearchCacheId) {
      console.log('executeSearch: 搜索条件未变化，不重复搜索', searchCacheId);
      // 返回当前搜索结果
      const currentResults = currentState.searchResults || [];
      return {
        results: currentResults,
        total: currentResults.length,
        error: null
      };
    }
    
    // 准备生成URL参数
    const params = new URLSearchParams();
    
    // 添加统一搜索参数，使用q参数传递搜索关键词
    if (hasSearchTerm) {
      params.append('q', finalSearchQuery);
    }
    
    // 添加食材参数 - 不论有无搜索关键词，都传递食材参数
    if (hasRequiredIngredients) {
      requiredIngredients.forEach(item => {
        params.append('requiredIngredient', item.tag);
      });
    }
    
    if (hasOptionalIngredients) {
      optionalIngredients.forEach(item => {
        params.append('optionalIngredient', item.tag);
      });
    }
    
    // 处理忌口食材
    if (hasAvoidIngredients) {
      avoidIngredients.forEach(item => {
        params.append('avoid', item.tag);
      });
    }
    
    // 处理其他筛选参数
    if (hasCuisines) {
      currentState.cuisines.forEach(cuisine => {
        params.append('cuisine', cuisine);
      });
    }
    
    if (hasFlavors) {
      currentState.flavors.forEach(flavor => {
        params.append('flavor', flavor);
      });
    }
    
    if (hasDifficulties) {
      currentState.difficulties.forEach(difficulty => {
        params.append('difficulty', difficulty);
      });
    }
    
    if (hasDietaryRestrictions) {
      currentState.dietaryRestrictions.forEach(diet => {
        params.append('dietary', diet);
      });
    }
    
    // 添加分页参数
    params.append('page', '1');
    params.append('limit', '50'); // 默认一次获取50条记录
    
    // 添加排序参数 - 使用相关性排序
    params.append('sortField', 'relevance_score');
    params.append('sortDirection', 'desc');
    
    // 添加语义搜索参数
    params.append('enableSemanticSearch', 'true');
    
    // 构建API URL
    const apiUrl = `/api/recipes/search?${params.toString()}`;
    console.log('搜索API URL:', apiUrl);
    
    // 检查是否在服务器端
    const isServer = typeof window === 'undefined';
    if (isServer) {
      console.log('服务器端渲染，跳过搜索请求');
      return null;
    }
    
    // 更新搜索状态为加载中
    setSearchState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));
    
    // 更新上次搜索缓存ID
    setLastSearchCacheId(searchCacheId);
    
    try {
      // 执行API调用
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`搜索失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理响应数据
      let results = [];
      let total = 0;
      
      if (data && data.recipes) {
        results = data.recipes;
        total = data.pagination?.total || results.length;
      } else if (Array.isArray(data)) {
        results = data;
        total = data.length;
      } else if (data.results && Array.isArray(data.results)) {
        results = data.results;
        total = data.total || results.length;
      }
      
      console.log(`搜索成功: 找到${total}个结果，当前显示${results.length}个`);
      
      // 更新搜索状态和搜索历史
      if (preserveHistory && finalSearchQuery) {
        if (searchHistory.includes(finalSearchQuery)) {
          // 如果历史中已存在，将其移到最前面
          setSearchHistory(prev => [
            finalSearchQuery,
            ...prev.filter(item => item !== finalSearchQuery)
          ]);
        } else {
          // 新添加到历史
          setSearchHistory(prev => [finalSearchQuery, ...prev].slice(0, 10));
        }
      }
      
      // 更新搜索状态
      setSearchState(prev => ({
        ...prev,
        searchResults: results,
        totalResults: total,
        loading: false,
        error: null,
        lastSearchTimestamp: Date.now()
      }));
      
      // 更新搜索缓存
      searchResultCache.current = {
        results,
        total,
        error: null
      };
      
      // 执行搜索回调
      if (onSearch && typeof onSearch === 'function') {
        onSearch(results);
      }
      
      return {
        results,
        total,
        error: null
      };
    } catch (error) {
      console.error('执行搜索请求失败:', error);
      
      // 更新搜索状态为错误
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
      
      return {
        results: [],
        total: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, [getState, setSearchState, searchHistory, lastSearchCacheId, onSearch]);

  // 添加必选食材
  const addRequiredIngredient = useCallback((ingredient: IngredientTag) => {
    // 确保食材不为空
    if (!ingredient || !ingredient.tag || !ingredient.tag.trim()) return;
    
    setSearchState(prev => {
      // 检查是否已经存在
      const exists = prev.requiredIngredients.some(ing => 
        ing.tag.toLowerCase() === ingredient.tag.toLowerCase()
      );
      
      if (!exists) {
        return {
          ...prev,
          requiredIngredients: [...prev.requiredIngredients, ingredient]
        };
      }
      return prev;
    });
  }, [setSearchState]);
  
  // 移除必选食材
  const removeRequiredIngredient = useCallback((ingredientId: string) => {
    setSearchState(prev => ({
      ...prev,
      requiredIngredients: prev.requiredIngredients.filter(ing => ing.id !== ingredientId)
    }));
  }, [setSearchState]);
  
  // 添加可选食材
  const addOptionalIngredient = useCallback((ingredient: IngredientTag) => {
    // 确保食材不为空
    if (!ingredient || !ingredient.tag || !ingredient.tag.trim()) return;
    
    setSearchState(prev => {
      // 检查是否已经存在于必选或可选中
      const existsInRequired = prev.requiredIngredients.some(ing => 
        ing.tag.toLowerCase() === ingredient.tag.toLowerCase()
      );
      
      const existsInOptional = prev.optionalIngredients.some(ing => 
        ing.tag.toLowerCase() === ingredient.tag.toLowerCase()
      );
      
      if (!existsInRequired && !existsInOptional) {
        return {
          ...prev,
          optionalIngredients: [...prev.optionalIngredients, ingredient]
        };
      }
      return prev;
    });
  }, [setSearchState]);
  
  // 移除可选食材
  const removeOptionalIngredient = useCallback((ingredientId: string) => {
    setSearchState(prev => ({
      ...prev,
      optionalIngredients: prev.optionalIngredients.filter(ing => ing.id !== ingredientId)
    }));
  }, [setSearchState]);
  
  // 添加忌口食材
  const addAvoidIngredient = useCallback((ingredient: IngredientTag) => {
    // 确保食材不为空
    if (!ingredient || !ingredient.tag || !ingredient.tag.trim()) return;
    
    setSearchState(prev => {
      // 检查是否已经存在
      const exists = prev.avoidIngredients.some(ing => 
        ing.tag.toLowerCase() === ingredient.tag.toLowerCase()
      );
      
      if (!exists) {
        return {
          ...prev,
          avoidIngredients: [...prev.avoidIngredients, ingredient]
        };
      }
      return prev;
    });
  }, [setSearchState]);
  
  // 移除忌口食材
  const removeAvoidIngredient = useCallback((ingredientId: string) => {
    setSearchState(prev => ({
      ...prev,
      avoidIngredients: prev.avoidIngredients.filter(ing => ing.id !== ingredientId)
    }));
  }, [setSearchState]);
  
  // 设置搜索关键词
  const setSearchQuery = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev, 
      searchQuery: query
    }));
  }, [setSearchState]);
  
  // 切换过滤器
  const toggleFilter = useCallback((filterType: FilterType, value: string) => {
    setSearchState(prev => {
      let updatedState = { ...prev };
      
      switch (filterType) {
        case FilterType.CUISINE:
          if (prev.cuisines.includes(value)) {
            // 如果已选中，则取消选中
            updatedState.cuisines = prev.cuisines.filter(item => item !== value);
          } else {
            // 如果未选中，则选中当前值，并清除同类其他选中值
            updatedState.cuisines = [value];
          }
          break;
          
        case FilterType.FLAVOR:
          if (prev.flavors.includes(value)) {
            // 如果已选中，则取消选中
            updatedState.flavors = prev.flavors.filter(item => item !== value);
          } else {
            // 如果未选中，则选中当前值，并清除同类其他选中值
            updatedState.flavors = [value];
          }
          break;
          
        case FilterType.DIFFICULTY:
          if (prev.difficulties.includes(value)) {
            // 如果已选中，则取消选中
            updatedState.difficulties = prev.difficulties.filter(item => item !== value);
          } else {
            // 如果未选中，则选中当前值，并清除同类其他选中值
            updatedState.difficulties = [value];
          }
          break;
          
        case FilterType.DIETARY:
          if (prev.dietaryRestrictions.includes(value)) {
            // 如果已选中，则取消选中
            updatedState.dietaryRestrictions = prev.dietaryRestrictions.filter(item => item !== value);
          } else {
            // 如果未选中，则选中当前值，并清除同类其他选中值
            updatedState.dietaryRestrictions = [value];
          }
          break;
          
        default:
          // 无需处理其他类型
          break;
      }
      
      // 更新应用的过滤器列表
      const appliedFilters = new Set(prev.appliedFilters);
      const hasFilterValues = (
        (filterType === FilterType.CUISINE && updatedState.cuisines.length > 0) ||
        (filterType === FilterType.FLAVOR && updatedState.flavors.length > 0) ||
        (filterType === FilterType.DIFFICULTY && updatedState.difficulties.length > 0) ||
        (filterType === FilterType.DIETARY && updatedState.dietaryRestrictions.length > 0)
      );
      
      if (hasFilterValues) {
        appliedFilters.add(filterType);
      } else {
        appliedFilters.delete(filterType);
      }
      
      updatedState.appliedFilters = Array.from(appliedFilters);
      
      return updatedState;
    });
  }, [setSearchState]);
  
  // 设置宴会配置
  const setBanquetConfig = useCallback((config: import('../types/banquet').BanquetConfig) => {
    setSearchState(prev => ({
      ...prev,
      banquetMode: {
        isEnabled: config.isEnabled,
        guestCount: config.guestCount,
        allocation: config.allocation,
        selectedRecipes: config.isEnabled ? (prev.banquetMode?.selectedRecipes || []) : []
      }
    }));
  }, [setSearchState]);

  // 切换菜谱选择状态（宴会模式下的多选功能）
  const toggleRecipeSelection = useCallback((recipeId: string) => {
    setSearchState(prev => {
      if (!prev.banquetMode?.isEnabled) return prev;
      
      const currentSelected = prev.banquetMode.selectedRecipes || [];
      const isSelected = currentSelected.includes(recipeId);
      
      return {
        ...prev,
        banquetMode: {
          ...prev.banquetMode,
          selectedRecipes: isSelected
            ? currentSelected.filter(id => id !== recipeId)
            : [...currentSelected, recipeId]
        }
      };
    });
  }, [setSearchState]);

  // 清空选中的菜谱
  const clearSelectedRecipes = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      banquetMode: prev.banquetMode ? {
        ...prev.banquetMode,
        selectedRecipes: []
      } : undefined
    }));
  }, [setSearchState]);

  // 返回控制器对象
  return {
    searchState,
    setSearchState,
    setSearchQuery,
    executeSearch,
    addRequiredIngredient,
    removeRequiredIngredient,
    addOptionalIngredient,
    removeOptionalIngredient,
    addAvoidIngredient,     // 添加忌口食材
    removeAvoidIngredient,  // 移除忌口食材
    toggleFilter,
    // 宴会模式相关方法
    setBanquetConfig,
    toggleRecipeSelection,
    clearSelectedRecipes,
    searchHistory,
    searchIsLoading,
    searchError
  };
}