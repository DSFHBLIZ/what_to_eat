-- search_thresholds.sql
-- 定义所有搜索相关的阈值、权重和倍数常量

-- 注意：这些值需要与src/utils/data/searchConfig.ts保持同步
-- 所有常量以SQL函数的形式定义，以便在其他SQL函数中使用

-- ============= 基础阈值函数 =============

-- 中文字符串匹配阈值
CREATE OR REPLACE FUNCTION get_chinese_string_match_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SQL_THRESHOLDS.CHINESE_STRING_MATCH = 0.5
    RETURN 0.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 分类匹配阈值
CREATE OR REPLACE FUNCTION get_category_match_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SQL_THRESHOLDS.CATEGORY_MATCH = 0.5
    RETURN 0.5;
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
    -- 对应 TRGM_SIMILARITY_THRESHOLD = 0.4
    RETURN 0.4;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 语义搜索阈值函数 =============

-- 语义搜索默认阈值
CREATE OR REPLACE FUNCTION get_semantic_default_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.DEFAULT = 0.55
    RETURN 0.55;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 语义搜索严格阈值
CREATE OR REPLACE FUNCTION get_semantic_strict_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.STRICT = 0.8
    RETURN 0.8;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 语义搜索宽松阈值
CREATE OR REPLACE FUNCTION get_semantic_relaxed_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.RELAXED = 0.4
    RETURN 0.4;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 忌口食材检测阈值
CREATE OR REPLACE FUNCTION get_forbidden_ingredients_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.FORBIDDEN_INGREDIENTS = 0.85
    RETURN 0.85;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 必选食材检测阈值
CREATE OR REPLACE FUNCTION get_required_ingredients_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.REQUIRED_INGREDIENTS = 0.7
    RETURN 0.7;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 通用搜索阈值
CREATE OR REPLACE FUNCTION get_general_search_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SEMANTIC_SEARCH_THRESHOLDS.GENERAL_SEARCH = 0.55
    RETURN 0.55;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 评分权重函数 =============

-- 菜名匹配权重
CREATE OR REPLACE FUNCTION get_score_weight_dish_name_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.DISH_NAME.EXACT = 10.0
    RETURN 10.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_dish_name_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.DISH_NAME.FUZZY = 6.0
    RETURN 6.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_dish_name_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.DISH_NAME.SIMILAR = 4.0
    RETURN 4.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 必选食材权重
CREATE OR REPLACE FUNCTION get_score_weight_required_ingredient_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_INGREDIENTS.EXACT = 8.0
    RETURN 8.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_ingredient_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_INGREDIENTS.FUZZY = 5.0
    RETURN 5.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_ingredient_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_INGREDIENTS.SIMILAR = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 可选食材权重
CREATE OR REPLACE FUNCTION get_score_weight_optional_ingredient_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_INGREDIENTS.EXACT = 6.0
    RETURN 6.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_ingredient_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_INGREDIENTS.FUZZY = 4.0
    RETURN 4.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_ingredient_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_INGREDIENTS.SIMILAR = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 必选调料权重
CREATE OR REPLACE FUNCTION get_score_weight_required_condiment_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_CONDIMENTS.EXACT = 8.0
    RETURN 8.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_condiment_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_CONDIMENTS.FUZZY = 5.0
    RETURN 5.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_condiment_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_CONDIMENTS.SIMILAR = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 可选调料权重
CREATE OR REPLACE FUNCTION get_score_weight_optional_condiment_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_CONDIMENTS.EXACT = 6.0
    RETURN 6.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_condiment_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_CONDIMENTS.FUZZY = 4.0
    RETURN 4.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_condiment_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_CONDIMENTS.SIMILAR = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 必选食材分类权重
CREATE OR REPLACE FUNCTION get_score_weight_required_ingredient_category_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_INGREDIENT_CATEGORIES.EXACT = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_ingredient_category_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_INGREDIENT_CATEGORIES.FUZZY = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_ingredient_category_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_INGREDIENT_CATEGORIES.SIMILAR = 1.0
    RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 可选食材分类权重
