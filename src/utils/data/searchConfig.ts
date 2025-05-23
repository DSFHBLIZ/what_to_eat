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

// 评分权重配置类型定义
export interface ScoreWeights {
  // 菜名匹配权重
  DISH_NAME: {
    EXACT: number;    // 菜名精确匹配权重
    FUZZY: number;    // 菜名模糊匹配权重
    SIMILAR: number;  // 菜名相似度匹配权重
  };
  
  // 必选食材权重
  REQUIRED_INGREDIENTS: {
    EXACT: number;    // 必选食材精确匹配
    FUZZY: number;    // 必选食材模糊匹配
    SIMILAR: number;  // 必选食材相似度匹配
  };
  
  // 可选食材权重
  OPTIONAL_INGREDIENTS: {
    EXACT: number;    // 可选食材精确匹配
    FUZZY: number;    // 可选食材模糊匹配
    SIMILAR: number;  // 可选食材相似度匹配
  };
  
  // 必选调料权重
  REQUIRED_CONDIMENTS: {
    EXACT: number;    // 必选调料精确匹配
    FUZZY: number;    // 必选调料模糊匹配
    SIMILAR: number;  // 必选调料相似度匹配
  };
  
  // 可选调料权重
  OPTIONAL_CONDIMENTS: {
    EXACT: number;    // 可选调料精确匹配
    FUZZY: number;    // 可选调料模糊匹配
    SIMILAR: number;  // 可选调料相似度匹配
  };
  
  // 必选食材分类权重
  REQUIRED_INGREDIENT_CATEGORIES: {
    EXACT: number;    // 必选食材分类精确匹配
    FUZZY: number;    // 必选食材分类模糊匹配
    SIMILAR: number;  // 必选食材分类相似度匹配
  };
  
  // 可选食材分类权重
  OPTIONAL_INGREDIENT_CATEGORIES: {
    EXACT: number;    // 可选食材分类精确匹配
    FUZZY: number;    // 可选食材分类模糊匹配
    SIMILAR: number;  // 可选食材分类相似度匹配
  };
  
  // 必选调料分类权重
  REQUIRED_CONDIMENT_CATEGORIES: {
    EXACT: number;    // 必选调料分类精确匹配
    FUZZY: number;    // 必选调料分类模糊匹配
    SIMILAR: number;  // 必选调料分类相似度匹配
  };
  
  // 可选调料分类权重
  OPTIONAL_CONDIMENT_CATEGORIES: {
    EXACT: number;    // 可选调料分类精确匹配
    FUZZY: number;    // 可选调料分类模糊匹配
    SIMILAR: number;  // 可选调料分类相似度匹配
  };
  
  // 菜系权重
  CUISINE: {
    EXACT: number;      // 菜系精确匹配权重
    FUZZY: number;      // 菜系模糊匹配权重
    SIMILAR: number;    // 菜系相似度匹配权重
    HOMESTYLE: number;  // 家常菜加分权重
  };
  
  // 其他属性权重
  FLAVOR: number;                // 口味匹配权重
  DIFFICULTY: number;            // 难度匹配权重
  DIETARY: number;               // 饮食限制匹配权重
  SEMANTIC_MATCH: number;        // 语义搜索匹配权重
}

// 最终得分倍数配置类型定义
export interface FinalMultipliers {
  SEMANTIC_SEARCH: number;        // 语义搜索影响最大
  DISH_NAME: number;             // 菜名匹配信号强
  REQUIRED_INGREDIENTS: number;   // "按食材搜索"的核心
  REQUIRED_CONDIMENTS: number;    // 重要但次于主要食材
  CUISINE: number;               // 显著偏好
  FLAVOR: number;                // 显著偏好
  OPTIONAL_INGREDIENTS: number;   // 优化项，良好的补充
  OPTIONAL_CONDIMENTS: number;    // 较不重要的可选项
  REQUIRED_INGREDIENT_CATEGORIES: number;  // 必选但是更广泛的分类匹配
  REQUIRED_CONDIMENT_CATEGORIES: number;   // 必选但广泛，适用于调料
  OPTIONAL_INGREDIENT_CATEGORIES: number;  // 可选且广泛
  OPTIONAL_CONDIMENT_CATEGORIES: number;   // 可选且广泛，适用于调料
}

