/**
 * 数据模型转换适配器
 * 负责在API数据模型和应用领域模型之间进行转换
 * 专注于DTO (Data Transfer Objects) 与领域模型 (Domain Models) 之间的映射
 */

import { Recipe } from '../../types/recipe';
import { IngredientItem } from '../../types';

// API层原始Recipe类型
export interface ApiRecipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  cookingTime?: number;
  prepTime?: number;
  cuisine?: string | undefined;
  difficulty?: string;
  tags?: string[];
  image?: string;
}

/**
 * 将API返回的食谱对象转换为应用统一Recipe类型
 * @param apiRecipe API返回的食谱对象
 * @returns 转换后的Recipe对象
 */
export function apiRecipeToRecipe(apiRecipe: ApiRecipe): Recipe {
  return {
    id: apiRecipe.id,
    name: apiRecipe.title,
    description: apiRecipe.description || '',
    ingredients: apiRecipe.ingredients.map(i => {
      // 确保总是返回字符串或正确的IngredientItem结构
      return typeof i === 'string' 
        ? i 
        : { id: '', name: String(i), isRequired: true } as IngredientItem;
    }),
    seasonings: [], // API中没有单独的调料字段
    steps: apiRecipe.instructions || [],
    flavors: [],
    difficulty: apiRecipe.difficulty || '普通',
    cookingTime: apiRecipe.cookingTime || 0,
    prepTime: apiRecipe.prepTime,
    cookingTips: [],
    imageUrl: apiRecipe.image || '',
    cuisine: apiRecipe.cuisine,
    tags: apiRecipe.tags || [],
  };
}

/**
 * 将应用统一Recipe类型转换为API层所需格式
 * @param recipe 应用统一Recipe类型对象
 * @returns 转换后的ApiRecipe对象
 */
export function recipeToApiRecipe(recipe: Recipe): ApiRecipe {
  // 处理difficulty字段，确保符合API需要的string类型
  let difficultyValue: string = '';
  if (typeof recipe.difficulty === 'string') {
    difficultyValue = recipe.difficulty;
  } else if (Array.isArray(recipe.difficulty) && recipe.difficulty.length > 0) {
    difficultyValue = recipe.difficulty[0]; // 取数组的第一个值
  }
  
  return {
    id: recipe.id,
    title: recipe.name,
    description: recipe.description,
    ingredients: recipe.ingredients.map(i => 
      typeof i === 'string' ? i : i.name
    ).filter(Boolean) as string[],
    instructions: recipe.steps || [],
    cookingTime: typeof recipe.cookingTime === 'string' 
      ? parseInt(recipe.cookingTime, 10) || 0
      : recipe.cookingTime || 0,
    prepTime: recipe.prepTime,
    cuisine: (recipe.cuisine as any)?.toString?.() || undefined,
    difficulty: difficultyValue,
    tags: (recipe.tags || []) as string[],
    image: recipe.imageUrl,
  };
}

/**
 * 批量转换API食谱对象为应用统一Recipe类型
 * @param apiRecipes API返回的食谱对象数组
 * @returns 转换后的Recipe对象数组
 */
export function batchConvertApiRecipes(apiRecipes: ApiRecipe[]): Recipe[] {
  return apiRecipes.map(apiRecipeToRecipe);
} 