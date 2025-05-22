/**
 * 统一API层
 * 整合现有API客户端，提供更易用的、领域驱动的API接口
 */

import { apiAdapter } from './apiAdapter';
import { CacheStrategy, ResponseType, OfflineStrategy } from '../constants';
import { eventBus } from '../../core/eventBus';
import { Recipe } from '../../types/recipe';
import { ApiRecipe, apiRecipeToRecipe, recipeToApiRecipe, batchConvertApiRecipes } from './dataAdapter';

// 定义SearchCriteria类型
export interface SearchCriteria {
  query?: string;
  requiredIngredients?: string[];
  optionalIngredients?: string[];
  cuisine?: string;
  flavors?: string[];
  difficulty?: string;
  cookingMethods?: string[];
  dietaryRestrictions?: string[];
  page?: number;
  limit?: number;
}

// 定义用户相关的类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: 'user' | 'admin';
}

// 定义Auth相关的类型
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

// 定义令牌刷新响应
export interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

// 定义操作响应
export interface OperationResponse {
  success: boolean;
  message: string;
}

// 定义统一API接口 - 所有数据调用应使用这些领域函数
export const api = {
  // 菜谱相关功能 ===================
  
  /**
   * 获取所有菜谱
   */
  fetchAllRecipes: async (page = 1, limit = 20): Promise<Recipe[]> => {
    const response = await apiAdapter.get('/recipes', { page, limit }, {
      cacheStrategy: CacheStrategy.CACHE_FIRST,
      cacheTtl: 5 * 60 * 1000, // 5分钟缓存
      cacheTags: ['recipes'],
    });
    return batchConvertApiRecipes(response.data);
  },
  
  /**
   * 按ID获取菜谱
   */
  fetchRecipe: async (id: string): Promise<Recipe | null> => {
    try {
      const response = await apiAdapter.get(`/recipes/${id}`, {}, {
        cacheStrategy: CacheStrategy.STALE_WHILE_REVALIDATE,
        cacheTtl: 15 * 60 * 1000, // 15分钟缓存
        cacheTags: [`recipe-${id}`],
      });
      return apiRecipeToRecipe(response.data);
    } catch (error) {
      console.error(`Error fetching recipe ${id}:`, error);
      return null;
    }
  },
  
  /**
   * 搜索菜谱
   */
  searchRecipes: async (criteria: SearchCriteria): Promise<Recipe[]> => {
    const response = await apiAdapter.get('/recipes/search', criteria, {
      cacheStrategy: CacheStrategy.CACHE_FIRST,
      cacheTtl: 10 * 60 * 1000, // 10分钟缓存
      cacheTags: ['search', 'recipes'],
    });
    return batchConvertApiRecipes(response.data.results);
  },
  
  /**
   * 获取推荐菜谱
   */
  fetchRecommendedRecipes: async (): Promise<Recipe[]> => {
    const response = await apiAdapter.get('/recipes/recommended', {}, {
      cacheStrategy: CacheStrategy.CACHE_FIRST,
      cacheTtl: 30 * 60 * 1000, // 30分钟缓存
      cacheTags: ['recipes', 'recommended'],
    });
    return batchConvertApiRecipes(response.data);
  },
  
  /**
   * 获取热门菜谱
   */
  fetchPopularRecipes: async (): Promise<Recipe[]> => {
    const response = await apiAdapter.get('/recipes/popular', {}, {
      cacheStrategy: CacheStrategy.CACHE_FIRST,
      cacheTtl: 10 * 60 * 1000, // 10分钟缓存
      cacheTags: ['recipes', 'popular'],
    });
    return batchConvertApiRecipes(response.data);
  },
  
  /**
   * 获取用户收藏的菜谱
   */
  fetchFavoriteRecipes: async (): Promise<Recipe[]> => {
    const response = await apiAdapter.get('/recipes/favorites', {}, {
      cacheStrategy: CacheStrategy.NETWORK_FIRST,
      cacheTags: ['favorites'],
      requiresAuth: true,
    });
    return batchConvertApiRecipes(response.data);
  },
  
  /**
   * 添加收藏
   */
  addFavoriteRecipe: async (recipeId: string): Promise<boolean> => {
    try {
      await apiAdapter.post('/recipes/favorites', { recipeId }, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        cacheTags: ['favorites'],
        requiresAuth: true,
        offlineStrategy: OfflineStrategy.QUEUE,
        invalidateCacheTags: ['favorites'],
      });
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  },
  
  /**
   * 移除收藏
   */
  removeFavoriteRecipe: async (recipeId: string): Promise<boolean> => {
    try {
      await apiAdapter.delete(`/recipes/favorites/${recipeId}`, {}, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        cacheTags: ['favorites'],
        requiresAuth: true,
        offlineStrategy: OfflineStrategy.QUEUE,
        invalidateCacheTags: ['favorites'],
      });
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  },
  
  /**
   * 获取菜谱历史
   */
  fetchRecipeHistory: async (): Promise<Recipe[]> => {
    const response = await apiAdapter.get('/recipes/history', {}, {
      cacheStrategy: CacheStrategy.CACHE_FIRST,
      cacheTags: ['history'],
      requiresAuth: true,
    });
    return batchConvertApiRecipes(response.data);
  },
  
  /**
   * 添加到历史
   */
  addToRecipeHistory: async (recipeId: string): Promise<boolean> => {
    try {
      await apiAdapter.post('/recipes/history', { recipeId }, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        offlineStrategy: OfflineStrategy.QUEUE,
        invalidateCacheTags: ['history'],
        requiresAuth: true,
      });
      return true;
    } catch (error) {
      console.error('Error adding to history:', error);
      return false;
    }
  },
  
  /**
   * 清除历史
   */
  clearRecipeHistory: async (): Promise<boolean> => {
    try {
      await apiAdapter.delete('/recipes/history', {}, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        invalidateCacheTags: ['history'],
        requiresAuth: true,
      });
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  },
  
  // 认证相关功能 ===================
  
  /**
   * 登录
   */
  login: async (email: string, password: string): Promise<AuthResponse | null> => {
    try {
      const response = await apiAdapter.post<AuthResponse>('/auth/login', { email, password }, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        responseType: ResponseType.DATA_ONLY,
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },
  
  /**
   * 注册
   */
  register: async (userData: { username: string, email: string, password: string }): Promise<AuthResponse | null> => {
    try {
      const response = await apiAdapter.post<AuthResponse>('/auth/register', userData, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        responseType: ResponseType.DATA_ONLY,
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  },
  
  /**
   * 登出
   */
  logout: async (): Promise<boolean> => {
    try {
      await apiAdapter.post('/auth/logout', {}, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        requiresAuth: true,
      });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },
  
  /**
   * 刷新令牌
   */
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse | null> => {
    try {
      const response = await apiAdapter.post<TokenRefreshResponse>('/auth/refresh', { refreshToken }, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        responseType: ResponseType.DATA_ONLY,
      });
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  },
  
  /**
   * 获取当前用户信息
   */
  fetchCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiAdapter.get<User>('/auth/me', {}, {
        cacheStrategy: CacheStrategy.NETWORK_FIRST,
        cacheTtl: 5 * 60 * 1000, // 5分钟缓存
        requiresAuth: true,
        responseType: ResponseType.DATA_ONLY,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },
  
  /**
   * 更新用户信息
   */
  updateUserProfile: async (userData: Partial<User>): Promise<User | null> => {
    try {
      const response = await apiAdapter.put<User>('/auth/me', userData, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        requiresAuth: true,
        responseType: ResponseType.DATA_ONLY,
        invalidateCacheTags: ['user'],
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  },
  
  /**
   * 忘记密码
   */
  forgotPassword: async (email: string): Promise<OperationResponse | null> => {
    try {
      const response = await apiAdapter.post<OperationResponse>('/auth/forgot-password', { email }, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        responseType: ResponseType.DATA_ONLY,
      });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      return null;
    }
  },
  
  /**
   * 重置密码
   */
  resetPassword: async (token: string, password: string): Promise<OperationResponse | null> => {
    try {
      const response = await apiAdapter.post<OperationResponse>('/auth/reset-password', { token, password }, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        responseType: ResponseType.DATA_ONLY,
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      return null;
    }
  },
  
  // 用户偏好相关API ===================
  
  /**
   * 获取用户偏好
   */
  fetchUserPreferences: async (): Promise<Record<string, any> | null> => {
    try {
      const response = await apiAdapter.get<Record<string, any>>('/preferences', {}, {
        cacheStrategy: CacheStrategy.NETWORK_FIRST,
        cacheTtl: 30 * 60 * 1000, // 30分钟缓存
        requiresAuth: true,
        cacheTags: ['preferences'],
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  },
  
  /**
   * 更新用户偏好
   */
  updateUserPreferences: async (preferences: Record<string, any>): Promise<boolean> => {
    try {
      await apiAdapter.put('/preferences', preferences, {
        cacheStrategy: CacheStrategy.NO_CACHE,
        requiresAuth: true,
        invalidateCacheTags: ['preferences'],
      });
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  },
  
  // 添加请求拦截器
  addMiddleware: (middleware: (config: any) => any) => {
    apiAdapter.addRequestInterceptor(middleware);
    return api;
  },
  
  // 添加错误处理拦截器
  setErrorHandler: (handler: (error: any) => any) => {
    apiAdapter.addErrorInterceptor((error) => {
      // 将错误委托给处理器
      handler(error);
      // 保持错误传播链
      return Promise.reject(error);
    });
    return api;
  },
  
  // 检查网络状态
  isOnline: () => typeof navigator !== 'undefined' && navigator.onLine,
  
  // 缓存相关方法
  cache: {
    invalidate: (tags: string[]) => apiAdapter.invalidateCacheByTags(tags),
    clear: () => apiAdapter.clearAllCache(),
  },
};

// 导出默认API实例
export default api; 