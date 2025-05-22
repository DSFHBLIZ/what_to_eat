/**
 * 组合状态中间件
 * 提供状态组合功能，支持从多个状态源派生复合状态
 */

import { StateCreator, StoreApi, create } from 'zustand';

// 状态选择器类型
export type StateSelector<S, T> = (state: S) => T;

// 状态转换器类型
export type StateTransformer<T, R> = (selected: T) => R;

// 状态监听器类型
export type StateListener<T> = (state: T, prevState: T | null) => void;

// 状态依赖选项
export interface StateDependencyOptions<S, T> {
  // 状态选择器
  selector: StateSelector<S, T>;
  // 状态转换器
  transformer?: StateTransformer<T, any>;
  // 相等性比较函数
  equalityFn?: (a: T, b: T) => boolean;
}

// 派生状态选项
export interface DerivedStateOptions<T> {
  // 状态键
  key: string;
  // 依赖状态列表
  dependencies: any[];
  // 组合函数
  compute: (...deps: any[]) => T;
  // 初始值
  initial?: T;
  // 是否惰性计算
  lazy?: boolean;
  // 相等性比较函数
  equalityFn?: (a: T, b: T) => boolean;
}

// 组合状态中间件
export const composableStateMiddleware = () => <T extends object>(
  baseCreate: StateCreator<T, [], []>
): StateCreator<T, [], []> => {
  return (set, get, api) => {
    // 获取基础状态和方法
    const baseState = baseCreate(set, get, api);
    
    // 存储派生状态定义
    const derivedStates = new Map<string, DerivedStateOptions<any>>();
    
    // 存储状态依赖
    const stateDependencies = new Map<string, StateDependencyOptions<any, any>[]>();
    
    // 存储依赖监听器清理函数
    const dependencyCleanups = new Map<string, (() => void)[]>();
    
    // 计算派生状态的当前值
    const computeDerivedState = <R>(options: DerivedStateOptions<R>): R => {
      const { dependencies, compute } = options;
      const dependencyValues = dependencies.map(dep => 
        typeof dep === 'function' ? dep(get()) : dep
      );
      return compute(...dependencyValues);
    };
    
    // 更新派生状态
    const updateDerivedState = (key: string): void => {
      const options = derivedStates.get(key);
      if (!options) return;
      
      const currentValue = (get() as any)[key];
      const newValue = computeDerivedState(options);
      
      // 只有当值变化时才更新
      if (options.equalityFn ? !options.equalityFn(currentValue, newValue) : currentValue !== newValue) {
        set((state) => ({
          ...state,
          [key]: newValue
        }));
      }
    };
    
    return {
      ...baseState,
      
      // 添加派生状态
      addDerivedState: <R>(options: DerivedStateOptions<R>): void => {
        const { key, initial, lazy = false } = options;
        
        // 存储派生状态定义
        derivedStates.set(key, options);
        
        // 设置初始值
        const initialValue = lazy ? (initial as R) : computeDerivedState(options);
        set((state) => ({
          ...state,
          [key]: initialValue
        }));
        
        // 清理之前的依赖监听器
        if (dependencyCleanups.has(key)) {
          dependencyCleanups.get(key)?.forEach(cleanup => cleanup());
          dependencyCleanups.delete(key);
        }
        
        // 注册依赖监听
        const cleanups: (() => void)[] = [];
        
        // 添加存储监听器
        const unsubscribe = api.subscribe(
          (state, prevState) => {
            // 使用自定义的相等性检查来确定依赖是否变化
            const oldDeps = options.dependencies.map(dep => 
              typeof dep === 'function' ? dep(prevState) : dep
            );
            const newDeps = options.dependencies.map(dep => 
              typeof dep === 'function' ? dep(state) : dep
            );
            
            // 使用自定义相等性检查
            if (JSON.stringify(oldDeps) !== JSON.stringify(newDeps)) {
              updateDerivedState(key);
            }
          }
        );
        
        cleanups.push(unsubscribe);
        dependencyCleanups.set(key, cleanups);
      },
      
      // 移除派生状态
      removeDerivedState: (key: string): void => {
        // 清理依赖监听器
        if (dependencyCleanups.has(key)) {
          dependencyCleanups.get(key)?.forEach(cleanup => cleanup());
          dependencyCleanups.delete(key);
        }
        
        // 移除派生状态定义
        derivedStates.delete(key);
        
        // 从状态中移除
        set((state) => {
          const newState = { ...state };
          delete (newState as any)[key];
          return newState;
        });
      },
      
      // 添加状态依赖
      addStateDependency: <S, R>(
        storeGetter: () => S,
        options: StateDependencyOptions<S, R> & { key: string }
      ): () => void => {
        const { key, selector, transformer, equalityFn } = options;
        
        // 存储依赖定义
        if (!stateDependencies.has(key)) {
          stateDependencies.set(key, []);
        }
        stateDependencies.get(key)!.push({
          selector,
          transformer,
          equalityFn
        });
        
        // 获取外部存储
        const externalStore = storeGetter();
        let lastValue: R | null = null;
        
        // 订阅外部存储变化
        const unsubscribe = (externalStore as any).subscribe(
          (state: S) => selector(state),
          (selectedValue: R) => {
            const transformedValue = transformer ? transformer(selectedValue) : selectedValue;
            
            // 只有当值变化时才更新
            if (!lastValue || (equalityFn ? !equalityFn(lastValue, selectedValue) : lastValue !== selectedValue)) {
              lastValue = selectedValue;
              
              set((state) => ({
                ...state,
                [key]: transformedValue
              }));
            }
          }
        );
        
        // 初始更新
        const initialValue = selector(externalStore as any);
        const transformedInitialValue = transformer ? transformer(initialValue) : initialValue;
        lastValue = initialValue;
        
        set((state) => ({
          ...state,
          [key]: transformedInitialValue
        }));
        
        // 返回清理函数
        return unsubscribe;
      },
      
      // 从依赖创建派生状态
      createStateFromDependencies: <S, R>(
        storeGetters: Array<() => any>,
        options: {
          key: string;
          selectors: Array<(state: any) => any>;
          combine: (...values: any[]) => R;
          equalityFn?: (a: R, b: R) => boolean;
        }
      ): () => void => {
        const { key, selectors, combine, equalityFn } = options;
        
        let lastValues: any[] = [];
        let lastResult: R | null = null;
        const unsubscribes: Array<() => void> = [];
        
        // 检查和更新
        const checkAndUpdate = () => {
          const combinedResult = combine(...lastValues);
          
          if (!lastResult || (equalityFn ? !equalityFn(lastResult, combinedResult) : lastResult !== combinedResult)) {
            lastResult = combinedResult;
            
            set((state) => ({
              ...state,
              [key]: combinedResult
            }));
          }
        };
        
        // 订阅每个存储
        storeGetters.forEach((getStore, index) => {
          const store = getStore();
          const selector = selectors[index];
          
          lastValues[index] = selector(store.getState());
          
          const unsubscribe = store.subscribe(
            (state: any) => selector(state),
            (value: any) => {
              lastValues[index] = value;
              checkAndUpdate();
            }
          );
          
          unsubscribes.push(unsubscribe);
        });
        
        // 初始更新
        checkAndUpdate();
        
        // 返回清理函数
        return () => unsubscribes.forEach(unsub => unsub());
      }
    };
  };
}; 