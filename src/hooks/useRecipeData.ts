import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { debounce } from 'lodash';
import { Recipe } from '../types/recipe';
import { FilterCriteria, fetchRecipes, fetchRecipeById } from '../utils/data/dataService';
import { useAsyncResourceController } from './useAsyncResourceController';
import { ErrorKey, createError } from '../i18n/errorMessages';
import { useRecipeError, RecipeErrorHelper } from '../contexts/AppProvider';

/**
 * 提取和处理食材项，统一格式为 {name, quantity}
 * @param item 食材数据项，可能是字符串或对象
 * @returns 标准化的食材对象
 */
function processIngredientItem(item: any): { name: string, quantity: string } {
  try {
    if (typeof item === 'string') {
      return { name: item, quantity: '' };
    }
    
    if (typeof item === 'object' && item !== null) {
      // 中文字段名映射表
      const nameFields = ['name', '名称', '食材', '调料', '配料', '材料', '名字'];
      const quantityFields = ['quantity', '用量', '数量', '份量', '分量', '重量'];
      
      // 查找匹配的字段
      let name = '';
      for (const field of nameFields) {
        if (field in item && item[field]) {
          name = String(item[field]);
          break;
        }
      }
      
      let quantity = '';
      for (const field of quantityFields) {
        if (field in item && item[field]) {
          quantity = String(item[field]);
          break;
        }
      }
      
      return { 
        name: name || '未知项', 
        quantity 
      };
    }
    
    return { name: String(item || '未知项'), quantity: '' };
  } catch (e) {
    console.error('处理食材项时出错:', e);
    return { name: '数据处理错误', quantity: '' };
  }
}

/**
 * 处理字符串项，确保返回字符串并处理对象和数组
 * @param item 需要处理的数据项
 * @returns 处理后的字符串
 */
function processStringItem(item: any): string {
  if (typeof item === 'string') return item;
  if (item === null || item === undefined) return '';
  
  try {
    if (typeof item === 'object') {
      // 检查是否有内容、描述或文本字段
      const contentFields = ['content', 'description', 'text', '内容', '描述', '文本', '说明'];
      
      for (const field of contentFields) {
        if (field in item && typeof item[field] === 'string') {
          return item[field];
        }
      }
      
      // 过滤出字符串属性
      const stringProps = Object.values(item)
        .filter((val): val is string => typeof val === 'string')
        .join(', ');
      return stringProps || JSON.stringify(item);
    }
    return String(item);
  } catch (e) {
    console.error('处理字符串项时出错:', e);
    return '数据处理错误';
  }
}

/**
 * 处理过的菜谱数据，便于在UI中展示
 */
export interface ProcessedRecipeData {
  processedIngredients: { name: string, quantity: string }[];
  processedSeasonings: { name: string, quantity: string }[];
  preparationSteps: string[];
  cookingSteps: string[];
  combinedSteps: string[];
  showCombinedSteps: boolean;
  cookingTips: string[];
}

export interface RecipeDataState {
  searchQuery: string;
  requiredIngredients: string[];
  optionalIngredients: string[];
  cuisines: string[];
  flavors: string[];
  difficulties: string[];
  cookingMethods: string[];
  dietaryRestrictions: string[];
  page: number;
  limit: number;
}

// 搜索结果接口
interface SearchResult {
  recipes: Recipe[];
  total: number;
}

export interface RecipeDataOptions {
  /**
   * 自动同步URL参数
   */
  syncWithUrl?: boolean;
  /**
   * 自动搜索延迟时间 (毫秒)
   */
  debounceTime?: number;
  /**
   * 初始页码 (默认1)
   */
  defaultPage?: number;
  /**
   * 每页数量 (默认20)
   */
  defaultLimit?: number;
  /**
   * 初始菜谱ID
   */
  recipeId?: string;
}

/**
 * 统一的菜谱数据Hook - 整合所有数据获取、搜索和过滤功能
 * @param options 配置选项
 */
