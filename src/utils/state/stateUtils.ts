/**
 * 状态管理通用工具函数
 */

/**
 * 过滤状态对象
 * @param state 状态对象
 * @param blacklist 黑名单字段列表
 * @param whitelist 白名单字段列表
 * @returns 过滤后的状态对象
 */
export function filterState<T extends object>(
  state: T,
  blacklist: string[] = [],
  whitelist: string[] = []
): Partial<T> {
  // 创建状态副本
  const stateCopy = { ...state };

  // 如果有黑名单，删除黑名单中的属性
  if (blacklist.length > 0) {
    for (const key of blacklist) {
      if (key in stateCopy) {
        delete stateCopy[key as keyof T];
      }
    }
  }

  // 如果有白名单，只保留白名单中的属性
  if (whitelist.length > 0) {
    const whitelistState = {} as Partial<T>;
    for (const key of whitelist) {
      if (key in stateCopy) {
        whitelistState[key as keyof T] = stateCopy[key as keyof T];
      }
    }
    return whitelistState;
  }

  return stateCopy;
}

/**
 * 检查值是否为对象
 * @param item 要检查的值
 * @returns 是否为对象
 */
export function isObject(item: any): item is object {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceKey = key as keyof typeof source;
      const targetKey = key as keyof typeof target;

      if (isObject(source[sourceKey]) && targetKey in target) {
        if (isObject(target[targetKey])) {
          output[targetKey] = deepMerge(
            target[targetKey] as object,
            source[sourceKey] as object
          ) as any;
        } else {
          output[targetKey] = source[sourceKey] as any;
        }
      } else {
        output[targetKey] = source[sourceKey] as any;
      }
    });
  }

  return output;
}

/**
 * 比较两个对象并判断指定字段是否有变化
 * @param newState 新状态
 * @param oldState 旧状态
 * @param fields 要比较的字段
 * @returns 是否有变化
 */
export function hasStateChanged<T extends object>(
  newState: T, 
  oldState: T, 
  fields: (keyof T)[]
): boolean {
  return fields.some(field => newState[field] !== oldState[field]);
}

/**
 * 从对象中选择指定字段
 * @param obj 源对象
 * @param keys 要选择的字段
 * @returns 包含指定字段的新对象
 */
export function pick<T extends object, K extends keyof T>(
  obj: T, 
  keys: K[]
): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
}

/**
 * 从对象中排除指定字段
 * @param obj 源对象
 * @param keys 要排除的字段
 * @returns 排除指定字段的新对象
 */
export function omit<T extends object, K extends keyof T>(
  obj: T, 
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

export default {
  filterState,
  deepMerge,
  isObject,
  hasStateChanged,
  pick,
  omit
}; 