import { Recipe } from '../../types/recipe';
import { getLocalStorageItem, setLocalStorageItem } from '../data/localStorage';

// 收藏系统的存储键
const SAVED_RECIPES_IDS_KEY = 'savedRecipes';
const SAVED_RECIPES_DATA_KEY = 'savedRecipesData';

/**
 * 本地收藏管理工具
 * 使用localStorage存储收藏数据，实现无需登录的收藏功能
 */

/**
 * 获取所有收藏的菜谱ID
 * @returns 收藏的菜谱ID数组
 */
export function getFavoriteIds(): string[] {
  try {
    if (typeof window === 'undefined') {
      return [];
    }
    
    // 添加调试日志
    console.log('[getFavoriteIds] 开始读取收藏ID');
    console.log('[getFavoriteIds] localStorage原始值:', localStorage.getItem(SAVED_RECIPES_IDS_KEY));
    
    const savedIds = getLocalStorageItem<string[]>(SAVED_RECIPES_IDS_KEY, [], 'getFavoriteIds');
    
    console.log('[getFavoriteIds] 解析后的收藏ID:', savedIds);
    
    return savedIds;
  } catch (error) {
    console.error('获取收藏ID出错:', error);
    return [];
  }
}

/**
 * 保存收藏的菜谱ID
 * @param favoriteIds 收藏的菜谱ID数组
 */
export function saveFavoriteIds(favoriteIds: string[]): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    setLocalStorageItem(SAVED_RECIPES_IDS_KEY, favoriteIds, 'saveFavoriteIds');
    
    // 触发存储事件，通知其他页面收藏变化
    window.dispatchEvent(new CustomEvent('favoritechange', {
      detail: { favoriteIds }
    }));
  } catch (error) {
    console.error('保存收藏ID出错:', error);
  }
}

/**
 * 保存收藏的菜谱完整数据
 * @param recipes 收藏的菜谱数组
 */
export function saveFavoriteRecipes(recipes: Recipe[]): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    setLocalStorageItem(SAVED_RECIPES_DATA_KEY, recipes, 'saveFavoriteRecipes');
  } catch (error) {
    console.error('保存收藏菜谱数据出错:', error);
  }
}

/**
 * 获取收藏的菜谱完整数据
 * @returns 收藏的菜谱数组
 */
export function getFavoriteRecipes(): Recipe[] {
  try {
    if (typeof window === 'undefined') {
      return [];
    }
    
    // 添加调试日志
    console.log('[getFavoriteRecipes] 开始读取收藏菜谱数据');
    
    const savedRecipes = getLocalStorageItem<Recipe[]>(SAVED_RECIPES_DATA_KEY, [], 'getFavoriteRecipes');
    
    console.log('[getFavoriteRecipes] 解析后的收藏菜谱数据:', {
      count: savedRecipes.length,
      data: savedRecipes.map(r => ({ id: r.id, name: r.name }))
    });
    
    return savedRecipes;
  } catch (error) {
    console.error('获取收藏菜谱数据出错:', error);
    return [];
  }
}

/**
 * 判断菜谱是否已收藏
 * @param recipeId 菜谱ID
 * @returns 是否已收藏
 */
export function isFavorite(recipeId: string): boolean {
  return getFavoriteIds().includes(recipeId);
}

/**
 * 添加菜谱到收藏
 * @param recipe 要收藏的菜谱
 * @returns 收藏操作是否成功
 */
export function addToFavorites(recipe: Recipe): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // 确保recipe对象至少有id
    if (!recipe || !recipe.id) {
      console.error('添加收藏失败: 缺少菜谱ID');
      return false;
    }
    
    // 获取当前收藏ID
    const favoriteIds = getFavoriteIds();
    
    // 如果已经收藏，直接返回成功
    if (favoriteIds.includes(recipe.id)) {
      return true;
    }
    
    // 添加新的收藏ID
    const newFavoriteIds = [...favoriteIds, recipe.id];
    saveFavoriteIds(newFavoriteIds);
    
    // 获取并更新收藏的菜谱完整数据
    const favoriteRecipes = getFavoriteRecipes();
    const newFavoriteRecipes = [...favoriteRecipes, recipe];
    saveFavoriteRecipes(newFavoriteRecipes);
    
    console.log(`成功将菜谱"${recipe.name || recipe.id}"添加到收藏`, {
      totalFavorites: newFavoriteIds.length,
      newFavoriteIds
    });
    
    return true;
  } catch (error) {
    console.error('添加收藏出错:', error);
    return false;
  }
}

