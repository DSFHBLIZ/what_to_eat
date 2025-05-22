/**
 * 异步操作中间件
 * 为状态管理提供统一的异步操作处理能力
 */

import { create, StateCreator } from 'zustand';
import { observability } from '../../observability';
import { createRequestId } from '../../utils/identifiers';
import { 
  SpanType, 
  SpanStatus, 
  EventTypes
} from '../../types/observability';

// 异步状态接口
export interface AsyncState {
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
}

// 异步操作类型
export type AsyncAction<T> = (...args: any[]) => Promise<T>;

// 异步操作选项
export interface AsyncActionOptions {
  // 操作唯一标识
  id: string;
  // 是否自动清理错误
  autoClearError?: boolean;
  // 自动清理错误延迟(毫秒)
  clearErrorDelay?: number;
  // 是否全局loading
  globalLoading?: boolean;
  // 是否捕获错误
  catchError?: boolean;
  // 是否触发事件
  emitEvents?: boolean;
}

// 定义扩展的AsyncState类型，包含createAsyncAction方法
export interface AsyncStateWithActions<T = any> extends AsyncState {
  createAsyncAction: <R>(action: AsyncAction<R>, options: AsyncActionOptions) => (...args: any[]) => Promise<R>;
}

// 异步操作中间件
export const asyncActionsMiddleware = <T extends AsyncState>(
  config: {
    eventPrefix?: string;
  } = {}
) => (
  create: StateCreator<T>
): StateCreator<T> => {
  // 事件前缀
  const eventPrefix = config.eventPrefix || 'store';
  
  return (set, get, store) => {
    const state = create(set, get, store);
    
    return {
      ...state,
      loading: {},
      errors: {},
      
      // 创建异步操作
      createAsyncAction: <R>(
        action: AsyncAction<R>,
        options: AsyncActionOptions
      ): ((...args: any[]) => Promise<R>) => {
        const { 
          id, 
          autoClearError = true, 
          clearErrorDelay = 5000,
          globalLoading = false,
          catchError = false,
          emitEvents = true
        } = options;
        
        return async (...args: any[]): Promise<R> => {
          let spanId: string | undefined;
          const requestId = createRequestId();
          
          // 设置loading状态
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              [id]: true,
              ...(globalLoading ? { global: true } : {})
            }
          }));
          
          try {
            // 清除之前的错误
            set((state) => ({
              ...state,
              errors: {
                ...state.errors,
                [id]: null
              }
            }));

            // 开始性能跟踪span
            spanId = observability.startSpan(
              `async-action:${id}`, 
              SpanType.OPERATION
            );

            // 触发开始事件
            if (emitEvents) {
              // 使用观测性系统的emitEvent方法直接记录
              observability.emitEvent(EventTypes.STORE_ACTION_STARTED, {
                timestamp: Date.now(),
                metadata: {
                  storeAction: true,
                  id,
                  requestId,
                  prefix: eventPrefix,
                  args
                }
              });
            }

            // 执行异步操作
            const result = await action(...args);

            // 添加成功结果到span
            if (spanId) {
              observability.addSpanEvent(spanId, 'success', { 
                result: typeof result === 'object' ? 'object-result' : result
              });
              observability.endSpan(spanId, SpanStatus.SUCCESS);
            }

            // 触发成功事件
            if (emitEvents) {
              // 使用观测性系统的emitEvent方法直接记录
              observability.emitEvent(EventTypes.STORE_ACTION_SUCCESS, {
                timestamp: Date.now(),
                metadata: {
                  storeAction: true,
                  id,
                  requestId,
                  prefix: eventPrefix,
                  result: typeof result === 'object' ? '[object]' : result,
                  args
                }
              });
            }

            return result;
          } catch (error) {
            // 添加错误信息到span
            if (spanId) {
              observability.addSpanEvent(spanId, 'error', { error });
              observability.endSpan(spanId, SpanStatus.ERROR);
            }
            
            // 设置错误状态
            set((state) => ({
              ...state,
              errors: {
                ...state.errors,
                [id]: error instanceof Error ? error : new Error(String(error))
              }
            }));

            // 触发错误事件
            if (emitEvents) {
              // 使用观测性系统的emitEvent方法直接记录
              observability.emitEvent(EventTypes.STORE_ACTION_ERROR, {
                timestamp: Date.now(),
                metadata: {
                  storeAction: true,
                  id,
                  requestId,
                  prefix: eventPrefix,
                  error: String(error),
                  args,
                  source: 'async-action'
                }
              });
            }

            // 自动清理错误
            if (autoClearError) {
              setTimeout(() => {
                set((state) => ({
                  ...state,
                  errors: {
                    ...state.errors,
                    [id]: null
                  }
                }));
              }, clearErrorDelay);
            }

            if (catchError) {
              return null as unknown as R;
            } else {
              throw error;
            }
          } finally {
            // 清除loading状态
            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                [id]: false,
                ...(globalLoading ? { global: false } : {})
              }
            }));

            // 触发完成事件
            if (emitEvents) {
              // 使用观测性系统的emitEvent方法直接记录
              observability.emitEvent(EventTypes.STORE_ACTION_COMPLETED, {
                timestamp: Date.now(),
                metadata: {
                  storeAction: true,
                  id,
                  requestId,
                  prefix: eventPrefix,
                  args
                }
              });
            }
          }
        };
      },

      // 重置异步状态
      resetAsyncState: () => {
        set((state) => ({
          ...state,
          loading: {},
          errors: {}
        }));
      },
    };
  };
};

// 异步动作钩子
export const createAsyncActionHook = <T extends AsyncStateWithActions>(useStore: () => T) => {
  return <R>(action: AsyncAction<R>, options: AsyncActionOptions) => {
    const store = useStore();
    
    // 获取loading和error状态
    const loading = !!store.loading[options.id];
    const error = store.errors[options.id];
    
    // 创建异步动作
    const asyncAction = store.createAsyncAction(action, options);
    
    return {
      loading,
      error,
      execute: asyncAction,
    };
  };
}; 