// 关键词匹配权重类型定义
export interface KeywordWeights {
  EXACT_MATCH: number;     // 完全匹配权重倍数 (1.0)
  PREFIX_MATCH: number;    // 前缀匹配权重倍数 (0.8)
  CONTAINS_MATCH: number;  // 包含匹配权重倍数 (0.6)
  MINIMAL_MATCH: number;   // 最低匹配权重倍数 (0.3)
}

// 评分系统参数类型定义
export interface ScoringParams {
  MAX_SCORE: number;                    // 最大评分 (10.0)
  PENALTY_FACTOR: number;               // 未命中惩罚因子 (0.4)
  MATCHING_THRESHOLD: number;           // 匹配惩罚阈值 (0.5)
  KEYWORD_DECAY_FACTOR: number;         // 关键词衰减因子 (0.7)
  REQUIRED_PENALTY_FACTOR: number;      // 必选项杂质惩罚系数 (2.0)
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
  SCORE_WEIGHTS: ScoreWeights;
  FINAL_MULTIPLIERS: FinalMultipliers;
  KEYWORD_WEIGHTS: KeywordWeights;
  SCORING_PARAMS: ScoringParams;
}

// 语义搜索相关阈值
export const SEMANTIC_SEARCH_THRESHOLDS: SemanticThresholds = {
  // 基本阈值
  DEFAULT: 0.55,            // 默认语义搜索阈值，平衡精度和覆盖范围
  STRICT: 0.8,             // 严格语义搜索阈值（更高精度，更少结果）
  RELAXED: 0.4,            // 宽松语义搜索阈值（更低精度，更多结果）
  
  // 特定用途的阈值
  FORBIDDEN_INGREDIENTS: 0.85, // 忌口食材检测阈值（非常严格，避免误判）
  REQUIRED_INGREDIENTS: 0.7,  // 必选食材检测阈值（较严格）
  GENERAL_SEARCH: 0.55,        // 通用搜索阈值（中等严格度）
};

// SQL工具函数使用的阈值
export const SQL_THRESHOLDS: SqlThresholds = {
  CHINESE_STRING_MATCH: 0.5,  // 中文字符串匹配的相似度阈值
  CATEGORY_MATCH: 0.5,        // 分类匹配的相似度阈值
  DISH_NAME_ADJUST_FACTOR: 0.8, // 菜名匹配调整因子
};

// 模糊匹配相似度阈值 (pg_trgm)
export const TRGM_SIMILARITY_THRESHOLD = 0.4;

// 评分权重配置
export const SCORE_WEIGHTS: ScoreWeights = {
  // 菜名匹配权重
  DISH_NAME: {
    EXACT: 10.0,    // 菜名精确匹配权重
    FUZZY: 6.0,     // 菜名模糊匹配权重(LIKE/%)
    SIMILAR: 4.0,   // 菜名相似度匹配权重
  },
  
  // 必选食材权重
  REQUIRED_INGREDIENTS: {
    EXACT: 8.0,     // 必选食材精确匹配
    FUZZY: 5.0,     // 必选食材模糊匹配
    SIMILAR: 3.0,   // 必选食材相似度匹配
  },
  
  // 可选食材权重
  OPTIONAL_INGREDIENTS: {
    EXACT: 6.0,     // 可选食材精确匹配
    FUZZY: 4.0,     // 可选食材模糊匹配
    SIMILAR: 2.0,   // 可选食材相似度匹配
  },
  
  // 必选调料权重
  REQUIRED_CONDIMENTS: {
    EXACT: 8.0,     // 必选调料精确匹配
    FUZZY: 5.0,     // 必选调料模糊匹配
    SIMILAR: 3.0,   // 必选调料相似度匹配
  },
  
  // 可选调料权重
  OPTIONAL_CONDIMENTS: {
    EXACT: 6.0,     // 可选调料精确匹配
    FUZZY: 4.0,     // 可选调料模糊匹配
    SIMILAR: 2.0,   // 可选调料相似度匹配
  },
  
  // 必选食材分类权重
  REQUIRED_INGREDIENT_CATEGORIES: {
    EXACT: 3.0,     // 必选食材分类精确匹配
    FUZZY: 2.0,     // 必选食材分类模糊匹配
    SIMILAR: 1.0,   // 必选食材分类相似度匹配
  },
  
  // 可选食材分类权重
  OPTIONAL_INGREDIENT_CATEGORIES: {
    EXACT: 3.0,     // 可选食材分类精确匹配
    FUZZY: 2.0,     // 可选食材分类模糊匹配
    SIMILAR: 1.0,   // 可选食材分类相似度匹配
  },
  
  // 必选调料分类权重
  REQUIRED_CONDIMENT_CATEGORIES: {
    EXACT: 3.0,     // 必选调料分类精确匹配
    FUZZY: 2.0,     // 必选调料分类模糊匹配
    SIMILAR: 1.0,   // 必选调料分类相似度匹配
  },
  
  // 可选调料分类权重
  OPTIONAL_CONDIMENT_CATEGORIES: {
    EXACT: 3.0,     // 可选调料分类精确匹配
    FUZZY: 2.0,     // 可选调料分类模糊匹配
    SIMILAR: 1.0,   // 可选调料分类相似度匹配
  },
  
  // 菜系权重
  CUISINE: {
    EXACT: 5.0,     // 菜系精确匹配权重
    FUZZY: 3.0,     // 菜系模糊匹配权重
    SIMILAR: 2.0,   // 菜系相似度匹配权重
    HOMESTYLE: 2.0, // 家常菜加分权重
  },
  
  // 其他属性权重
  FLAVOR: 4.0,                // 口味匹配权重
  DIFFICULTY: 3.0,            // 难度匹配权重
  DIETARY: 5.0,               // 饮食限制匹配权重
  SEMANTIC_MATCH: 10.0,       // 语义搜索匹配权重
};

