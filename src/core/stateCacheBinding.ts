/**
 * 状态缓存绑定系统
 * 实现状态与缓存系统的双向数据同步
 */
import { StateCreator } from 'zustand';
import { eventBus } from './eventBus';
import { cacheManager } from './cache/cacheManager';

// 定义一些辅助函数
const stateUtils = {
  // 根据黑名单和白名单过滤状态
  filterState: (state: any, blacklist: string[] = [], whitelist: string[] = []) => {
    if (whitelist.length > 0) {
      const result: Record<string, any> = {};
      whitelist.forEach(key => {
        if (key in state) {
          result[key] = state[key];
        }
      });
      return result;
    }

    if (blacklist.length > 0) {
      const result = { ...state };
      blacklist.forEach(key => {
        delete result[key];
      });
      return result;
    }

    return state;
  },

  // 深度合并两个对象
  deepMerge: (target: any, source: any): any => {
    if (!source) return target;
    if (!target) return source;

    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = stateUtils.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }
};

// 获取存储适配器
function getStorage(type: 'local' | 'session' | 'memory') {
  switch (type) {
    case 'local':
      return cacheManager;
    case 'session':
      return cacheManager;
    case 'memory':
    default:
      return cacheManager;
  }
}

/**
 * 缓存选项接口
 */
export interface CacheOptions {
  /** 缓存键前缀 */
  prefix?: string;
  /** 缓存存储类型 */
  storage?: 'local' | 'session' | 'memory';
  /** 过期时间（毫秒） */
  expiry?: number;
  /** 是否立即恢复缓存状态 */
  restoreOnInit?: boolean;
  /** 过滤不需要缓存的字段 */
  blacklist?: string[];
  /** 只缓存特定字段 */
  whitelist?: string[];
  /** 序列化方法 */
  serialize?: (value: any) => string;
  /** 反序列化方法 */
  deserialize?: (value: string) => any;
  /** 缓存版本 */
  version?: number;
}

/**
 * 缓存绑定状态接口
 */
export interface WithCache {
  /** 手动保存至缓存 */
  saveToCache: () => boolean;
  /** 从缓存恢复状态 */
  restoreFromCache: () => boolean;
  /** 清除缓存 */
  clearCache: () => boolean;
  /** 缓存信息 */
  _cache: {
    /** 上次保存时间 */
    lastSaved: number | null;
    /** 上次恢复时间 */
    lastRestored: number | null;
    /** 缓存键 */
    key: string;
    /** 是否启用缓存 */
    enabled: boolean;
    /** 缓存版本 */
    version: number;
  };
}

/**
 * 默认缓存选项
 */
const defaultCacheOptions: CacheOptions = {
  prefix: 'app-state',
  storage: 'local',
  expiry: 24 * 60 * 60 * 1000, // 24小时
  restoreOnInit: true,
  blacklist: [],
  whitelist: [],
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  version: 1,
};