CREATE OR REPLACE FUNCTION get_score_weight_optional_ingredient_category_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_INGREDIENT_CATEGORIES.EXACT = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_ingredient_category_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_INGREDIENT_CATEGORIES.FUZZY = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_ingredient_category_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_INGREDIENT_CATEGORIES.SIMILAR = 1.0
    RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 必选调料分类权重
CREATE OR REPLACE FUNCTION get_score_weight_required_condiment_category_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_CONDIMENT_CATEGORIES.EXACT = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_condiment_category_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_CONDIMENT_CATEGORIES.FUZZY = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_required_condiment_category_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.REQUIRED_CONDIMENT_CATEGORIES.SIMILAR = 1.0
    RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 可选调料分类权重
CREATE OR REPLACE FUNCTION get_score_weight_optional_condiment_category_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_CONDIMENT_CATEGORIES.EXACT = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_condiment_category_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_CONDIMENT_CATEGORIES.FUZZY = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_optional_condiment_category_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.OPTIONAL_CONDIMENT_CATEGORIES.SIMILAR = 1.0
    RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 菜系权重
CREATE OR REPLACE FUNCTION get_score_weight_cuisine_exact()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.CUISINE.EXACT = 5.0
    RETURN 5.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_cuisine_fuzzy()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.CUISINE.FUZZY = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_cuisine_similar()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.CUISINE.SIMILAR = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_cuisine_homestyle()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.CUISINE.HOMESTYLE = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 其他属性权重
CREATE OR REPLACE FUNCTION get_score_weight_flavor()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.FLAVOR = 4.0
    RETURN 4.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_difficulty()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.DIFFICULTY = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_dietary()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.DIETARY = 5.0
    RETURN 5.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_score_weight_semantic_match()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORE_WEIGHTS.SEMANTIC_MATCH = 10.0
    RETURN 10.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 最终得分倍数函数 =============

CREATE OR REPLACE FUNCTION get_final_multiplier_semantic_search()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.SEMANTIC_SEARCH = 3.0
    RETURN 3.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_dish_name()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.DISH_NAME = 2.8
    RETURN 2.8;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_required_ingredients()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.REQUIRED_INGREDIENTS = 2.5
    RETURN 2.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_required_condiments()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.REQUIRED_CONDIMENTS = 1.5
    RETURN 1.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_cuisine()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.CUISINE = 1.2
    RETURN 1.2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_flavor()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.FLAVOR = 1.2
    RETURN 1.2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_optional_ingredients()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.OPTIONAL_INGREDIENTS = 0.8
    RETURN 0.8;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_optional_condiments()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.OPTIONAL_CONDIMENTS = 0.5
    RETURN 0.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_required_ingredient_categories()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.REQUIRED_INGREDIENT_CATEGORIES = 0.7
    RETURN 0.7;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_required_condiment_categories()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.REQUIRED_CONDIMENT_CATEGORIES = 0.4
    RETURN 0.4;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_optional_ingredient_categories()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.OPTIONAL_INGREDIENT_CATEGORIES = 0.3
    RETURN 0.3;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_optional_condiment_categories()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 FINAL_MULTIPLIERS.OPTIONAL_CONDIMENT_CATEGORIES = 0.2
    RETURN 0.2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 关键词权重函数 =============

CREATE OR REPLACE FUNCTION get_keyword_weight_exact_match()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 KEYWORD_WEIGHTS.EXACT_MATCH = 1.0
    RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_keyword_weight_prefix_match()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 KEYWORD_WEIGHTS.PREFIX_MATCH = 0.8
    RETURN 0.8;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_keyword_weight_contains_match()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 KEYWORD_WEIGHTS.CONTAINS_MATCH = 0.6
    RETURN 0.6;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_keyword_weight_minimal_match()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 KEYWORD_WEIGHTS.MINIMAL_MATCH = 0.3
    RETURN 0.3;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 评分系统参数函数 =============

-- 通用惩罚因子
CREATE OR REPLACE FUNCTION get_penalty_factor_default()
RETURNS FLOAT AS $$
BEGIN
    -- 对应默认的杂质惩罚系数
    RETURN 0.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 归一化最大分数
