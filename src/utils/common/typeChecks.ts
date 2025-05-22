/**
 * 类型检查实用函数
 * 为应用程序提供更安全的类型检查和验证机制
 */

import { safeArray as safeArrayImpl } from './safeTypeConversions';

/**
 * 检查值是否为数组
 * @param value 要检查的值
 * @returns 布尔值指示是否为数组
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 检查值是否为对象
 * @param value 要检查的值
 * @returns 布尔值指示是否为对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 检查值是否为字符串
 * @param value 要检查的值
 * @returns 布尔值指示是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 检查值是否为数字
 * @param value 要检查的值
 * @returns 布尔值指示是否为数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 检查值是否为布尔值
 * @param value 要检查的值
 * @returns 布尔值指示是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 检查值是否为日期对象
 * @param value 要检查的值
 * @returns 布尔值指示是否为日期对象
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 检查值是否为函数
 * @param value 要检查的值
 * @returns 布尔值指示是否为函数
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * 检查值是否为undefined或null
 * @param value 要检查的值
 * @returns 布尔值指示是否为undefined或null
 */
export function isNil(value: unknown): value is null | undefined {
  return value === undefined || value === null;
}

/**
 * 检查字符串是否为有效的JSON
 * @param str 要检查的字符串
 * @returns 布尔值指示是否为有效的JSON
 */
export function isValidJson(str: unknown): boolean {
  if (!isString(str)) return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 检查值是否为食材结构
 * @param value 要检查的值
 * @returns 布尔值指示是否为食材结构
 */
export function isIngredient(
  value: unknown
): value is { name: string; quantity?: string } {
  if (!isObject(value)) return false;
  
  // 检查name字段，必须有且为字符串
  if (!('name' in value) && !('名称' in value) && !('食材' in value)) {
    return false;
  }
  
  // 检查name字段为字符串
  const name = (value as any).name || (value as any).名称 || (value as any).食材;
  if (!isString(name)) {
    return false;
  }
  
  // 如果有quantity字段，检查为字符串
  if ('quantity' in value || '用量' in value || '数量' in value) {
    const quantity = (value as any).quantity || (value as any).用量 || (value as any).数量;
    if (quantity !== undefined && !isString(quantity) && !isNumber(quantity)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 检查值是否为季节性食材结构数组
 * @param value 要检查的值
 * @returns 布尔值指示是否为季节性食材结构数组
 */
export function isIngredientArray(
  value: unknown
): value is Array<string | { name: string; quantity?: string }> {
  if (!isArray(value)) return false;
  
  // 空数组认为是有效的
  if (value.length === 0) return true;
  
  // 检查每个元素是否为字符串或食材结构
  return value.every(item => 
    isString(item) || isIngredient(item)
  );
}

/**
 * 类型守卫：确保值存在
 * @param value 要检查的值
 * @returns 同样的值但TypeScript知道它不是null或undefined
 */
export function ensureExists<T>(value: T | null | undefined, defaultValue: T): T {
  return (value === null || value === undefined) ? defaultValue : value;
}

/**
 * 类型守卫：确保值是一个数组
 * @param value 要检查的值
 * @param defaultValue 默认值，如果值无效
 * @param options 额外选项
 * @returns 转换后的数组
 */
export function ensureArray<T>(
  value: T | T[] | null | undefined, 
  defaultValue: T[] = [], 
  options?: { 
    componentName?: string; 
    propertyName?: string; 
    allowEmpty?: boolean 
  }
): T[] {
  return safeArrayImpl<T>(
    value,
    defaultValue,
    {
      componentName: options?.componentName,
      propertyName: options?.propertyName,
      allowEmpty: options?.allowEmpty,
    }
  );
}

/**
 * 安全处理数组切片，确保输入是有效数组
 * @param arr 输入数组
 * @param start 开始索引
 * @param end 结束索引
 * @returns 切片后的数组
 */
export function safeArraySlice<T>(
  arr: T[] | undefined | null, 
  start: number, 
  end?: number,
  options?: { 
    componentName?: string; 
    propertyName?: string; 
    allowEmpty?: boolean 
  }
): T[] {
  return ensureArray<T>(arr, [], options).slice(start, end);
}

export default {
  isArray,
  isObject,
  isString,
  isNumber,
  isBoolean,
  isDate,
  isFunction,
  isNil,
  isValidJson,
  isIngredient,
  isIngredientArray,
  ensureExists,
  ensureArray,
  safeArraySlice
}; 