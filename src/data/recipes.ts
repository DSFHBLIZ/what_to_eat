import recipesData from './sample-recipes.json';
import { Recipe, Flavor } from '../types/recipe';
import { buildRecipeTags } from '../utils/recipe';

// 定义原始菜谱数据类型
interface RawRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  seasonings: string[];
  flavors: string[];
  difficulty: string;
  cookingTime: number;
  steps: string[];
  cookingTips: string[];
  imageUrl: string;
}

// 处理空数据情况并添加错误处理
let processedRecipes: Recipe[] = [];

try {
  // 只有在有数据时才进行处理
  if (recipesData && Array.isArray(recipesData) && recipesData.length > 0) {
    processedRecipes = (recipesData as RawRecipe[]).map(recipe => {
      // 使用工具函数构建标签
      const tags = buildRecipeTags(recipe);
      
      // 使用类型断言解决flavors类型问题
      return {
        ...recipe,
        flavors: recipe.flavors as unknown as Flavor[],
        tags
      } as Recipe;
    });
  }
} catch (error) {
  console.error('处理菜谱数据时出错:', error);
}

export default processedRecipes; 