/**
 * 菜谱核心模块
 * 
 * 包含菜谱数据格式化的相关功能
 * 以及各种菜谱数据处理相关工具函数
 */

import { Recipe, Flavor, Cuisine } from '../../types/recipe';
import { safeString, safeArray } from '../common/safeData';
import { getFavoriteIds } from '../favorite';

// 导出类型
export * from '../../types/recipe';

// 导出相关模块
export * as ingredientUtils from './ingredientUtils';
export * as keywordUtils from './keywordUtils';
export * as searchService from './searchService';
export * as searchUtils from './searchUtils';

// 直接导出关键词处理工具函数（保留方便使用的函数）
export {
  normalizeKeyword,
  buildSearchQuery,
  parseSearchTags,
  addSearchTag,
  removeSearchTag,
  isLikelyIngredient,
  isLikelySeasoning,
  getIngredientCategory,
  getSeasoningCategory,
  getExcludedItemsText,
  getRecipeSuggestions
} from './keywordUtils';

/**
 * 获取菜谱名称
 */
export const getRecipeName = (recipe: Recipe): string => {
  return recipe.name || '未命名菜谱';
};

/**
 * 获取菜谱图片URL，处理默认图片回退
 */
export const getRecipeImageUrl = (recipe: Recipe): string => {
  return recipe.imageUrl || '/images/default-recipe.jpg';
};

/**
 * 获取菜谱难度描述
 * @param recipe 菜谱对象
 * @returns 格式化的难度描述
 */
export function getDifficultyLevel(recipe: Partial<Recipe> | undefined): string {
  if (!recipe) return '普通';
  
  // 首选直接使用difficulty字段
  if (recipe.difficulty) {
    if (typeof recipe.difficulty === 'string') {
      return recipe.difficulty;
    }
    if (Array.isArray(recipe.difficulty) && recipe.difficulty.length > 0) {
      return recipe.difficulty[0];
    }
  }
  
  // 备选方案：兼容性处理
  if (typeof (recipe as any).烹饪难度 === 'string') {
    return (recipe as any).烹饪难度;
  }
  
  // 默认值
  return '普通';
}

/**
 * 获取菜系类型
 * @param recipe 菜谱对象
 * @returns 格式化的菜系描述
 */
export function getCuisineType(recipe: Partial<Recipe> | undefined): string {
  if (!recipe) return '中餐';
  
  // 首选直接使用cuisine字段
  if (recipe.cuisine) {
    if (typeof recipe.cuisine === 'string') {
      return recipe.cuisine;
    }
  }
  
  // 备选方案：兼容性处理
  if (typeof (recipe as any).菜系 === 'string') {
    return (recipe as any).菜系;
  }
  
  // 默认值
  return '中餐';
}

/**
 * 格式化烹饪时间
 */
