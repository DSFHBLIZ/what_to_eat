/**
 * 工具函数统一入口
 * 直接导出常用函数，降低导入复杂度
 */

// 核心数据服务
export { 
  supabase, 
  getSupabaseClient,
  fetchRecipes,
  fetchRecipeById
} from './data/dataService';

// 错误处理
export { 
  logError, 
  logInfo, 
  logWarning, 
  logAppState 
} from './common/errorLogger';

// 数据转换
export * from './data/dataMapper';

// 菜谱工具
export * from './recipe';

// ID生成工具
export * from './identifiers';

// UI工具
export * from './ui';

// 数据安全处理
export {
  safeArray,
  safeString,
  safeNumber,
  safeObject,
  safeBoolean,
  validateAndSanitizeRecipe,
  createEmptyRecipe
} from './common/safeData';

// 其他子目录需要时按路径导入 