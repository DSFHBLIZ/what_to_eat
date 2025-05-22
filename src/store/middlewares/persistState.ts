/**
 * 增强的状态持久化中间件
 * 提供可配置的持久化能力，支持多存储引擎、压缩和加密
 */

import { StateCreator, StoreApi } from 'zustand';
import { set as setNested, get as getNested, omit, pick } from 'lodash';

// 持久化存储引擎接口
export interface PersistenceStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

// 压缩器接口
export interface Compressor {
  compress(data: string): string;
  decompress(data: string): string;
}

// 加密器接口
export interface Encryptor {
  encrypt(data: string): string;
  decrypt(data: string): string;
}

// 持久化配置
export interface PersistenceConfig<T> {
  // 存储键名
  name: string;
  // 存储引擎，默认localStorage
  storage?: PersistenceStorage;
  // 版本号
  version?: number;
  // 迁移函数
  migrate?: (persistedState: any, version: number) => T;
  // 合并函数
  merge?: (persistedState: any, currentState: T) => T;
  // 筛选函数，确定哪些状态需要持久化
  partialize?: (state: T) => Partial<T>;
  // 白名单路径
  include?: string[];
  // 黑名单路径
  exclude?: string[];
  // 压缩器
  compressor?: Compressor;
  // 加密器
  encryptor?: Encryptor;
  // 是否启用调试日志
  debug?: boolean;
  // 序列化函数
  serialize?: (state: any) => string;
  // 反序列化函数
  deserialize?: (str: string) => any;
  // 是否启用自动存储
  autoStorage?: boolean;
  // 存储延迟(毫秒)，用于性能优化
  storageDelay?: number;
  // 是否存储增量
  storeIncremental?: boolean;
}

// 基本localStorage存储引擎
export const createLocalStorage = (): PersistenceStorage => ({
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item to localStorage:', error);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }
});

// 基本sessionStorage存储引擎
export const createSessionStorage = (): PersistenceStorage => ({
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from sessionStorage:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item to sessionStorage:', error);
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from sessionStorage:', error);
    }
  }
});

// 内存存储引擎，用于测试或临时存储
export const createMemoryStorage = (): PersistenceStorage => {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => { store.set(key, value); },
    removeItem: (key) => { store.delete(key); }
  };
};

