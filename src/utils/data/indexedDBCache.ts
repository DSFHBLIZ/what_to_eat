'use client';

import { Recipe } from '../../types/recipe';

// IndexedDB数据库名称与版本
const DB_NAME = 'RecipeFinderDB';
const DB_VERSION = 2; // 版本号增加以支持数据分片
const RECIPE_STORE = 'recipes';
const RECIPE_CHUNK_STORE = 'recipe_chunks'; // 新增存储分片的存储区
const COLLECTION_STORE = 'collections';
const META_STORE = 'metadata'; // 新增元数据存储区
const KEY_VALUE_STORE = 'keyValueStore'; // 新增通用键值对存储区

// 分片大小设置 (单位：字节)
const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5MB，安全低于2MB限制
const DEFAULT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

let db: IDBDatabase | null = null;

/**
 * 初始化IndexedDB数据库
 * @returns 成功初始化的Promise
 */
async function initDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is not available in server environment');
  }

  if (db) return db;

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // 创建菜谱存储
      if (!database.objectStoreNames.contains(RECIPE_STORE)) {
        const recipeStore = database.createObjectStore(RECIPE_STORE, { keyPath: 'id' });
        recipeStore.createIndex('name', 'name', { unique: false });
        console.log('已创建菜谱存储');
      }
      
      // 创建通用键值对存储
      if (!database.objectStoreNames.contains(KEY_VALUE_STORE)) {
        database.createObjectStore(KEY_VALUE_STORE, { keyPath: 'key' });
        console.log('已创建键值对存储');
      }
      
      // 创建元数据存储
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' });
        console.log('已创建元数据存储');
      }
      
      // 创建分片存储
      if (!database.objectStoreNames.contains(RECIPE_CHUNK_STORE)) {
        const chunkStore = database.createObjectStore(RECIPE_CHUNK_STORE, { keyPath: 'chunkId' });
        chunkStore.createIndex('batchId', 'batchId', { unique: false });
        chunkStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('已创建分片存储');
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log('已成功连接到IndexedDB');
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('连接IndexedDB失败:', (event.target as IDBOpenDBRequest).error);
      reject(new Error(`连接IndexedDB失败: ${(event.target as IDBOpenDBRequest).error}`));
    };
  });
}

/**
 * 压缩数据
 * @param data 需要压缩的数据
 * @returns 压缩后的字符串
 */
function compressData(data: any): string {
  try {
    // 简单的JSON转换，未来可以添加更复杂的压缩算法
    return JSON.stringify(data);
  } catch (error) {
    console.error('数据压缩失败:', error);
    throw error;
  }
}

/**
 * 解压数据
 * @param compressedData 压缩的数据
 * @returns 解压后的对象
 */
