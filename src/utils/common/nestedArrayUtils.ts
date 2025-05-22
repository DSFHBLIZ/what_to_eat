/**
 * 增强版嵌套数组和对象访问工具
 * 安全地访问和修改深层嵌套数组和对象，防止运行时错误
 * 版本: 1.0.1 - 修复类型检查问题
 */

import { logError } from './errorLogger';

/**
 * 安全地获取嵌套属性
 * 如果任何中间路径是null或undefined，返回undefined
 * 
 * 使用示例:
 * const name = safeGetNestedProperty(user, ['profile', 'name']);
 */
export function safeGetNestedProperty<T = any>(
  obj: any,
  path: string[],
  componentName: string = 'unknown',
  operation: string = 'safeGetNestedProperty'
): T | undefined {
  try {
    // 如果原始对象是null或undefined，直接返回undefined
    if (obj === null || obj === undefined) {
      logError(
        componentName, 
        operation,
        `初始对象是${obj === null ? 'null' : 'undefined'}`,
        {
          objectType: typeof obj,
          path: path,
          isNull: obj === null,
          isUndefined: obj === undefined,
          requestedPath: path.join('.'),
          stackTrace: new Error().stack
        }
      );
      return undefined;
    }

    let current = obj;
    let lastProcessedIndex = -1;
    
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      lastProcessedIndex = i;
      
      // 如果当前值是null或undefined，返回undefined
      if (current === null || current === undefined) {
        // 记录访问路径和错误位置
        logError(
          componentName,
          operation,
          `尝试访问${current === null ? 'null' : 'undefined'}的属性: ${key}`,
          {
            objectType: typeof obj,
            path: path,
            failedAt: key,
            processedPath: path.slice(0, i).join('.'),
            remainingPath: path.slice(i).join('.'),
            valueAtFailure: current === null ? 'null' : 'undefined',
            stackTrace: new Error().stack
          }
        );
        return undefined;
      }
      
      current = current[key];
    }
    
    return current as T;
  } catch (err: unknown) { // 将err类型从any改为unknown以提高类型安全性
    // 捕获并记录任何错误
    logError(
      componentName,
      operation,
      err instanceof Error ? err : String(err),
      {
        objectType: typeof obj,
        path: path,
        errorType: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        stackTrace: err instanceof Error ? err.stack : new Error().stack
      }
    );
    return undefined;
  }
}

/**
 * 安全地获取嵌套数组
 * 如果任何中间路径是null或undefined，返回空数组
 * 
 * 使用示例:
 * const items = safeGetNestedArray(obj, ['user', 'orders', 'items']);
 */
export function safeGetNestedArray<T = any>(
  obj: any,
  path: string[],
  componentName: string = 'unknown',
  operation: string = 'safeGetNestedArray'
): T[] {
  try {
    // 如果原始对象为null或undefined，直接返回空数组
    if (obj === null || obj === undefined) {
      logError(
        componentName,
        operation,
        `尝试从${obj === null ? 'null' : 'undefined'}获取数组`,
        {
          objectType: typeof obj,
          path: path,
          requestedPath: path.join('.'),
          isNull: obj === null,
          isUndefined: obj === undefined,
          stackTrace: new Error().stack
        }
      );
      return [];
    }

    // 手动遍历路径，避免在中间路径出现null/undefined时抛出错误
    let current = obj;
    
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      
      // 一旦遇到null或undefined，就记录详细信息并返回空数组
      if (current === null || current === undefined) {
        logError(
          componentName,
          operation,
          `尝试访问${current === null ? 'null' : 'undefined'}的属性: ${key}`,
          {
            objectType: typeof obj,
            path: path,
            failedAt: key,
            processedPath: path.slice(0, i).join('.'),
            remainingPath: path.slice(i).join('.'),
            valueAtFailure: current === null ? 'null' : 'undefined',
            stackTrace: new Error().stack
          }
        );
        return [];
      }
      
      current = current[key];
    }
    
    // 检查最终获取的值是否为数组
    if (Array.isArray(current)) {
      return current as T[];
    }
    
    // 如果最终值不是数组，记录错误并返回空数组
    logError(
      componentName,
      operation,
      `路径 ${path.join('.')} 的值不是数组`,
      {
        objectType: typeof obj,
        path: path,
        valueType: typeof current,
        value: current === null ? 'null' : 
               current === undefined ? 'undefined' : 
               String(current).substring(0, 100),
        stackTrace: new Error().stack
      }
    );
    
    return [];
  } catch (err: unknown) { // 将err类型从any改为unknown以提高类型安全性
    // 捕获并记录任何错误，但仍然返回空数组
    logError(
      componentName,
      operation,
      err instanceof Error ? err : String(err),
      {
        objectType: typeof obj,
        path: path,
        errorType: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        stackTrace: err instanceof Error ? err.stack : new Error().stack
      }
    );
    return [];
  }
}