// 持久化中间件
export const enhancedPersist = <T extends object>(
  config: PersistenceConfig<T>
) => (
  baseCreate: StateCreator<T, [], []>
): StateCreator<T, [], []> => {
  type ExtendedState = T & {
    _persist?: {
      version: number;
      lastUpdated: number;
      rehydrated: boolean;
    };
  };

  return (set, get, api) => {
    // 默认配置
    const options: Required<PersistenceConfig<T>> = {
      name: config.name,
      storage: config.storage || createLocalStorage(),
      version: config.version || 0,
      migrate: config.migrate || ((persistedState: any, _version: number) => persistedState as T),
      merge: config.merge || ((persistedState: any, currentState: T) => ({ ...currentState, ...persistedState })),
      partialize: config.partialize || ((state: T) => state),
      include: config.include || [],
      exclude: config.exclude || [],
      compressor: config.compressor || {
        compress: (data: string) => data,
        decompress: (data: string) => data
      },
      encryptor: config.encryptor || {
        encrypt: (data: string) => data,
        decrypt: (data: string) => data
      },
      debug: config.debug || false,
      serialize: config.serialize || JSON.stringify,
      deserialize: config.deserialize || JSON.parse,
      autoStorage: config.autoStorage !== undefined ? config.autoStorage : true,
      storageDelay: config.storageDelay || 0,
      storeIncremental: config.storeIncremental || false
    };

    // 存储键
    const storageKey = options.name;
    // 元数据键
    const metaKey = `${options.name}_meta`;

    // 存储延迟定时器
    let storageTimer: ReturnType<typeof setTimeout> | null = null;

    // 调试日志
    const log = (...args: any[]) => {
      if (options.debug) {
        console.log(`[persist:${options.name}]`, ...args);
      }
    };

    // 获取应持久化的状态
    const getStateToSave = (state: T): Partial<T> => {
      let partializedState = options.partialize(state);

      // 应用白名单
      if (options.include.length > 0) {
        const stateToStore: Partial<T> = {};
        options.include.forEach(path => {
          const value = getNested(partializedState, path);
          if (value !== undefined) {
            setNested(stateToStore, path, value);
          }
        });
        partializedState = stateToStore;
      }

      // 应用黑名单
      if (options.exclude.length > 0) {
        options.exclude.forEach(path => {
          if (getNested(partializedState, path) !== undefined) {
            // 如果是顶级属性，直接从对象中移除
            if (!path.includes('.')) {
              partializedState = omit(partializedState, [path]) as Partial<T>;
            } else {
              // 否则设置为undefined（在序列化时会被忽略）
              setNested(partializedState, path, undefined);
            }
          }
        });
      }

      return partializedState;
    };

    // 将状态持久化到存储
    const persistState = async (state: T): Promise<void> => {
      try {
        const stateToSave = getStateToSave(state);
        
        // 存储元数据
        const metadata = {
          version: options.version,
          lastUpdated: Date.now()
        };
        
        // 序列化、压缩和加密
        const serialized = options.serialize(stateToSave);
        const compressed = options.compressor.compress(serialized);
        const encrypted = options.encryptor.encrypt(compressed);
        
        // 存储到存储引擎
        await options.storage.setItem(storageKey, encrypted);
        await options.storage.setItem(metaKey, options.serialize(metadata));
        
        log('State persisted:', stateToSave);
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    };

    // 防抖存储
    const debouncedPersistState = (state: T): void => {
      if (storageTimer) {
        clearTimeout(storageTimer);
      }
      
      if (options.storageDelay > 0) {
        storageTimer = setTimeout(() => persistState(state), options.storageDelay);
      } else {
        persistState(state);
      }
    };

    // 从存储中恢复状态
    const rehydrate = async (): Promise<void> => {
      try {
        // 获取存储的数据
        const persistedData = await options.storage.getItem(storageKey);
        const metaData = await options.storage.getItem(metaKey);
        
        // 如果没有数据，直接返回
        if (!persistedData) {
          set((state) => ({
            ...state,
            _persist: {
              version: options.version,
              lastUpdated: Date.now(),
              rehydrated: true
            }
          }));
          log('No persisted state found');
          return;
        }
        
        // 解密、解压缩和反序列化
        const decrypted = options.encryptor.decrypt(persistedData);
        const decompressed = options.compressor.decompress(decrypted);
        const parsedState = options.deserialize(decompressed);
        
        // 解析元数据
        const metadata = metaData ? options.deserialize(metaData) : { version: 0 };
        const persistedVersion = metadata.version || 0;
        
        // 执行迁移
        let migratedState;
        if (persistedVersion !== options.version) {
          log(`Version mismatch: stored ${persistedVersion}, current ${options.version}. Migrating...`);
          migratedState = options.migrate(parsedState, persistedVersion);
        } else {
          migratedState = parsedState;
        }
        
        // 合并状态
        const currentState = get();
        const mergedState = options.merge(migratedState, currentState);
        
        // 更新状态
        set({
          ...mergedState,
          _persist: {
            version: options.version,
            lastUpdated: Date.now(),
            rehydrated: true
          }
        });
        
        log('State rehydrated:', mergedState);
      } catch (error) {
        console.error('Error rehydrating state:', error);
        set((state) => ({
          ...state,
          _persist: {
            version: options.version,
            lastUpdated: Date.now(),
            rehydrated: true
          }
        }));
      }
    };

    // 初始化状态
    const initialState = baseCreate(set, get, api);

    // 开始重新水合状态
    rehydrate();

    // 自动持久化
    if (options.autoStorage) {
      const unsubscribe = api.subscribe((state) => {
        // 只有水合后才自动存储
        if ((state as ExtendedState)._persist?.rehydrated) {
          debouncedPersistState(state);
        }
      });
    }

    return {
      ...initialState,
      _persist: {
        version: options.version,
        lastUpdated: Date.now(),
        rehydrated: false
      },
      
      // 手动持久化当前状态
      persistState: (): void => {
        persistState(get());
      },
      
      // 清除持久化状态
      clearPersistedState: async (): Promise<void> => {
        await options.storage.removeItem(storageKey);
        await options.storage.removeItem(metaKey);
        log('Persisted state cleared');
      },
      
      // 重新水合状态
      rehydrateState: (): Promise<void> => {
        return rehydrate();
      }
    };
  };
}; 