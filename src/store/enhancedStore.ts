/**
 * 增强的Zustand存储管理
 * 提供统一的状态管理接口和命名规范
 */

import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { Draft } from 'immer';

// 确保所有slicer都有一致的命名
export interface BaseState {
  // 每个slice都必须有一个唯一标识符
  sliceId: string;
}

// 标准化的action命名规则
type ActionName<T extends string> = `set${Capitalize<T>}` | `reset${Capitalize<T>}` | `toggle${Capitalize<T>}`;

/**
 * 创建一个标准的状态setter
 * @param set 状态设置函数
 * @param property 要设置的属性
 * @returns 标准化的setter函数
 */
export function createSetter<T extends object, K extends keyof T>(
  set: (fn: (state: T) => void | Partial<T>) => void,
  property: K
): (value: T[K]) => void {
  const capitalizedKey = property.toString().charAt(0).toUpperCase() + property.toString().slice(1);
  const setterName = `set${capitalizedKey}` as ActionName<K & string>;
  
  const setter = (value: T[K]) => {
    set((state) => {
      state[property] = value;
      return {}; // 返回空对象以满足类型要求
    });
  };
  
  // 将函数名重命名为符合规范的名称
  Object.defineProperty(setter, 'name', { value: setterName });
  
  return setter;
}

/**
 * 创建一个标准的状态toggler
 * @param set 状态设置函数
 * @param property 要切换的属性
 * @returns 标准化的toggler函数
 */
export function createToggler<T extends object, K extends keyof T>(
  set: (fn: (state: T) => void | Partial<T>) => void,
  property: K
): () => void {
  const capitalizedKey = property.toString().charAt(0).toUpperCase() + property.toString().slice(1);
  const togglerName = `toggle${capitalizedKey}` as ActionName<K & string>;
  
  const toggler = () => {
    set((state) => {
      // 确保属性是布尔类型
      if (typeof state[property] === 'boolean') {
        (state[property] as unknown as boolean) = !(state[property] as unknown as boolean);
      }
      return {}; // 返回空对象以满足类型要求
    });
  };
  
  // 将函数名重命名为符合规范的名称
  Object.defineProperty(toggler, 'name', { value: togglerName });
  
  return toggler;
}

/**
 * 创建一个标准的状态重置器
 * @param set 状态设置函数
 * @param property 要重置的属性
 * @param defaultValue 默认值
 * @returns 标准化的重置函数
 */
export function createResetter<T extends object, K extends keyof T>(
  set: (fn: (state: T) => void | Partial<T>) => void,
  property: K,
  defaultValue: T[K]
): () => void {
  const capitalizedKey = property.toString().charAt(0).toUpperCase() + property.toString().slice(1);
  const resetterName = `reset${capitalizedKey}` as ActionName<K & string>;
  
  const resetter = () => {
    set((state) => {
      state[property] = defaultValue;
      return {}; // 返回空对象以满足类型要求
    });
  };
  
  // 将函数名重命名为符合规范的名称
  Object.defineProperty(resetter, 'name', { value: resetterName });
  
  return resetter;
}

// 切片选项接口
export interface SliceOptions<T extends object> {
  // 切片名称
  name: string;
  // 初始状态
  initialState: T;
  // 选择器
  selectors?: Record<string, (state: T) => any>;
  // 动作创建器
  actions?: Record<string, (state: Draft<T>, ...args: any[]) => void>;
  // 是否持久化
  persist?: boolean | PersistOptions<T, Partial<T>>;
  // 是否启用开发工具
  devtools?: boolean;
  // 是否启用immer
  immer?: boolean;
}

// 标准化配置项
interface EnhancedStoreConfig<T> {
  name: string;
  sliceId?: string;
  persist?: boolean | PersistOptions<T, Partial<T>>;
  devtools?: boolean;
  immer?: boolean;
}

/**
 * 创建增强的Zustand存储
 * 自动应用immer和devtools等中间件
 * @param config 存储配置
 * @param initialState 初始状态
 * @returns 增强的Zustand存储
 */
