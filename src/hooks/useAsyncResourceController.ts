'use client';

/**
 * 通用异步资源控制器Hook
 * 
 * 这个Hook抽象了常见的异步资源获取和操作的状态管理模式，
 * 可以用于搜索、收藏、分页、表单等场景，统一管理loading、data、error等状态
 */
import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * 分页数据Hook - 处理分页、加载和数据缓存
 */
export function usePaginatedData<T, P extends { page?: number; pageSize?: number } = { page?: number; pageSize?: number }>(
  fetchFunction: (params: P) => Promise<{ items: T[]; total: number }>,
  options: {
    initialParams?: Partial<P>;
    pageSize?: number;
    cacheResults?: boolean;
  } = {}
) {
  const {
    initialParams = {} as Partial<P>,
    pageSize = 10,
    cacheResults = true
  } = options;
  
  // 使用基础的异步状态Hook
  const asyncState = useAsyncState<{ items: T[]; total: number; pages: number }>(null);
  const { data, loading, error, execute } = asyncState;
  
  // 分页状态
  const [params, setParams] = useState<P>({
    ...({} as P),
    ...initialParams,
    page: (initialParams as any).page ?? 1,
    pageSize: (initialParams as any).pageSize ?? pageSize
  });
  
  // 缓存
  const [cache, setCache] = useState<Record<number, T[]>>({});
  
  // 获取指定页数据
  const fetchPage = useCallback(async (newParams: Partial<P> = {}) => {
    const updatedParams = { ...params, ...newParams } as P;
    const page = updatedParams.page || 1;
    
    // 如果启用缓存且缓存中有此页数据，直接使用缓存
    if (cacheResults && cache[page] && !newParams.hasOwnProperty('page')) {
      asyncState.setData({
        items: cache[page],
        total: data?.total || 0,
        pages: data?.pages || 0
      });
      return;
    }
    
    // 否则从API获取
    try {
      const result = await execute(fetchFunction(updatedParams));
      
      // 计算总页数
      const totalPages = Math.ceil(result.total / (updatedParams.pageSize || pageSize));
      
      // 更新状态和缓存
      asyncState.setData({
        items: result.items,
        total: result.total,
        pages: totalPages
      });
      
      // 更新参数状态
      setParams(updatedParams);
      
      // 更新缓存
      if (cacheResults) {
        setCache(prev => ({
          ...prev,
          [page]: result.items
        }));
      }
      
      return result;
    } catch (error) {
      // 错误处理由execute内部完成
      console.error('Failed to fetch page data:', error);
      throw error;
    }
  }, [params, cache, cacheResults, data, execute, fetchFunction, asyncState, pageSize]);
  
  // 切换页码
  const goToPage = useCallback((page: number) => {
    if (page < 1 || (data?.pages && page > data.pages)) {
      return;
    }
    
    fetchPage({ page } as Partial<P>);
  }, [fetchPage, data]);
  
  // 下一页
  const nextPage = useCallback(() => {
    if (!data || !data.pages || params.page === data.pages) {
      return;
    }
    
    goToPage((params.page || 1) + 1);
  }, [goToPage, params.page, data]);
  
  // 上一页
  const prevPage = useCallback(() => {
    if (!params.page || params.page <= 1) {
      return;
    }
    
    goToPage((params.page || 1) - 1);
  }, [goToPage, params.page]);
  
  // 清除缓存
  const clearCache = useCallback(() => {
    setCache({});
  }, []);
  
  // 刷新当前页
  const refresh = useCallback(() => {
    fetchPage();
  }, [fetchPage]);
  
  return {
    // 数据状态
    data: data?.items || [],
    loading,
    error,
    
    // 分页信息
    page: params.page || 1,
    pageSize: params.pageSize || pageSize,
    total: data?.total || 0,
    totalPages: data?.pages || 0,
    
    // 分页控制
    goToPage,
    nextPage,
    prevPage,
    
    // 参数控制
    params,
    updateParams: fetchPage,
    
    // 缓存控制
    clearCache,
    
    // 刷新
    refresh
  };
}

/**
 * 简化的异步状态Hook - 统一封装loading/error/data三状态
 * 用于快速创建异步操作状态管理
 */