export const formatCookingTime = (time?: string | number): string => {
  if (!time) return '';
  
  // 如果是数字，直接添加分钟单位
  if (typeof time === 'number') {
    if (time < 60) {
      return `${time}分钟`;
    }
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
  
  // 如果是字符串，检查是否已包含单位
  const timeStr = String(time).trim();
  if (/^\d+$/.test(timeStr)) {
    // 纯数字字符串，添加"分钟"单位
    const timeNum = parseInt(timeStr, 10);
    if (timeNum < 60) {
      return `${timeNum}分钟`;
    }
    const hours = Math.floor(timeNum / 60);
    const minutes = timeNum % 60;
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
  
  // 如果已有单位或其他格式，直接返回
  return timeStr;
};

/**
 * 获取并格式化烹饪时间
 */
export const getCookingTime = (recipe: Recipe): string => {
  return formatCookingTime(recipe.cookingTime);
};

/**
 * 格式化匹配分数为百分比
 */
export const formatMatchScore = (score?: number): number | undefined => {
  if (score === undefined) return undefined;
  return Math.round(score < 1 ? score * 100 : score);
};

/**
 * 获取匹配分数
 */
export const getMatchScore = (recipe: Recipe, propMatchScore?: number): number | undefined => {
  const score = propMatchScore !== undefined ? propMatchScore : recipe.matchScore;
  return formatMatchScore(score);
};

/**
 * 获取匹配的食材列表
 */
export const getMatchedIngredients = (recipe: Recipe, propMatchedIngredients?: string[]): string[] => {
  return propMatchedIngredients || recipe.matchedIngredients || [];
};

/**
 * 获取食材列表
 */
export const getIngredientList = (recipe: Recipe, propIngredientList?: string[]): string[] => {
  if (propIngredientList) return propIngredientList;
  if (recipe.ingredients) {
    return Array.isArray(recipe.ingredients) 
      ? recipe.ingredients.map(i => {
          if (typeof i === 'string') return i;
          if (i && typeof i === 'object' && 'name' in i) return String(i.name);
          return '';
        }).filter(Boolean) // 过滤掉空字符串
      : [];
  }
  return [];
};

/**
 * 获取菜谱属性标签
 */
export const getRecipeAttributes = (recipe: Recipe): string[] => {
  if (recipe.dietaryRestrictions && Array.isArray(recipe.dietaryRestrictions)) {
    return recipe.dietaryRestrictions as string[];
  }
  return [];
};

/**
 * 获取用户收藏的菜谱
 * @param allRecipes 所有菜谱列表
 * @returns 收藏的菜谱列表
 */
export function getFavoriteRecipes(allRecipes: Recipe[]): Recipe[] {
  try {
    if (typeof window === 'undefined') {
      return [];
    }
    
    // 使用统一的收藏工具函数获取收藏ID
    const favoriteIds = getFavoriteIds();
    
    if (!favoriteIds.length) {
      return [];
    }
    
    // 筛选出收藏的菜谱
    return allRecipes.filter(recipe => favoriteIds.includes(recipe.id));
  } catch (error) {
    console.error('获取收藏菜谱出错:', error);
    return [];
  }
}

/**
 * 规范化食材名称
 * 移除单位、数字和括号中的内容
 * @param ingredient 原始食材名称
 * @returns 规范化后的食材名称
 */
export function normalizeIngredient(ingredient: string): string {
  if (!ingredient) return '';
  
  // 如果是对象，直接获取名称
  if (typeof ingredient === 'object' && ingredient !== null && 'name' in ingredient) {
    return normalizeIngredient((ingredient as any).name || '');
  }
  
  if (typeof ingredient !== 'string') {
    return '';
  }
  
  // 移除数字和常见计量单位
  return ingredient
    .replace(/\d+(\.\d+)?/g, '') // 移除数字
    .replace(/克|千克|g|kg|毫升|ml|升|l|个|只|条|块|片|勺|匙|杯|碗|斤|两|盒|瓶|罐|包|斤|份|把|颗|粒|根|段|头/g, '')
    .replace(/\(.*?\)/g, '') // 移除括号内容
    .replace(/（.*?）/g, '') // 移除中文括号内容
    .replace(/\[.*?\]/g, '') // 移除方括号内容
    .replace(/【.*?】/g, '') // 移除中文方括号内容
    .replace(/[,.，。、；;]/g, '') // 移除标点符号
    .replace(/^\s+|\s+$/g, ''); // 移除首尾空格
}

/**
 * 根据烹饪时间分钟数获取时间分类描述
 * @param cookingTime 烹饪时间（分钟）
 * @returns 时间分类描述
 */
export function getCookingSpeed(cookingTime: number): string {
  if (cookingTime <= 15) {
    return '快速(15分钟内)';
  } else if (cookingTime <= 30) {
    return '中等(15-30分钟)';
  } else {
    return '慢速(30分钟以上)';
  }
}

/**
 * 根据菜谱名称推断菜系
 * @param recipeName 菜谱名称
 * @returns 推断的菜系标签数组
 */
export function getCuisineByName(recipeName: string): string[] {
  const cuisineTags: string[] = [];

  if (recipeName.includes('宫保') || recipeName.includes('麻婆')) {
    cuisineTags.push('中式');
    cuisineTags.push('川式');
  } else if (recipeName.includes('土豆炖牛肉')) {
    cuisineTags.push('西式');
    cuisineTags.push('家常菜');
  }
  
  // 这里可以继续添加更多判断规则
  
  return cuisineTags;
}

/**
 * 根据菜谱信息构建标签
 * @param recipe 包含菜谱基本信息的对象
 * @returns 标签数组
 */
export function buildRecipeTags(recipe: {
  ingredients: string[];
  flavors: string[];
  difficulty: string;
  cookingTime: number;
  name: string;
}): string[] {
  const tags = [
    ...recipe.ingredients.slice(0, 3),
    ...recipe.flavors,
    recipe.difficulty,
    getCookingSpeed(recipe.cookingTime)
  ];
  
  // 根据菜名添加菜系标签
  const cuisineTags = getCuisineByName(recipe.name);
  
  return [...tags, ...cuisineTags];
}

/**
 * 获取所有菜谱ID，用于站点地图生成
 * @param recipes 菜谱数组
 * @returns 菜谱ID数组
 */
export function getAllRecipeIds(recipes: Recipe[]): string[] {
  if (!Array.isArray(recipes)) return [];
  return recipes.map(recipe => recipe.id);
} 