/**
 * 安全地获取嵌套数组并执行slice操作
 * 如果任何路径是null或undefined，返回空数组
 * 
 * 使用示例:
 * const items = safeGetNestedArraySlice(obj, ['user', 'orders', 'items'], 0, 5);
 */
export function safeGetNestedArraySlice<T = any>(
  obj: any,
  path: string[],
  start?: number,
  end?: number,
  componentName: string = 'unknown',
  operation: string = 'safeGetNestedArraySlice'
): T[] {
  try {
    const array = safeGetNestedArray<T>(obj, path, componentName, operation);
    
    // 确保数组存在，否则返回空数组
    if (!Array.isArray(array)) {
      return [];
    }
    
    // 安全地执行slice操作
    try {
      return array.slice(start, end);
    } catch (sliceError: unknown) { // 将sliceError类型从any改为unknown以提高类型安全性
      logError(
        componentName,
        operation,
        sliceError instanceof Error ? sliceError : String(sliceError),
        {
          arrayLength: array.length,
          requestedRange: `${start ?? '0'}-${end ?? 'end'}`,
          stackTrace: new Error().stack
        }
      );
      return [];
    }
  } catch (err: unknown) { // 将err类型从any改为unknown以提高类型安全性
    // 捕获并记录任何其他错误，返回空数组
    logError(
      componentName,
      operation,
      err instanceof Error ? err : String(err),
      {
        objectType: typeof obj,
        path: path,
        range: `${start ?? '0'}-${end ?? 'end'}`,
        errorType: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        stackTrace: err instanceof Error ? err.stack : new Error().stack
      }
    );
    return [];
  }
}

/**
 * 安全地对嵌套路径设置值
 * 如果中间路径不存在，会自动创建对象
 * 
 * 使用示例:
 * safeSetNestedProperty(obj, ['user', 'preferences', 'theme'], 'dark');
 */
export function safeSetNestedProperty(
  obj: any,
  path: string[],
  value: any,
  componentName: string = 'unknown',
  operation: string = 'safeSetNestedProperty'
): boolean {
  try {
    // 验证根对象是否为对象
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      logError(
        componentName,
        operation,
        '根对象必须是一个对象',
        {
          objectType: typeof obj,
          isNull: obj === null,
          isUndefined: obj === undefined,
          value: obj
        }
      );
      return false;
    }

    let current = obj;
    const lastKey = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    
    // 遍历父路径
    for (const key of parentPath) {
      // 如果当前路径不存在或不是对象，创建一个新对象
      if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // 设置最终属性的值
    current[lastKey] = value;
    return true;
  } catch (err: unknown) { // 将err类型从any改为unknown以提高类型安全性
    // 捕获并记录任何错误
    logError(
      componentName,
      operation,
      err instanceof Error ? err : String(err),
      {
        objectType: typeof obj,
        path: path,
        value: String(value),
        errorType: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        stackTrace: err instanceof Error ? err.stack : new Error().stack
      }
    );
    return false;
  }
} 