export function useRecipeData(options: RecipeDataOptions = {}) {
  const {
    syncWithUrl = true,
    debounceTime = 300,
    defaultPage = 1,
    defaultLimit = 20,
    recipeId
  } = options;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addError, clearError } = useRecipeError();
  
  // 初始化搜索状态，如果启用URL同步，则从URL参数初始化
  const [searchState, setSearchState] = useState<RecipeDataState>(() => {
    // 如果没有searchParams对象，则使用默认值
    if (!searchParams) {
      return {
        searchQuery: '',
        requiredIngredients: [],
        optionalIngredients: [],
        cuisines: [],
        flavors: [],
        difficulties: [],
        cookingMethods: [],
        dietaryRestrictions: [],
        page: defaultPage,
        limit: defaultLimit
      };
    }
    
    return {
      searchQuery: syncWithUrl ? searchParams.get('q') || '' : '',
      requiredIngredients: syncWithUrl ? searchParams.getAll('required') : [],
      optionalIngredients: syncWithUrl ? searchParams.getAll('optional') : [],
      cuisines: syncWithUrl ? searchParams.getAll('cuisine') : [],
      flavors: syncWithUrl ? searchParams.getAll('flavor') : [],
      difficulties: syncWithUrl ? searchParams.getAll('difficulty') : [],
      cookingMethods: syncWithUrl ? searchParams.getAll('method') : [],
      dietaryRestrictions: syncWithUrl ? searchParams.getAll('diet') : [],
      page: syncWithUrl ? Number(searchParams.get('page')) || defaultPage : defaultPage,
      limit: syncWithUrl ? Number(searchParams.get('limit')) || defaultLimit : defaultLimit
    };
  });
  
  // 构建当前搜索条件对象
  const currentFilters = useMemo<FilterCriteria>(() => {
    return {
      searchQuery: searchState.searchQuery,
      requiredIngredients: searchState.requiredIngredients,
      optionalIngredients: searchState.optionalIngredients,
      cuisines: searchState.cuisines,
      flavors: searchState.flavors,
      difficulties: searchState.difficulties,
      cookingMethods: searchState.cookingMethods,
      dietaryRestrictions: searchState.dietaryRestrictions
    };
  }, [
    searchState.searchQuery,
    searchState.requiredIngredients,
    searchState.optionalIngredients,
    searchState.cuisines,
    searchState.flavors,
    searchState.difficulties,
    searchState.cookingMethods,
    searchState.dietaryRestrictions
  ]);
  
  // 使用异步资源控制器获取搜索结果
  const searchResource = useAsyncResourceController<SearchResult>({
    fetcher: async () => {
      try {
        const result = await fetchRecipes({
          filters: currentFilters,
          sort: { field: 'name', direction: 'asc' },
          pagination: { page: searchState.page, limit: searchState.limit }
        });
        return { 
          recipes: result.recipes || [], 
          total: result.total || 0 
        };
      } catch (error) {
        console.error('获取菜谱列表失败', error);
        // 添加到全局错误状态
        addError('search', RecipeErrorHelper.createNetworkError('获取菜谱列表失败'));
        throw error;
      }
    },
    debounceTime
  });

  // 使用异步资源控制器获取单个菜谱详情
  const recipeDetailResource = useAsyncResourceController<Recipe>({
    fetcher: async () => {
      if (!recipeId) throw createError(ErrorKey.RECIPE_ID_REQUIRED);
      try {
        const result = await fetchRecipeById(recipeId);
        if (!result || !result.recipe) {
          const error = createError(ErrorKey.RECIPE_FETCH_FAILED);
          addError(recipeId, RecipeErrorHelper.createNotFoundError(recipeId));
          throw error;
        }
        // 成功加载菜谱，清除之前可能存在的错误
        clearError(recipeId);
        return result.recipe;
      } catch (error) {
        // 添加到全局错误状态
        addError(recipeId, RecipeErrorHelper.createLoadError(recipeId, error));
        throw error;
      }
    },
    autoFetch: !!recipeId
  });

  // 同步状态到URL参数
  const syncStateToUrl = useCallback(() => {
    if (!syncWithUrl || !router) return;
    
    const newParams = new URLSearchParams();
    
    // 只添加有值的参数
    if (searchState.searchQuery) newParams.set('q', searchState.searchQuery);
    searchState.requiredIngredients.forEach(ing => newParams.append('required', ing));
    searchState.optionalIngredients.forEach(ing => newParams.append('optional', ing));
    searchState.cuisines.forEach(cuisine => newParams.append('cuisine', cuisine));
    searchState.flavors.forEach(flavor => newParams.append('flavors', flavor));
    searchState.difficulties.forEach(difficulty => newParams.append('difficulty', difficulty));
    searchState.cookingMethods.forEach(method => newParams.append('method', method));
    searchState.dietaryRestrictions.forEach(diet => newParams.append('diet', diet));
    
    // 分页参数
    if (searchState.page !== defaultPage) newParams.set('page', searchState.page.toString());
    if (searchState.limit !== defaultLimit) newParams.set('limit', searchState.limit.toString());
    
    // 更新URL，不刷新页面
    const queryString = newParams.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.replace(newUrl);
  }, [searchState, router, syncWithUrl, defaultPage, defaultLimit]);

  // 搜索成功后同步URL
  useEffect(() => {
    if (searchResource.isInitialized && !searchResource.isLoading) {
      syncStateToUrl();
    }
  }, [searchResource.isInitialized, searchResource.isLoading, syncStateToUrl]);

  // 处理菜谱数据，使其便于在UI中展示
  const processRecipeData = useCallback((recipe: Recipe): ProcessedRecipeData => {
    if (!recipe) return {
      processedIngredients: [],
      processedSeasonings: [],
      preparationSteps: [],
      cookingSteps: [],
      combinedSteps: [],
      showCombinedSteps: false,
      cookingTips: []
    };
    
    try {
      // 食材列表处理
      const processedIngredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map(processIngredientItem)
        : [];
        
      // 调料列表处理
      const processedSeasonings = Array.isArray(recipe.seasonings)
        ? recipe.seasonings.map(processIngredientItem)
        : [];
        
      // 准备步骤
      const preparationSteps = Array.isArray(recipe.preparationSteps)
        ? recipe.preparationSteps.map(processStringItem)
        : [];
        
      // 烹饪步骤
      const cookingSteps = Array.isArray(recipe.cookingSteps)
        ? recipe.cookingSteps.map(processStringItem)
        : [];
        
      // 合并步骤 - 使用steps作为组合步骤
      const combinedSteps = Array.isArray(recipe.steps)
        ? recipe.steps.map(processStringItem)
        : [];
      
      // 当有详细步骤时显示详细步骤，否则显示组合步骤
      const showCombinedSteps = !(preparationSteps.length > 0 || cookingSteps.length > 0);
      
      // 烹饪技巧
      const cookingTips = Array.isArray(recipe.cookingTips)
        ? recipe.cookingTips.map(processStringItem)
        : [];
      
      return {
        processedIngredients,
        processedSeasonings,
        preparationSteps,
        cookingSteps,
        combinedSteps,
        showCombinedSteps,
        cookingTips
      };
    } catch (e) {
      console.error('处理菜谱数据出错:', e);
      return {
        processedIngredients: [],
        processedSeasonings: [],
        preparationSteps: [],
        cookingSteps: [],
        combinedSteps: [],
        showCombinedSteps: false,
        cookingTips: []
      };
    }
  }, []);
  
  // 加工后的菜谱详情数据
  const processedRecipeData = useMemo(() => {
    if (!recipeDetailResource.data) return null;
    return processRecipeData(recipeDetailResource.data);
  }, [recipeDetailResource.data, processRecipeData]);

  // 更新搜索查询
  const setSearchQuery = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev,
      searchQuery: query,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新必需食材
  const setRequiredIngredients = useCallback((ingredients: string[]) => {
    setSearchState(prev => ({
      ...prev,
      requiredIngredients: ingredients,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新可选食材
  const setOptionalIngredients = useCallback((ingredients: string[]) => {
    setSearchState(prev => ({
      ...prev,
      optionalIngredients: ingredients,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新菜系
  const setCuisines = useCallback((cuisines: string[]) => {
    setSearchState(prev => ({
      ...prev,
      cuisines,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新口味
  const setFlavors = useCallback((flavors: string[]) => {
    setSearchState(prev => ({
      ...prev,
      flavors,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新难度
  const setDifficulties = useCallback((difficulties: string[]) => {
    setSearchState(prev => ({
      ...prev,
      difficulties,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新烹饪方法
  const setCookingMethods = useCallback((methods: string[]) => {
    setSearchState(prev => ({
      ...prev,
      cookingMethods: methods,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新饮食限制
  const setDietaryRestrictions = useCallback((restrictions: string[]) => {
    setSearchState(prev => ({
      ...prev,
      dietaryRestrictions: restrictions,
      page: 1 // 重置页码
    }));
  }, []);

  // 更新页码
  const setPage = useCallback((page: number) => {
    setSearchState(prev => ({
      ...prev,
      page
    }));
  }, []);

  // 更新每页数量
  const setLimit = useCallback((limit: number) => {
    setSearchState(prev => ({
      ...prev,
      limit,
      page: 1 // 重置页码
    }));
  }, []);

  // 清空所有筛选条件
  const clearFilters = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      searchQuery: '',
      requiredIngredients: [],
      optionalIngredients: [],
      cuisines: [],
      flavors: [],
      difficulties: [],
      cookingMethods: [],
      dietaryRestrictions: [],
      page: 1 // 重置页码
    }));
  }, []);

  // 初始化单个菜谱详情
  const fetchRecipeDetail = useCallback((id: string) => {
    if (id) {
      recipeDetailResource.fetch();
    }
  }, [recipeDetailResource]);

  // 当recipeId变化时，获取菜谱详情
  useEffect(() => {
    if (recipeId) {
      fetchRecipeDetail(recipeId);
    }
  }, [recipeId, fetchRecipeDetail]);

  return {
    // 搜索状态
    ...searchState,
    
    // 数据和UI状态
    isLoading: searchResource.loading || recipeDetailResource.loading,
    recipes: searchResource.data?.recipes || [],
    totalRecipes: searchResource.data?.total || 0,
    error: searchResource.error || recipeDetailResource.error,
    
    // 菜谱详情
    recipe: recipeDetailResource.data,
    processedRecipeData,
    processRecipeData,
    
    // 搜索动作
    setSearchQuery,
    setRequiredIngredients,
    setOptionalIngredients,
    setCuisines,
    setFlavors,
    setDifficulties,
    setCookingMethods,
    setDietaryRestrictions,
    
    // 分页动作
    setPage,
    setLimit,
    
    // 其他动作
    clearFilters,
    
    // 手动触发搜索
    executeSearch: searchResource.fetch,
    
    // 获取菜谱详情
    fetchRecipeDetail
  };
} 