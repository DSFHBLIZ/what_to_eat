/**
 * 本地存储安全工具函数
 * 提供类型安全的本地存储访问方法
 */

import { safeJsonParse } from '../common/safeTypeConversions';
import { isValidJson } from '../common/typeChecks';

/**
 * 安全地获取本地存储中的值
 * @param key 存储键
 * @param defaultValue 默认值，当存储不存在或解析失败时返回
 * @param componentName 组件名称，用于日志
 * @returns 解析后的值或默认值
 */
export function getLocalStorageItem<T>(
  key: string, 
  defaultValue: T, 
  componentName: string = 'localStorage'
): T {
  try {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    return safeJsonParse<T>(item, defaultValue, componentName);
  } catch (error) {
    console.error(`[${componentName}] 获取本地存储项失败:`, error);
    return defaultValue;
  }
}

/**
 * 安全地设置本地存储值
 * @param key 存储键
 * @param value 要存储的值
 * @param componentName 组件名称，用于日志
 * @returns 是否设置成功
 */
export function setLocalStorageItem<T>(
  key: string, 
  value: T, 
  componentName: string = 'localStorage'
): boolean {
  try {
    if (typeof value === 'undefined') {
      console.warn(`[${componentName}] 尝试存储undefined值，将使用null替代`);
    }
    
    // 预处理特殊值，确保它们能被正确序列化
    const processedValue = preprocessForJSON(value);
    
    const jsonValue = JSON.stringify(processedValue);
    localStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`[${componentName}] 设置本地存储项失败:`, error);
    return false;
  }
}

/**
 * 预处理对象以确保JSON序列化的一致性
 * 处理Symbol，NaN，Infinity等特殊值
 * @param value 要处理的值
 * @returns 处理后的值
 */
function preprocessForJSON(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  
  // 处理基本类型
  if (typeof value !== 'object' && typeof value !== 'function') {
    // Symbol 转为 null
    if (typeof value === 'symbol') {
      return null;
    }
    
    // NaN 和 Infinity 转为 null
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
      return null;
    }
    
    return value;
  }
  
  // 处理日期对象 - JSON.stringify会将其转为ISO字符串
  if (value instanceof Date) {
    return value; // 保留日期对象，由JSON.stringify自动处理
  }
  
  // 处理数组
  if (Array.isArray(value)) {
    return value.map(item => preprocessForJSON(item));
  }
  
  // 处理普通对象
  if (Object.prototype.toString.call(value) === '[object Object]') {
    const result: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = preprocessForJSON(value[key]);
      }
    }
    return result;
  }
  
  // 处理正则表达式
  if (value instanceof RegExp) {
    return {}; // 正则表达式转为空对象
  }
  
  // 处理函数
  if (typeof value === 'function') {
    return null; // 函数转为null
  }
  
  // 处理Symbol
  if (typeof value.valueOf === 'function' && typeof value.valueOf() === 'symbol') {
    return null;
  }
  
  // 默认表示
  return {};
}

/**
 * 安全地从本地存储中移除项
 * @param key 存储键
 * @param componentName 组件名称，用于日志
 * @returns 是否移除成功
 */
export function removeLocalStorageItem(
  key: string, 
  componentName: string = 'localStorage'
): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[${componentName}] 移除本地存储项失败:`, error);
    return false;
  }
}

/**
 * 安全地清除所有本地存储
 * @param componentName 组件名称，用于日志
 * @returns 是否清除成功
 */
export function clearLocalStorage(
  componentName: string = 'localStorage'
): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error(`[${componentName}] 清除本地存储失败:`, error);
    return false;
  }
}

/**
 * 获取本地存储中的所有键
 * @param componentName 组件名称，用于日志
 * @returns 存储键数组
 */
export function getLocalStorageKeys(
  componentName: string = 'localStorage'
): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error(`[${componentName}] 获取本地存储键失败:`, error);
    return [];
  }
}

/**
 * 获取本地存储已使用空间（字节）
 * @param componentName 组件名称，用于日志
 * @returns 已使用空间大小（字节）
 */
export function getLocalStorageUsage(
  componentName: string = 'localStorage'
): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) {
        total += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }
    return total;
  } catch (error) {
    console.error(`[${componentName}] 获取本地存储使用情况失败:`, error);
    return 0;
  }
}

/**
 * 检查浏览器是否支持本地存储
 * @returns 是否支持本地存储
 */
export function isLocalStorageSupported(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    const isSupported = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return isSupported;
  } catch (error) {
    return false;
  }
}

export default {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  clearLocalStorage,
  getLocalStorageKeys,
  getLocalStorageUsage,
  isLocalStorageSupported
}; 