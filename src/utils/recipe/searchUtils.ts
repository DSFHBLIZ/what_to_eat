'use client';

// 模拟搜索建议API
const foodSuggestions = [
  '火锅', '烧烤', '麻辣香锅', '寿司', '意大利面', 
  '披萨', '汉堡', '炸鸡', '烤鱼', '麻辣烫',
  '冒菜', '煲仔饭', '生煎', '小龙虾', '川菜',
  '粤菜', '湘菜', '东北菜', '西北菜', '徽菜'
];

/**
 * 获取搜索关键词建议
 * @param keyword 搜索关键词
 * @returns 匹配的建议列表
 */
export async function getKeywordSuggestions(keyword: string): Promise<string[]> {
  // 模拟API延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = keyword 
        ? foodSuggestions.filter(item => 
            item.toLowerCase().includes(keyword.toLowerCase()))
        : [];
      resolve(filtered);
    }, 300);
  });
}

/**
 * 搜索食物
 * @param keyword 搜索关键词  
 */
export async function searchFood(keyword: string) {
  // 实际应用中，这里会调用真实的API
  console.log(`搜索食物: ${keyword}`);
  // 返回模拟数据
  return [];
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 搜索工具函数
 * 提供处理搜索结果的辅助函数
 */

import { SearchResultItem, SearchResults, SearchResultsPage, getEmptySearchResults, getEmptySearchResultsPage } from '../../types/search';

// 自定义的辅助函数，代替缺少的导入
/**
 * 获取食材名称的辅助函数
 */
function getIngredientName(ingredient: any): string {
  if (typeof ingredient === 'string') {
    return ingredient;
  }
  if (ingredient && typeof ingredient === 'object' && 'name' in ingredient) {
    return ingredient.name || '';
  }
  return '';
}

/**
 * 检查食材是否包含关键词的辅助函数
 */
function ingredientContainsKeyword(ingredient: any, keyword: string): boolean {
  const name = getIngredientName(ingredient).toLowerCase();
  return name.includes(keyword.toLowerCase());
}

/**
 * 确保返回有效的搜索结果对象
 * @param results 搜索结果对象或空值
 * @returns 有效的搜索结果对象
 */
export function safeSearchResults(results?: SearchResults | null): SearchResults {
  if (!results) {
    return getEmptySearchResults();
  }
  return results;
}

/**
 * 安全获取搜索结果页，防止出现未定义错误
 * @param page 可能为空或无效的搜索结果页
 * @returns 确保类型安全的搜索结果页对象
 */
export function safeSearchResultsPage(page: any): SearchResultsPage {
  if (!page || typeof page !== 'object') {
    return getEmptySearchResultsPage();
  }
  
  // 如果是普通数组，转换为SearchResultsPage
  if (Array.isArray(page)) {
    return {
      items: page as SearchResultItem[],
      totalCount: page.length,
      pageSize: page.length,
      currentPage: 1
    };
  }
  
  // 确保items是有效的SearchResultItem数组
  const items = Array.isArray(page.items) ? page.items : [];
  
  return {
    items,
    totalCount: typeof page.totalCount === 'number' ? page.totalCount : items.length,
    pageSize: typeof page.pageSize === 'number' ? page.pageSize : 10,
    currentPage: typeof page.currentPage === 'number' ? page.currentPage : 1,
    query: typeof page.query === 'string' ? page.query : undefined,
    filters: page.filters && typeof page.filters === 'object' ? page.filters : undefined,
    sortBy: typeof page.sortBy === 'string' ? page.sortBy : undefined,
    timeTaken: typeof page.timeTaken === 'number' ? page.timeTaken : undefined
  };
}

/**
 * 格式化相关性得分，确保显示为百分比
 * @param score 原始相关性得分(0-1之间)
 * @returns 格式化的百分比字符串
 */
export function formatRelevanceScore(score?: number): string {
  if (typeof score !== 'number' || isNaN(score)) {
    return '0%';
  }
  
  // 确保分数在0-1之间
  const normalizedScore = Math.max(0, Math.min(1, score));
  // 转换为百分比并四舍五入到整数
  return `${Math.round(normalizedScore * 100)}%`;
}

/**
 * 根据相关性分数对搜索结果进行排序
 * @param results 搜索结果数组
 * @returns 排序后的搜索结果数组
 */
export function sortByRelevance(results: SearchResults): SearchResults {
  if (!results || !Array.isArray(results)) return getEmptySearchResults();
  
  return [...results].sort((a, b) => {
    const scoreA = a.matchScore ?? a.relevanceScore ?? 0;
    const scoreB = b.matchScore ?? b.relevanceScore ?? 0;
    return scoreB - scoreA;
  });
}

/**
 * 高亮搜索结果中匹配的关键词
 * @param text 需要高亮的文本
 * @param keywords 需要高亮的关键词数组
 * @returns 包含高亮标记的HTML字符串
 */
export function highlightKeywords(text: string, keywords: string[]): string {
  if (!text || !keywords.length) return text;
  
  let result = text;
  
  keywords.forEach(keyword => {
    if (!keyword) return;
    
    const regex = new RegExp(keyword, 'gi');
    result = result.replace(regex, match => `<mark class="bg-yellow-200 text-yellow-800 px-1 rounded">${match}</mark>`);
  });
  
  return result;
}

/**
 * 从搜索关键词和食材列表中提取匹配的食材
 * 返回匹配的食材对象数组
 * @param ingredients 食材数组
 * @param searchTerm 搜索关键词
 * @returns 匹配的食材数组
 */
export function extractMatchedIngredients(ingredients: any[], searchTerm: string): any[] {
  if (!Array.isArray(ingredients) || !searchTerm || typeof searchTerm !== 'string') {
    return [];
  }
  
  const term = searchTerm.toLowerCase().trim();
  if (!term) {
    return [];
  }
  
  return ingredients.filter(ing => ingredientContainsKeyword(ing, term));
}

/**
 * 检查搜索结果项是否包含特定食材
 * @param item 搜索结果项
 * @param ingredientName 食材名称
 * @returns 是否包含该食材
 */
export function itemContainsIngredient(item: SearchResultItem, ingredientName: string): boolean {
  if (!item || !ingredientName || typeof ingredientName !== 'string') {
    return false;
  }
  
  const name = ingredientName.toLowerCase().trim();
  if (!name || !Array.isArray(item.ingredients)) {
    return false;
  }
  
  return item.ingredients.some(ing => {
    const ingName = getIngredientName(ing).toLowerCase();
    return ingName.includes(name) || name.includes(ingName);
  });
}

/**
 * 创建带有过滤条件的搜索参数对象
 * @param params 基础参数
 * @returns 格式化的搜索参数
 */
export function createSearchParams(params: {
  query?: string;
  requiredIngredients?: string[];
  optionalIngredients?: string[];
  cuisines?: string[];
  flavors?: string[];
  difficulties?: string[];
  cookingMethods?: string[];
  dietaryRestrictions?: string[];
  tagLogic?: 'AND' | 'OR';
}) {
  return {
    query: params.query || '',
    requiredIngredients: Array.isArray(params.requiredIngredients) ? params.requiredIngredients : [],
    optionalIngredients: Array.isArray(params.optionalIngredients) ? params.optionalIngredients : [],
    cuisines: Array.isArray(params.cuisines) ? params.cuisines : [],
    flavors: Array.isArray(params.flavors) ? params.flavors : [],
    difficulties: Array.isArray(params.difficulties) ? params.difficulties : [],
    cookingMethods: Array.isArray(params.cookingMethods) ? params.cookingMethods : [],
    dietaryRestrictions: Array.isArray(params.dietaryRestrictions) ? params.dietaryRestrictions : [],
    tagLogic: params.tagLogic || 'OR'
  };
}

/**
 * 根据条件筛选菜谱，客户端实现版本
 * 适用于测试和客户端筛选场景
 * 
 * @param recipes 菜谱列表
 * @param filters 筛选条件
 * @returns 筛选后的菜谱列表
 */
export function filterRecipes(
  recipes: any[],
  filters: {
    query?: string;
    ingredients?: string[];
    cuisines?: string[];
    flavors?: string[];
    cookingMethods?: string[];
    difficulties?: string[];
    dietaryRestrictions?: string[];
  }
): any[] {
  const { 
    query, 
    ingredients, 
    cuisines = [], 
    flavors = [], 
    cookingMethods = [],
    difficulties = [],
    dietaryRestrictions = []
  } = filters;
  
  return recipes.filter(recipe => {
    // 关键词筛选
    if (query) {
      const normalizedQuery = query.toLowerCase();
      const nameMatches = recipe.name.toLowerCase().includes(normalizedQuery);
      
      // 仅匹配名称中包含关键词的菜谱，不再检查描述和食材
      if (!nameMatches) {
        return false;
      }
    }
    
    // 食材筛选
    if (ingredients && ingredients.length > 0) {
      const recipeIngredients = recipe.ingredients.map((ing: any) => 
        typeof ing === 'string' ? ing.toLowerCase() : 
          (ing && ing.name ? ing.name.toLowerCase() : '')
      );
      
      const hasAllIngredients = ingredients.every(ingredient => 
        recipeIngredients.some((ri: string) => ri.includes(ingredient.toLowerCase()))
      );
      
      if (!hasAllIngredients) {
        return false;
      }
    }
    
    // 菜系筛选
    if (cuisines.length > 0 && (!recipe.cuisine || !cuisines.includes(recipe.cuisine))) {
      return false;
    }
    
    // 口味筛选
    if (flavors.length > 0) {
      if (!recipe.flavors) return false;
      
      const hasMatchingFlavor = flavors.some(f => 
        recipe.flavors.includes(f)
      );
      
      if (!hasMatchingFlavor) {
        return false;
      }
    }
    
    // 烹饪方式筛选
    if (cookingMethods.length > 0) {
      if (!recipe.cookingMethod) {
        return false;
      }
      
      const methodArray = Array.isArray(recipe.cookingMethod) ? recipe.cookingMethod : [recipe.cookingMethod];
      const hasMatchingMethod = cookingMethods.some(method => methodArray.includes(method));
      
      if (!hasMatchingMethod) {
        return false;
      }
    }
    
    // 难度筛选
    if (difficulties.length > 0) {
      if (!recipe.difficulty) return false;
      
      if (Array.isArray(recipe.difficulty)) {
        const hasMatchingDifficulty = difficulties.some(d => 
          recipe.difficulty.includes(d)
        );
        if (!hasMatchingDifficulty) {
          return false;
        }
      } else if (!difficulties.includes(recipe.difficulty)) {
        return false;
      }
    }
    
    // 饮食限制筛选
    if (dietaryRestrictions.length > 0) {
      if (!recipe.dietaryRestrictions) return false;
      
      const restrictionsArray = Array.isArray(recipe.dietaryRestrictions) ? 
        recipe.dietaryRestrictions : [recipe.dietaryRestrictions];
      
      const hasMatchingRestriction = dietaryRestrictions.some(r => restrictionsArray.includes(r));
      
      if (!hasMatchingRestriction) {
        return false;
      }
    }
    
    return true;
  });
} 