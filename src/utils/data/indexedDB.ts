/**
 * IndexedDB安全工具函数
 * 提供类型安全的IndexedDB数据库操作
 */

/**
 * 数据库连接选项
 */
export interface DBOptions {
  dbName: string;
  version?: number;
  stores?: {
    name: string;
    keyPath: string;
    indexes?: {
      name: string;
      keyPath: string;
      options?: IDBIndexParameters;
    }[];
  }[];
}

/**
 * 索引查询选项
 */
export interface IndexQueryOptions {
  indexName: string;
  direction?: IDBCursorDirection;
  range?: IDBKeyRange;
  limit?: number;
}

/**
 * 原始查询选项
 */
export interface RawQueryOptions {
  direction?: IDBCursorDirection; 
  range?: IDBKeyRange;
  limit?: number;
}

/**
 * 安全的IndexedDB操作封装类
 */
export class SafeIndexedDB {
  private dbName: string;
  private version: number;
  private stores: DBOptions['stores'];
  private db: IDBDatabase | null = null;
  private connectionPromise: Promise<IDBDatabase> | null = null;

  /**
   * 构造函数
   * @param options 数据库配置选项
   */
  constructor(options: DBOptions) {
    this.dbName = options.dbName;
    this.version = options.version || 1;
    this.stores = options.stores || [];
  }

