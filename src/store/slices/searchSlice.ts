/**
 * 搜索状态管理
 * 集成过滤、搜索和食材管理功能
 */
import { FilterType, IngredientTag } from '../../types/search';
import { Recipe } from '../../types/recipe';
import { eventBus } from '../../core/eventBus';
import { createSlice } from '../sliceFactory';
import { isSeasoningTag } from '../../utils/recipe/searchService';

// 定义统一的搜索状态接口
export interface SearchState {
  // 搜索相关
  searchQuery: string;
  searchResults: Recipe[];
  searchHistory: string[];
  isLoading: boolean;
  error: string | null;
  lastSearchTime: number | null;
  
  // 过滤相关
  requiredIngredients: IngredientTag[];
  optionalIngredients: IngredientTag[];
  cuisines: string[];
  flavors: string[];
  difficulties: string[];
  cookingMethods: string[];
  dietaryRestrictions: string[];
  appliedFilters: Record<string, boolean>;
  tagLogic: 'AND' | 'OR';
}

// 默认初始状态
const initialState: SearchState = {
  // 搜索相关
  searchQuery: '',
  searchResults: [],
  searchHistory: [],
  isLoading: false,
  error: null,
  lastSearchTime: null,
  
  // 过滤相关
  requiredIngredients: [],
  optionalIngredients: [],
  cuisines: [],
  flavors: [],
  difficulties: [],
  cookingMethods: [],
  dietaryRestrictions: [],
  appliedFilters: {},
  tagLogic: 'AND',
};

