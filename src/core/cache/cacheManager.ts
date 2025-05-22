/**
 * 统一缓存管理器
 * 对本地存储和会话存储缓存进行统一管理
 */

import localCache from './localCache';
import sessionCache from './sessionCache';

export interface CacheOptions {
  /** 缓存时间（毫秒），默认为适配器默认TTL */
  ttl?: number;
  /** 缓存标签，用于分组管理缓存 */
  tags?: string[];
  /** 是否使用会话缓存，默认为false（使用本地存储） */
  useSession?: boolean;
}

/**
 * 缓存作用域类型
 */
export enum CacheScope {
  /** 本地存储（持久） */
  LOCAL = 'local',
  /** 会话存储（临时） */
  SESSION = 'session',
  /** 同时使用两种存储 */
  BOTH = 'both'
}

// 缓存存储接口
export interface ICacheStorage {
  set<T>(key: string, value: T, options?: CacheOptions): boolean;
  get<T>(key: string): T | undefined;
  getOrSet<T>(key: string, fallback: () => T | Promise<T>, options?: CacheOptions): Promise<T>;
  has(key: string): boolean;
  remove(key: string): boolean;
  clear(): void;
  removeByTag(tag: string): number;
  getKeysByTag(tag: string): string[];
  getKeys(): string[];
  purgeExpired(): number;
}

/**
 * 统一缓存管理器类
 */
class CacheManager {
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   * @returns 是否设置成功
   */
  set<T>(key: string, value: T, options?: CacheOptions): boolean {
    const useSession = options?.useSession ?? false;
    
    if (useSession) {
      return sessionCache.set(key, value, options);
    } else {
      return localCache.set(key, value, options);
    }
  }
  
  /**
   * 同时在本地存储和会话存储中设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   * @returns 是否两种存储都设置成功
   */
  setBoth<T>(key: string, value: T, options?: CacheOptions): boolean {
    const localResult = localCache.set(key, value, options);
    const sessionResult = sessionCache.set(key, value, options);
    return localResult && sessionResult;
  }
  
  /**
   * 按作用域设置缓存
   * @param scope 缓存作用域
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   * @returns 是否设置成功
   */
  setByScope<T>(scope: CacheScope, key: string, value: T, options?: CacheOptions): boolean {
    switch (scope) {
      case CacheScope.LOCAL:
        return localCache.set(key, value, options);
      case CacheScope.SESSION:
        return sessionCache.set(key, value, options);
      case CacheScope.BOTH:
        return this.setBoth(key, value, options);
      default:
        return false;
    }
  }
  
  /**
   * 获取缓存，优先从会话存储获取，如果不存在则从本地存储获取
   * @param key 缓存键
   * @param preferLocal 是否优先从本地存储获取，默认为false
   * @returns 缓存值或undefined
   */
  get<T>(key: string, preferLocal: boolean = false): T | undefined {
    if (preferLocal) {
      return localCache.get<T>(key) ?? sessionCache.get<T>(key);
    } else {
      return sessionCache.get<T>(key) ?? localCache.get<T>(key);
    }
  }
  
  /**
   * 从指定作用域获取缓存
   * @param scope 缓存作用域
   * @param key 缓存键
   * @returns 缓存值或undefined
   */
  getFromScope<T>(scope: CacheScope, key: string): T | undefined {
    switch (scope) {
      case CacheScope.LOCAL:
        return localCache.get<T>(key);
      case CacheScope.SESSION:
        return sessionCache.get<T>(key);
      case CacheScope.BOTH:
        return this.get<T>(key);
      default:
        return undefined;
    }
  }
  
  /**
   * 获取缓存，如果不存在则通过回调函数生成并缓存
   * @param key 缓存键
   * @param fallback 数据不存在时的回调函数
   * @param options 缓存选项
   * @returns 缓存值
   */
  async getOrSet<T>(
    key: string,
    fallback: () => T | Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const useSession = options?.useSession ?? false;
    
    if (useSession) {
      return sessionCache.getOrSet<T>(key, fallback, options);
    } else {
      return localCache.getOrSet<T>(key, fallback, options);
    }
  }
  
  /**
   * 按照作用域获取或设置缓存
   * @param scope 缓存作用域
   * @param key 缓存键
   * @param fallback 数据不存在时的回调函数
   * @param options 缓存选项
   * @returns 缓存值
   */
  async getOrSetByScope<T>(
    scope: CacheScope,
    key: string,
    fallback: () => T | Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    switch (scope) {
      case CacheScope.LOCAL:
        return localCache.getOrSet<T>(key, fallback, options);
      case CacheScope.SESSION:
        return sessionCache.getOrSet<T>(key, fallback, options);
      case CacheScope.BOTH:
        // 先尝试获取缓存
        const value = this.get<T>(key);
        if (value !== undefined) {
          return value;
        }
        
        // 获取新值并同时设置到两个缓存
        const result = await Promise.resolve(fallback());
        this.setBoth(key, result, options);
        return result;
      default:
        throw new Error(`不支持的缓存作用域: ${scope}`);
    }
  }
  
