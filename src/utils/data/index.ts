/**
 * 数据处理相关工具函数集合
 * 提供与数据库交互、数据转换、缓存等相关的工具函数
 */

// 重新导出 supabase 客户端
export { supabase, getSupabaseClient } from './dataService';

// 核心数据服务
export * from './dataService';
export * from './dataMapper';

// 存储相关（使用命名导出避免冲突）
import * as IndexedDB from './indexedDB';
import * as IndexedDBCache from './indexedDBCache';
import * as LocalStorage from './localStorage';
import * as SessionStorage from './sessionStorage';
import * as JsonLoader from './jsonLoader';
import * as JsonMigration from './jsonMigrationHelper';
import * as SafeJsonParse from './enhancedSafeJsonParse';
import * as Validation from './validation';
import * as DbOptimization from './db-optimization';
import * as FieldMapping from './fieldMapping';

export {
  IndexedDB,
  IndexedDBCache,
  LocalStorage,
  SessionStorage,
  JsonLoader,
  JsonMigration,
  SafeJsonParse,
  Validation,
  DbOptimization,
  FieldMapping
}; 