export function createEnhancedStore<T extends object>(
  config: EnhancedStoreConfig<T>,
  initialState: T
): UseBoundStore<StoreApi<T>> {
  // 确保状态有sliceId
  if (config.sliceId && !('sliceId' in initialState)) {
    (initialState as any).sliceId = config.sliceId;
  }
  
  type TState = T;
  
  // 创建状态
  const createState: StateCreator<TState> = (set, get) => initialState;
  
  // 中间件链
  let middleware = createState;
  
  // 应用immer中间件
  if (config.immer !== false) {
    middleware = immer(middleware as any) as any;
  }
  
  // 应用devtools中间件
  if (config.devtools !== false) {
    middleware = devtools(middleware, { name: config.name }) as any;
  }
  
  // 应用persist中间件
  if (config.persist) {
    const persistOptions = typeof config.persist === 'boolean'
      ? { name: `${config.name}-storage` }
      : config.persist;
    
    middleware = persist(middleware, persistOptions) as any;
  }
  
  // 创建存储
  return create<TState>()(middleware);
}

/**
 * 创建状态切片
 * @param options 切片选项
 * @returns 切片对象
 */
export function createSlice<T extends object>(options: SliceOptions<T>) {
  const { 
    name, 
    initialState, 
    selectors = {}, 
    actions = {}, 
    persist: persistOption, 
    devtools, 
    immer = true 
  } = options;
  
  // 创建store
  const useStore = createEnhancedStore<T>(
    { 
      name,
      sliceId: name,
      persist: persistOption,
      devtools,
      immer
    },
    initialState
  );
  
  // 绑定actions
  const boundActions: Record<string, (...args: any[]) => any> = {};
  
  for (const actionName in actions) {
    boundActions[actionName] = (...args: any[]) => {
      useStore.setState((state) => {
        actions[actionName](state as Draft<T>, ...args);
        return {};
      });
    };
  }
  
  // 绑定selectors
  const boundSelectors: Record<string, (state?: T) => any> = {};
  
  for (const selectorName in selectors) {
    boundSelectors[selectorName] = (state?: T) => {
      const currentState = state || useStore.getState();
      return selectors[selectorName](currentState);
    };
  }
  
  // 返回增强的store
  return {
    useStore,
    name,
    actions: boundActions,
    selectors: boundSelectors,
    getState: useStore.getState,
    setState: useStore.setState,
    subscribe: useStore.subscribe,
    reset: () => useStore.setState(initialState)
  };
}

/**
 * 合并多个切片
 * @param slices 切片列表
 * @returns 合并后的store
 */
export function combineSlices<T extends object>(
  name: string,
  slices: ReturnType<typeof createSlice>[]
): UseBoundStore<StoreApi<T>> {
  // 合并初始状态
  const initialState = {} as T;
  
  // 合并所有切片的初始状态
  slices.forEach((slice) => {
    (initialState as any)[slice.name] = slice.getState();
  });
  
  // 创建合并后的store
  const useStore = createEnhancedStore<T>(
    { name },
    initialState
  );
  
  // 添加订阅，同步各个切片的状态
  slices.forEach((slice) => {
    // 订阅合并store的变化，更新切片
    useStore.subscribe((state) => {
      const sliceState = (state as any)[slice.name];
      if (sliceState) {
        const currentState = slice.getState();
        if (sliceState !== currentState) {
          slice.setState(sliceState);
        }
      }
    });
    
    // 订阅切片的变化，更新合并store
    slice.subscribe((state) => {
      useStore.setState({
        ...useStore.getState(),
        [slice.name]: state
      } as Partial<T>);
    });
  });
  
  return useStore;
}

/**
 * 统一的状态管理工具
 * 提供了统一的接口来创建不同类型的状态管理工具
 */
export const storeManager = {
  /**
   * 创建一个新的增强存储
   */
  createStore: createEnhancedStore,
  
  /**
   * 创建一个状态切片
   */
  createSlice,
  
  /**
   * 合并多个状态切片
   */
  combineSlices,
  
  /**
   * 辅助函数：创建标准的setter
   */
  createSetter,
  
  /**
   * 辅助函数：创建标准的toggler
   */
  createToggler,
  
  /**
   * 辅助函数：创建标准的resetter
   */
  createResetter
};

// 导出storeManager作为默认导出
export default storeManager; 