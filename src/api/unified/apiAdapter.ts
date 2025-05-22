/**
 * API适配器 - 处理不同API接口之间的差异以及数据格式转换
 * 集中处理所有数据映射、适配和转换逻辑，使API路由保持简洁
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CacheStrategy, ResponseType, OfflineStrategy } from '../constants';
import { dbRecordToFrontendModel, dbRecipesToFrontendModels, frontendModelToDbRecord, DbRecipe } from '../../utils/data/dataMapper';
import type { Recipe } from '../../types/recipe';

// API响应接口
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  statusText: string;
}

/**
 * 适配器配置接口
 */
export interface ApiAdapterOptions {
  cacheStrategy?: string; 
  cacheTtl?: number;
  cacheTags?: string[];
  responseType?: string;
  requiresAuth?: boolean;
  offlineStrategy?: string;
  invalidateCacheTags?: string[];
  mockData?: any;
  [key: string]: any;
}

// 创建Axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 存储认证令牌
let authToken: string | null = null;

// 请求拦截器处理认证
axiosInstance.interceptors.request.use((config) => {
  if (authToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

/**
 * 转换请求配置，将我们的统一配置转换为axios可以理解的格式
 */
function adaptRequestOptions(options: ApiAdapterOptions = {}): AxiosRequestConfig {
  const adaptedOptions: AxiosRequestConfig = {};
  
  // 复制基本选项
  Object.keys(options).forEach(key => {
    // 排除特定的适配器选项，它们不是axios配置的一部分
    if (!['cacheStrategy', 'cacheTtl', 'cacheTags', 'responseType', 
         'requiresAuth', 'offlineStrategy', 'invalidateCacheTags', 
         'mockData'].includes(key)) {
      (adaptedOptions as any)[key] = options[key];
    }
  });
  
  return adaptedOptions;
}

// 将Axios响应转换为ApiResponse
function adaptResponse<T>(axiosResponse: AxiosResponse): ApiResponse<T> {
  return {
    status: axiosResponse.status,
    data: axiosResponse.data,
    headers: axiosResponse.headers as Record<string, string>,
    statusText: axiosResponse.statusText
  };
}

/**
 * API适配器 - 包装axios，提供一致的接口
 * 处理所有数据转换、结构映射逻辑
 */
export const apiAdapter = {
  /**
   * 执行GET请求
   */
  get: async <T = any>(url: string, params: Record<string, any> = {}, options: ApiAdapterOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const axiosResponse = await axiosInstance.get<T>(url, { 
        params,
        ...adaptRequestOptions(options)
      });
      return adaptResponse<T>(axiosResponse);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return adaptResponse(error.response);
      }
      throw error;
    }
  },
  
  /**
   * 执行POST请求
   */
  post: async <T = any>(url: string, data: any = {}, options: ApiAdapterOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const axiosResponse = await axiosInstance.post<T>(url, data, adaptRequestOptions(options));
      return adaptResponse<T>(axiosResponse);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return adaptResponse(error.response);
      }
      throw error;
    }
  },
  
  /**
   * 执行PUT请求
   */
  put: async <T = any>(url: string, data: any = {}, options: ApiAdapterOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const axiosResponse = await axiosInstance.put<T>(url, data, adaptRequestOptions(options));
      return adaptResponse<T>(axiosResponse);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return adaptResponse(error.response);
      }
      throw error;
    }
  },
  
  /**
   * 执行DELETE请求
   */
  delete: async <T = any>(url: string, params: Record<string, any> = {}, options: ApiAdapterOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const axiosResponse = await axiosInstance.delete<T>(url, { 
        params,
        ...adaptRequestOptions(options)
      });
      return adaptResponse<T>(axiosResponse);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return adaptResponse(error.response);
      }
      throw error;
    }
  },
  
  /**
   * 执行PATCH请求
   */
  patch: async <T = any>(url: string, data: any = {}, options: ApiAdapterOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const axiosResponse = await axiosInstance.patch<T>(url, data, adaptRequestOptions(options));
      return adaptResponse<T>(axiosResponse);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return adaptResponse(error.response);
      }
      throw error;
    }
  },
  
  /**
   * 取消请求
   */
  cancelRequest: (requestId: string) => {
    // TODO: 实现请求取消逻辑
    console.warn('Request cancellation not implemented');
  },
  
  /**
   * 取消所有请求
   */
  cancelAllRequests: () => {
    // TODO: 实现请求取消逻辑
    console.warn('Request cancellation not implemented');
  },
  
  /**
   * 添加请求拦截器
   */
  addRequestInterceptor: (interceptor: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig) => {
    return axiosInstance.interceptors.request.use(interceptor);
  },
  
  /**
   * 添加响应拦截器
   */
  addResponseInterceptor: (interceptor: (response: AxiosResponse) => AxiosResponse) => {
    return axiosInstance.interceptors.response.use(interceptor);
  },
  
  /**
   * 添加错误拦截器
   */
  addErrorInterceptor: (interceptor: (error: any) => any) => {
    return axiosInstance.interceptors.response.use(
      response => response,
      error => interceptor(error)
    );
  },
  
  /**
   * 处理离线队列
   */
  processOfflineQueue: () => {
    // 实现离线队列处理逻辑
    console.warn('Offline queue processing not implemented');
    return Promise.resolve();
  },
  
  /**
   * 使特定标签的缓存失效
   */
  invalidateCacheByTags: (tags: string[]) => {
    // TODO: 实现缓存失效逻辑
    console.warn('Cache invalidation not implemented');
  },
  
  /**
   * 清除所有缓存
   */
  clearAllCache: () => {
    // TODO: 实现缓存清理逻辑
    console.warn('Cache clearing not implemented');
  },
  
  /**
   * 获取缓存项
   */
  getCacheItem: (key: string) => {
    // TODO: 实现缓存获取逻辑
    return null;
  },
  
  /**
   * 设置缓存项
   */
  setCacheItem: (key: string, value: any, ttl?: number) => {
    // TODO: 实现缓存设置逻辑
    console.warn('Cache setting not implemented');
    return null;
  },
  
  /**
   * 设置认证令牌
   */
  setAuthToken: (token: string) => {
    authToken = token;
  },
  
  /**
   * 清除认证令牌
   */
  clearAuthToken: () => {
    authToken = null;
  },

  /**
   * 检索所有菜谱并自动转换为前端格式
   * @param options 请求选项
   * @returns 转换后的菜谱数组
   */
  async getRecipes(options: ApiAdapterOptions = {}): Promise<Recipe[]> {
    // 从API获取菜谱数据
    const response = await apiAdapter.get('/api/recipes', {}, options);
    
    // 如果响应已经是前端格式，直接返回
    if (Array.isArray(response.data) && response.data.length > 0 && 'name' in response.data[0]) {
      return response.data as Recipe[];
    }
    
    // 否则进行数据转换
    return dbRecipesToFrontendModels(response.data as DbRecipe[]);
  },

  /**
   * 根据ID检索菜谱并自动转换为前端格式
   * @param recipeId 菜谱ID
   * @param options 请求选项
   * @returns 转换后的菜谱
   */
  async getRecipeById(recipeId: string, options: ApiAdapterOptions = {}): Promise<Recipe | null> {
    // 从API获取菜谱数据
    const response = await apiAdapter.get(`/api/recipes/${recipeId}`, {}, options);
    
    // 如果没有找到数据
    if (!response.data) {
      return null;
    }
    
    // 如果响应已经是前端格式，直接返回
    if ('name' in response.data) {
      return response.data as Recipe;
    }
    
    // 否则进行数据转换
    return dbRecordToFrontendModel(response.data as DbRecipe);
  },

  /**
   * 创建或更新菜谱，自动处理数据转换
   * @param recipe 前端菜谱对象
   * @param options 请求选项
   * @returns 保存后的菜谱
   */
  async saveRecipe(recipe: Recipe, options: ApiAdapterOptions = {}): Promise<Recipe> {
    // 将前端格式转换为数据库格式
    const dbRecipe = frontendModelToDbRecord(recipe);
    
    let response;
    if (recipe.id && !recipe.id.startsWith('temp-')) {
      // 更新现有菜谱
      response = await apiAdapter.put(`/api/recipes/${recipe.id}`, dbRecipe, options);
    } else {
      // 创建新菜谱
      response = await apiAdapter.post('/api/recipes', dbRecipe, options);
    }
    
    // 返回转换后的响应数据
    return dbRecordToFrontendModel(response.data as DbRecipe);
  }
};

export default apiAdapter; 