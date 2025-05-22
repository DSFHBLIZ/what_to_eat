/**
 * Slice 工厂函数
 * 提供统一的状态切片创建方式
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// 定义动作类型
export type Actions<T> = Record<string, (state: T, ...args: any[]) => T | void | Promise<any>>;

// 定义选择器类型
export type Selectors<T> = Record<string, (state: T) => any>;

// 定义 createSlice 参数类型
export interface SliceOptions<T> {
  name: string;
  initialState: T;
  persist?: boolean | {
    name?: string;
    partialize?: (state: T) => Partial<T>;
  };
  actions?: Actions<T>;
  selectors?: Selectors<T>;
}

/**
 * 创建统一风格的状态切片
 * 
 * @param options 切片配置选项
 * @returns 状态store及相关操作
 */
export function createSlice<T extends object>(options: SliceOptions<T>) {
  const {
    name,
    initialState,
    persist: persistOptions = false,
    actions = {},
    selectors = {}
  } = options;
  
  // 创建状态
  type StoreState = T & { actions: Record<string, Function> };
  
  let storeCreator = (set: any, get: any) => {
    // 包装actions，添加state参数并应用到set
    const wrappedActions: Record<string, Function> = {};
    
    Object.entries(actions).forEach(([key, action]) => {
      wrappedActions[key] = (...args: any[]) => {
        const state = get();
        const result = action(state, ...args);
        
        // 如果返回了新的状态，则更新
        if (result && typeof result === 'object' && !isPromise(result)) {
          set(result, `${name}/${key}`);
        }
        
        return result;
      };
    });
    
    return {
      ...initialState,
      actions: wrappedActions
    };
  };
  
  // 使用immer中间件
  storeCreator = immer(storeCreator as any) as any;
  
  // 使用持久化中间件
  if (persistOptions) {
    const persistConfig = typeof persistOptions === 'object' 
      ? {
          name: persistOptions.name || `${name}-storage`,
          partialize: persistOptions.partialize
        }
      : { name: `${name}-storage` };
      
    storeCreator = persist(storeCreator as any, persistConfig) as any;
  }
  
  // 使用开发工具中间件
  storeCreator = devtools(storeCreator as any, { name }) as any;
  
  // 创建store
  const useStore = create<StoreState>(storeCreator);
  
  // 创建访问状态的钩子（不含actions）
  const useState = () => {
    // 获取完整状态
    const fullState = useStore.getState();
    
    // 创建不包含actions的新对象
    const stateWithoutActions: Partial<T> = {};
    
    // 复制初始状态的所有属性
    Object.keys(initialState).forEach(key => {
      const typedKey = key as keyof T;
      stateWithoutActions[typedKey] = fullState[key as keyof typeof fullState] as T[keyof T];
    });
    
    return stateWithoutActions as T;
  };
  
  // 创建访问actions的函数（不使用hook）
  const getActions = () => {
    const store = useStore.getState();
    return Object.keys(actions).reduce((acc, key) => {
      // 使用类型安全的方式访问
      if (store.actions && typeof store.actions[key] === 'function') {
        acc[key] = (...args: any[]) => useStore.getState().actions[key](...args);
      }
      return acc;
    }, {} as Record<string, Function>);
  };
  
  // 创建访问selectors的函数（移除hook调用）
  const getSelectors = () => {
    return Object.keys(selectors).reduce((acc, key) => {
      // 创建选择器函数
      acc[key] = (customState?: T) => {
        // 如果提供了自定义状态使用它，否则使用getState获取状态
        if (customState) {
          return selectors[key](customState);
        }
        
        // 安全地获取状态
        const fullState = useStore.getState();
        // 从初始状态中提取字段创建一个干净的状态对象
        const cleanState: Partial<T> = {};
        for (const k in initialState) {
          if (k in fullState) {
            cleanState[k as keyof T] = fullState[k as keyof typeof fullState] as T[keyof T];
          }
        }
        
        return selectors[key](cleanState as T);
      };
      return acc;
    }, {} as Record<string, (customState?: T) => any>);
  };
  
  return {
    useStore,
    useState,
    actions: getActions(),
    selectors: getSelectors()
  };
}

// 辅助函数：检查是否为Promise
function isPromise(obj: any): boolean {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

/**
 * 合并多个切片
 * 
 * @param rootName 根存储名称
 * @param slices 要合并的切片列表
 * @returns 合并后的store钩子
 */
export function combineSlices(rootName: string, slices: ReturnType<typeof createSlice>[]) {
  // TODO: 实现切片合并逻辑
  throw new Error("切片合并功能尚未实现");
}

/**
 * 常用操作创建器
 */
export const actionCreators = {
  /**
   * 创建一个简单的setter
   * 
   * @param key 要设置的状态键
   */
  createSetter: <T, K extends keyof T>(key: K) => 
    (set: Function) => (value: T[K]) => 
      set((state: T) => ({ [key]: value }), `set:${String(key)}`),
  
  /**
   * 创建一个简单的toggler
   * 
   * @param key 要切换的布尔状态键
   */
  createToggler: <T>(key: keyof T) => 
    (set: Function, get: Function) => () => 
      set((state: T) => ({ [key]: !state[key] }), `toggle:${String(key)}`),
  
  /**
   * 创建一个数组项添加器
   * 
   * @param key 数组状态键
   */
  createArrayAdder: <T, K extends keyof T>(key: K) => 
    (set: Function) => (item: T[K] extends Array<infer I> ? I : never) => 
      set((state: T) => {
        const array = [...(state[key] as any)];
        array.push(item);
        return { [key]: array };
      }, `add:${String(key)}`),
  
  /**
   * 创建一个数组项移除器
   * 
   * @param key 数组状态键
   * @param predicate 用于标识要移除项的函数
   */
  createArrayRemover: <T, K extends keyof T, I = T[K] extends Array<infer U> ? U : never>(
    key: K, 
    predicate: (item: I, index: number) => boolean
  ) => 
    (set: Function) => () => 
      set((state: T) => {
        const array = [...(state[key] as any)];
        const filteredArray = array.filter((item, index) => !predicate(item, index));
        return { [key]: filteredArray };
      }, `remove:${String(key)}`)
};

export default createSlice; 