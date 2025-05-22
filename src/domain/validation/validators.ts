/**
 * 领域层：表单验证器
 * 提供一系列可重用的验证函数
 */
import { getValidationMessage } from '../../config/validationSchema';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export type Validator<T = any> = (value: T, label?: string) => ValidationResult;

/**
 * 必填验证器
 * @param message 错误信息
 * @returns 验证器函数
 */
export function required(message?: string): Validator {
  return (value: any, label = '此字段') => {
    const isValid = !(
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    );
    
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('required', { label }),
    };
  };
}

/**
 * 最小长度验证器
 * @param min 最小长度
 * @param message 错误信息
 * @returns 验证器函数
 */
export function minLength(min: number, message?: string): Validator<string> {
  return (value: string, label = '此字段') => {
    const isValid = !value || value.length >= min;
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('minLength', { label, min: min.toString() }),
    };
  };
}

/**
 * 最大长度验证器
 * @param max 最大长度
 * @param message 错误信息
 * @returns 验证器函数
 */
export function maxLength(max: number, message?: string): Validator<string> {
  return (value: string, label = '此字段') => {
    const isValid = !value || value.length <= max;
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('maxLength', { label, max: max.toString() }),
    };
  };
}

/**
 * 正则表达式验证器
 * @param regex 正则表达式
 * @param message 错误信息
 * @returns 验证器函数
 */
export function pattern(regex: RegExp, message?: string): Validator<string> {
  return (value: string, label = '此字段') => {
    const isValid = !value || regex.test(value);
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('pattern', { label }),
    };
  };
}

/**
 * 邮箱验证器
 * @param message 错误信息
 * @returns 验证器函数
 */
export function email(message?: string): Validator<string> {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return (value: string, label = '此字段') => {
    const isValid = !value || emailRegex.test(value);
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('email', { label }),
    };
  };
}

/**
 * 数字范围验证器
 * @param min 最小值
 * @param max 最大值
 * @param message 错误信息
 * @returns 验证器函数
 */
export function range(min: number, max: number, message?: string): Validator<number> {
  return (value: number, label = '此字段') => {
    const isValid = value === undefined || value === null || (value >= min && value <= max);
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('range', { 
        label, 
        min: min.toString(), 
        max: max.toString() 
      }),
    };
  };
}

/**
 * 最小值验证器
 * @param min 最小值
 * @param message 错误信息
 * @returns 验证器函数
 */
export function min(min: number, message?: string): Validator<number> {
  return (value: number, label = '此字段') => {
    const isValid = value === undefined || value === null || value >= min;
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('min', { label, min: min.toString() }),
    };
  };
}

/**
 * 最大值验证器
 * @param max 最大值
 * @param message 错误信息
 * @returns 验证器函数
 */
export function max(max: number, message?: string): Validator<number> {
  return (value: number, label = '此字段') => {
    const isValid = value === undefined || value === null || value <= max;
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('max', { label, max: max.toString() }),
    };
  };
}

/**
 * 相同值验证器
 * @param fieldName 比较的字段名
 * @param getFieldValue 获取字段值的函数
 * @param message 错误信息
 * @returns 验证器函数
 */
export function sameAs<T = any>(
  fieldName: string,
  getFieldValue: () => T,
  message?: string
): Validator<T> {
  return (value: T, label = '此字段') => {
    const compareValue = getFieldValue();
    const isValid = value === compareValue;
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('sameAs', { label, fieldName }),
    };
  };
}

/**
 * 自定义验证器
 * @param validateFn 验证函数
 * @param message 错误信息
 * @returns 验证器函数
 */
export function custom<T = any>(
  validateFn: (value: T) => boolean,
  message?: string
): Validator<T> {
  return (value: T, label = '此字段') => {
    const isValid = validateFn(value);
    return {
      valid: isValid,
      message: isValid ? undefined : message || getValidationMessage('custom', { label }),
    };
  };
}

/**
 * 条件验证器
 * @param condition 条件函数
 * @param validator 条件为真时使用的验证器
 * @returns 验证器函数
 */
export function when<T = any>(
  condition: () => boolean,
  validator: Validator<T>
): Validator<T> {
  return (value: T, label = '此字段') => {
    if (condition()) {
      return validator(value, label);
    }
    return { valid: true };
  };
}

/**
 * 组合多个验证器
 * @param validators 验证器数组
 * @returns 组合验证器函数
 */
export function compose<T = any>(...validators: Validator<T>[]): Validator<T> {
  return (value: T, label = '此字段') => {
    for (const validator of validators) {
      const result = validator(value, label);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
} 