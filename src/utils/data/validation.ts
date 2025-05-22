/**
 * 表单验证工具
 * 提供常用验证规则和方法，与表单状态管理集成
 */

import { create } from 'zustand';

// 验证规则类型定义
export type ValidationRule<T = any> = (value: T, allValues?: Record<string, any>) => string | null;

// 验证规则集合
export interface ValidationRules {
  [key: string]: ValidationRule[];
}

// 验证错误类型
export interface ValidationErrors {
  [key: string]: string[];
}

// 字段验证状态
export interface FieldValidationState {
  valid: boolean;
  errors: string[];
  dirty: boolean;
  touched: boolean;
}

// 表单验证状态
export interface FormValidationState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: ValidationErrors;
  fields: Record<string, FieldValidationState>;
}

// 表单验证存储类型
export interface ValidationStore<T extends Record<string, any> = Record<string, any>> {
  // 表单值
  values: T;
  // 原始值
  initialValues: T;
  // 表单验证状态
  validation: FormValidationState;
  // 验证规则
  rules: ValidationRules;
  // 正在验证中
  isValidating: boolean;
  // 上次验证时间
  lastValidated: number | null;
  
  // 设置表单值
  setValues: (values: Partial<T>) => void;
  // 设置字段值
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  // 设置字段触摸状态
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  // 验证表单
  validateForm: () => Promise<boolean>;
  // 验证字段
  validateField: <K extends keyof T>(field: K) => Promise<string[]>;
  // 重置表单
  resetForm: (values?: Partial<T>) => void;
  // 设置验证规则
  setRules: (rules: ValidationRules) => void;
  // 获取错误信息
  getFieldError: <K extends keyof T>(field: K) => string | null;
}

/**
 * 必填验证
 * @param message 错误消息
 * @returns 验证规则
 */
export const required = (message = '此字段不能为空'): ValidationRule => {
  return (value) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return message;
    }
    
    return null;
  };
};

/**
 * 最小长度验证
 * @param min 最小长度
 * @param message 错误消息
 * @returns 验证规则
 */
export const minLength = (min: number, message?: string): ValidationRule<string> => {
  return (value) => {
    if (!value || value.length < min) {
      return message || `长度不能少于${min}个字符`;
    }
    return null;
  };
};

/**
 * 最大长度验证
 * @param max 最大长度
 * @param message 错误消息
 * @returns 验证规则
 */
export const maxLength = (max: number, message?: string): ValidationRule<string> => {
  return (value) => {
    if (value && value.length > max) {
      return message || `长度不能超过${max}个字符`;
    }
    return null;
  };
};

/**
 * 正则表达式验证
 * @param pattern 正则表达式
 * @param message 错误消息
 * @returns 验证规则
 */
export const pattern = (pattern: RegExp, message = '格式不正确'): ValidationRule<string> => {
  return (value) => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  };
};

/**
 * 邮箱格式验证
 * @param message 错误消息
 * @returns 验证规则
 */
export const email = (message = '请输入有效的邮箱地址'): ValidationRule<string> => {
  // 使用符合RFC 5322标准的邮箱正则表达式
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return pattern(emailPattern, message);
};

/**
 * 手机号码验证（中国）
 * @param message 错误消息
 * @returns 验证规则
 */
export const phone = (message = '请输入有效的手机号码'): ValidationRule<string> => {
  // 中国大陆11位手机号码验证
  const phonePattern = /^1[3-9]\d{9}$/;
  
  return pattern(phonePattern, message);
};

/**
 * 数值范围验证
 * @param min 最小值
 * @param max 最大值
 * @param message 错误消息
 * @returns 验证规则
 */
export const range = (min: number, max: number, message?: string): ValidationRule<number> => {
  return (value) => {
    if (value === undefined || value === null) {
      return null;
    }
    
    if (value < min || value > max) {
      return message || `值必须在${min}到${max}之间`;
    }
    
    return null;
  };
};

/**
 * URL格式验证
 * @param message 错误消息
 * @returns 验证规则
 */
export const url = (message = '请输入有效的URL地址'): ValidationRule<string> => {
  // URL验证正则表达式
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  
  return pattern(urlPattern, message);
};

/**
 * 匹配另一个字段验证
 * @param field 要匹配的字段名
 * @param message 错误消息
 * @returns 验证规则
 */
export const match = (field: string, message?: string): ValidationRule => {
  return (value, allValues) => {
    if (!allValues || value !== allValues[field]) {
      return message || `必须与${field}字段匹配`;
    }
    return null;
  };
};

/**
 * 验证字段值是否与另一个字段匹配
 * @param field 比较的字段名
 * @param message 错误信息
 * @returns 验证规则
 */
