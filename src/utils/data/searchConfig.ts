/**
 * 搜索配置参数
 * 集中管理所有搜索相关的配置，使得调整参数更加方便
 */

// 语义搜索阈值类型定义
export interface SemanticThresholds {
  DEFAULT: number;
  STRICT: number;
  RELAXED: number;
  FORBIDDEN_INGREDIENTS: number;
  REQUIRED_INGREDIENTS: number;
  GENERAL_SEARCH: number;
}

// SQL工具函数阈值类型定义
export interface SqlThresholds {
  CHINESE_STRING_MATCH: number;  // 中文字符串匹配阈值
  CATEGORY_MATCH: number;        // 分类匹配阈值
  DISH_NAME_ADJUST_FACTOR: number; // 菜名匹配调整因子
}

// 搜索配置类型定义
export interface SearchConfig {
  VERSION: string;
  DEFAULT_PAGE_SIZE: number;
  MAX_PAGE_SIZE: number;
  DEFAULT_SORT_FIELD: string;
  DEFAULT_SORT_DIRECTION: 'asc' | 'desc';
  ENABLE_SEMANTIC_SEARCH: boolean;
  ENABLE_CACHE: boolean;
  SEMANTIC_THRESHOLDS: SemanticThresholds;
  SIMILARITY_THRESHOLD: number;
  SQL_THRESHOLDS: SqlThresholds;
}

// 语义搜索相关阈值
export const SEMANTIC_SEARCH_THRESHOLDS: SemanticThresholds = {
  // 基本阈值
  DEFAULT: 0.3,            // 默认语义搜索阈值，平衡精度和覆盖范围
  STRICT: 0.3,             // 严格语义搜索阈值（更高精度，更少结果）
  RELAXED: 0.3,            // 宽松语义搜索阈值（更低精度，更多结果）
  
  // 特定用途的阈值
  FORBIDDEN_INGREDIENTS: 0.5, // 忌口食材检测阈值（非常严格，避免误判）
  REQUIRED_INGREDIENTS: 0.3,  // 必选食材检测阈值（较严格）
  GENERAL_SEARCH: 0.3,        // 通用搜索阈值（中等严格度）
};

// SQL工具函数使用的阈值
export const SQL_THRESHOLDS: SqlThresholds = {
  CHINESE_STRING_MATCH: 0.3,  // 中文字符串匹配的相似度阈值
  CATEGORY_MATCH: 0.3,        // 分类匹配的相似度阈值
  DISH_NAME_ADJUST_FACTOR: 0.3, // 菜名匹配调整因子
};

// 模糊匹配相似度阈值 (pg_trgm)
export const TRGM_SIMILARITY_THRESHOLD = 0.3;

// 搜索相关配置
export const SEARCH_CONFIG: SearchConfig = {
  // 版本信息
  VERSION: '1.0.4',  // 更新版本号
  
  // 默认分页配置
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // 默认排序配置
  DEFAULT_SORT_FIELD: 'relevance_score',
  DEFAULT_SORT_DIRECTION: 'desc',
  
  // 功能开关
  ENABLE_SEMANTIC_SEARCH: true,
  ENABLE_CACHE: true,
  
  // 阈值配置 - 直接引用上面的常量
  SEMANTIC_THRESHOLDS: SEMANTIC_SEARCH_THRESHOLDS,
  SIMILARITY_THRESHOLD: TRGM_SIMILARITY_THRESHOLD,
  SQL_THRESHOLDS: SQL_THRESHOLDS,
};

// 导出默认配置
export default SEARCH_CONFIG; 