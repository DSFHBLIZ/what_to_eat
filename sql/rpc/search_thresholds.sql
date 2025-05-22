-- search_thresholds.sql
-- 定义所有搜索相关的阈值常量

-- 注意：这些值需要与src/utils/data/searchConfig.ts保持同步
-- 所有常量以SQL函数的形式定义，以便在其他SQL函数中使用

-- 中文字符串匹配阈值
CREATE OR REPLACE FUNCTION get_chinese_string_match_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SQL_THRESHOLDS.CHINESE_STRING_MATCH = 0.3
    RETURN 0.3;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 分类匹配阈值
CREATE OR REPLACE FUNCTION get_category_match_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SQL_THRESHOLDS.CATEGORY_MATCH = 0.4
    RETURN 0.4;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 菜名匹配调整因子
CREATE OR REPLACE FUNCTION get_dish_name_adjust_factor()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SQL_THRESHOLDS.DISH_NAME_ADJUST_FACTOR = 0.8
    RETURN 0.8;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 模糊匹配相似度阈值 (pg_trgm)
CREATE OR REPLACE FUNCTION get_trgm_similarity_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 TRGM_SIMILARITY_THRESHOLD = 0.35
    RETURN 0.35;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 语义搜索默认阈值
CREATE OR REPLACE FUNCTION get_semantic_default_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.DEFAULT = 0.5
    RETURN 0.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 语义搜索严格阈值
CREATE OR REPLACE FUNCTION get_semantic_strict_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.STRICT = 0.7
    RETURN 0.7;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 语义搜索宽松阈值
CREATE OR REPLACE FUNCTION get_semantic_relaxed_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.RELAXED = 0.3
    RETURN 0.3;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 忌口食材检测阈值
CREATE OR REPLACE FUNCTION get_forbidden_ingredients_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.FORBIDDEN_INGREDIENTS = 0.8
    RETURN 0.8;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 必选食材检测阈值
CREATE OR REPLACE FUNCTION get_required_ingredients_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.REQUIRED_INGREDIENTS = 0.6
    RETURN 0.6;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 通用搜索阈值
CREATE OR REPLACE FUNCTION get_general_search_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.GENERAL_SEARCH = 0.5
    RETURN 0.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE; 