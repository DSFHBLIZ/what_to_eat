/**
 * 会话存储缓存适配器
 * 使用sessionStorage实现会话级别缓存
 */

import { CacheOptions, ICacheStorage } from './cacheManager';

interface StoredCacheEntry<T = any> {
  /** 缓存值 */
  value: T;
  /** 创建时间 */
  createdAt: number;
  /** 过期时间 */
  expiresAt: number | null;
  /** 缓存标签 */
  tags: string[];
  /** 最后更新时间 */
  updatedAt: number;
}

/**
 * 会话存储缓存键前缀
 */
const SESSION_STORAGE_PREFIX = 'app_session_';

/**
 * 会话存储缓存适配器类
 */
class SessionStorageCache implements ICacheStorage {
  private prefix: string;
  private defaultTTL: number = 30 * 60 * 1000; // 默认30分钟
  
  /**
   * 构造函数
   * @param prefix 缓存键前缀
   * @param defaultTTL 默认过期时间（毫秒）
   */
  constructor(prefix: string = SESSION_STORAGE_PREFIX, defaultTTL?: number) {
    this.prefix = prefix;
    if (defaultTTL !== undefined) {
      this.defaultTTL = defaultTTL;
    }
  }
  
  /**
   * 获取完整缓存键
   * @param key 原始键
   * @returns 添加前缀的缓存键
   */
  private getFullKey(key: string): string {
    return this.prefix + key;
  }
  
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   * @returns 是否设置成功
   */
  set<T>(key: string, value: T, options?: CacheOptions): boolean {
    try {
      const fullKey = this.getFullKey(key);
      const now = Date.now();
      const ttl = options?.ttl ?? this.defaultTTL;
      
      const entry: StoredCacheEntry<T> = {
        value,
        createdAt: now,
        expiresAt: ttl > 0 ? now + ttl : null,
        tags: options?.tags || [],
        updatedAt: now,
      };
      
      sessionStorage.setItem(fullKey, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error('会话存储缓存设置失败:', error);
      return false;
    }
  }
  
  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值或undefined
   */
  get<T>(key: string): T | undefined {
    try {
      const fullKey = this.getFullKey(key);
      const data = sessionStorage.getItem(fullKey);
      
      if (!data) {
        return undefined;
      }
      
      const entry = JSON.parse(data) as StoredCacheEntry<T>;
      const now = Date.now();
      
      // 检查是否过期
      if (entry.expiresAt !== null && entry.expiresAt < now) {
        this.remove(key);
        return undefined;
      }
      
      return entry.value;
    } catch (error) {
      console.error('会话存储缓存获取失败:', error);
      return undefined;
    }
  }
  
  /**
   * 获取缓存，如果不存在则由回调函数生成
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
    const value = this.get<T>(key);
    
    if (value !== undefined) {
      return value;
    }
    
    const result = await Promise.resolve(fallback());
    this.set(key, result, options);
    return result;
  }
  
  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在且未过期
   */
  has(key: string): boolean {
    try {
      const fullKey = this.getFullKey(key);
      const data = sessionStorage.getItem(fullKey);
      
      if (!data) {
        return false;
      }
      
      const entry = JSON.parse(data) as StoredCacheEntry;
      
      // 检查是否过期
      if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
        this.remove(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('会话存储缓存检查失败:', error);
      return false;
    }
  }
  
  /**
   * 移除缓存
   * @param key 缓存键
   * @returns 是否成功移除
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.getFullKey(key);
      sessionStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('会话存储缓存移除失败:', error);
      return false;
    }
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    try {
      // 仅清除带有指定前缀的缓存项
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error('会话存储缓存清空失败:', error);
    }
  }
  
  /**
   * 按标签移除缓存
   * @param tag 标签
   * @returns 移除的数量
   */
  removeByTag(tag: string): number {
    const keys = this.getKeysByTag(tag);
    
    keys.forEach(key => {
      this.remove(key);
    });
    
    return keys.length;
  }
  
  /**
   * 按标签获取缓存键列表
   * @param tag 标签
   * @returns 缓存键列表
   */
  getKeysByTag(tag: string): string[] {
    const result: string[] = [];
    
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key || !key.startsWith(this.prefix)) continue;
        
        const data = sessionStorage.getItem(key);
        if (!data) continue;
        
        try {
          const entry = JSON.parse(data) as StoredCacheEntry;
          if (entry.tags.includes(tag)) {
            // 从完整键中移除前缀
            result.push(key.substring(this.prefix.length));
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    } catch (error) {
      console.error('获取标签缓存键失败:', error);
    }
    
    return result;
  }
  
  /**
   * 获取所有缓存键
   * @returns 缓存键列表
   */
  getKeys(): string[] {
    const result: string[] = [];
    
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          // 从完整键中移除前缀
          result.push(key.substring(this.prefix.length));
        }
      }
    } catch (error) {
      console.error('获取缓存键列表失败:', error);
    }
    
    return result;
  }
  
  /**
   * 清理所有过期的缓存
   * @returns 清理的数量
   */
  purgeExpired(): number {
    let count = 0;
    
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key || !key.startsWith(this.prefix)) continue;
        
        const data = sessionStorage.getItem(key);
        if (!data) continue;
        
        try {
          const entry = JSON.parse(data) as StoredCacheEntry;
          if (entry.expiresAt !== null && entry.expiresAt < now) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
      
      // 删除过期项
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        count++;
      });
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
    
    return count;
  }
}

// 导出单例实例
const sessionCache = new SessionStorageCache();
export default sessionCache; 