import { Recipe } from '../../types/recipe';
import { Flavor, Cuisine, DietaryRestriction } from '../../types/recipe';
import { safeJsonParse as safeJsonParseFromUtils } from '../common/safeTypeConversions';
import { fetchRecipes } from './dataService';

// 定义原始菜谱数据类型
interface DataRecipe {
  id: string;
  name: string;
  description?: string;
  ingredients?: string[];
  seasonings?: string[];
  flavors?: string[];
  difficulty?: string;
  cookingTime?: number;
  steps?: string[];
  cookingTips?: string[];
  imageUrl?: string;
  cuisine?: string;
  cookingMethod?: string[];
  dietaryRestrictions?: string[];
  tags?: string[];
}

/**
 * 将data/recipes中的Recipe类型适配到types/recipe中的Recipe类型
 */
export function adaptRecipeType(dataRecipe: DataRecipe | any): Recipe {
  // 确保口味字段符合Flavor类型
  const adaptedFlavors: Flavor[] = Array.isArray(dataRecipe.flavors) 
    ? dataRecipe.flavors.filter((f: any) => 
        typeof f === 'string' && 
        ['酸', '咸', '苦', '辣', '鲜', '甜', '香', '麻', '清淡', '咸鲜', '酸甜', '麻辣', '鲜香', '甜酸'].includes(f)
      ) as Flavor[]
    : [];
  
  // 确保菜系字段符合Cuisine类型
  let adaptedCuisine: Cuisine | undefined = undefined;
  if (dataRecipe.cuisine && typeof dataRecipe.cuisine === 'string') {
    // 尝试将字符串转换为有效的Cuisine类型
    const cuisineMapping: Record<string, Cuisine> = {
      '川菜': '川菜',
      '粤菜': '粤菜',
      '苏菜': '苏菜',
      '西餐': '西餐',
      '日料': '日料',
      '韩餐': '韩餐',
      // 默认映射到"其他"
      '其他': '其他'
    };
    adaptedCuisine = cuisineMapping[dataRecipe.cuisine] || '其他';
  }
  
  // 确保烹饪方法字段符合CookingMethod[]类型
  const adaptedCookingMethod: string[] = Array.isArray(dataRecipe.cookingMethod)
    ? dataRecipe.cookingMethod.filter((m: any) => 
        typeof m === 'string' && 
        ['炒', '煮', '蒸', '煎', '炖', '烤', '焖', '拌', '炸', '焯', '烧'].includes(m)
      ) as string[]
    : [];
  
  // 确保饮食限制字段符合DietaryRestriction[]类型
  const adaptedDietaryRestrictions: DietaryRestriction[] = Array.isArray(dataRecipe.dietaryRestrictions)
    ? dataRecipe.dietaryRestrictions.filter((d: any) => 
        typeof d === 'string' && 
        ['纯素', '清真', '无麸质'].includes(d)
      ) as DietaryRestriction[]
    : [];
  
  // 返回适配后的Recipe对象
  return {
    id: dataRecipe.id,
    name: dataRecipe.name,
    description: dataRecipe.description || '',
    ingredients: Array.isArray(dataRecipe.ingredients) ? dataRecipe.ingredients : [],
    seasonings: Array.isArray(dataRecipe.seasonings) ? dataRecipe.seasonings : [],
    flavors: adaptedFlavors,
    difficulty: dataRecipe.difficulty as any || '中等',
    cookingTime: typeof dataRecipe.cookingTime === 'number' ? dataRecipe.cookingTime : 30,
    steps: Array.isArray(dataRecipe.steps) ? dataRecipe.steps : [],
    preparationSteps: Array.isArray(dataRecipe.preparationSteps) ? dataRecipe.preparationSteps : undefined,
    cookingSteps: Array.isArray(dataRecipe.cookingSteps) ? dataRecipe.cookingSteps : undefined,
    cookingTips: Array.isArray(dataRecipe.cookingTips) ? dataRecipe.cookingTips : [],
    imageUrl: dataRecipe.imageUrl || '',
    cuisine: adaptedCuisine,
    cookingMethod: adaptedCookingMethod,
    dietaryRestrictions: adaptedDietaryRestrictions,
    tags: Array.isArray(dataRecipe.tags) ? dataRecipe.tags : [],
  };
}