// 创建统一的搜索状态切片
const searchSlice = createSlice({
  name: 'search',
  initialState,
  persist: {
    name: 'what_to_eat_search',
    partialize: (state: SearchState) => ({
      searchHistory: state.searchHistory,
      requiredIngredients: state.requiredIngredients,
      optionalIngredients: state.optionalIngredients,
      cuisines: state.cuisines,
      flavors: state.flavors,
      difficulties: state.difficulties,
      cookingMethods: state.cookingMethods,
      dietaryRestrictions: state.dietaryRestrictions,
      tagLogic: state.tagLogic,
    })
  },
  actions: {
    // 设置搜索关键词
    setSearchQuery: (state: SearchState, query: string) => {
      state.searchQuery = query;
      eventBus.emit('search:query', { query });
      return state;
    },
    
    // 设置搜索结果
    setSearchResults: (state: SearchState, results: Recipe[]) => {
      state.searchResults = results;
      state.lastSearchTime = Date.now();
      eventBus.emit('search:results', { results });
      return state;
    },
    
    // 添加到搜索历史
    addToSearchHistory: (state: SearchState, query: string) => {
      if (!query.trim()) return state;
      
      const filteredHistory = state.searchHistory.filter(item => item !== query);
      state.searchHistory = [query, ...filteredHistory].slice(0, 10);
      return state;
    },
    
    // 清空搜索历史
    clearSearchHistory: (state: SearchState) => {
      state.searchHistory = [];
      eventBus.emit('search:clearHistory', undefined);
      return state;
    },
    
    // 设置加载状态
    setLoading: (state: SearchState, isLoading: boolean) => {
      state.isLoading = isLoading;
      return state;
    },
    
    // 设置错误信息
    setError: (state: SearchState, error: string | null) => {
      state.error = error;
      return state;
    },
    
    // 添加必选食材
    addRequiredIngredient: (state: SearchState, params: { tag: string, type: FilterType }) => {
      const { tag, type } = params;
      if (!tag.trim()) return state;
      
      // 检查是否已存在相同tag
      const existingIngredient = state.requiredIngredients.find(
        (item) => item.tag.toLowerCase() === tag.toLowerCase()
      );
      
      if (!existingIngredient) {
        state.requiredIngredients.push({
          id: `${Date.now()}-${tag}`,
          tag,
          type
        });
      }
      return state;
    },
    
    // 移除必选食材
    removeRequiredIngredient: (state: SearchState, id: string) => {
      state.requiredIngredients = state.requiredIngredients.filter(
        (item) => item.id !== id
      );
      return state;
    },
    
    // 添加可选食材
    addOptionalIngredient: (state: SearchState, params: { tag: string, type: FilterType }) => {
      const { tag, type } = params;
      if (!tag.trim()) return state;
      
      // 检查必选中是否存在
      const existsInRequired = state.requiredIngredients.some(
        (ingredient) => ingredient.tag.toLowerCase() === tag.toLowerCase()
      );
      
      // 检查可选中是否存在
      const existsInOptional = state.optionalIngredients.some(
        (ingredient) => ingredient.tag.toLowerCase() === tag.toLowerCase()
      );
      
      if (!existsInRequired && !existsInOptional) {
        state.optionalIngredients.push({
          id: `${Date.now()}-${tag}`,
          tag,
          type
        });
      }
      return state;
    },
    
    // 移除可选食材
    removeOptionalIngredient: (state: SearchState, id: string) => {
      state.optionalIngredients = state.optionalIngredients.filter(
        (item) => item.id !== id
      );
      return state;
    },
    
    // 切换过滤器
    toggleFilter: (state: SearchState, params: { type: FilterType | string, value: string }) => {
      const { type, value } = params;
      const filterKey = `${type}:${value}`;
      const isActive = state.appliedFilters[filterKey];
      
      // 更新过滤状态
      state.appliedFilters[filterKey] = !isActive;
      
      // 如果是已知的过滤类型，更新相应数组
      if (Object.values(FilterType).includes(type as FilterType)) {
        const arrayName = type.toString();
        
        if (arrayName in state) {
          const arrayKey = arrayName as keyof SearchState;
          const currentArray = state[arrayKey] as string[];
          
          if (Array.isArray(currentArray)) {
            const valueIndex = currentArray.indexOf(value);
            
            if (!isActive && valueIndex === -1) {
              (currentArray as string[]).push(value);
            } else if (isActive && valueIndex !== -1) {
              (currentArray as string[]).splice(valueIndex, 1);
            }
          }
        }
      }
      return state;
    },
    
    // 清除所有过滤器
    clearAllFilters: (state: SearchState, type?: FilterType) => {
      if (type) {
        // 只清除特定类型的过滤器
        const filterType = type.toString();
        
        // 清除appliedFilters中的相关项
        Object.keys(state.appliedFilters).forEach((key) => {
          if (key.startsWith(`${filterType}:`)) {
            delete state.appliedFilters[key];
          }
        });
        
        // 清除相应数组
        if (filterType in state) {
          const arrayKey = filterType as keyof typeof state;
          if (Array.isArray(state[arrayKey])) {
            (state[arrayKey] as any) = [];
          }
        }
      } else {
        // 清除所有过滤器
        state.requiredIngredients = [];
        state.optionalIngredients = [];
        state.cuisines = [];
        state.flavors = [];
        state.difficulties = [];
        state.cookingMethods = [];
        state.dietaryRestrictions = [];
        state.appliedFilters = {};
      }
      return state;
    },
    
    // 设置标签逻辑
    setTagLogic: (state: SearchState, logic: 'AND' | 'OR') => {
      state.tagLogic = logic;
      return state;
    },
    
    // 重置过滤器
    resetFilters: (state: SearchState) => {
      state.requiredIngredients = initialState.requiredIngredients;
      state.optionalIngredients = initialState.optionalIngredients;
      state.cuisines = initialState.cuisines;
      state.flavors = initialState.flavors;
      state.difficulties = initialState.difficulties;
      state.cookingMethods = initialState.cookingMethods;
      state.dietaryRestrictions = initialState.dietaryRestrictions;
      state.appliedFilters = initialState.appliedFilters;
      state.tagLogic = initialState.tagLogic;
      return state;
    },
    
    // 从URL参数同步状态
    syncFromUrlParams: (state: SearchState, params: URLSearchParams) => {
      // 先清空现有过滤器
      state.requiredIngredients = [];
      state.optionalIngredients = [];
      state.cuisines = [];
      state.flavors = [];
      state.difficulties = [];
      state.cookingMethods = [];
      state.dietaryRestrictions = [];
      state.appliedFilters = {};
      
      // 同步搜索查询
      const query = params.get('q');
      if (query) {
        state.searchQuery = query;
      }
      
      // 同步必选食材
      const required = params.get('required');
      if (required) {
        const ingredients = required.split(',').filter(Boolean);
        ingredients.forEach(tag => {
          // 检查是否已经存在
          const exists = state.requiredIngredients.some(
            (ingredient) => ingredient.tag.toLowerCase() === tag.toLowerCase()
          );
          
          if (!exists) {
            const isSeasoning = isSeasoningTag(tag);
            state.requiredIngredients.push({
              id: `${Date.now()}-${tag}`,
              tag,
              type: isSeasoning ? FilterType.SEASONING : FilterType.INGREDIENT
            });
          }
        });
      }
      
      // 同步可选食材
      const optional = params.get('optional');
      if (optional) {
        const ingredients = optional.split(',').filter(Boolean);
        ingredients.forEach(tag => {
          // 检查必选中是否存在
          const existsInRequired = state.requiredIngredients.some(
            (ingredient) => ingredient.tag.toLowerCase() === tag.toLowerCase()
          );
          
          // 检查可选中是否存在
          const existsInOptional = state.optionalIngredients.some(
            (ingredient) => ingredient.tag.toLowerCase() === tag.toLowerCase()
          );
          
          if (!existsInRequired && !existsInOptional) {
            const isSeasoning = isSeasoningTag(tag);
            state.optionalIngredients.push({
              id: `${Date.now()}-${tag}`,
              tag,
              type: isSeasoning ? FilterType.SEASONING : FilterType.INGREDIENT
            });
          }
        });
      }
      
      // 同步过滤条件
      const syncFilters = (paramName: string, filterType: FilterType): void => {
        // 获取所有同名参数，兼容单个值和多个值的情况
        const values = params.getAll(paramName);
        if (values && values.length > 0) {
          // 处理所有值（可能有多个同名参数，或者一个逗号分隔的参数）
          const allValues: string[] = [];
          
          values.forEach(value => {
            if (value.includes(',')) {
              // 如果值包含逗号，按逗号分割
              allValues.push(...value.split(',').filter(Boolean));
            } else {
              // 否则直接添加
              allValues.push(value);
            }
          });
          
          // 添加到对应的过滤器中
          allValues.forEach(value => {
            if (!value.trim()) return;
            
            const filterKey = `${filterType}:${value}`;
            state.appliedFilters[filterKey] = true;
            
            const arrayName = filterType.toString();
            if (arrayName in state) {
              const arrayKey = arrayName as keyof SearchState;
              const currentArray = state[arrayKey] as string[];
              
              if (Array.isArray(currentArray) && !currentArray.includes(value)) {
                (currentArray as string[]).push(value);
              }
            }
          });
        }
      };
      
      syncFilters('cuisine', FilterType.CUISINE);
      syncFilters('flavor', FilterType.FLAVOR);
      syncFilters('difficulty', FilterType.DIFFICULTY);
      syncFilters('cookingMethod', FilterType.TAG);
      syncFilters('diet', FilterType.DIETARY);
      
      // 同步标签逻辑
      const tagLogic = params.get('tagLogic');
      if (tagLogic && (tagLogic === 'AND' || tagLogic === 'OR')) {
        state.tagLogic = tagLogic;
      }
      
      return state;
    }
  },
  selectors: {
    selectSearchQuery: (state: SearchState) => state.searchQuery,
    selectSearchResults: (state: SearchState) => state.searchResults,
    selectSearchHistory: (state: SearchState) => state.searchHistory,
    selectIsLoading: (state: SearchState) => state.isLoading,
    selectError: (state: SearchState) => state.error,
    selectRequiredIngredients: (state: SearchState) => state.requiredIngredients,
    selectOptionalIngredients: (state: SearchState) => state.optionalIngredients,
    selectTagLogic: (state: SearchState) => state.tagLogic,
    selectCuisines: (state: SearchState) => state.cuisines,
    selectFlavors: (state: SearchState) => state.flavors,
    selectDifficulties: (state: SearchState) => state.difficulties,
    selectCookingMethods: (state: SearchState) => state.cookingMethods,
    selectDietaryRestrictions: (state: SearchState) => state.dietaryRestrictions,
    selectAppliedFilters: (state: SearchState) => state.appliedFilters,
    selectFilterCount: (state: SearchState) => (
      state.requiredIngredients.length +
      state.optionalIngredients.length +
      state.cuisines.length +
      state.flavors.length +
      state.difficulties.length +
      state.cookingMethods.length +
      state.dietaryRestrictions.length
    ),
    selectIsFilterActive: (state: SearchState) => (type: FilterType | string, value: string) => {
      const filterKey = `${type}:${value}`;
      return !!state.appliedFilters[filterKey];
    }
  }
});

