'use client';

/**
 * 控制器层：菜谱控制器
 * 负责处理菜谱相关的业务逻辑和副作用
 */
import { useCallback, useState } from 'react';
import { Recipe } from '../types/recipe';
import { useRecipeStore } from '../store/slices/recipeSlice';
import { eventBus } from '../core/eventBus';
import { logError } from '../utils/common/errorLogger';

export interface RecipeControllerOptions {
  /**
   * 自动加载数据
   */
  autoLoad?: boolean;
}

/**
 * 菜谱控制器钩子
 * 负责管理菜谱数据的获取、缓存和操作
 */
export function useRecipeController(options: RecipeControllerOptions = {}) {
  const {
    autoLoad = true
  } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 从Store获取菜谱状态和操作方法
  const recipeStore = useRecipeStore();
  
  // 添加菜谱
  const addRecipe = useCallback((recipe: Recipe) => {
    try {
      recipeStore.addRecipe(recipe);
      return true;
    } catch (err) {
      logError('useRecipeController', 'addRecipe', err instanceof Error ? err.message : String(err), { recipe });
      return false;
    }
  }, [recipeStore]);
  
  // 更新菜谱
  const updateRecipe = useCallback((recipeId: string, updates: Partial<Recipe>) => {
    try {
      recipeStore.updateRecipe({ id: recipeId, updates });
      return true;
    } catch (err) {
      logError('useRecipeController', 'updateRecipe', err instanceof Error ? err.message : String(err), { recipeId, updates });
      return false;
    }
  }, [recipeStore]);
  
  // 删除菜谱
  const removeRecipe = useCallback((recipeId: string) => {
    try {
      recipeStore.removeRecipe(recipeId);
      return true;
    } catch (err) {
      logError('useRecipeController', 'removeRecipe', err instanceof Error ? err.message : String(err), { recipeId });
      return false;
    }
  }, [recipeStore]);
  
  // 切换收藏状态
  const toggleFavorite = useCallback((recipeId: string) => {
    try {
      recipeStore.toggleFavorite(recipeId);
      return true;
    } catch (err) {
      logError('useRecipeController', 'toggleFavorite', err instanceof Error ? err.message : String(err), { recipeId });
      return false;
    }
  }, [recipeStore]);
  
  // 添加到历史记录
  const addToHistory = useCallback((recipeId: string) => {
    try {
      recipeStore.addToHistory(recipeId);
      return true;
    } catch (err) {
      logError('useRecipeController', 'addToHistory', err instanceof Error ? err.message : String(err), { recipeId });
      return false;
    }
  }, [recipeStore]);
  
  // 清除历史记录
  const clearHistory = useCallback(() => {
    try {
      recipeStore.clearHistory();
      return true;
    } catch (err) {
      logError('useRecipeController', 'clearHistory', err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [recipeStore]);
  
  // 创建收藏集
  const createCollection = useCallback((name: string, description?: string) => {
    try {
      recipeStore.createCollection(name, description);
      return true;
    } catch (err) {
      logError('useRecipeController', 'createCollection', err instanceof Error ? err.message : String(err), { name, description });
      return null;
    }
  }, [recipeStore]);
  
  // 删除收藏集
  const deleteCollection = useCallback((collectionId: string) => {
    try {
      recipeStore.deleteCollection(collectionId);
      return true;
    } catch (err) {
      logError('useRecipeController', 'deleteCollection', err instanceof Error ? err.message : String(err), { collectionId });
      return false;
    }
  }, [recipeStore]);
  
  // 添加到收藏集
  const addToCollection = useCallback((collectionId: string, recipeId: string) => {
    try {
      recipeStore.addToCollection(collectionId, recipeId);
      return true;
    } catch (err) {
      logError('useRecipeController', 'addToCollection', err instanceof Error ? err.message : String(err), { collectionId, recipeId });
      return false;
    }
  }, [recipeStore]);
  
  // 从收藏集移除
  const removeFromCollection = useCallback((collectionId: string, recipeId: string) => {
    try {
      recipeStore.removeFromCollection(collectionId, recipeId);
      return true;
    } catch (err) {
      logError('useRecipeController', 'removeFromCollection', err instanceof Error ? err.message : String(err), { collectionId, recipeId });
      return false;
    }
  }, [recipeStore]);
  
  // 收藏状态检查
  const isFavorite = useCallback((recipeId: string) => {
    return recipeStore.isFavorite(recipeId);
  }, [recipeStore]);
  
  // 收藏集检查
  const isInCollection = useCallback((collectionId: string, recipeId: string) => {
    return recipeStore.isInCollection(collectionId, recipeId);
  }, [recipeStore]);
  
  return {
    // 状态
    recipes: recipeStore.recipes,
    favorites: recipeStore.favorites,
    history: recipeStore.history,
    collections: recipeStore.collections,
    loading,
    error,
    
    // 方法
    addRecipe,
    updateRecipe,
    removeRecipe,
    toggleFavorite,
    addToHistory,
    clearHistory,
    createCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    
    // 辅助方法
    isFavorite,
    isInCollection
  };
} 