/**
 * 从收藏中移除菜谱
 * @param recipeId 要移除的菜谱ID
 * @returns 移除操作是否成功
 */
export function removeFromFavorites(recipeId: string): boolean {
  try {
    if (typeof window === 'undefined' || !recipeId) {
      return false;
    }
    
    // 获取当前收藏
    const favoriteIds = getFavoriteIds();
    
    // 如果未收藏，直接返回成功
    if (!favoriteIds.includes(recipeId)) {
      return true;
    }
    
    // 移除收藏ID
    const newFavoriteIds = favoriteIds.filter(id => id !== recipeId);
    saveFavoriteIds(newFavoriteIds);
    
    // 更新收藏的菜谱完整数据
    const favoriteRecipes = getFavoriteRecipes();
    const newFavoriteRecipes = favoriteRecipes.filter(recipe => recipe.id !== recipeId);
    saveFavoriteRecipes(newFavoriteRecipes);
    
    return true;
  } catch (error) {
    console.error('移除收藏出错:', error);
    return false;
  }
}

/**
 * 切换菜谱的收藏状态
 * @param recipe 菜谱对象
 * @returns 切换后的收藏状态
 */
export function toggleFavorite(recipe: Recipe): boolean {
  // 添加调试日志
  console.log('toggleFavorite: 开始切换收藏状态', { 
    recipeId: recipe.id,
    recipeName: recipe.name
  });
  
  const isCurrentlyFavorite = isFavorite(recipe.id);
  console.log('toggleFavorite: 当前收藏状态', { isCurrentlyFavorite });
  
  if (isCurrentlyFavorite) {
    removeFromFavorites(recipe.id);
    console.log('toggleFavorite: 已移除收藏');
    return false;
  } else {
    addToFavorites(recipe);
    console.log('toggleFavorite: 已添加收藏');
    return true;
  }
}

/**
 * 清空所有收藏
 * @returns 清空操作是否成功
 */
export function clearAllFavorites(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    
    localStorage.removeItem(SAVED_RECIPES_IDS_KEY);
    localStorage.removeItem(SAVED_RECIPES_DATA_KEY);
    
    // 触发存储事件，通知其他页面收藏变化
    window.dispatchEvent(new CustomEvent('favoritechange', {
      detail: { favoriteIds: [] }
    }));
    
    return true;
  } catch (error) {
    console.error('清空收藏出错:', error);
    return false;
  }
}

/**
 * 获取收藏的菜谱数量
 * @returns 收藏的菜谱数量
 */
export function getFavoriteCount(): number {
  return getFavoriteIds().length;
}

/**
 * 检查并迁移旧版本的收藏数据（如果存在）
 * 包括从 'favorites' 和 'whattoeat_favorites/whattoeat_favorite_recipes' 迁移到 'savedRecipes/savedRecipesData'
 */