CREATE OR REPLACE FUNCTION get_normalization_max_score()
RETURNS FLOAT AS $$
BEGIN
    -- 对应评分系统的最大分数范围
    RETURN 10.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 归一化最小分数
CREATE OR REPLACE FUNCTION get_normalization_min_score()
RETURNS FLOAT AS $$
BEGIN
    -- 对应评分系统的最小分数范围
    RETURN 0.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 可选项匹配阈值
CREATE OR REPLACE FUNCTION get_optional_matching_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 当匹配率低于此值时开始应用惩罚
    RETURN 0.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 语义相似度余弦距离基准
CREATE OR REPLACE FUNCTION get_semantic_cosine_base()
RETURNS FLOAT AS $$
BEGIN
    -- 余弦相似度计算基准值 (1 - 距离)
    RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 语义搜索归一化因子
CREATE OR REPLACE FUNCTION get_semantic_normalization_factor()
RETURNS FLOAT AS $$
BEGIN
    -- 语义搜索结果归一化因子
    RETURN 10.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：关键词倍数限制 =============

CREATE OR REPLACE FUNCTION get_keyword_score_multiplier_limit()
RETURNS FLOAT AS $$
BEGIN
    -- 关键词得分倍数限制（防止过度累加）
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：必选项杂质惩罚系数 =============

CREATE OR REPLACE FUNCTION get_required_penalty_factor()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORING_PARAMS.REQUIRED_PENALTY_FACTOR = 2.0
    RETURN 2.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：匹配惩罚阈值 =============

CREATE OR REPLACE FUNCTION get_matching_threshold()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORING_PARAMS.MATCHING_THRESHOLD = 0.5
    RETURN 0.5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：最大评分 =============

CREATE OR REPLACE FUNCTION get_max_score()
RETURNS FLOAT AS $$
BEGIN
    -- 对应 SCORING_PARAMS.MAX_SCORE = 10.0
    RETURN 10.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：关键词衰减因子 =============

CREATE OR REPLACE FUNCTION get_keyword_decay_factor()
RETURNS FLOAT AS $$
BEGIN
    -- 关键词权重衰减因子（多个关键词时的衰减）
    RETURN 0.7;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：默认分页参数 =============

CREATE OR REPLACE FUNCTION get_default_page()
RETURNS INTEGER AS $$
BEGIN
    RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_default_page_size()
RETURNS INTEGER AS $$
BEGIN
    RETURN 10;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_max_page_size()
RETURNS INTEGER AS $$
BEGIN
    RETURN 1000000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：搜索偏移常数 =============

CREATE OR REPLACE FUNCTION get_default_start_offset()
RETURNS INTEGER AS $$
BEGIN
    RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_max_start_offset()
RETURNS INTEGER AS $$
BEGIN
    RETURN 10000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 其他配置参数函数 =============

-- 避免除零错误的最小项目数（已在上面定义，此处删除重复）

-- ============= 新增：错误避免常数 =============

CREATE OR REPLACE FUNCTION get_min_item_count_to_avoid_division_by_zero()
RETURNS INTEGER AS $$
BEGIN
    RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 新增：缺失的函数定义 =============

-- 必选食材的杂质惩罚因子
CREATE OR REPLACE FUNCTION get_penalty_factor_required_ingredients()
RETURNS FLOAT AS $$
BEGIN
    -- 必选食材使用更严格的杂质惩罚系数
    RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============= 别名函数（用于兼容简化函数名） =============

-- 为main文件中使用的简化函数名创建别名
CREATE OR REPLACE FUNCTION get_final_multiplier_req_ingredients()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_required_ingredients();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_req_condiments()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_required_condiments();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_opt_ingredients()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_optional_ingredients();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_opt_condiments()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_optional_condiments();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_req_ing_cat()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_required_ingredient_categories();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_req_cond_cat()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_required_condiment_categories();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_opt_ing_cat()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_optional_ingredient_categories();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_final_multiplier_opt_cond_cat()
RETURNS FLOAT AS $$
BEGIN
    RETURN get_final_multiplier_optional_condiment_categories();
END;
$$ LANGUAGE plpgsql IMMUTABLE; 