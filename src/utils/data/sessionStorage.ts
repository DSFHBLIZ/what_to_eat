/**
 * 会话存储安全工具函数
 * 提供类型安全的会话存储访问方法
 */

import { safeJsonParse } from '../common/safeTypeConversions';
import { isValidJson } from '../common/typeChecks';

/**
 * 安全地获取会话存储中的值
 * @param key 存储键
 * @param defaultValue 默认值，当存储不存在或解析失败时返回
 * @param componentName 组件名称，用于日志
 * @returns 解析后的值或默认值
 */
export function getSessionStorageItem<T>(
  key: string, 
  defaultValue: T, 
  componentName: string = 'sessionStorage'
): T {
  try {
    const item = sessionStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    return safeJsonParse<T>(item, defaultValue, componentName);
  } catch (error) {
    console.error(`[${componentName}] 获取会话存储项失败:`, error);
    return defaultValue;
  }
}

/**
 * 安全地设置会话存储值
 * @param key 存储键
 * @param value 要存储的值
 * @param componentName 组件名称，用于日志
 * @returns 是否设置成功
 */
export function setSessionStorageItem<T>(
  key: string, 
  value: T, 
  componentName: string = 'sessionStorage'
): boolean {
  try {
    if (typeof value === 'undefined') {
      console.warn(`[${componentName}] 尝试存储undefined值，将使用null替代`);
    }
    
    const jsonValue = JSON.stringify(value);
    sessionStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`[${componentName}] 设置会话存储项失败:`, error);
    return false;
  }
}

/**
 * 安全地从会话存储中移除项
 * @param key 存储键
 * @param componentName 组件名称，用于日志
 * @returns 是否移除成功
 */
export function removeSessionStorageItem(
  key: string, 
  componentName: string = 'sessionStorage'
): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[${componentName}] 移除会话存储项失败:`, error);
    return false;
  }
}

/**
 * 安全地清除所有会话存储
 * @param componentName 组件名称，用于日志
 * @returns 是否清除成功
 */
export function clearSessionStorage(
  componentName: string = 'sessionStorage'
): boolean {
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error(`[${componentName}] 清除会话存储失败:`, error);
    return false;
  }
}

/**
 * 获取会话存储中的所有键
 * @param componentName 组件名称，用于日志
 * @returns 存储键数组
 */
export function getSessionStorageKeys(
  componentName: string = 'sessionStorage'
): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key !== null) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error(`[${componentName}] 获取会话存储键失败:`, error);
    return [];
  }
}

/**
 * 获取会话存储已使用空间（字节）
 * @param componentName 组件名称，用于日志
 * @returns 已使用空间大小（字节）
 */
export function getSessionStorageUsage(
  componentName: string = 'sessionStorage'
): number {
  try {
    let total = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key !== null) {
        total += key.length + (sessionStorage.getItem(key)?.length || 0);
      }
    }
    return total;
  } catch (error) {
    console.error(`[${componentName}] 获取会话存储使用情况失败:`, error);
    return 0;
  }
}

/**
 * 检查浏览器是否支持会话存储
 * @returns 是否支持会话存储
 */
export function isSessionStorageSupported(): boolean {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    const isSupported = sessionStorage.getItem(testKey) === testKey;
    sessionStorage.removeItem(testKey);
    return isSupported;
  } catch (error) {
    return false;
  }
}

export default {
  getSessionStorageItem,
  setSessionStorageItem,
  removeSessionStorageItem,
  clearSessionStorage,
  getSessionStorageKeys,
  getSessionStorageUsage,
  isSessionStorageSupported
}; 