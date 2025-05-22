import * as baseValidators from '../data/validation';
import { getValidationMessage, FIELD_LABELS } from '../../config/validationSchema';

/**
 * 国际化表单验证工具
 * 基于基础验证器，添加国际化支持
 */

// 支持的语言类型
export type SupportedLanguage = 'zh-CN' | 'en-US';

// 当前语言
let currentLanguage: SupportedLanguage = 'zh-CN';

/**
 * 设置验证消息语言
 * @param lang 目标语言
 */
export const setValidationLanguage = (lang: SupportedLanguage): void => {
  currentLanguage = lang;
};

/**
 * 获取验证消息
 * @returns 当前语言的验证消息
 */
export const getMessages = () => {
  return {
    required: (label?: string) => 
      getValidationMessage('required', { label: label || '该字段' }, currentLanguage),
    
    email: (label?: string) => 
      getValidationMessage('email', { label: label || '邮箱' }, currentLanguage),
    
    minLength: (min: number, label?: string) => 
      getValidationMessage('minLength', { min, label: label || '该字段' }, currentLanguage),
    
    maxLength: (max: number, label?: string) => 
      getValidationMessage('maxLength', { max, label: label || '该字段' }, currentLanguage),
    
    pattern: (label?: string) => 
      getValidationMessage('pattern', { label: label || '该字段' }, currentLanguage),
    
    url: (label?: string) => 
      getValidationMessage('url', { label: label || 'URL' }, currentLanguage),
    
    phone: (label?: string) => 
      getValidationMessage('phone', { label: label || '电话号码' }, currentLanguage),
    
    range: (min: number, max: number, label?: string) => 
      getValidationMessage('min', { min, max, label: label || '该值' }, currentLanguage),
    
    sameAs: (field: string) => 
      `两次输入不一致`,
    
    custom: (label?: string) => 
      getValidationMessage('custom', { label: label || '该字段' }, currentLanguage)
  };
};

/**
 * 必填验证
 * @param message 自定义错误消息（可选）
 */
export const required = (message?: string) => {
  return baseValidators.required(message || getMessages().required());
};

/**
 * 邮箱格式验证
 * @param message 自定义错误消息（可选）
 */
export const email = (message?: string) => {
  return baseValidators.email(message || getMessages().email());
};

/**
 * 最小长度验证
 * @param min 最小长度
 * @param message 自定义错误消息（可选）
 */
export const minLength = (min: number, message?: string) => {
  return baseValidators.minLength(min, message || getMessages().minLength(min));
};

/**
 * 最大长度验证
 * @param max 最大长度
 * @param message 自定义错误消息（可选）
 */
export const maxLength = (max: number, message?: string) => {
  return baseValidators.maxLength(max, message || getMessages().maxLength(max));
};

/**
 * 正则表达式验证
 * @param regex 正则表达式
 * @param message 自定义错误消息（可选）
 */
export const pattern = (regex: RegExp, message?: string) => {
  return baseValidators.pattern(regex, message || getMessages().pattern());
};

/**
 * URL格式验证
 * @param message 自定义错误消息（可选）
 */
export const url = (message?: string) => {
  return baseValidators.url(message || getMessages().url());
};

/**
 * 电话号码验证
 * @param message 自定义错误消息（可选）
 */
export const phone = (message?: string) => {
  return baseValidators.phone(message || getMessages().phone());
};

/**
 * 值范围验证
 * @param min 最小值
 * @param max 最大值
 * @param message 自定义错误消息（可选）
 */
export const range = (min: number, max: number, message?: string) => {
  return baseValidators.range(min, max, message || getMessages().range(min, max));
};

/**
 * 与其他字段值相同验证
 * @param field 要比较的字段名
 * @param message 自定义错误消息（可选）
 */
export const sameAs = (field: string, message?: string) => {
  return baseValidators.sameAs(field, message || getMessages().sameAs(field));
};

/**
 * 自定义验证
 * @param validator 自定义验证函数
 * @param message 自定义错误消息（可选）
 */
export const custom = (
  validator: (value: any, formValues?: Record<string, any>) => boolean,
  message?: string
) => {
  return baseValidators.custom(validator, message || getMessages().custom());
};

// 重新导出其他基础功能
export const {
  createValidationStore,
  useField,
  validateField,
  validateFields,
  hasErrors
} = baseValidators; 