/**
 * 从数据服务加载菜谱数据
 */
export async function loadRecipes(): Promise<Recipe[]> {
  try {
    console.log('开始从数据服务加载菜谱数据...');
    console.log('环境变量检查:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置');
    
    // 如果环境变量未配置，直接抛出错误
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('数据库环境变量未配置，无法连接到Supabase');
    }
    
    const { recipes, error } = await fetchRecipes();
    
    // 如果获取数据出错，直接抛出错误
    if (error) {
      throw new Error(`获取数据出错: ${error}`);
    }
    
    // 如果数据为空或长度为0，直接抛出错误
    if (!recipes || recipes.length === 0) {
      throw new Error('从数据服务加载的数据为空');
    }
    
    console.log(`数据获取成功，共加载 ${recipes.length} 个菜谱`);
    // 使用类型适配器转换数据类型
    return recipes.map(adaptRecipeType);
  } catch (error) {
    console.error('无法加载菜谱数据:', error);
    // 直接抛出错误，不再使用示例数据
    throw error;
  }
}

/**
 * 检查是否在客户端环境
 */
const isClient = typeof window !== 'undefined';

/**
 * 加载菜谱数据并缓存到本地存储
 * 使用本地存储缓存，减少重复加载
 */
export async function loadAndCacheRecipes(): Promise<Recipe[]> {
  console.log('检查本地缓存...', isClient ? '客户端环境' : '服务器环境');
  
  try {
    // 仅在客户端运行时使用localStorage
    if (isClient) {
      // 检查缓存
      try {
        const cachedData = localStorage.getItem('cachedRecipes');
        const cacheTime = localStorage.getItem('recipesCacheTime');
        
        // 检查缓存是否存在且未过期（24小时内）
        if (cachedData && cacheTime) {
          const cacheTimeValue = parseInt(cacheTime);
          
          // 确保cacheTime是有效的数字
          if (!isNaN(cacheTimeValue)) {
            const cacheAge = Date.now() - cacheTimeValue;
            console.log(`缓存年龄: ${Math.round(cacheAge / (60 * 60 * 1000))} 小时`);
            
            if (cacheAge < 24 * 60 * 60 * 1000) { // 24小时缓存
              console.log('使用本地缓存数据');
              try {
                const parsedData = safeJsonParseFromUtils(cachedData, [], 'jsonLoader') as Recipe[];
                if (parsedData && parsedData.length > 0) {
                  return parsedData;
                } else {
                  console.log('缓存数据为空，将重新加载数据');
                  throw new Error('缓存数据为空');
                }
              } catch (e) {
                console.error('缓存数据解析错误', e instanceof Error ? e.message : String(e));
                throw e;
              }
            }
            console.log('缓存已过期，需要重新加载');
          } else {
            console.log('缓存时间戳无效，需要重新加载');
          }
        } else {
          console.log('未找到缓存，需要加载远程数据');
        }
      } catch (storageError) {
        // 处理localStorage访问错误（如隐私模式下的配额限制）
        console.warn('无法访问本地存储:', storageError instanceof Error ? storageError.message : String(storageError));
      }
    } else {
      console.log('服务器端渲染，无法使用本地缓存');
    }
    
    // 如果缓存不存在或已过期，从Supabase加载新数据
    const recipes = await loadRecipes();
    
    // 如果仍然没有获取到数据，直接报错
    if (!recipes || recipes.length === 0) {
      throw new Error('无法获取菜谱数据');
    }
    
    // 仅在客户端运行时缓存数据
    if (isClient) {
      // 缓存数据
      console.log('将数据保存到本地缓存...');
      try {
        const recipesJson = JSON.stringify(recipes);
        localStorage.setItem('cachedRecipes', recipesJson);
        localStorage.setItem('recipesCacheTime', Date.now().toString());
      } catch (storageError) {
        // 处理可能的localStorage错误，如QuotaExceededError
        console.warn('无法保存到本地缓存', 
          storageError instanceof Error ? storageError.message : String(storageError));
      }
    }
    
    return recipes;
  } catch (error) {
    console.error('无法加载和缓存菜谱数据', 
      error instanceof Error ? error.message : String(error));
    // 直接抛出错误，不再使用示例数据
    throw error;
  }
} 