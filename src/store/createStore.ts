import { create, StateCreator } from 'zustand';
import { devtools, persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { eventBus } from '../core/eventBus';
import { CacheOptions } from '../core/cache/cacheManager';
import localCache from '../core/cache/localCache'; 
import sessionCache from '../core/cache/sessionCache';

// 导入CacheManager类型
interface CacheManager {
  set<T>(key: string, value: T, options?: CacheOptions): boolean;
  get<T>(key: string, preferLocal?: boolean): T | undefined;
  remove(key: string): boolean;
  delete?(key: string): boolean; // 兼容接口
}

/**
 * 存储类型
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory' | 'custom';

/**
 * 中间件类型
 */
export type MiddlewareType = 'immer' | 'devtools' | 'persist';

/**
 * 存储引擎接口
 */
export interface StorageEngine {
  getItem: (name: string) => Promise<string | null> | string | null;
  setItem: (name: string, value: string) => Promise<void> | void;
  removeItem: (name: string) => Promise<void> | void;
}

/**
 * 创建存储选项
 */
export interface CreateStoreOptions<T extends object> {
  /** 存储名称 */
  name: string;
  /** 默认值 */
  defaults: T;
  /** 是否启用中间件 */
  middleware?: {
    persist?: boolean;
    immer?: boolean;
    devtools?: boolean;
  };
  /** 持久化选项 */
  persistOptions?: {
    /** 存储类型 */
    storageType?: StorageType;
    /** 自定义存储引擎 */
    customStorage?: StorageEngine;
    /** 自定义缓存管理器 */
    customCache?: CacheManager;
    /** 持久化键前缀 */
    prefix?: string;
    /** 数据版本，版本变更会重置数据 */
    version?: number;
    /** 需要持久化的状态路径 */
    include?: string[];
    /** 不需要持久化的状态路径 */
    exclude?: string[];
    /** 缓存过期时间（分钟） */
    ttlMinutes?: number;
    /** 是否触发缓存事件 */
    emitCacheEvents?: boolean;
  };
  /** 事件前缀 */
  eventPrefix?: string;
  /** 是否启用高级事件 */
  advancedEvents?: boolean;
}

/**
 * 创建通用存储
 * @param options 创建存储的选项
 * @returns Zustand 存储钩子
 */
export function createStore<T extends object>(options: CreateStoreOptions<T>) {
  const {
    name,
    defaults,
    middleware = {
      persist: true,
      immer: true,
      devtools: process.env.NODE_ENV !== 'production',
    },
    persistOptions = {
      storageType: 'localStorage',
      prefix: 'store',
      version: 1,
      ttlMinutes: 60 * 24 * 7, // 默认7天
      emitCacheEvents: true,
    },
    eventPrefix = name,
    advancedEvents = false,
  } = options;

  // 创建状态更新的基础方法
  const createState: StateCreator<
    T & { 
      setState: (newState: Partial<T>, eventData?: Record<string, any>) => void; 
      resetState: () => void;
      subscribeToEvents: (callback: (data: any) => void) => () => void;
    }
  > = (set, get) => ({
    ...defaults,
    setState: (newState: Partial<T>, eventData?: Record<string, any>) => {
      set((state) => {
        const updatedState = { ...state, ...newState };
        
        // 基础状态更新事件
        eventBus.emit('app:notification' as any, {
          message: `${eventPrefix}:updated`,
          type: 'info',
          ...eventData,
        });
        
        // 高级事件：为每个变更的字段触发单独的事件
        if (advancedEvents) {
          Object.keys(newState).forEach(key => {
            eventBus.emit('app:notification' as any, {
              message: `${eventPrefix}:${key}:updated`,
              type: 'info',
              value: (newState as any)[key],
              ...eventData,
            });
          });
        }
        
        return updatedState;
      });
    },
    resetState: () => {
      set(defaults as any);
      eventBus.emit('app:notification' as any, {
        message: `${eventPrefix}:reset`,
        type: 'info',
      });
    },
    subscribeToEvents: (callback) => {
      // 订阅所有相关事件
      const listenerFn = (event: any) => {
        if (event.message === `${eventPrefix}:updated` || 
            event.message === `${eventPrefix}:reset`) {
          callback(event);
        }
      };
      
      // 添加事件监听
      eventBus.on('app:notification' as any, listenerFn);
      
      // 返回清理函数
      return () => {
        eventBus.off('app:notification' as any, listenerFn);
      };
    },
  });

  // 获取自定义存储引擎
  const getCustomStorage = (): StorageEngine | undefined => {
    // 如果提供了自定义存储，则使用自定义存储
    if (persistOptions.customStorage) {
      return persistOptions.customStorage;
    }

    // 如果提供了自定义缓存管理器，则使用其作为存储引擎
    if (persistOptions.customCache) {
      return {
        getItem: async (name) => {
          const value = await persistOptions.customCache?.get(name);
          return value ? JSON.stringify(value) : null;
        },
        setItem: async (name, value) => {
          await persistOptions.customCache?.set(
            name, 
            JSON.parse(value), 
            { ttl: persistOptions.ttlMinutes ? persistOptions.ttlMinutes * 60 * 1000 : undefined }
          );
        },
        removeItem: async (name) => {
          await persistOptions.customCache?.remove(name);
        },
      };
    }

    // 根据存储类型选择存储引擎
    switch (persistOptions.storageType) {
      case 'localStorage':
        return typeof window !== 'undefined'
          ? {
              getItem: (name) => window.localStorage.getItem(name),
              setItem: (name, value) => window.localStorage.setItem(name, value),
              removeItem: (name) => window.localStorage.removeItem(name),
            }
          : undefined;

      case 'sessionStorage':
        return typeof window !== 'undefined'
          ? {
              getItem: (name) => window.sessionStorage.getItem(name),
              setItem: (name, value) => window.sessionStorage.setItem(name, value),
              removeItem: (name) => window.sessionStorage.removeItem(name),
            }
          : undefined;

      case 'indexedDB':
        // 使用localCache作为IndexedDB存储
        return {
          getItem: async (name) => {
            const value = await localCache.get(name);
            return value ? JSON.stringify(value) : null;
          },
          setItem: async (name, value) => {
            await localCache.set(
              name, 
              JSON.parse(value)
            );
          },
          removeItem: async (name) => {
            await localCache.remove(name);
          },
        };

      case 'memory':
        // 使用sessionCache作为内存存储
        return {
          getItem: (name) => {
            const value = sessionCache.get(name);
            return value ? JSON.stringify(value) : null;
          },
          setItem: (name, value) => {
            sessionCache.set(
              name, 
              JSON.parse(value)
            );
          },
          removeItem: (name) => {
            sessionCache.remove(name);
          },
        };

      default:
        return undefined;
    }
  };

  // 创建持久化选项
  const createPersistOptions = (): PersistOptions<any> => {
    // 获取存储名称
    const storeName = `${persistOptions.prefix || 'app'}.${name}`;

    return {
      name: storeName,
      version: persistOptions.version || 1,
      storage: getCustomStorage() as any,
      partialize: (state) => {
        // 如果没有指定 include 和 exclude，则全部持久化
        if (!persistOptions.include && !persistOptions.exclude) {
          // 移除 setState 和 resetState 方法
          const { setState, resetState, subscribeToEvents, ...rest } = state;
          return rest;
        }

        // 如果指定了 include，则只持久化指定的路径
        if (persistOptions.include && persistOptions.include.length > 0) {
          return Object.fromEntries(
            persistOptions.include.map((key) => [key, state[key]])
          );
        }

        // 如果指定了 exclude，则排除指定的路径
        if (persistOptions.exclude && persistOptions.exclude.length > 0) {
          const { setState, resetState, subscribeToEvents, ...rest } = state;
          const result = { ...rest };
          persistOptions.exclude.forEach((key) => {
            delete result[key];
          });
          return result;
        }

        return state;
      },
      onRehydrateStorage: (state) => {
        return (rehydratedState, error) => {
          if (error) {
            console.error(`错误：重新水合${name}存储时出错:`, error);
            eventBus.emit('app:error' as any, {
              message: `${name}存储重新水合出错`,
              code: 'store-rehydrate-error',
              details: error,
            });
          } else {
            console.log(`成功：重新水合${name}存储`);
            eventBus.emit('app:notification' as any, {
              message: `${eventPrefix}:rehydrated`,
              type: 'info',
              store: name,
            });
          }
        };
      },
    };
  };

  // 应用中间件
  let storeCreator = createState;

  // 应用 immer 中间件
  if (middleware.immer) {
    storeCreator = immer(storeCreator as any) as any;
  }

  // 应用 persist 中间件
  if (middleware.persist) {
    storeCreator = persist(storeCreator as any, createPersistOptions()) as any;
  }

  // 应用 devtools 中间件
  if (middleware.devtools) {
    storeCreator = devtools(storeCreator as any, { name }) as any;
  }

  // 创建存储
  return create<T & { 
    setState: (newState: Partial<T>, eventData?: Record<string, any>) => void; 
    resetState: () => void;
    subscribeToEvents: (callback: (data: any) => void) => () => void;
  }>()(
    storeCreator as any
  );
} 