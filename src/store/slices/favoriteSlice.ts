/**
 * 收藏菜谱状态管理
 * 集中管理所有与收藏相关的状态和逻辑
 */
import { Recipe } from '../../types/recipe';
import { createSlice } from '../sliceFactory';

// 收藏状态接口
export interface FavoriteState {
  favoriteRecipes: Record<string, Recipe>;
  favoriteIds: string[];
  lastUpdated: number;
}

// 初始状态
const initialState: FavoriteState = {
  favoriteRecipes: {},
  favoriteIds: [],
  lastUpdated: Date.now(),
};

// 创建收藏状态切片
const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  persist: {
    name: 'what_to_eat_favorites'
  },
  actions: {
    // 添加收藏
    addFavorite: (state: FavoriteState, recipe: Recipe) => {
      // 检查是否已存在收藏
      if (state.favoriteIds.includes(recipe.id)) {
        return state; // 已收藏，不做任何操作
      }

      // 更新收藏列表
      state.favoriteRecipes[recipe.id] = recipe;
      state.favoriteIds.push(recipe.id);
      state.lastUpdated = Date.now();
      
      return state;
    },

    // 移除收藏
    removeFavorite: (state: FavoriteState, recipeId: string) => {
      // 检查是否已存在收藏
      if (!state.favoriteIds.includes(recipeId)) {
        return state; // 未收藏，不做任何操作
      }

      // 删除指定ID
      delete state.favoriteRecipes[recipeId];
      
      // 更新收藏列表
      state.favoriteIds = state.favoriteIds.filter(id => id !== recipeId);
      state.lastUpdated = Date.now();
      
      return state;
    },

    // 清除所有收藏
    clearAllFavorites: (state: FavoriteState) => {
      state.favoriteRecipes = {};
      state.favoriteIds = [];
      state.lastUpdated = Date.now();
      
      return state;
    },

    // 导入收藏
    importFavorites: (state: FavoriteState, recipes: Recipe[]) => {
      recipes.forEach(recipe => {
        if (!state.favoriteIds.includes(recipe.id)) {
          state.favoriteRecipes[recipe.id] = recipe;
          state.favoriteIds.push(recipe.id);
        }
      });
      
      state.lastUpdated = Date.now();
      return state;
    }
  },
  selectors: {
    selectFavoriteIds: (state: FavoriteState) => state.favoriteIds,
    selectFavoriteRecipes: (state: FavoriteState) => state.favoriteRecipes,
    selectAllFavorites: (state: FavoriteState) => 
      state.favoriteIds.map(id => state.favoriteRecipes[id]).filter(Boolean),
    selectIsFavorite: (state: FavoriteState) => (recipeId: string) => 
      state.favoriteIds.includes(recipeId),
    selectFavoriteCount: (state: FavoriteState) => state.favoriteIds.length
  }
});

// 导出状态和动作
export const { 
  useState: useFavoriteStore, 
  useStore: useFavoriteStoreRaw,
  actions: favoriteStoreActions, 
  selectors 
} = favoriteSlice;

// 异步切换收藏状态 - 不使用Hook，改用getState
export const toggleFavorite = async (recipe: Recipe): Promise<boolean> => {
  // 使用getState而不是useFavoriteStore
  const state = useFavoriteStoreRaw.getState();
  const isFav = state.favoriteIds.includes(recipe.id);
  
  if (isFav) {
    favoriteStoreActions.removeFavorite(recipe.id);
    return false;
  } else {
    favoriteStoreActions.addFavorite(recipe);
    return true;
  }
};

// 同步收藏与服务器（模拟实现）
export const syncWithServer = async (): Promise<void> => {
  // 在实际应用中，这里应该与服务器进行同步
  console.log('同步收藏与服务器...');
};

/**
 * 收藏钩子函数
 * 暴露给组件使用的简便API
 */
export const useFavorite = () => {
  const state = useFavoriteStore();
  
  return {
    favorites: selectors.selectAllFavorites(state),
    favoriteIds: state.favoriteIds,
    isFavorite: (recipeId: string) => selectors.selectIsFavorite(state)(recipeId),
    toggleFavorite,
    addToFavorites: favoriteStoreActions.addFavorite,
    removeFromFavorites: favoriteStoreActions.removeFavorite,
    clearFavorites: favoriteStoreActions.clearAllFavorites,
    count: selectors.selectFavoriteCount(state)
  };
};

export default favoriteSlice; 