export const sameAs = <T>(field: keyof T, message?: string): ValidationRule<T> => 
  (value: any, allValues?: Record<string, any>) => {
    if (!allValues) return null;
    return value === allValues[field as string] ? null : message || `必须与${String(field)}字段相同`;
  };

/**
 * 自定义验证规则
 * @param validator 自定义验证函数
 * @param message 错误消息
 * @returns 验证规则
 */
export const custom = <T>(
  validator: (value: T, allValues?: Record<string, any>) => boolean, 
  message = '验证失败'
): ValidationRule<T> => {
  return (value, allValues) => {
    if (!validator(value, allValues)) {
      return message;
    }
    return null;
  };
};

/**
 * 验证单个字段
 * @param value 字段值
 * @param rules 验证规则数组
 * @param allValues 所有字段值
 * @returns 错误消息数组
 */
export const validateField = <T>(
  value: T, 
  rules: ValidationRule<T>[], 
  allValues?: Record<string, any>
): string[] => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    const error = rule(value, allValues);
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
};

/**
 * 验证多个字段
 * @param values 字段值对象
 * @param validationRules 验证规则集合
 * @returns 验证错误对象
 */
export const validateFields = (
  values: Record<string, any>, 
  validationRules: ValidationRules
): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  Object.keys(validationRules).forEach((field) => {
    const fieldErrors = validateField(
      values[field], 
      validationRules[field], 
      values
    );
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });
  
  return errors;
};

/**
 * 检查表单是否有错误
 * @param errors 验证错误对象
 * @returns 是否有错误
 */
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * 创建表单验证器
 * @param validationRules 验证规则集合
 * @returns 表单验证器函数
 */
export const createValidator = (validationRules: ValidationRules) => {
  return (values: Record<string, any>) => {
    return validateFields(values, validationRules);
  };
};

/**
 * 创建表单验证状态存储
 * @param initialValues 初始值
 * @param validationRules 验证规则
 * @returns Zustand存储钩子
 */