function decompressData<T>(compressedData: string): T {
  try {
    // 解析JSON数据
    return JSON.parse(compressedData) as T;
  } catch (error) {
    console.error('数据解压失败:', error instanceof Error ? error.message : String(error));
    throw new Error(`数据解压失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 分片存储大型数据
 * @param data 要存储的数据
 * @param batchId 批次ID，用于将相关分片分组
 * @returns 成功存储的Promise
 */
async function storeChunkedData(data: any[], batchId: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction(RECIPE_CHUNK_STORE, 'readwrite');
    const store = transaction.objectStore(RECIPE_CHUNK_STORE);
    
    // 压缩数据
    const compressedData = compressData(data);
    const totalSize = compressedData.length;
    
    // 计算需要多少个分片
    const chunkCount = Math.ceil(totalSize / CHUNK_SIZE);
    console.log(`存储数据大小: ${(totalSize / 1024 / 1024).toFixed(2)}MB, 分为${chunkCount}个分片`);
    
    // 存储元数据
    await storeMetadata({
      key: `batch_${batchId}`,
      totalChunks: chunkCount,
      totalSize,
      timestamp: Date.now(),
      itemCount: data.length
    });
    
    // 分片存储数据
    const storePromises: Promise<void>[] = [];
    
    for (let i = 0; i < chunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunk = compressedData.substring(start, end);
      
      const chunkData = {
        chunkId: `${batchId}_${i}`,
        batchId,
        chunkIndex: i,
        data: chunk,
        timestamp: Date.now()
      };
      
      const storeRequest = store.put(chunkData);
      storePromises.push(
        new Promise<void>((resolve, reject) => {
          storeRequest.onsuccess = () => resolve();
          storeRequest.onerror = (event) => {
            reject(new Error(`存储分片 ${i} 失败: ${(event.target as IDBRequest).error}`));
          };
        })
      );
    }
    
    // 等待所有分片存储完成
    await Promise.all(storePromises);
    console.log(`成功分片存储 ${batchId} 批次的 ${data.length} 条数据`);
  } catch (error) {
    console.error('分片存储数据失败:', error);
    throw error;
  }
}

/**
 * 存储元数据
 * @param metadata 元数据对象
 * @returns 成功存储的Promise
 */
async function storeMetadata(metadata: any): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction(META_STORE, 'readwrite');
    const store = transaction.objectStore(META_STORE);
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put(metadata);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        reject(new Error(`存储元数据失败: ${(event.target as IDBRequest).error}`));
      };
    });
  } catch (error) {
    console.error('存储元数据失败:', error);
    throw error;
  }
}

/**
 * 获取元数据
 * @param key 元数据键
 * @returns 元数据对象或null
 */
async function getMetadata(key: string): Promise<any | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction(META_STORE, 'readonly');
    const store = transaction.objectStore(META_STORE);
    
    return new Promise<any | null>((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => {
        reject(new Error(`获取元数据失败: ${(event.target as IDBRequest).error}`));
      };
    });
  } catch (error) {
    console.error('获取元数据失败:', error);
    return null;
  }
}

/**
 * 从分片中获取数据
 * @param batchId 批次ID
 * @returns 重构的数据数组
 */
async function getChunkedData<T>(batchId: string): Promise<T[]> {
  try {
    // 获取批次元数据
    const metadata = await getMetadata(`batch_${batchId}`);
    if (!metadata) {
      console.warn(`找不到批次 ${batchId} 的元数据`);
      return [];
    }
    
    const { totalChunks, totalSize } = metadata;
    if (!totalChunks || typeof totalChunks !== 'number' || totalChunks <= 0) {
      console.error(`批次 ${batchId} 的元数据无效: totalChunks=${totalChunks}`);
      return [];
    }
    
    const db = await initDB();
    const transaction = db.transaction(RECIPE_CHUNK_STORE, 'readonly');
    const store = transaction.objectStore(RECIPE_CHUNK_STORE);
    const index = store.index('batchId');
    
    // 获取所有分片
    const request = index.getAll(batchId);
    
    return new Promise<T[]>((resolve, reject) => {
      request.onsuccess = () => {
        try {
          const chunks = request.result;
          
          // 检查是否找到了所有分片
          if (!chunks || chunks.length === 0) {
            console.error(`未找到批次 ${batchId} 的任何分片`);
            return resolve([]);
          }
          
          if (chunks.length < totalChunks) {
            console.warn(`批次 ${batchId} 的分片不完整: 找到 ${chunks.length}/${totalChunks}`);
            // 可以选择返回部分数据或者直接返回空数组
            // 这里选择返回空数组，确保数据完整性
            return resolve([]);
          }
          
          // 按照chunkIndex排序分片
          chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
          
          // 验证分片序列是否完整
          const isSequenceComplete = chunks.every((chunk, index) => chunk.chunkIndex === index);
          if (!isSequenceComplete) {
            console.error(`批次 ${batchId} 的分片序列不完整`);
            return resolve([]);
          }
          
          // 合并所有分片数据
          let combinedData = '';
          for (const chunk of chunks) {
            if (!chunk.data || typeof chunk.data !== 'string') {
              console.error(`批次 ${batchId} 的分片 ${chunk.chunkIndex} 数据无效`);
              return resolve([]);
            }
            combinedData += chunk.data;
          }
          
          // 检查合并后的数据大小是否正确
          if (combinedData.length !== totalSize) {
            console.warn(`批次 ${batchId} 的数据大小不匹配: 实际=${combinedData.length}, 预期=${totalSize}`);
            // 可以选择继续处理或者返回空数组
            // 这里选择继续处理，因为长度可能有细微差异但数据仍然有效
          }
          
          // 解压数据
          try {
            const decompressedData = decompressData<T[]>(combinedData);
            console.log(`成功获取批次 ${batchId} 的分片数据: ${decompressedData.length} 项`);
            return resolve(decompressedData);
          } catch (decompressError) {
            console.error(`解压批次 ${batchId} 的数据失败:`, decompressError);
            return resolve([]);
          }
        } catch (error) {
          console.error(`处理批次 ${batchId} 的分片数据时出错:`, error);
          return resolve([]);
        }
      };
      
      request.onerror = (event) => {
        console.error(`获取批次 ${batchId} 的分片失败:`, (event.target as IDBRequest).error);
        reject(new Error(`获取批次 ${batchId} 的分片失败: ${(event.target as IDBRequest).error}`));
      };
    });
  } catch (error) {
    console.error(`获取批次 ${batchId} 的分片数据时出错:`, error);
    return [];
  }
}

/**
 * 直接缓存少量菜谱（无需分片）
 * @param recipes 菜谱数组
 * @returns 成功存储的Promise
 */
async function cacheRecipesDirectly(recipes: Recipe[]): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction(RECIPE_STORE, 'readwrite');
    const store = transaction.objectStore(RECIPE_STORE);
    
    // 存储每个菜谱
    const storePromises: Promise<void>[] = recipes.map(recipe => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put(recipe);
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          reject(new Error(`缓存菜谱 ${recipe.id} 失败: ${(event.target as IDBRequest).error}`));
        };
      });
    });
    
    await Promise.all(storePromises);
    
    // 更新缓存时间戳
    updateCacheTimestamp();
    
    console.log(`成功直接缓存 ${recipes.length} 个菜谱`);
  } catch (error) {
    console.error('直接缓存菜谱时出错:', error);
    throw error;
  }
}

/**
 * 缓存菜谱到IndexedDB，使用分片存储大型数据
 * @param recipes 菜谱数组
 * @returns 成功存储的Promise
 */
export async function cacheRecipes(recipes: Recipe[]): Promise<void> {
  try {
    // 如果数据量小，直接使用原始存储方式
    if (recipes.length <= 100) {
      await cacheRecipesDirectly(recipes);
      return;
    }
    
    // 为大数据集使用分片存储
    const batchId = `recipes_${Date.now()}`;
    await storeChunkedData(recipes, batchId);
    
    // 存储元数据索引，用于后续检索
    await storeMetadata({
      key: 'currentRecipeBatch',
      batchId,
      timestamp: Date.now(),
      recipeCount: recipes.length
    });
    
    // 更新缓存时间戳
    updateCacheTimestamp();
    
    console.log(`成功分片缓存 ${recipes.length} 个菜谱`);
  } catch (error) {
    console.error('缓存菜谱时出错:', error);
    throw error;
  }
}

/**
 * 从缓存中获取所有菜谱
 * @returns 菜谱数组
 */
export async function getCachedRecipes(): Promise<Recipe[]> {
  try {
    // 检查是否有分片存储的批次
    const currentBatchMeta = await getMetadata('currentRecipeBatch');
    
    // 如果有分片存储的批次，则从分片中获取数据
    if (currentBatchMeta && currentBatchMeta.batchId) {
      return getChunkedData<Recipe>(currentBatchMeta.batchId);
    }
    
    // 否则从常规存储中获取
    return getCachedRecipesDirectly();
  } catch (error) {
    console.error('读取缓存菜谱时出错:', error);
    return [];
  }
}

/**
 * 直接从存储中获取菜谱（无分片）
 * @returns 菜谱数组
 */
async function getCachedRecipesDirectly(): Promise<Recipe[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction(RECIPE_STORE, 'readonly');
    const store = transaction.objectStore(RECIPE_STORE);
    const request = store.getAll();
    
    return new Promise<Recipe[]>((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error(`获取缓存菜谱失败: ${request.error}`));
      };
    });
  } catch (error) {
    console.error('直接读取缓存菜谱时出错:', error);
    return [];
  }
}

/**
 * 根据ID从缓存获取菜谱
 * @param id 菜谱ID
 * @returns 菜谱对象或null
 */
export async function getCachedRecipeById(id: string): Promise<Recipe | null> {
  try {
    // 先尝试从直接存储中获取
    const db = await initDB();
    const transaction = db.transaction(RECIPE_STORE, 'readonly');
    const store = transaction.objectStore(RECIPE_STORE);
    const request = store.get(id);
    
    const directResult = await new Promise<Recipe | null>((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`获取ID为${id}的菜谱失败: ${request.error}`));
      };
    });
    
    if (directResult) {
      return directResult;
    }
    
    // 如果直接存储中没有，尝试从分片存储中查找
    const currentBatchMeta = await getMetadata('currentRecipeBatch');
    if (currentBatchMeta && currentBatchMeta.batchId) {
      const recipes = await getChunkedData<Recipe>(currentBatchMeta.batchId);
      return recipes.find(recipe => recipe.id === id) || null;
    }
    
    return null;
  } catch (error) {
    console.error(`获取ID为${id}的缓存菜谱时出错:`, error);
    return null;
  }
}

/**
 * 清除所有缓存的菜谱
 * @returns 清除成功的Promise
 */
export async function clearCachedRecipes(): Promise<void> {
  try {
    const db = await initDB();
    
    // 清除直接存储的菜谱
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(RECIPE_STORE, 'readwrite');
      const store = transaction.objectStore(RECIPE_STORE);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new Error(`清除菜谱直接缓存失败: ${request.error}`));
      };
    });
    
    // 清除分片存储的菜谱
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(RECIPE_CHUNK_STORE, 'readwrite');
      const store = transaction.objectStore(RECIPE_CHUNK_STORE);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new Error(`清除菜谱分片缓存失败: ${request.error}`));
      };
    });
    
    // 清除元数据中的菜谱批次信息
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(META_STORE, 'readwrite');
      const store = transaction.objectStore(META_STORE);
      const request = store.delete('currentRecipeBatch');
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new Error(`清除菜谱批次元数据失败: ${request.error}`));
      };
    });
    
    // 清除缓存时间戳
    localStorage.removeItem('lastRecipeCacheTime');
    
    console.log('成功清除所有菜谱缓存');
  } catch (error) {
    console.error('清除菜谱缓存时出错:', error);
    throw error;
  }
}

/**
 * 检查缓存是否为空
 * @returns 如果缓存为空则返回true，否则返回false
 */
export async function isCacheEmpty(): Promise<boolean> {
  try {
    // 检查元数据
    const currentBatchMeta = await getMetadata('currentRecipeBatch');
    if (currentBatchMeta && currentBatchMeta.batchId) {
      // 检查批次是否存在有效数据
      const metadata = await getMetadata(`batch_${currentBatchMeta.batchId}`);
      return !metadata || metadata.itemCount === 0;
    }
    
    // 检查直接存储
    const db = await initDB();
    const transaction = db.transaction(RECIPE_STORE, 'readonly');
    const store = transaction.objectStore(RECIPE_STORE);
    const countRequest = store.count();
    
    return new Promise<boolean>((resolve) => {
      countRequest.onsuccess = () => {
        resolve(countRequest.result === 0);
      };
      
      countRequest.onerror = () => {
        resolve(true); // 如果检查出错，假设缓存为空
      };
    });
  } catch (error) {
    console.error('检查缓存状态时出错:', error);
    return true; // 如果检查出错，假设缓存为空
  }
}

/**
 * 检查缓存是否过期
 * @param cacheTime 缓存时间（毫秒）
 * @returns 如果缓存过期或不存在则返回true，否则返回false
 */
export async function isCacheExpired(cacheTime: number = DEFAULT_CACHE_EXPIRY): Promise<boolean> {
  try {
    // 检查缓存是否为空
    const isEmpty = await isCacheEmpty();
    if (isEmpty) {
      return true; // 空缓存视为过期
    }
    
    // 检查上次缓存时间
    const lastCacheTimeStr = localStorage.getItem('lastRecipeCacheTime');
    if (!lastCacheTimeStr) {
      return true; // 没有缓存时间记录，视为缓存过期
    }
    
    const lastCacheTime = parseInt(lastCacheTimeStr, 10);
    const now = Date.now();
    
    // 检查是否超过缓存时间
    return now - lastCacheTime > cacheTime;
  } catch (error) {
    console.error('检查缓存过期时出错:', error);
    return true; // 如果出错，假设缓存过期
  }
}

/**
 * 更新缓存时间戳
 */
export function updateCacheTimestamp(): void {
  localStorage.setItem('lastRecipeCacheTime', Date.now().toString());
}

/**
 * 获取缓存统计信息
 * 返回缓存中的记录数、大小和上次更新时间等信息
 */
export async function getCacheStats(): Promise<{
  totalRecipes: number;
  totalSizeBytes: number;
  lastUpdated: Date | null;
  chunkedStorage: boolean;
  chunkCount?: number;
}> {
  try {
    // 默认统计数据
    let stats = {
      totalRecipes: 0,
      totalSizeBytes: 0,
      lastUpdated: null as Date | null,
      chunkedStorage: false,
      chunkCount: 0
    };
    
    // 检查是否有分片存储
    const currentBatchMeta = await getMetadata('currentRecipeBatch');
    if (currentBatchMeta && currentBatchMeta.batchId) {
      // 获取分片存储统计
      const batchMeta = await getMetadata(`batch_${currentBatchMeta.batchId}`);
      if (batchMeta) {
        stats.chunkedStorage = true;
        stats.totalRecipes = batchMeta.itemCount || 0;
        stats.totalSizeBytes = batchMeta.totalSize || 0;
        stats.chunkCount = batchMeta.totalChunks || 0;
        stats.lastUpdated = batchMeta.timestamp ? new Date(batchMeta.timestamp) : null;
        return stats;
      }
    }
    
    // 获取直接存储统计
    const db = await initDB();
    const transaction = db.transaction(RECIPE_STORE, 'readonly');
    const store = transaction.objectStore(RECIPE_STORE);
    const countRequest = store.count();
    
    return new Promise<{
      totalRecipes: number;
      totalSizeBytes: number;
      lastUpdated: Date | null;
      chunkedStorage: boolean;
      chunkCount?: number;
    }>((resolve) => {
      countRequest.onsuccess = () => {
        stats.totalRecipes = countRequest.result;
        
        // 估算大小
        if (stats.totalRecipes > 0) {
          // 假设每个菜谱平均5KB
          stats.totalSizeBytes = stats.totalRecipes * 5 * 1024; 
        }
        
        // 获取上次更新时间
        const lastCacheTimeStr = localStorage.getItem('lastRecipeCacheTime');
        if (lastCacheTimeStr) {
          stats.lastUpdated = new Date(parseInt(lastCacheTimeStr, 10));
        }
        
        resolve(stats);
      };
      
      countRequest.onerror = () => {
        resolve(stats); // 返回默认统计数据
      };
    });
  } catch (error) {
    console.error('获取缓存统计信息时出错:', error);
    return {
      totalRecipes: 0,
      totalSizeBytes: 0,
      lastUpdated: null,
      chunkedStorage: false
    };
  }
}

/**
 * 通用函数：保存任意数据到缓存
 * @param key 缓存键名
 * @param data 要缓存的数据
 * @param expiryTime 过期时间（毫秒）
 * @returns 成功存储的Promise
 */
export async function saveToCache<T>(key: string, data: T, expiryTime?: number): Promise<void> {
  try {
    const serializedData = JSON.stringify(data);
    const batchId = `${key}_${Date.now()}`;
    
    // 根据数据大小决定是否需要分片存储
    if (serializedData.length > 1.5 * 1024 * 1024) { // 如果大于1.5MB
      // 转换为数组以兼容storeChunkedData函数的参数要求
      const dataArray = Array.isArray(data) ? data : [data];
      await storeChunkedData(dataArray as any[], batchId);
      
      // 存储元数据索引，用于后续检索
      const metadataObject = {
        key: `cache_${key}`,
        batchId,
        timestamp: Date.now(),
        expiryTime: expiryTime || DEFAULT_CACHE_EXPIRY,
        itemCount: Array.isArray(data) ? data.length : 1
      };
      await storeMetadata(metadataObject);
    } else {
      // 数据较小，直接存储元数据
      const compressedData = compressData(data);
      const metadataObject = {
        key: `cache_${key}`,
        data: compressedData,
        timestamp: Date.now(),
        expiryTime: expiryTime || DEFAULT_CACHE_EXPIRY,
        itemCount: Array.isArray(data) ? data.length : 1
      };
      await storeMetadata(metadataObject);
    }
    
    console.log(`成功缓存数据到键 ${key}`);
  } catch (error) {
    console.error(`缓存数据到键 ${key} 时出错:`, error);
    throw error;
  }
}

/**
 * 从缓存中加载数据
 * @param key 缓存键
 * @param expiryTime 过期时间（毫秒）
 * @returns 缓存的数据或null
 */
export async function loadFromCache<T>(key: string, expiryTime?: number): Promise<T | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction(KEY_VALUE_STORE, 'readonly');
    const store = transaction.objectStore(KEY_VALUE_STORE);
    
    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        
        const { value, timestamp } = request.result;
        const now = Date.now();
        const expiry = expiryTime || DEFAULT_CACHE_EXPIRY;
        
        if (now - timestamp > expiry) {
          console.log(`键 ${key} 的缓存已过期`);
          resolve(null);
          return;
        }
        
        try {
          // 确保值是有效的JSON，如果需要
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try {
              const parsedValue = JSON.parse(value);
              resolve(parsedValue as T);
            } catch (parseError) {
              console.warn(`键 ${key} 的值不是有效的JSON:`, parseError instanceof Error ? parseError.message : String(parseError));
              resolve(value as unknown as T);
            }
          } else {
            resolve(value as T);
          }
        } catch (processingError) {
          console.error(`处理键 ${key} 的缓存值时出错:`, processingError instanceof Error ? processingError.message : String(processingError));
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        console.error(`获取键 ${key} 的缓存失败:`, error?.message || '未知错误');
        resolve(null);
      };
    });
  } catch (error) {
    console.error('加载缓存数据失败:', error instanceof Error ? error.message : String(error));
    return null;
  }
} 