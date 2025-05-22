/**
 * 食谱状态切片
 * 使用sliceFactory管理食谱数据
 */
import { createSlice } from '../sliceFactory';
import { Recipe } from '../../types/recipe';
import { FilterType, IngredientTag } from '../../types/search';
import { eventBus } from '../../core/eventBus';

// 食谱状态接口
export interface RecipeState {
  recipes: Record<string, Recipe>;
  favorites: string[];
  history: Array<{ id: string; timestamp: number }>;
  collections: Array<{
    id: string;
    name: string;
    description: string;
    recipeIds: string[];
    createdAt: number;
  }>;
}

// 初始状态
const initialState: RecipeState = {
  recipes: {},
  favorites: [],
  history: [],
  collections: []
};

// 创建食谱状态切片
const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  persist: {
    name: 'what_to_eat_recipes',
    partialize: (state) => ({
      favorites: state.favorites,
      history: state.history,
      collections: state.collections
    })
  },
  actions: {
    // 添加菜谱
    addRecipe: (state, recipe: Recipe) => {
      state.recipes[recipe.id] = recipe;
      eventBus.emit('recipe:added', { recipe });
      return state;
    },
    
    // 更新菜谱
    updateRecipe: (state, { id, updates }: { id: string; updates: Partial<Recipe> }) => {
      if (state.recipes[id]) {
        state.recipes[id] = { ...state.recipes[id], ...updates };
        eventBus.emit('recipe:updated', { recipeId: id, updates });
      }
      return state;
    },
    
    // 删除菜谱
    removeRecipe: (state, id: string) => {
      if (state.recipes[id]) {
        delete state.recipes[id];
        state.favorites = state.favorites.filter(favId => favId !== id);
        state.history = state.history.filter(item => item.id !== id);
        
        // 从收藏集中移除
        state.collections.forEach(collection => {
          collection.recipeIds = collection.recipeIds.filter(recipeId => recipeId !== id);
        });
        
        eventBus.emit('recipe:removed', { recipeId: id });
      }
      return state;
    },
    
    // 切换收藏状态
    toggleFavorite: (state, id: string) => {
      const isFavorite = state.favorites.includes(id);
      
      if (isFavorite) {
        state.favorites = state.favorites.filter(favId => favId !== id);
      } else if (state.recipes[id]) {
        state.favorites.push(id);
      }
      
      eventBus.emit('recipe:favorite', { recipeId: id, isFavorite: !isFavorite });
      return state;
    },
    
    // 添加到历史记录
    addToHistory: (state, id: string) => {
      // 移除已存在的记录
      state.history = state.history.filter(item => item.id !== id);
      
      // 添加新记录到开头
      state.history.unshift({
        id,
        timestamp: Date.now()
      });
      
      // 最多保留50条历史记录
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
      
      eventBus.emit('recipe:history', { recipeId: id, action: 'added' });
      return state;
    },
    
    // 清空历史记录
    clearHistory: (state) => {
      state.history = [];
      eventBus.emit('recipe:history', { action: 'cleared' });
      return state;
    },
    
    // 创建收藏集
    createCollection: (state, { name, description }: { name: string; description?: string }) => {
      const id = `collection-${Date.now()}`;
      state.collections.push({
        id,
        name,
        description: description || '',
        recipeIds: [],
        createdAt: Date.now()
      });
      
      eventBus.emit('recipe:collection', { action: 'created', collectionId: id, name });
      return state;
    },
    
    // 删除收藏集
    deleteCollection: (state, id: string) => {
      state.collections = state.collections.filter(collection => collection.id !== id);
      eventBus.emit('recipe:collection', { action: 'deleted', collectionId: id });
      return state;
    },
    
    // 添加到收藏集
    addToCollection: (state, { collectionId, recipeId }: { collectionId: string; recipeId: string }) => {
      const collection = state.collections.find(c => c.id === collectionId);
      
      if (collection && !collection.recipeIds.includes(recipeId)) {
        collection.recipeIds.push(recipeId);
        eventBus.emit('recipe:collection', { action: 'added', collectionId, recipeId });
      }
      
      return state;
    },
    
    // 从收藏集移除
    removeFromCollection: (state, { collectionId, recipeId }: { collectionId: string; recipeId: string }) => {
      const collection = state.collections.find(c => c.id === collectionId);
      
      if (collection) {
        collection.recipeIds = collection.recipeIds.filter(id => id !== recipeId);
        eventBus.emit('recipe:collection', { action: 'removed', collectionId, recipeId });
      }
      
      return state;
    }
  },
  selectors: {
    // 获取所有菜谱
    getAllRecipes: (state) => Object.values(state.recipes),
    
    // 获取收藏的菜谱
    getFavoriteRecipes: (state) => state.favorites.map(id => state.recipes[id]).filter(Boolean),
    
    // 获取历史记录中的菜谱
    getHistoryRecipes: (state) => state.history.map(item => ({ 
      recipe: state.recipes[item.id], 
      timestamp: item.timestamp 
    })).filter(item => item.recipe),
    
    // 检查菜谱是否已收藏
    isFavorite: (state) => (id: string) => state.favorites.includes(id),
    
    // 获取所有收藏集
    getCollections: (state) => state.collections,
    
    // 获取特定收藏集
    getCollectionById: (state) => (id: string) => state.collections.find(c => c.id === id),
    
    // 检查菜谱是否在收藏集中
    isInCollection: (state) => (collectionId: string, recipeId: string) => {
      const collection = state.collections.find(c => c.id === collectionId);
      return collection ? collection.recipeIds.includes(recipeId) : false;
    }
  }
});

// 导出钩子和动作
export const { useState: useRecipeSlice, actions: recipeActions, selectors: recipeSelectors } = recipeSlice;

/**
 * 创建完整的菜谱控制接口
 * 提供便捷的方法访问状态和动作
 */
export const useRecipeStore = () => {
  const state = useRecipeSlice();
  
  return {
    // 状态
    recipes: state.recipes,
    favorites: state.favorites,
    history: state.history,
    collections: state.collections,
    
    // 动作
    addRecipe: recipeActions.addRecipe,
    updateRecipe: recipeActions.updateRecipe,
    removeRecipe: recipeActions.removeRecipe,
    toggleFavorite: recipeActions.toggleFavorite,
    addToHistory: recipeActions.addToHistory, 
    clearHistory: recipeActions.clearHistory,
    createCollection: (name: string, description?: string) => 
      recipeActions.createCollection({ name, description }),
    deleteCollection: recipeActions.deleteCollection,
    addToCollection: (collectionId: string, recipeId: string) => 
      recipeActions.addToCollection({ collectionId, recipeId }),
    removeFromCollection: (collectionId: string, recipeId: string) => 
      recipeActions.removeFromCollection({ collectionId, recipeId }),
      
    // 使用selector函数
    getAllRecipes: recipeSelectors.getAllRecipes,
    getFavoriteRecipes: recipeSelectors.getFavoriteRecipes,
    getHistoryRecipes: recipeSelectors.getHistoryRecipes,
    isFavorite: (id: string) => recipeSelectors.isFavorite()(id),
    getCollections: recipeSelectors.getCollections,
    getCollectionById: (id: string) => recipeSelectors.getCollectionById()(id),
    isInCollection: (collectionId: string, recipeId: string) => 
      recipeSelectors.isInCollection()(collectionId, recipeId)
  };
};

export default recipeSlice; 