// 简化类型定义，使用any解决类型兼容性问题
export const withCache = (f: any, userOptions?: CacheOptions) => (set: any, get: any, store: any) => {
  // 合并选项
  const options = { ...defaultCacheOptions, ...userOptions };
  
  // 缓存键
  const cacheKey = `${options.prefix}:${store.toString()}:v${options.version}`;
  
  // 获取存储器
  const storage = getStorage(options.storage || 'local');
  
  // 创建缓存元数据
  const cacheMetadata = {
    lastSaved: null as number | null,
    lastRestored: null as number | null,
    key: cacheKey,
    enabled: true,
    version: options.version || 1,
  };

  // 保存状态到缓存
  const saveToCache = () => {
    try {
      // 获取当前状态
      const state = get();
      
      // 过滤状态
      const filteredState = stateUtils.filterState(
        state,
        options.blacklist || [],
        options.whitelist || []
      );
      
      // 移除缓存方法
      const { saveToCache, restoreFromCache, clearCache, _cache, ...stateToCache } = filteredState;
      
      // 序列化状态
      const serialized = options.serialize ? options.serialize(stateToCache) : JSON.stringify(stateToCache);
      
      // 保存到缓存
      storage.set(cacheKey, serialized, { ttl: options.expiry });
      
      // 更新缓存元数据
      const now = Date.now();
      set(
        { _cache: { ...cacheMetadata, lastSaved: now } },
        false,
        '@@CACHE/SAVE'
      );
      
      // 发出事件
      (eventBus as any).emit('state:cache:saved', { key: cacheKey, state: stateToCache });
      
      return true;
    } catch (error) {
      console.error('保存状态到缓存时出错:', error);
      (eventBus as any).emit('state:cache:error', { action: 'save', error });
      return false;
    }
  };

  // 从缓存恢复状态
  const restoreFromCache = () => {
    try {
      // 从缓存获取状态
      const cached = storage.get(cacheKey);
      
      if (!cached) {
        (eventBus as any).emit('state:cache:miss', { key: cacheKey });
        return false;
      }
      
      // 反序列化状态
      const deserialized = options.deserialize
        ? options.deserialize(cached as string)
        : JSON.parse(cached as string);
      
      // 如果版本不匹配，清除缓存并返回
      if (deserialized._cacheVersion && deserialized._cacheVersion !== options.version) {
        storage.remove(cacheKey);
        (eventBus as any).emit('state:cache:version-mismatch', {
          key: cacheKey,
          savedVersion: deserialized._cacheVersion,
          currentVersion: options.version,
        });
        return false;
      }
      
      // 获取当前状态
      const currentState = get();
      
      // 深度合并缓存状态和当前状态
      const mergedState = stateUtils.deepMerge(currentState, deserialized);
      
      // 更新状态
      const now = Date.now();
      set(
        {
          ...mergedState,
          _cache: { ...cacheMetadata, lastRestored: now },
        },
        false,
        '@@CACHE/RESTORE'
      );
      
      // 发出事件
      (eventBus as any).emit('state:cache:restored', { key: cacheKey, state: mergedState });
      
      return true;
    } catch (error) {
      console.error('从缓存恢复状态时出错:', error);
      (eventBus as any).emit('state:cache:error', { action: 'restore', error });
      return false;
    }
  };

  // 清除缓存
  const clearCache = () => {
    try {
      storage.remove(cacheKey);
      set(
        { _cache: { ...cacheMetadata, lastSaved: null, lastRestored: null } },
        false,
        '@@CACHE/CLEAR'
      );
      (eventBus as any).emit('state:cache:cleared', { key: cacheKey });
      return true;
    } catch (error) {
      console.error('清除缓存时出错:', error);
      (eventBus as any).emit('state:cache:error', { action: 'clear', error });
      return false;
    }
  };

  // 订阅状态变化
  const unsubscribe = store.subscribe((state: any, prevState: any) => {
    // 跳过缓存操作引起的状态变化
    const action = (store as any).lastAction;
    if (
      action === '@@CACHE/SAVE' ||
      action === '@@CACHE/RESTORE' ||
      action === '@@CACHE/CLEAR'
    ) {
      return;
    }
    
    // 自动保存到缓存
    if (cacheMetadata.enabled) {
      saveToCache();
    }
  });

  // 创建增强的状态创建者
  const stateCreator = f(
    (partial: any, replace?: boolean, action?: string) => set(partial, replace, action), 
    get, 
    store
  );

  // 添加缓存API
  const cacheAPI = {
    saveToCache,
    restoreFromCache,
    clearCache,
    _cache: cacheMetadata,
  };

  // 生成最终状态
  const finalState = {
    ...stateCreator,
    ...cacheAPI,
  };

  // 如果配置为立即从缓存恢复
  if (options.restoreOnInit) {
    setTimeout(() => {
      restoreFromCache();
    }, 0);
  }

  return finalState;
};

/**
 * 创建带缓存功能的状态存储
 */
export function createCachedStore(initialState: any, cacheOptions?: CacheOptions) {
  return (set: any, get: any, api: any) => {
    const state = typeof initialState === 'function' 
      ? initialState(set, get, api)
      : initialState;
    
    return {
      ...state,
    };
  };
}

export default {
  withCache,
  createCachedStore,
}; 