export function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: initialData,
    loading: false,
    error: null
  });

  const setLoading = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState({ data, loading: false, error: null });
  }, []);

  const setError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, loading: false, error }));
  }, []);

  const execute = useCallback(async <R = T>(
    promise: Promise<R>,
    successTransform?: (result: R) => T
  ): Promise<R> => {
    try {
      setLoading();
      const result = await promise;
      
      if (successTransform) {
        setData(successTransform(result));
      } else {
        setData(result as unknown as T);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [setLoading, setData, setError]);

  return {
    ...state,
    setLoading,
    setData,
    setError,
    execute
  };
}

// 异步资源控制器选项接口
export interface AsyncResourceControllerOptions<T, P = any> {
  /**
   * 数据获取函数
   */
  fetcher: (params?: P) => Promise<T>;
  
  /**
   * 数据转换函数，用于格式化API返回的数据
   */
  transformer?: (data: any) => T;
  
  /**
   * 是否在挂载时自动获取数据
   */
  autoFetch?: boolean;
  
  /**
   * 初始参数
   */
  initialParams?: P;
  
  /**
   * 初始数据
   */
  initialData?: T;
  
  /**
   * 请求间隔时间(ms)，用于防止频繁请求
   */
  debounceTime?: number;
  
  /**
   * 请求出错时的回调
   */
  onError?: (error: Error) => void;
  
  /**
   * 请求成功时的回调
   */
  onSuccess?: (data: T) => void;
}

// 异步资源控制器状态接口
export interface AsyncResourceState<T, P = any> {
  /**
   * 资源数据
   */
  data: T | null;
  
  /**
   * 是否正在加载
   */
  loading: boolean;
  
  /**
   * 错误信息
   */
  error: Error | null;
  
  /**
   * 请求参数
   */
  params: P | undefined;
  
  /**
   * 是否已经获取过数据
   */
  initialized: boolean;
}

/**
 * 异步资源控制器Hook
 * 统一管理异步资源的获取、更新和状态
 */
export function useAsyncResourceController<T, P = any>(
  options: AsyncResourceControllerOptions<T, P>
) {
  const {
    fetcher,
    transformer,
    autoFetch = true,
    initialParams,
    initialData = null,
    debounceTime = 0,
    onError,
    onSuccess
  } = options;

  // 初始化状态
  const [state, setState] = useState<AsyncResourceState<T, P>>({
    data: initialData,
    loading: autoFetch,
    error: null,
    params: initialParams,
    initialized: false
  });

  // 数据获取函数
  const fetchData = useCallback(async (params?: P) => {
    // 如果已经在加载中并且请求参数没有变化，则不重复请求
    if (state.loading && params === state.params) {
      return;
    }

    // 更新状态为加载中
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      params: params !== undefined ? params : prev.params
    }));

    try {
      // 调用数据获取函数
      const effectiveParams = params !== undefined ? params : state.params;
      const result = await fetcher(effectiveParams);
      
      // 转换数据
      const transformedData = transformer ? transformer(result) : result;
      
      // 更新状态为成功
      setState(prev => ({
        ...prev,
        data: transformedData,
        loading: false,
        initialized: true
      }));

      // 如果有成功回调，则调用
      if (onSuccess) {
        onSuccess(transformedData);
      }

      return transformedData;
    } catch (error) {
      // 转换错误对象
      const errorObject = error instanceof Error ? error : new Error(String(error));
      
      // 更新状态为失败
      setState(prev => ({
        ...prev,
        error: errorObject,
        loading: false
      }));

      // 如果有错误回调，则调用
      if (onError) {
        onError(errorObject);
      }

      throw errorObject;
    }
  }, [fetcher, transformer, state.params, state.loading, onSuccess, onError]);

  // 防抖版数据获取函数
  const debouncedFetchData = useCallback(
    (() => {
      if (debounceTime <= 0) {
        return fetchData;
      }

      let timeoutId: NodeJS.Timeout | null = null;

      return (params?: P) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        return new Promise<T | undefined>((resolve, reject) => {
          timeoutId = setTimeout(() => {
            fetchData(params)
              .then(resolve)
              .catch(reject);
          }, debounceTime);
        });
      };
    })(),
    [fetchData, debounceTime]
  );

  // 设置数据函数
  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    setState(prev => ({
      ...prev,
      data: typeof updater === 'function' 
        ? (updater as ((prev: T | null) => T))(prev.data) 
        : updater
    }));
  }, []);

  // 重置状态函数
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      params: initialParams,
      initialized: false
    });
  }, [initialData, initialParams]);

  // 设置错误函数
  const setError = useCallback((error: Error | null) => {
    setState(prev => ({
      ...prev,
      error
    }));
  }, []);

  // 更新参数函数
  const setParams = useCallback((params: P | ((prev: P | undefined) => P)) => {
    setState(prev => {
      const newParams = typeof params === 'function'
        ? (params as ((prev: P | undefined) => P))(prev.params)
        : params;
      
      return {
        ...prev,
        params: newParams
      };
    });
  }, []);

  // 如果autoFetch为true，则在挂载时自动获取数据
  useEffect(() => {
    // 根据PRD要求删除自动执行搜索的逻辑
    // 搜索只在用户点击搜索按钮时执行，不自动执行
    // 如果autoFetch为true，则在挂载时自动获取数据 - 但不应用于搜索场景
    // if (autoFetch) {
    //  debouncedFetchData();
    // }
  }, [autoFetch, debouncedFetchData]);

  // 返回值
  return {
    // 状态
    ...state,
    
    // 方法
    fetch: debouncedFetchData,
    setData,
    setError,
    setParams,
    reset,
    
    // 计算属性
    isInitialized: state.initialized,
    isLoading: state.loading,
    isError: !!state.error,
    isEmpty: state.initialized && !state.data
  };
}

/**
 * 使用示例:
 * 
 * // 基本用法
 * const recipesResource = useAsyncResourceController({
 *   fetcher: () => fetchRecipes(),
 *   transformer: (data) => data.recipes
 * });
 * 
 * // 带参数的搜索
 * const searchResource = useAsyncResourceController({
 *   fetcher: (params) => fetchRecipes(params),
 *   initialParams: { query: '', page: 1 },
 *   debounceTime: 300
 * });
 * 
 * // 表单提交
 * const formSubmit = useAsyncResourceController({
 *   fetcher: (formData) => submitForm(formData),
 *   autoFetch: false,
 *   onSuccess: (data) => {
 *     showToast('提交成功');
 *     router.push('/success');
 *   },
 *   onError: (error) => {
 *     showToast(`提交失败: ${error.message}`);
 *   }
 * });
 */ 