// 导出状态和动作
export const { 
  useState: useSearchStore, 
  useStore: useSearchStoreRaw,
  actions: searchStoreActions 
} = searchSlice;

// 参数类型接口
interface ExecuteSearchParams {
  query?: string;
  cuisine?: string[];
  difficulty?: string[];
  includeIngredients?: string[];
  excludeIngredients?: string[];
  tags?: string[];
}

/**
 * 执行搜索（可用于组件外部调用）
 */
export const executeSearch = async (query?: string): Promise<Recipe[]> => {
  // 使用getState代替Hook
  const state = useSearchStoreRaw.getState();
  const searchQuery = query || state.searchQuery;
  
  // 记录搜索开始
  searchStoreActions.setLoading(true);
  
  try {
    // 构建搜索参数
    const params: ExecuteSearchParams = {
      query: searchQuery,
      cuisine: state.cuisines,
      difficulty: state.difficulties,
      includeIngredients: state.requiredIngredients.map(item => item.tag),
      tags: []
    };
    
    // API搜索实现
    const response = await fetch(`/api/recipes?q=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '搜索失败');
    }
    
    const recipes = data.data || [];
    
    // 记录搜索历史
    if (searchQuery.trim()) {
      searchStoreActions.addToSearchHistory(searchQuery);
    }
    
    // 更新搜索结果
    searchStoreActions.setSearchResults(recipes);
    
    // 返回结果
    return recipes;
  } catch (error) {
    // 记录错误
    searchStoreActions.setError(error instanceof Error ? error.message : String(error));
    return [];
  } finally {
    // 结束加载
    searchStoreActions.setLoading(false);
  }
};

export default searchSlice; 