export const createValidationStore = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules = {}
) => {
  // 创建初始验证状态
  const createInitialValidationState = (): FormValidationState => {
    const fields: Record<string, FieldValidationState> = {};
    
    // 为每个字段创建初始验证状态
    Object.keys(initialValues).forEach((key) => {
      fields[key] = {
        valid: true,
        errors: [],
        dirty: false,
        touched: false
      };
    });
    
    return {
      isValid: true,
      isDirty: false,
      isTouched: false,
      errors: {},
      fields
    };
  };
  
  return create<ValidationStore<T>>((set, get) => ({
    // 初始状态
    values: { ...initialValues },
    initialValues: { ...initialValues },
    validation: createInitialValidationState(),
    rules: { ...validationRules },
    isValidating: false,
    lastValidated: null,
    
    // 设置表单值
    setValues: (values) => {
      const currentState = get();
      const updatedValues = { ...currentState.values, ...values };
      
      // 计算表单是否变脏
      const isDirty = Object.keys(updatedValues).some(key => {
        const initialValue = currentState.initialValues[key as keyof T];
        const currentValue = updatedValues[key as keyof T];
        return JSON.stringify(initialValue) !== JSON.stringify(currentValue);
      });
      
      // 更新验证字段状态
      const updatedFields = { ...currentState.validation.fields };
      Object.keys(values).forEach(key => {
        if (updatedFields[key]) {
          updatedFields[key] = {
            ...updatedFields[key],
            dirty: isDirty
          };
        }
      });
      
      set({
        values: updatedValues,
        validation: {
          ...currentState.validation,
          isDirty,
          fields: updatedFields
        }
      });
      
      // 在值变更后自动验证
      get().validateForm();
    },
    
    // 设置字段值
    setFieldValue: (field, value) => {
      const currentState = get();
      const updatedValues = { 
        ...currentState.values, 
        [field]: value 
      };
      
      // 计算字段是否变脏
      const isDirty = JSON.stringify(currentState.initialValues[field]) !== JSON.stringify(value);
      
      // 更新字段验证状态
      const updatedFields = { ...currentState.validation.fields };
      if (updatedFields[field as string]) {
        updatedFields[field as string] = {
          ...updatedFields[field as string],
          dirty: isDirty
        };
      }
      
      // 计算表单是否变脏
      const formIsDirty = isDirty || Object.keys(updatedValues).some(key => {
        if (key === field as string) return isDirty;
        const initialValue = currentState.initialValues[key as keyof T];
        const currentValue = updatedValues[key as keyof T];
        return JSON.stringify(initialValue) !== JSON.stringify(currentValue);
      });
      
      set({
        values: updatedValues,
        validation: {
          ...currentState.validation,
          isDirty: formIsDirty,
          fields: updatedFields
        }
      });
      
      // 验证当前字段
      get().validateField(field);
    },
    
    // 设置字段触摸状态
    setFieldTouched: (field, touched = true) => {
      const currentState = get();
      
      // 更新字段触摸状态
      const updatedFields = { ...currentState.validation.fields };
      if (updatedFields[field as string]) {
        updatedFields[field as string] = {
          ...updatedFields[field as string],
          touched
        };
      }
      
      // 计算表单是否被触摸
      const formIsTouched = touched || Object.values(updatedFields).some(field => field.touched);
      
      set({
        validation: {
          ...currentState.validation,
          isTouched: formIsTouched,
          fields: updatedFields
        }
      });
      
      // 当字段被触摸时验证
      if (touched) {
        get().validateField(field);
      }
    },
    
    // 验证表单
    validateForm: async () => {
      const { values, rules } = get();
      
      set({ isValidating: true });
      
      // 验证所有字段
      const errors = validateFields(values as Record<string, any>, rules);
      const hasError = Object.keys(errors).length > 0;
      
      // 更新字段验证状态
      const updatedFields = { ...get().validation.fields };
      
      // 重置所有字段的验证状态
      Object.keys(updatedFields).forEach(key => {
        updatedFields[key] = {
          ...updatedFields[key],
          errors: [],
          valid: true
        };
      });
      
      // 设置有错误的字段
      Object.entries(errors).forEach(([field, fieldErrors]) => {
        if (updatedFields[field]) {
          updatedFields[field] = {
            ...updatedFields[field],
            errors: fieldErrors,
            valid: false
          };
        }
      });
      
      set({
        isValidating: false,
        lastValidated: Date.now(),
        validation: {
          ...get().validation,
          isValid: !hasError,
          errors,
          fields: updatedFields
        }
      });
      
      return !hasError;
    },
    
    // 验证字段
    validateField: async (field) => {
      const { values, rules } = get();
      const fieldRules = rules[field as string];
      
      if (!fieldRules) return [];
      
      // 验证字段
      const errors = validateField(values[field], fieldRules, values as Record<string, any>);
      
      // 更新字段验证状态
      const updatedFields = { ...get().validation.fields };
      if (updatedFields[field as string]) {
        updatedFields[field as string] = {
          ...updatedFields[field as string],
          errors,
          valid: errors.length === 0
        };
      }
      
      // 更新验证错误
      const updatedErrors = { ...get().validation.errors };
      if (errors.length > 0) {
        updatedErrors[field as string] = errors;
      } else {
        delete updatedErrors[field as string];
      }
      
      set({
        validation: {
          ...get().validation,
          isValid: Object.keys(updatedErrors).length === 0,
          errors: updatedErrors,
          fields: updatedFields
        }
      });
      
      return errors;
    },
    
    // 重置表单
    resetForm: (values) => {
      const resetValues = values 
        ? { ...get().initialValues, ...values }
        : { ...get().initialValues };
        
      set({
        values: resetValues,
        validation: createInitialValidationState(),
        lastValidated: null
      });
    },
    
    // 设置验证规则
    setRules: (rules) => {
      set({ rules });
      // 应用新规则后重新验证
      get().validateForm();
    },
    
    // 获取错误信息
    getFieldError: (field) => {
      const { validation } = get();
      const fieldErrors = validation.fields[field as string]?.errors;
      return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
    }
  }));
};

/**
 * 表单字段属性接口
 */
export interface FieldProps<T extends Record<string, any>, K extends keyof T> {
  name: K;
  value: T[K];
  onChange: (value: T[K]) => void;
  onBlur: () => void;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
}

/**
 * 使用验证状态钩子创建字段属性
 * 返回可以直接传递给表单控件的属性
 */
export const useField = <T extends Record<string, any>, K extends keyof T>(
  store: ValidationStore<T>,
  fieldName: K
): FieldProps<T, K> => {
  const { values, setFieldValue, setFieldTouched, validation } = store;
  const fieldState = validation.fields[fieldName as string] || {
    valid: true,
    errors: [],
    dirty: false,
    touched: false
  };
  
  return {
    name: fieldName,
    value: values[fieldName],
    onChange: (value: T[K]) => setFieldValue(fieldName, value),
    onBlur: () => setFieldTouched(fieldName),
    error: fieldState.errors[0] || null,
    touched: fieldState.touched,
    dirty: fieldState.dirty,
    valid: fieldState.valid
  };
};

export default {
  required,
  minLength,
  maxLength,
  pattern,
  email,
  phone,
  range,
  url,
  match,
  sameAs,
  custom,
  validateField,
  validateFields,
  hasErrors,
  createValidator,
  createValidationStore,
  useField,
}; 