// 最终得分倍数配置
export const FINAL_MULTIPLIERS: FinalMultipliers = {
  SEMANTIC_SEARCH: 3.0,        // 语义搜索影响最大
  DISH_NAME: 2.8,             // 菜名匹配信号强
  REQUIRED_INGREDIENTS: 2.5,   // "按食材搜索"的核心
  REQUIRED_CONDIMENTS: 1.5,    // 重要但次于主要食材
  CUISINE: 1.2,               // 显著偏好
  FLAVOR: 1.2,                // 显著偏好
  OPTIONAL_INGREDIENTS: 0.8,   // 优化项，良好的补充
  OPTIONAL_CONDIMENTS: 0.5,    // 较不重要的可选项
  REQUIRED_INGREDIENT_CATEGORIES: 0.7,  // 必选但是更广泛的分类匹配
  REQUIRED_CONDIMENT_CATEGORIES: 0.4,   // 必选但广泛，适用于调料
  OPTIONAL_INGREDIENT_CATEGORIES: 0.3,  // 可选且广泛
  OPTIONAL_CONDIMENT_CATEGORIES: 0.2,   // 可选且广泛，适用于调料
};

// 关键词匹配权重配置
export const KEYWORD_WEIGHTS: KeywordWeights = {
  EXACT_MATCH: 1.0,     // 完全匹配权重倍数
  PREFIX_MATCH: 0.8,    // 前缀匹配权重倍数
  CONTAINS_MATCH: 0.6,  // 包含匹配权重倍数
  MINIMAL_MATCH: 0.3,   // 最低匹配权重倍数
};

// 评分系统参数配置
export const SCORING_PARAMS: ScoringParams = {
  MAX_SCORE: 10.0,                    // 最大评分
  PENALTY_FACTOR: 0.4,                // 未命中惩罚因子 (0-1之间)
  MATCHING_THRESHOLD: 0.5,            // 匹配惩罚阈值 (低于50%匹配率开始惩罚)
  KEYWORD_DECAY_FACTOR: 0.7,          // 关键词衰减因子 (POWER函数中使用)
  REQUIRED_PENALTY_FACTOR: 2.0,       // 必选项杂质惩罚系数
};

// 搜索相关配置
export const SEARCH_CONFIG: SearchConfig = {
  // 版本信息
  VERSION: '1.2.0',  // 更新版本号 - 添加权重和倍数配置
  
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
  SCORE_WEIGHTS: SCORE_WEIGHTS,
  FINAL_MULTIPLIERS: FINAL_MULTIPLIERS,
  KEYWORD_WEIGHTS: KEYWORD_WEIGHTS,
  SCORING_PARAMS: SCORING_PARAMS,
};

// 导出默认配置
export default SEARCH_CONFIG; 