export function migrateOldFavorites(): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    console.log('开始检查并迁移旧版收藏数据');
    
    // 获取当前savedRecipes数据作为基础
    let currentIds = getFavoriteIds();
    let currentRecipes = getFavoriteRecipes();
    
    let hasChanges = false;
    
    // 检查并迁移旧版 'favorites' 数据
    const oldFavoritesJson = localStorage.getItem('favorites');
    if (oldFavoritesJson) {
      try {
        console.log('发现旧版favorites数据，开始迁移');
        
        const oldFavoriteIds = JSON.parse(oldFavoritesJson) as string[];
        if (oldFavoriteIds && oldFavoriteIds.length > 0) {
          // 添加未存在的ID
          for (const id of oldFavoriteIds) {
            if (!currentIds.includes(id)) {
              currentIds.push(id);
              hasChanges = true;
            }
          }
        }
        
        // 迁移后删除旧数据
        localStorage.removeItem('favorites');
        console.log('已删除旧版favorites数据');
      } catch (error) {
        console.error('迁移favorites数据失败:', error);
      }
    }
    
    // 检查并迁移 'whattoeat_favorites' 数据
    const whattoeatFavoritesJson = localStorage.getItem('whattoeat_favorites');
    const whattoeatFavoriteRecipesJson = localStorage.getItem('whattoeat_favorite_recipes');
    
    if (whattoeatFavoritesJson || whattoeatFavoriteRecipesJson) {
      try {
        console.log('发现whattoeat_favorites数据，开始迁移');
        
        // 迁移ID数据
        if (whattoeatFavoritesJson) {
          const whattoeatIds = JSON.parse(whattoeatFavoritesJson) as string[];
          if (whattoeatIds && whattoeatIds.length > 0) {
            // 添加未存在的ID
            for (const id of whattoeatIds) {
              if (!currentIds.includes(id)) {
                currentIds.push(id);
                hasChanges = true;
              }
            }
          }
        }
        
        // 迁移菜谱数据
        if (whattoeatFavoriteRecipesJson) {
          const whattoeatRecipes = JSON.parse(whattoeatFavoriteRecipesJson) as Recipe[];
          if (whattoeatRecipes && whattoeatRecipes.length > 0) {
            // 添加未存在的菜谱
            for (const recipe of whattoeatRecipes) {
              if (!currentRecipes.find(r => r.id === recipe.id)) {
                currentRecipes.push(recipe);
                hasChanges = true;
              }
            }
          }
        }
        
        // 迁移后删除旧数据
        localStorage.removeItem('whattoeat_favorites');
        localStorage.removeItem('whattoeat_favorite_recipes');
        console.log('已删除whattoeat_favorites数据系统');
      } catch (error) {
        console.error('迁移whattoeat_favorites数据失败:', error);
      }
    }
    
    // 如果有数据变化，保存合并后的数据
    if (hasChanges) {
      console.log('收藏数据已更新，保存合并后的数据');
      saveFavoriteIds(currentIds);
      saveFavoriteRecipes(currentRecipes);
    } else {
      console.log('没有需要迁移的收藏数据');
    }
    
  } catch (error) {
    console.error('迁移旧版收藏数据出错:', error);
  }
}

/**
 * 尝试从API获取收藏菜谱的详细数据
 * 用于确保收藏页面显示完整数据
 * @param ids 收藏的菜谱ID数组
 * @returns Promise<Recipe[]> 包含完整数据的菜谱数组
 */
export async function fetchFavoriteRecipes(ids: string[]): Promise<Recipe[]> {
  // 如果没有ID，直接返回空数组
  if (!ids.length) {
    return [];
  }
  
  try {
    console.log('[fetchFavoriteRecipes] 开始从API获取收藏菜谱详细数据，ID数量:', ids.length);
    
    // 发起API请求获取菜谱详情数据
    const response = await fetch('/api/recipes/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    
    console.log('[fetchFavoriteRecipes] API响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`获取收藏菜谱失败: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[fetchFavoriteRecipes] 获取到原始数据:', {
      hasData: !!data,
      hasRecipes: !!(data && data.recipes),
      isArray: !!(data && Array.isArray(data.recipes))
    });
    
    if (!data || !Array.isArray(data.recipes)) {
      console.warn('[fetchFavoriteRecipes] API返回的收藏菜谱数据格式不正确');
      
      // 尝试直接使用数据，如果它本身就是数组
      if (Array.isArray(data)) {
        console.log('[fetchFavoriteRecipes] 尝试直接使用返回数据，它本身是数组');
        const recipes = data as Recipe[];
        // 更新本地收藏的完整数据
        saveFavoriteRecipes(recipes);
        return recipes;
      }
      
      return [];
    }
    
    const recipes = data.recipes as Recipe[];
    
    // 更新本地收藏的完整数据
    saveFavoriteRecipes(recipes);
    
    console.log(`[fetchFavoriteRecipes] 成功获取${recipes.length}个收藏菜谱的详细数据`);
    return recipes;
  } catch (error) {
    console.error('[fetchFavoriteRecipes] 从API获取收藏菜谱详细数据失败:', error);
    // 失败时返回本地存储的数据
    return getFavoriteRecipes();
  }
} 