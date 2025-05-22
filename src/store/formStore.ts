/**
 * 表单状态管理
 * 提供表单状态持久化、验证和管理
 */

import { createEnhancedStore } from './enhancedStore';
import cacheManager from '../core/cache/cacheManager';

// 表单状态接口
export interface FormState {
  // 表单标识符
  id: string;
  // 表单数据
  values: Record<string, any>;
  // 表单错误
  errors: Record<string, string>;
  // 表单是否有效
  isValid: boolean;
  // 表单是否已修改
  isDirty: boolean;
  // 表单是否已提交
  isSubmitted: boolean;
  // 表单是否正在提交
  isSubmitting: boolean;
  // 是否启用验证
  validationEnabled: boolean;
  // 持久化配置
  persistence: {
    enabled: boolean;
    key: string | null;
    excludeFields: string[];
    expires: number | null;
  };
  // 表单加载状态
  initialized: boolean;
  // 表单提交次数
  submitCount: number;
  // 表单内部状态
  internalState: Record<string, any>;
}

// 创建表单存储的初始状态
const createFormInitialState = (id: string): FormState => ({
  id,
  values: {},
  errors: {},
  isValid: false,
  isDirty: false,
  isSubmitted: false,
  isSubmitting: false,
  validationEnabled: true,
  persistence: {
    enabled: false,
    key: null,
    excludeFields: [],
    expires: null
  },
  initialized: false,
  submitCount: 0,
  internalState: {}
});

/**
 * 创建表单存储
 * @param id 表单标识符
 * @returns 表单存储对象
 */
export const createFormStore = (id: string) => {
  // 创建增强的存储
  const useFormStore = createEnhancedStore<FormState>(
    {
      name: `form-${id}`,
      persist: false,
      immer: true,
      devtools: true,
    },
    createFormInitialState(id)
  );
  
  // 从缓存加载表单状态
  async function loadFormState(): Promise<Record<string, any> | null> {
    try {
      const formState = cacheManager.get<FormState['values']>(`form-${id}`);
      return formState || null;
    } catch (error) {
      console.error('加载表单状态失败:', error);
      return null;
    }
  }
  
  // 保存表单状态到缓存
  function saveFormState(formState: FormState): void {
    if (!formState.persistence.enabled) return;
    
    try {
      const key = formState.persistence.key || `form-${formState.id}`;
      const ttl = formState.persistence.expires || undefined;
      
      // 如果有排除字段，从值中移除
      let valuesToSave = { ...formState.values };
      if (formState.persistence.excludeFields.length > 0) {
        for (const field of formState.persistence.excludeFields) {
          delete valuesToSave[field];
        }
      }
      
      cacheManager.set(key, valuesToSave, { ttl });
    } catch (error) {
      console.error('保存表单状态失败:', error);
    }
  }
  
  // 清除表单状态
  function clearFormState(): void {
    try {
      cacheManager.remove(`form-${id}`);
    } catch (error) {
      console.error('清除表单状态失败:', error);
    }
  }
  
  return {
    useStore: useFormStore,
    getState: useFormStore.getState,
    setState: useFormStore.setState,
    actions: {
      // 设置表单值
      setValues: (values: Record<string, any>) => {
        useFormStore.setState(state => {
          state.values = { ...state.values, ...values };
          state.isDirty = true;
          
          // 保存表单
          saveFormState(state);
          
          return state;
        });
      },
      
      // 设置单个表单值
      setValue: (field: string, value: any) => {
        useFormStore.setState(state => {
          state.values[field] = value;
          state.isDirty = true;
          
          // 保存表单
          saveFormState(state);
          
          return state;
        });
      },
      
      // 设置表单错误
      setErrors: (errors: Record<string, string>) => {
        useFormStore.setState(state => {
          state.errors = errors;
          state.isValid = Object.keys(errors).length === 0;
          return state;
        });
      },
      
      // 设置单个表单错误
      setError: (field: string, error: string | null) => {
        useFormStore.setState(state => {
          if (error === null) {
            delete state.errors[field];
          } else {
            state.errors[field] = error;
          }
          state.isValid = Object.keys(state.errors).length === 0;
          return state;
        });
      },
      
      // 重置表单
      resetForm: () => {
        useFormStore.setState(state => {
          state.values = {};
          state.errors = {};
          state.isValid = false;
          state.isDirty = false;
          state.isSubmitted = false;
          state.isSubmitting = false;
          return state;
        });
        
        // 清除表单缓存
        clearFormState();
      },
      
      // 提交表单
      submitForm: async (submitFn: (values: Record<string, any>) => Promise<void>) => {
        const { values } = useFormStore.getState();
        
        useFormStore.setState(state => {
          state.isSubmitting = true;
          state.submitCount += 1;
          return state;
        });
        
        try {
          await submitFn(values);
          
          useFormStore.setState(state => {
            state.isSubmitting = false;
            state.isSubmitted = true;
            return state;
          });
          
          // 清除表单缓存
          clearFormState();
          
          return { success: true };
        } catch (error) {
          useFormStore.setState(state => {
            state.isSubmitting = false;
            return state;
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      },
      
      // 初始化表单
      initForm: async (initialValues?: Record<string, any>) => {
        // 尝试从缓存加载表单状态
        const cachedState = await loadFormState();
        
        if (cachedState) {
          // 使用缓存状态
          useFormStore.setState(state => {
            state.values = cachedState;
            state.initialized = true;
            return state;
          });
        } else if (initialValues) {
          // 使用初始值
          useFormStore.setState(state => {
            state.values = initialValues;
            state.initialized = true;
            return state;
          });
        } else {
          // 标记为已初始化，但没有任何值
          useFormStore.setState(state => {
            state.initialized = true;
            return state;
          });
        }
      },
      
      // 设置持久化选项
      setPersistenceOptions: (options: Partial<FormState['persistence']>) => {
        useFormStore.setState(state => {
          state.persistence = {
            ...state.persistence,
            ...options
          };
          
          // 如果启用了持久化，存储当前状态
          if (state.persistence.enabled) {
            saveFormState(state);
          }
          
          return state;
        });
      },
      
      // 启用持久化
      enablePersistence: (key?: string, expires?: number) => {
        useFormStore.setState(state => {
          state.persistence.enabled = true;
          state.persistence.key = key || `form-${id}`;
          state.persistence.expires = expires || null;
          
          // 保存当前状态
          saveFormState(state);
          
          return state;
        });
      },
      
      // 禁用持久化
      disablePersistence: () => {
        useFormStore.setState(state => {
          state.persistence.enabled = false;
          return state;
        });
        
        // 清除表单缓存
        clearFormState();
      },
      
      // 切换验证
      toggleValidation: () => {
        useFormStore.setState(state => {
          state.validationEnabled = !state.validationEnabled;
          return state;
        });
      }
    }
  };
}; 