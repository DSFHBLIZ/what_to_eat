/**
 * UI层：表单Hook
 * 处理表单的界面渲染和交互
 */
import { useEffect, useMemo, useCallback } from 'react';
import { FormValidationConfig, FormValidationState, createFormValidationState, validateAllFields, updateFieldValue, touchField, validateField, resetForm } from '../domain/validation';
import { useAsyncResourceController } from './useAsyncResourceController';

// 表单Hook选项
export interface UseFormOptions {
  // 是否在字段变化时验证
  validateOnChange?: boolean;
  // 是否在字段失去焦点时验证
  validateOnBlur?: boolean;
  // 提交回调
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
  // 字段标签映射（用于错误消息）
  fieldLabels?: Record<string, string>;
  // 是否在提交后重置表单
  resetAfterSubmit?: boolean;
}

// 表单数据类型
interface FormData {
  formState: FormValidationState;
  isSubmitted: boolean;
}

/**
 * 表单Hook
 * 用于处理表单的状态管理、验证和提交
 */
export function useForm(config: FormValidationConfig, options: UseFormOptions = {}) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
    fieldLabels = {},
    resetAfterSubmit = false,
  } = options;

  // 使用通用资源控制器管理表单状态
  const formResource = useAsyncResourceController<FormData>({
    fetcher: async () => {
      // 只是一个占位函数，表单状态主要通过setData更新
      return { 
        formState: createFormValidationState(config),
        isSubmitted: false
      };
    },
    initialData: { 
      formState: createFormValidationState(config),
      isSubmitted: false
    },
    autoFetch: false
  });

  // 获取表单值
  const getValues = useCallback(() => {
    if (!formResource.data) return {};
    
    const values: Record<string, any> = {};
    for (const [fieldName, field] of Object.entries(formResource.data.formState.fields)) {
      values[fieldName] = field.value;
    }
    return values;
  }, [formResource.data]);

  // 设置字段值
  const setValue = useCallback(
    (fieldName: string, value: any) => {
      if (!formResource.data) return;
      
      formResource.setData((prev) => {
        if (!prev) return { 
          formState: createFormValidationState(config),
          isSubmitted: false
        };
        
        return {
          ...prev,
          formState: updateFieldValue(
            prev.formState,
            fieldName,
            value,
            validateOnChange,
            fieldLabels[fieldName]
          )
        };
      });
    },
    [formResource, validateOnChange, fieldLabels, config]
  );

  // 标记字段为已访问
  const setTouched = useCallback(
    (fieldName: string) => {
      if (!formResource.data) return;
      
      formResource.setData((prev) => {
        if (!prev) return { 
          formState: createFormValidationState(config),
          isSubmitted: false
        };
        
        return {
          ...prev,
          formState: touchField(
            prev.formState,
            fieldName,
            validateOnBlur,
            fieldLabels[fieldName]
          )
        };
      });
    },
    [formResource, validateOnBlur, fieldLabels, config]
  );

  // 验证单个字段
  const validateFieldValue = useCallback(
    (fieldName: string) => {
      if (!formResource.data) return;
      
      formResource.setData((prev) => {
        if (!prev) return { 
          formState: createFormValidationState(config),
          isSubmitted: false
        };
        
        return {
          ...prev,
          formState: validateField(
            prev.formState,
            fieldName,
            fieldLabels[fieldName]
          )
        };
      });
    },
    [formResource, fieldLabels, config]
  );

  // 验证所有字段
  const validateFormFields = useCallback(() => {
    if (!formResource.data) return false;
    
    formResource.setData((prev) => {
      if (!prev) return { 
        formState: createFormValidationState(config),
        isSubmitted: false
      };
      
      return {
        ...prev,
        formState: validateAllFields(prev.formState, fieldLabels)
      };
    });
    
    return formResource.data.formState.isValid;
  }, [formResource, fieldLabels, config]);

  // 重置表单
  const resetFormData = useCallback(() => {
    formResource.setData((prev) => {
      if (!prev) return { 
        formState: createFormValidationState(config),
        isSubmitted: false
      };
      
      return {
        ...prev,
        formState: resetForm(prev.formState, config),
        isSubmitted: false
      };
    });
  }, [formResource, config]);

  // 提交表单
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!formResource.data) return false;

      // 标记表单为已提交
      formResource.setData((prev) => {
        if (!prev) return { 
          formState: createFormValidationState(config),
          isSubmitted: true
        };
        
        return {
          ...prev,
          isSubmitted: true
        };
      });

      // 验证所有字段
      formResource.setData((prev) => {
        if (!prev) return { 
          formState: validateAllFields(createFormValidationState(config), fieldLabels),
          isSubmitted: true
        };
        
        return {
          ...prev,
          formState: validateAllFields(prev.formState, fieldLabels)
        };
      });

      // 如果表单有效且有提交回调，则调用提交回调
      if (formResource.data.formState.isValid && onSubmit) {
        try {
          // 标记表单为提交中
          formResource.setData(prev => ({
            ...prev!,
            submitError: null,
          }));

          // 开始加载状态
          const currentValues = getValues();
          
          // 调用提交回调
          await onSubmit(currentValues);

          // 如果需要重置表单，则重置
          if (resetAfterSubmit) {
            resetFormData();
          }

          return true;
        } catch (error) {
          // 设置错误
          formResource.setError(error instanceof Error ? error : new Error('提交失败'));
          return false;
        }
      }

      return false;
    },
    [formResource, onSubmit, getValues, fieldLabels, resetAfterSubmit, resetFormData]
  );

  // 创建字段处理器
  const getFieldProps = useCallback(
    (fieldName: string) => {
      if (!formResource.data) {
        throw new Error(`表单尚未初始化`);
      }
      
      const field = formResource.data.formState.fields[fieldName];
      if (!field) {
        throw new Error(`字段"${fieldName}"不存在`);
      }

      return {
        value: field.value,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
          setValue(fieldName, e.target.value);
        },
        onBlur: () => {
          setTouched(fieldName);
        },
        name: fieldName,
        id: fieldName,
        'aria-invalid': !field.isValid,
        'aria-describedby': !field.isValid ? `${fieldName}-error` : undefined,
      };
    },
    [formResource.data, setValue, setTouched]
  );

  // 获取字段状态
  const getFieldState = useCallback(
    (fieldName: string) => {
      if (!formResource.data) {
        throw new Error(`表单尚未初始化`);
      }
      
      const field = formResource.data.formState.fields[fieldName];
      if (!field) {
        throw new Error(`字段"${fieldName}"不存在`);
      }

      return {
        value: field.value,
        isDirty: field.isDirty,
        isTouched: field.isTouched,
        isValid: field.isValid,
        error: field.error,
        shouldShowError: (formResource.data.isSubmitted || field.isTouched) && !field.isValid,
      };
    },
    [formResource.data]
  );

  // 提交中状态
  const isSubmitting = useMemo(() => formResource.loading, [formResource.loading]);
  
  // 表单状态
  const formState = useMemo(() => 
    formResource.data?.formState || createFormValidationState(config), 
    [formResource.data, config]
  );
  
  // 表单是否已提交
  const isSubmitted = useMemo(() => 
    formResource.data?.isSubmitted || false, 
    [formResource.data]
  );
  
  // 提交错误
  const submitError = useMemo(() => 
    formResource.error?.message || null, 
    [formResource.error]
  );
  
  // 表单是否有效
  const isValid = useMemo(() => 
    formResource.data?.formState.isValid || false, 
    [formResource.data]
  );

  // 表单渲染属性
  const formProps = useMemo(() => ({
    onSubmit: handleSubmit,
    noValidate: true,
  }), [handleSubmit]);

  // 提供给UI组件使用的表单API
  return {
    // 源自控制器的属性
    formState,
    isValid,
    isSubmitted,
    isSubmitting,
    submitError,
    
    // 表单提交处理
    handleSubmit,
    formProps,
    
    // 字段操作
    register: getFieldProps,
    getFieldState,
    setValue,
    setTouched,
    
    // 表单操作
    getValues,
    validateField: validateFieldValue,
    validateForm: validateFormFields,
    resetForm: resetFormData,
  };
}

/**
 * 使用示例：
 * 
 * const [formState, formActions] = useForm({
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *     confirmPassword: '',
 *     acceptTerms: false
 *   },
 *   validationRules: {
 *     username: [validators.required('用户名'), validators.minLength(3, '用户名')],
 *     email: [validators.required('邮箱'), validators.email()],
 *     password: [validators.required('密码'), validators.minLength(8, '密码')],
 *     confirmPassword: [
 *       validators.required('确认密码'),
 *       (value) => value === formState.values.password ? null : '两次密码输入不一致'
 *     ],
 *     acceptTerms: [
 *       (value) => value === true ? null : '必须接受服务条款'
 *     ]
 *   },
 *   onSubmit: async (values) => {
 *     console.log('表单提交:', values);
 *     // 执行API调用等异步操作
 *   }
 * });
 */ 