  /**
   * 检查缓存是否存在（任一缓存中存在即返回true）
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return sessionCache.has(key) || localCache.has(key);
  }
  
  /**
   * 检查指定作用域的缓存是否存在
   * @param scope 缓存作用域
   * @param key 缓存键
   * @returns 是否存在
   */
  hasByScope(scope: CacheScope, key: string): boolean {
    switch (scope) {
      case CacheScope.LOCAL:
        return localCache.has(key);
      case CacheScope.SESSION:
        return sessionCache.has(key);
      case CacheScope.BOTH:
        return this.has(key);
      default:
        return false;
    }
  }
  
  /**
   * 移除缓存（从所有缓存中移除）
   * @param key 缓存键
   * @returns 是否成功移除
   */
  remove(key: string): boolean {
    const localResult = localCache.remove(key);
    const sessionResult = sessionCache.remove(key);
    return localResult || sessionResult;
  }
  
  /**
   * 从指定作用域移除缓存
   * @param scope 缓存作用域
   * @param key 缓存键
   * @returns 是否成功移除
   */
  removeFromScope(scope: CacheScope, key: string): boolean {
    switch (scope) {
      case CacheScope.LOCAL:
        return localCache.remove(key);
      case CacheScope.SESSION:
        return sessionCache.remove(key);
      case CacheScope.BOTH:
        return this.remove(key);
      default:
        return false;
    }
  }
  
  /**
   * 清空所有缓存
   * @param scope 缓存作用域，默认清空所有作用域
   */
  clear(scope: CacheScope = CacheScope.BOTH): void {
    switch (scope) {
      case CacheScope.LOCAL:
        localCache.clear();
        break;
      case CacheScope.SESSION:
        sessionCache.clear();
        break;
      case CacheScope.BOTH:
        localCache.clear();
        sessionCache.clear();
        break;
    }
  }
  
  /**
   * 按标签移除缓存
   * @param tag 标签
   * @param scope 缓存作用域，默认为所有作用域
   * @returns 移除的数量
   */
  removeByTag(tag: string, scope: CacheScope = CacheScope.BOTH): number {
    let count = 0;
    
    switch (scope) {
      case CacheScope.LOCAL:
        count += localCache.removeByTag(tag);
        break;
      case CacheScope.SESSION:
        count += sessionCache.removeByTag(tag);
        break;
      case CacheScope.BOTH:
        count += localCache.removeByTag(tag);
        count += sessionCache.removeByTag(tag);
        break;
    }
    
    return count;
  }
  
  /**
   * 按标签获取缓存键列表
   * @param tag 标签
   * @param scope 缓存作用域，默认为所有作用域
   * @returns 缓存键列表
   */
  getKeysByTag(tag: string, scope: CacheScope = CacheScope.BOTH): string[] {
    let keys: string[] = [];
    
    switch (scope) {
      case CacheScope.LOCAL:
        keys = localCache.getKeysByTag(tag);
        break;
      case CacheScope.SESSION:
        keys = sessionCache.getKeysByTag(tag);
        break;
      case CacheScope.BOTH:
        const localKeys = localCache.getKeysByTag(tag);
        const sessionKeys = sessionCache.getKeysByTag(tag);
        
        // 合并并去重
        keys = Array.from(new Set([...localKeys, ...sessionKeys]));
        break;
    }
    
    return keys;
  }
  
  /**
   * 获取所有缓存键
   * @param scope 缓存作用域，默认为所有作用域
   * @returns 缓存键列表
   */
  getKeys(scope: CacheScope = CacheScope.BOTH): string[] {
    let keys: string[] = [];
    
    switch (scope) {
      case CacheScope.LOCAL:
        keys = localCache.getKeys();
        break;
      case CacheScope.SESSION:
        keys = sessionCache.getKeys();
        break;
      case CacheScope.BOTH:
        const localKeys = localCache.getKeys();
        const sessionKeys = sessionCache.getKeys();
        
        // 合并并去重
        keys = Array.from(new Set([...localKeys, ...sessionKeys]));
        break;
    }
    
    return keys;
  }
  
  /**
   * 清理已过期的缓存项
   * @param scope 缓存作用域，默认为所有作用域
   * @returns 清理的项数
   */
  purgeExpired(scope: CacheScope = CacheScope.BOTH): number {
    let count = 0;
    
    switch (scope) {
      case CacheScope.LOCAL:
        count += localCache.purgeExpired();
        break;
      case CacheScope.SESSION:
        count += sessionCache.purgeExpired();
        break;
      case CacheScope.BOTH:
        count += localCache.purgeExpired();
        count += sessionCache.purgeExpired();
        break;
    }
    
    return count;
  }
  
  /**
   * 获取本地缓存实例
   */
  getLocalCache() {
    return localCache;
  }
  
  /**
   * 获取会话缓存实例
   */
  getSessionCache() {
    return sessionCache;
  }
}

// 导出单例
export const cacheManager = new CacheManager();
export default cacheManager; 