  /**
   * 连接到数据库
   * @returns 数据库连接
   */
  public connect(): Promise<IDBDatabase> {
    // 如果已有连接，直接返回
    if (this.db) {
      return Promise.resolve(this.db);
    }

    // 如果有正在进行的连接请求，返回它
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = (event) => {
          console.error(`[IndexedDB] 打开数据库失败:`, event);
          reject(new Error(`打开数据库失败: ${this.dbName}`));
          this.connectionPromise = null;
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          
          // 数据库关闭时清除引用
          this.db.onclose = () => {
            this.db = null;
          };
          
          // 数据库版本变更错误处理
          this.db.onversionchange = () => {
            this.db?.close();
            this.db = null;
            console.warn(`[IndexedDB] 数据库版本已更改，连接已关闭`);
          };
          
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // 创建对象存储
          this.stores?.forEach(store => {
            if (!db.objectStoreNames.contains(store.name)) {
              const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
              
              // 创建索引
              store.indexes?.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath, index.options);
              });
              
              console.log(`[IndexedDB] 创建存储: ${store.name}`);
            }
          });
        };
      } catch (error) {
        console.error(`[IndexedDB] 连接数据库错误:`, error);
        reject(error);
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  /**
   * 关闭数据库连接
   */
  public closeConnection(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log(`[IndexedDB] 数据库连接已关闭: ${this.dbName}`);
    }
  }

  /**
   * 添加数据项
   * @param storeName 存储名称
   * @param item 要添加的数据项
   * @returns 添加的数据项的键
   */
  public async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.connect();
    
    return new Promise<IDBValidKey>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.add(item as any);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 添加数据失败:`, event);
          reject(new Error(`添加数据失败: ${storeName}`));
        };
        
        transaction.oncomplete = () => {
          console.log(`[IndexedDB] 添加数据完成: ${storeName}`);
        };
        
        transaction.onerror = (event) => {
          console.error(`[IndexedDB] 事务错误:`, event);
          reject(new Error(`事务错误: ${storeName}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 添加数据错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 获取数据项
   * @param storeName 存储名称
   * @param key 键值
   * @returns 获取的数据项，不存在则返回null
   */
  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.connect();
    
    return new Promise<T | null>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 获取数据失败:`, event);
          reject(new Error(`获取数据失败: ${storeName}, key: ${key}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 获取数据错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 更新数据项
   * @param storeName 存储名称
   * @param item 要更新的数据项
   * @returns 更新的数据项的键
   */
  public async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.connect();
    
    return new Promise<IDBValidKey>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.put(item as any);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 更新数据失败:`, event);
          reject(new Error(`更新数据失败: ${storeName}`));
        };
        
        transaction.oncomplete = () => {
          console.log(`[IndexedDB] 更新数据完成: ${storeName}`);
        };
      } catch (error) {
        console.error(`[IndexedDB] 更新数据错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 删除数据项
   * @param storeName 存储名称
   * @param key 要删除的数据项的键
   * @returns 是否成功删除
   */
  public async delete(storeName: string, key: IDBValidKey): Promise<boolean> {
    const db = await this.connect();
    
    return new Promise<boolean>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 删除数据失败:`, event);
          reject(new Error(`删除数据失败: ${storeName}, key: ${key}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 删除数据错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 获取所有数据项
   * @param storeName 存储名称
   * @param options 查询选项
   * @returns 所有数据项的数组
   */
  public async getAll<T>(
    storeName: string, 
    options: RawQueryOptions = {}
  ): Promise<T[]> {
    const db = await this.connect();
    
    return new Promise<T[]>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        const results: T[] = [];
        
        // 使用游标遍历
        const request = store.openCursor(options.range, options.direction);
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          
          if (cursor) {
            results.push(cursor.value);
            
            // 如果设置了限制且已达到限制，则完成
            if (options.limit && results.length >= options.limit) {
              resolve(results);
              return;
            }
            
            cursor.continue();
          } else {
            // 已遍历完所有结果
            resolve(results);
          }
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 获取所有数据失败:`, event);
          reject(new Error(`获取所有数据失败: ${storeName}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 获取所有数据错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 使用索引查询数据
   * @param storeName 存储名称
   * @param options 索引查询选项
   * @returns 查询结果数组
   */
  public async queryByIndex<T>(
    storeName: string, 
    options: IndexQueryOptions
  ): Promise<T[]> {
    const db = await this.connect();
    
    return new Promise<T[]>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        // 检查索引是否存在
        if (!store.indexNames.contains(options.indexName)) {
          reject(new Error(`索引不存在: ${options.indexName}`));
          return;
        }
        
        const index = store.index(options.indexName);
        const results: T[] = [];
        
        // 使用索引游标
        const request = index.openCursor(options.range, options.direction);
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          
          if (cursor) {
            results.push(cursor.value);
            
            // 如果设置了限制且已达到限制，则完成
            if (options.limit && results.length >= options.limit) {
              resolve(results);
              return;
            }
            
            cursor.continue();
          } else {
            // 已遍历完所有结果
            resolve(results);
          }
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 索引查询失败:`, event);
          reject(new Error(`索引查询失败: ${storeName}, index: ${options.indexName}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 索引查询错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 清空存储
   * @param storeName 存储名称
   * @returns 是否成功清空
   */
  public async clear(storeName: string): Promise<boolean> {
    const db = await this.connect();
    
    return new Promise<boolean>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.clear();
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 清空存储失败:`, event);
          reject(new Error(`清空存储失败: ${storeName}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 清空存储错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 计算存储中的记录数
   * @param storeName 存储名称
   * @returns 记录数
   */
  public async count(storeName: string): Promise<number> {
    const db = await this.connect();
    
    return new Promise<number>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = store.count();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 计数失败:`, event);
          reject(new Error(`计数失败: ${storeName}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 计数错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 检查浏览器是否支持IndexedDB
   * @returns 是否支持
   */
  public static isSupported(): boolean {
    return !!window.indexedDB;
  }

  /**
   * 删除整个数据库
   * @param dbName 数据库名称
   * @returns 是否成功删除
   */
  public static deleteDatabase(dbName: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const request = indexedDB.deleteDatabase(dbName);
        
        request.onsuccess = () => {
          console.log(`[IndexedDB] 数据库已删除: ${dbName}`);
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error(`[IndexedDB] 删除数据库失败:`, event);
          reject(new Error(`删除数据库失败: ${dbName}`));
        };
      } catch (error) {
        console.error(`[IndexedDB] 删除数据库错误:`, error);
        reject(error);
      }
    });
  }
}

/**
 * 创建用于菜谱存储的SafeIndexedDB实例
 */
export function createRecipeDB(): SafeIndexedDB {
  return new SafeIndexedDB({
    dbName: 'RecipeDatabase',
    version: 1,
    stores: [
      {
        name: 'recipes',
        keyPath: 'id',
        indexes: [
          { name: 'name', keyPath: 'name' },
          { name: 'cuisine', keyPath: 'cuisine' },
          { name: 'difficulty', keyPath: 'difficulty' },
          { name: 'createdAt', keyPath: 'createdAt' }
        ]
      },
      {
        name: 'favorites',
        keyPath: 'id',
        indexes: [
          { name: 'recipeId', keyPath: 'recipeId' },
          { name: 'addedAt', keyPath: 'addedAt' }
        ]
      },
      {
        name: 'searchHistory',
        keyPath: 'id',
        indexes: [
          { name: 'query', keyPath: 'query' },
          { name: 'timestamp', keyPath: 'timestamp' }
        ]
      }
    ]
  });
}

export default {
  SafeIndexedDB,
  createRecipeDB
}; 