-- search_recipes_scoring.sql
--
-- 包含搜索菜谱所用的评分函数
-- 此文件是模块化重构的一部分
-- 注意：重构后，多个调料/分类相关函数已合并，以减少代码冗余和提高一致性

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS score_required_ingredients;
-- 必选食材评分 - 使用通用食材评分函数
CREATE OR REPLACE FUNCTION score_required_ingredients(
    IN_食材 JSONB,
    required_ingredients TEXT[],
    similarity_threshold FLOAT,
    score_weight_required_ingredient_exact FLOAT8,
    score_weight_required_ingredient_fuzzy FLOAT8,
    score_weight_required_ingredient_similar FLOAT8
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 调用通用食材评分函数，对必选食材使用更高的杂质惩罚系数
    RETURN score_ingredients(
        IN_食材,
        required_ingredients,
        similarity_threshold,
        score_weight_required_ingredient_exact,
        score_weight_required_ingredient_fuzzy,
        score_weight_required_ingredient_similar,
        2.5  -- 必选食材的杂质惩罚系数更高
    );
END;
$$ LANGUAGE plpgsql;

-- 添加一个通用的食材/调料评分函数
DROP FUNCTION IF EXISTS score_ingredients;
-- 通用食材/调料评分函数 - 输出0-10范围的归一化分数
CREATE OR REPLACE FUNCTION score_ingredients(
    IN_数据 JSONB,                 -- 输入的数据（食材或调料）
    ingredients TEXT[],            -- 需要评分的食材/调料列表
    similarity_threshold FLOAT,    -- 相似度阈值
    score_weight_exact FLOAT8,     -- 精确匹配权重
    score_weight_fuzzy FLOAT8,     -- 模糊匹配权重
    score_weight_similar FLOAT8,   -- 相似度匹配权重
    penalty_factor FLOAT8 DEFAULT 2.0  -- 杂质惩罚系数
)
RETURNS FLOAT8 AS $$
DECLARE
    total_score FLOAT8 := 0;
    item_score FLOAT8;
    item TEXT;
    item_count INTEGER := 0;           -- 用户提供的项目数量
    matched_count INTEGER := 0;        -- 匹配到的项目数量
    recipe_item_count INTEGER := 0;    -- 菜谱中的项目总数量
    match_ratio FLOAT8 := 0;           -- 匹配比例
    impurity_ratio FLOAT8 := 0;        -- 杂质比例
    impurity_penalty FLOAT8 := 0;      -- 杂质惩罚
    raw_score FLOAT8 := 0;             -- 原始得分
    normalized_score FLOAT8 := 0;      -- 归一化得分(0-10)
    max_possible_score FLOAT8;         -- 可能的最大得分(所有项目完美匹配)
BEGIN
    -- 如果没有评分项目，返回0分
    IF NOT has_elements(ingredients) THEN
        RETURN 0;
    END IF;
    
    -- 计算菜谱中项目总数
    SELECT jsonb_array_length(safe_jsonb_array(IN_数据)) INTO recipe_item_count;
    if recipe_item_count IS NULL OR recipe_item_count = 0 THEN
        recipe_item_count := 1; -- 避免除零错误
    END IF;
    
    -- 计算用户提供的项目数量
    item_count := array_length(ingredients, 1);
    
    -- 可能的最大得分(如果所有项目都精确匹配)
    max_possible_score := item_count * score_weight_exact;
    
    -- 计算每个项目的得分并累加
    FOREACH item IN ARRAY ingredients LOOP
        item_score := get_ingredient_match_score(
            IN_数据, 
            item,
            score_weight_exact,
            score_weight_fuzzy,
            score_weight_similar,
            similarity_threshold
        );
        
        -- 如果得分大于0，表示找到了匹配
        IF item_score > 0 THEN
            matched_count := matched_count + 1;
        END IF;
        
        total_score := total_score + item_score;
    END LOOP;
    
    -- 计算匹配比例
    match_ratio := GREATEST(matched_count::FLOAT / GREATEST(item_count, 1)::FLOAT, 0);
    
    -- 计算杂质比例（菜谱中未匹配的项目占比）
    impurity_ratio := GREATEST((recipe_item_count - matched_count)::FLOAT / recipe_item_count::FLOAT, 0);
    
    -- 计算杂质惩罚
    impurity_penalty := impurity_ratio * penalty_factor;
    
    -- 原始得分 = 总分 * 匹配比例 - 杂质惩罚
    raw_score := total_score * match_ratio - impurity_penalty;
    raw_score := GREATEST(raw_score, 0); -- 确保不为负数
    
    -- 归一化到0-10范围
    -- 如果max_possible_score为0，则返回0
    IF max_possible_score <= 0 THEN
        RETURN 0;
    END IF;
    
    -- 将得分归一化到0-10范围
    normalized_score := (raw_score / max_possible_score) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

-- 修改score_optional_ingredients函数调用通用函数
DROP FUNCTION IF EXISTS score_optional_ingredients;
-- 可选食材评分 - 现在调用通用评分函数
CREATE OR REPLACE FUNCTION score_optional_ingredients(
    IN_食材 JSONB,
    optional_ingredients TEXT[],
    similarity_threshold FLOAT,
    score_weight_optional_ingredient_exact FLOAT8,
    score_weight_optional_ingredient_fuzzy FLOAT8,
    score_weight_optional_ingredient_similar FLOAT8
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 调用通用食材评分函数
    RETURN score_ingredients(
        IN_食材,
        optional_ingredients,
        similarity_threshold,
        score_weight_optional_ingredient_exact,
        score_weight_optional_ingredient_fuzzy,
        score_weight_optional_ingredient_similar,
        2.0  -- 杂质惩罚系数
    );
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS score_required_condiments;
-- 必选调料评分 - 此函数已废弃，功能已合并到score_required_ingredients
-- 保留空函数以兼容旧代码
CREATE OR REPLACE FUNCTION score_required_condiments(
    IN_调料 JSONB,
    required_condiments TEXT[],
    score_weight_required_condiment_exact FLOAT8,
    score_weight_required_condiment_fuzzy FLOAT8,
    score_weight_required_condiment_similar FLOAT8,
    similarity_threshold FLOAT
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 返回0，此函数已不再使用
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 修改score_optional_condiments函数调用通用函数
DROP FUNCTION IF EXISTS score_optional_condiments;
-- 可选调料评分 - 现在调用通用评分函数
-- 已废弃，建议使用score_optional_ingredients，但保留以兼容性
CREATE OR REPLACE FUNCTION score_optional_condiments(
    IN_调料 JSONB,
    optional_condiments TEXT[],
    similarity_threshold FLOAT,
    score_weight_optional_condiment_exact FLOAT8,
    score_weight_optional_condiment_fuzzy FLOAT8,
    score_weight_optional_condiment_similar FLOAT8
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 调用通用食材评分函数，但使用较低的杂质惩罚系数
    RETURN score_ingredients(
        IN_调料,
        optional_condiments,
        similarity_threshold,
        score_weight_optional_condiment_exact,
        score_weight_optional_condiment_fuzzy,
        score_weight_optional_condiment_similar,
        1.5  -- 调料杂质惩罚系数较低
    );
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS score_required_ingredient_categories;
-- 必选食材分类评分 - 现在调用通用评分函数
CREATE OR REPLACE FUNCTION score_required_ingredient_categories(
    IN_食材分类 JSONB,
    required_ingredient_categories TEXT[],
    similarity_threshold FLOAT,
    score_weight_required_ingredient_category_exact FLOAT8,
    score_weight_required_ingredient_category_fuzzy FLOAT8,
    score_weight_required_ingredient_category_similar FLOAT8
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 调用通用评分函数
    RETURN score_categories(
        IN_食材分类,
        required_ingredient_categories,
        similarity_threshold,
        score_weight_required_ingredient_category_exact,
        score_weight_required_ingredient_category_fuzzy,
        score_weight_required_ingredient_category_similar
    );
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS score_optional_ingredient_categories;
-- 可选食材分类评分 - 现在调用通用评分函数
CREATE OR REPLACE FUNCTION score_optional_ingredient_categories(
    IN_食材分类 JSONB,
    optional_ingredient_categories TEXT[],
    similarity_threshold FLOAT,
    score_weight_optional_ingredient_category_exact FLOAT8,
    score_weight_optional_ingredient_category_fuzzy FLOAT8,
    score_weight_optional_ingredient_category_similar FLOAT8
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 调用通用评分函数
    RETURN score_categories(
        IN_食材分类,
        optional_ingredient_categories,
        similarity_threshold,
        score_weight_optional_ingredient_category_exact,
        score_weight_optional_ingredient_category_fuzzy,
        score_weight_optional_ingredient_category_similar
    );
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS score_required_condiment_categories;
-- 必选调料分类评分 - 已冗余但保留以兼容性，现在调用通用评分函数
-- 注意：此函数功能可整合到score_required_ingredient_categories中
CREATE OR REPLACE FUNCTION score_required_condiment_categories(
    IN_调料分类 JSONB,
    required_condiment_categories TEXT[],
    similarity_threshold FLOAT,
    score_weight_required_condiment_category_exact FLOAT8,
    score_weight_required_condiment_category_fuzzy FLOAT8,
    score_weight_required_condiment_category_similar FLOAT8
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 调用通用评分函数
    RETURN score_categories(
        IN_调料分类,
        required_condiment_categories,
        similarity_threshold,
        score_weight_required_condiment_category_exact,
        score_weight_required_condiment_category_fuzzy,
        score_weight_required_condiment_category_similar
    );
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS score_optional_condiment_categories;
-- 可选调料分类评分 - 已冗余但保留以兼容性，现在调用通用评分函数
-- 注意：此函数功能可整合到score_optional_ingredient_categories中
CREATE OR REPLACE FUNCTION score_optional_condiment_categories(
    IN_调料分类 JSONB,
    optional_condiment_categories TEXT[],
    similarity_threshold FLOAT,
    score_weight_optional_condiment_category_exact FLOAT8,
    score_weight_optional_condiment_category_fuzzy FLOAT8,
    score_weight_optional_condiment_category_similar FLOAT8
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 调用通用评分函数
    RETURN score_categories(
        IN_调料分类,
        optional_condiment_categories,
        similarity_threshold,
        score_weight_optional_condiment_category_exact,
        score_weight_optional_condiment_category_fuzzy,
        score_weight_optional_condiment_category_similar
    );
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS score_dish_name_keywords;
-- 菜名关键词评分 - 输出0-10范围的归一化分数
CREATE OR REPLACE FUNCTION score_dish_name_keywords(
    IN_菜名 TEXT,
    dish_name_keywords TEXT[],
    score_weight_dish_name_exact FLOAT8,
    score_weight_dish_name_fuzzy FLOAT8,
    score_weight_dish_name_similar FLOAT8,
    similarity_threshold FLOAT
)
RETURNS FLOAT8 AS $$
DECLARE
    total_score FLOAT8 := 0;
    keyword_score FLOAT8;
    keyword TEXT;
    max_keyword_score FLOAT8 := 0;
    keyword_count INT := 0;
    max_possible_score FLOAT8;
    normalized_score FLOAT8;
BEGIN
    -- 如果没有菜名关键词，返回0分
    IF NOT has_elements(dish_name_keywords) THEN
        RETURN 0;
    END IF;
    
    -- 计算可能的最大得分(如果所有关键词都精确匹配)
    max_possible_score := array_length(dish_name_keywords, 1) * score_weight_dish_name_exact;
    
    -- 计算每个菜名关键词的得分并累加
    FOREACH keyword IN ARRAY dish_name_keywords LOOP
        keyword_score := get_dish_name_match_score(
            IN_菜名,
            keyword,
            score_weight_dish_name_exact,
            score_weight_dish_name_fuzzy,
            score_weight_dish_name_similar,
            similarity_threshold
        );
        
        -- 记录最高分
        IF keyword_score > max_keyword_score THEN
            max_keyword_score := keyword_score;
        END IF;
        
        -- 累加分数，但对额外的关键词应用递减权重，避免过多关键词导致分数过高
        IF keyword_score > 0 THEN
            keyword_count := keyword_count + 1;
            -- 第一个匹配的关键词获得全部分数，后续关键词递减
            total_score := total_score + (keyword_score * POWER(0.7, keyword_count - 1));
        END IF;
    END LOOP;
    
    -- 确保总分不超过最高单一关键词分数的2倍，防止过度累加
    total_score := LEAST(total_score, max_keyword_score * 2);
    
    -- 归一化到0-10范围
    IF max_possible_score <= 0 THEN
        RETURN 0;
    END IF;
    
    normalized_score := (total_score / max_possible_score) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS score_search_query;
-- 搜索关键词评分 - 输出0-10范围的归一化分数
CREATE OR REPLACE FUNCTION score_search_query(
    IN_菜名 TEXT,
    IN_菜系 TEXT,
    IN_食材 JSONB,
    IN_调料 JSONB,
    search_query TEXT,
    dish_name_keywords TEXT[],
    score_weight_dish_name_exact FLOAT8,
    score_weight_dish_name_fuzzy FLOAT8,
    score_weight_dish_name_similar FLOAT8,
    score_weight_cuisine_exact FLOAT8,
    score_weight_cuisine_fuzzy FLOAT8,
    score_weight_cuisine_similar FLOAT8,
    score_weight_cuisine_homestyle FLOAT8,
    score_weight_keyword_hit FLOAT8,
    max_keyword_hits INTEGER,
    similarity_threshold FLOAT
)
RETURNS FLOAT8 AS $$
DECLARE
    score FLOAT8 := 0;
    count_matches INTEGER;
    max_possible_score FLOAT8;
    normalized_score FLOAT8;
BEGIN
    -- 如果搜索关键词为空，返回0分
    IF search_query IS NULL OR LENGTH(TRIM(search_query)) = 0 THEN
        RETURN 0;
    END IF;
    
    -- 避免与dish_name_keywords重复计算得分
    IF has_elements(dish_name_keywords) AND search_query = ANY(dish_name_keywords) THEN
        RETURN 0;
    END IF;
    
    -- 设置可能的最大得分
    max_possible_score := GREATEST(
        score_weight_dish_name_exact,
        score_weight_cuisine_exact,
        score_weight_cuisine_homestyle,
        max_keyword_hits * score_weight_keyword_hit
    );
    
    -- 1. 菜名匹配（最高权重）
    IF IN_菜名 = search_query THEN 
        score := score_weight_dish_name_exact;
    ELSIF IN_菜名 % search_query OR search_query % IN_菜名 THEN 
        score := score_weight_dish_name_fuzzy;
    ELSIF similarity(IN_菜名, search_query) > similarity_threshold THEN 
        score := similarity(IN_菜名, search_query) * score_weight_dish_name_similar;
    END IF;
    
    -- 2. 菜系匹配
    IF IN_菜系 = search_query THEN 
        score := GREATEST(score, score_weight_cuisine_exact);
    ELSIF IN_菜系 % search_query OR search_query % IN_菜系 THEN 
        score := GREATEST(score, score_weight_cuisine_fuzzy);
    ELSIF similarity(IN_菜系, search_query) > similarity_threshold THEN
        score := GREATEST(score, similarity(IN_菜系, search_query) * score_weight_cuisine_similar);
    -- 给"家常菜"额外加分以提升优先级
    ELSIF IN_菜系 = '家常菜' THEN 
        score := GREATEST(score, score_weight_cuisine_homestyle);
    END IF;
    
    -- 3. 食材匹配 - 关键词命中计数，最多累计max_keyword_hits次
    SELECT COUNT(*)
    INTO count_matches
    FROM jsonb_array_elements(safe_jsonb_array(IN_食材)) AS elem,
    LATERAL (SELECT (elem->>'名称')::text AS elem_name) e
    WHERE e.elem_name IS NOT NULL AND 
          (e.elem_name = search_query OR e.elem_name % search_query OR 
           search_query % e.elem_name OR similarity(e.elem_name, search_query) > similarity_threshold)
    LIMIT max_keyword_hits;
    
    IF count_matches > 0 THEN
        score := GREATEST(score, LEAST(count_matches, max_keyword_hits) * score_weight_keyword_hit);
    END IF;
    
    -- 4. 调料匹配 - 关键词命中计数，最多累计max_keyword_hits次
    SELECT COUNT(*)
    INTO count_matches
    FROM jsonb_array_elements(safe_jsonb_array(IN_调料)) AS elem,
    LATERAL (SELECT (elem->>'名称')::text AS elem_name) e
    WHERE e.elem_name IS NOT NULL AND 
          (e.elem_name = search_query OR e.elem_name % search_query OR 
           search_query % e.elem_name OR similarity(e.elem_name, search_query) > similarity_threshold)
    LIMIT max_keyword_hits;
    
    IF count_matches > 0 THEN
        score := GREATEST(score, LEAST(count_matches, max_keyword_hits) * score_weight_keyword_hit);
    END IF;
    
    -- 归一化到0-10范围
    IF max_possible_score <= 0 THEN
        RETURN 0;
    END IF;
    
    normalized_score := (score / max_possible_score) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS normalize_optional_score;
-- 归一化可选项得分，确保输出0-10的归一化分数
-- 注意：此函数主要用于可选的分类评分函数(score_optional_ingredient_categories和score_optional_condiment_categories)
CREATE OR REPLACE FUNCTION normalize_optional_score(
    total_matched_score FLOAT8,     -- 已匹配项的总得分
    total_options_count INTEGER,    -- 用户提供的可选项总数量
    max_weight_per_item FLOAT8,     -- 每项可选项的最大权重
    penalty_factor FLOAT8 DEFAULT 0.4  -- 未命中惩罚因子 (0-1之间)
)
RETURNS FLOAT8 AS $$
DECLARE
    normalized_score FLOAT8;
    max_possible_score FLOAT8;
    missing_penalty FLOAT8 := 0;
    matching_ratio FLOAT8;
    final_score FLOAT8;
BEGIN
    -- 如果没有可选项，直接返回0
    IF total_options_count <= 0 THEN
        RETURN 0;
    END IF;
    
    -- 计算理论最大得分(如果所有选项都精确匹配)
    max_possible_score := total_options_count * max_weight_per_item;
    
    -- 计算匹配比例
    matching_ratio := total_matched_score / max_possible_score;
    
    -- 计算未命中惩罚（低命中率时的惩罚会更大）
    -- 当匹配率低于50%时开始应用惩罚
    IF matching_ratio < 0.5 THEN
        -- 惩罚随匹配率降低而增加
        missing_penalty := (0.5 - matching_ratio) * penalty_factor * max_possible_score;
    END IF;
    
    -- 计算初步归一化得分
    normalized_score := total_matched_score - missing_penalty;
    normalized_score := GREATEST(normalized_score, 0); -- 确保不为负数
    
    -- 转化为0-10范围
    final_score := (normalized_score / max_possible_score) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(final_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

-- 删除旧的语义搜索评分函数
DROP FUNCTION IF EXISTS score_semantic_search;

-- 添加新的语义搜索评分函数，符合main文件中的调用参数
CREATE OR REPLACE FUNCTION score_semantic_search(
    recipe_embedding vector,     -- 菜谱的嵌入向量
    query_embedding vector,      -- 查询的嵌入向量
    semantic_threshold double precision,          -- 语义相似度阈值
    score_weight_semantic_match double precision  -- 语义匹配权重
)
RETURNS FLOAT8 AS $$
DECLARE
    similarity_score FLOAT8 := 0;
    effective_threshold FLOAT8 := semantic_threshold;  -- 直接使用传入的阈值
    raw_score FLOAT8 := 0;
    normalized_score FLOAT8 := 0;
BEGIN
    -- 如果任一向量为NULL，返回0分
    IF recipe_embedding IS NULL OR query_embedding IS NULL THEN
        RETURN 0;
    END IF;
    
    -- 计算余弦相似度 (1 - 距离)
    -- PostgreSQL的向量运算符 <=> 计算两个向量之间的余弦距离
    similarity_score := 1 - (recipe_embedding <=> query_embedding);
    
    -- 如果相似度低于阈值，返回0
    IF similarity_score < effective_threshold THEN
        RETURN 0;
    END IF;
    
    -- 计算原始得分 (相似度 * 权重)
    raw_score := similarity_score * score_weight_semantic_match;
    
    -- 归一化到0-10范围
    IF raw_score <= 0 THEN
        RETURN 0;
    END IF;
    
    normalized_score := (raw_score / 10.0) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION score_semantic_search(vector, vector, double precision, double precision) IS
'计算两个向量之间的语义相似度得分，用于搜索菜谱时的语义匹配。
输出范围：0-10，其中0表示不相关，10表示完全匹配。

参数:
- recipe_embedding: 菜谱的嵌入向量
- query_embedding: 查询的嵌入向量
- semantic_threshold: 语义相似度阈值，低于此值视为不相关
- score_weight_semantic_match: 语义匹配权重';

-- 添加score_cuisine函数定义
DROP FUNCTION IF EXISTS score_cuisine;
-- 菜系评分 - 输出0-10范围的归一化分数
CREATE OR REPLACE FUNCTION score_cuisine(
    IN_菜系 TEXT,
    IN_菜系_jsonb JSONB,
    cuisines TEXT[],
    similarity_threshold FLOAT,
    score_weight_cuisine_exact FLOAT8,
    score_weight_cuisine_fuzzy FLOAT8,
    score_weight_cuisine_similar FLOAT8,
    score_weight_cuisine_homestyle FLOAT8
)
RETURNS FLOAT8 AS $$
DECLARE
    total_score FLOAT8 := 0;
    cuisine TEXT;
    matched BOOLEAN;
    match_type TEXT;
    homestyle_bonus FLOAT8 := 0;
    max_possible_score FLOAT8;
    normalized_score FLOAT8;
BEGIN
    -- 如果没有菜系筛选条件，返回基础分
    IF NOT has_elements(cuisines) THEN
        RETURN 0;
    END IF;
    
    -- 计算可能的最大得分 (所有菜系都精确匹配 + 可能的家常菜加分)
    max_possible_score := array_length(cuisines, 1) * score_weight_cuisine_exact + score_weight_cuisine_homestyle;
    
    -- 检查"家常菜"加分
    IF IN_菜系 ILIKE '%家常%' OR IN_菜系 ILIKE '%家常菜%' THEN
        homestyle_bonus := score_weight_cuisine_homestyle;
    END IF;
    
    -- 计算每个菜系的得分
    FOREACH cuisine IN ARRAY cuisines LOOP
        matched := FALSE;
        
        -- 精确匹配
        IF IN_菜系 = cuisine THEN
            total_score := total_score + score_weight_cuisine_exact;
            matched := TRUE;
            match_type := 'exact';
        -- 模糊匹配 (LIKE)
        ELSIF IN_菜系 ILIKE '%' || cuisine || '%' OR cuisine ILIKE '%' || IN_菜系 || '%' THEN
            total_score := total_score + score_weight_cuisine_fuzzy;
            matched := TRUE;
            match_type := 'fuzzy';
        -- 相似度匹配
        ELSIF similarity(IN_菜系, cuisine) > similarity_threshold THEN
            total_score := total_score + score_weight_cuisine_similar;
            matched := TRUE;
            match_type := 'similar';
        END IF;
        
        -- 如果没找到匹配，尝试在JSON中查找
        IF NOT matched AND IN_菜系_jsonb IS NOT NULL THEN
            IF jsonb_typeof(IN_菜系_jsonb) = 'array' THEN
                -- 遍历JSON数组中的菜系
                FOR i IN 0..jsonb_array_length(IN_菜系_jsonb)-1 LOOP
                    -- 精确匹配
                    IF jsonb_array_element_text(IN_菜系_jsonb, i) = cuisine THEN
                        total_score := total_score + score_weight_cuisine_exact;
                        matched := TRUE;
                        match_type := 'json_exact';
                        EXIT;
                    -- 模糊匹配 (LIKE)
                    ELSIF jsonb_array_element_text(IN_菜系_jsonb, i) ILIKE '%' || cuisine || '%' OR 
                          cuisine ILIKE '%' || jsonb_array_element_text(IN_菜系_jsonb, i) || '%' THEN
                        total_score := total_score + score_weight_cuisine_fuzzy;
                        matched := TRUE;
                        match_type := 'json_fuzzy';
                        EXIT;
                    -- 相似度匹配
                    ELSIF similarity(jsonb_array_element_text(IN_菜系_jsonb, i), cuisine) > similarity_threshold THEN
                        total_score := total_score + score_weight_cuisine_similar;
                        matched := TRUE;
                        match_type := 'json_similar';
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END LOOP;
    
    -- 将菜系得分 + 家常菜加分归一化到0-10范围
    total_score := total_score + homestyle_bonus;
    
    -- 归一化处理
    IF max_possible_score <= 0 THEN
        RETURN 0;
    END IF;
    
    normalized_score := (total_score / max_possible_score) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

-- 定义缺失的score_flavor函数
DROP FUNCTION IF EXISTS score_flavor;
-- 口味评分 - 输出0-10范围的归一化分数
CREATE OR REPLACE FUNCTION score_flavor(
    IN_口味特点 JSONB,
    flavors TEXT[],
    score_weight_flavor FLOAT8
)
RETURNS FLOAT8 AS $$
DECLARE
    total_score FLOAT8 := 0;
    flavor TEXT;
    口味标签 JSONB;
    matched_count INTEGER := 0;
    flavor_count INTEGER := 0;
    match_ratio FLOAT8 := 0;
    normalized_score FLOAT8 := 0;
BEGIN
    -- 如果没有口味筛选条件，返回0分
    IF NOT has_elements(flavors) THEN
        RETURN 0;
    END IF;
    
    -- 计算口味标签
    口味标签 := CASE
        WHEN (IN_口味特点 IS NOT NULL AND 
            jsonb_typeof(IN_口味特点) = 'object' AND
            (IN_口味特点 ? '标签')::boolean AND
            jsonb_typeof(IN_口味特点->'标签') = 'array')
        THEN IN_口味特点->'标签'
        WHEN (IN_口味特点 IS NOT NULL AND jsonb_typeof(IN_口味特点) = 'array')
        THEN IN_口味特点
        ELSE '[]'::jsonb
    END;
    
    -- 计算用户要求的口味数量
    flavor_count := array_length(flavors, 1);
    if flavor_count IS NULL OR flavor_count = 0 THEN
        RETURN 0;
    END IF;
    
    -- 遍历每个要求的口味
    FOREACH flavor IN ARRAY flavors LOOP
        -- 检查是否匹配
        IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(口味标签) tag
            WHERE tag = flavor
        ) THEN
            matched_count := matched_count + 1;
        END IF;
    END LOOP;
    
    -- 计算匹配比例
    match_ratio := GREATEST(matched_count::FLOAT / flavor_count::FLOAT, 0);
    
    -- 计算原始得分 = 权重 * 匹配比例
    total_score := score_weight_flavor * match_ratio;
    
    -- 归一化到0-10范围
    -- 假设满分(所有口味都匹配)应该是10分
    normalized_score := (match_ratio * 10.0);
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

-- 定义缺失的score_dish_name函数
DROP FUNCTION IF EXISTS score_dish_name;
-- 菜名关键词评分 - 输出0-10范围的归一化分数
CREATE OR REPLACE FUNCTION score_dish_name(
    IN_菜名 TEXT,
    IN_菜名_jsonb JSONB,
    dish_name_keywords TEXT[],
    similarity_threshold FLOAT,
    score_weight_dish_name_exact FLOAT8,
    score_weight_dish_name_fuzzy FLOAT8,
    score_weight_dish_name_similar FLOAT8
)
RETURNS FLOAT8 AS $$
DECLARE
    total_score FLOAT8 := 0;
    keyword TEXT;
    matched BOOLEAN;
    max_possible_score FLOAT8;
    normalized_score FLOAT8;
BEGIN
    -- 如果没有菜名关键词，返回0分
    IF NOT has_elements(dish_name_keywords) THEN
        RETURN 0;
    END IF;
    
    -- 计算可能的最大得分(所有关键词都精确匹配)
    max_possible_score := array_length(dish_name_keywords, 1) * score_weight_dish_name_exact;
    
    -- 计算每个关键词的得分
    FOREACH keyword IN ARRAY dish_name_keywords LOOP
        matched := FALSE;
        
        -- 精确匹配
        IF IN_菜名 = keyword THEN
            total_score := total_score + score_weight_dish_name_exact;
            matched := TRUE;
        -- 模糊匹配 (LIKE)
        ELSIF IN_菜名 ILIKE '%' || keyword || '%' THEN
            total_score := total_score + score_weight_dish_name_fuzzy;
            matched := TRUE;
        -- 相似度匹配
        ELSIF similarity(IN_菜名, keyword) > similarity_threshold THEN
            total_score := total_score + score_weight_dish_name_similar;
            matched := TRUE;
        END IF;
        
        -- 如果没找到匹配，尝试在JSON中查找
        IF NOT matched AND IN_菜名_jsonb IS NOT NULL THEN
            IF jsonb_typeof(IN_菜名_jsonb) = 'array' THEN
                -- 遍历JSON数组中的菜名变体
                FOR i IN 0..jsonb_array_length(IN_菜名_jsonb)-1 LOOP
                    -- 精确匹配
                    IF jsonb_array_element_text(IN_菜名_jsonb, i) = keyword THEN
                        total_score := total_score + score_weight_dish_name_exact;
                        EXIT;
                    -- 模糊匹配 (LIKE)
                    ELSIF jsonb_array_element_text(IN_菜名_jsonb, i) ILIKE '%' || keyword || '%' THEN
                        total_score := total_score + score_weight_dish_name_fuzzy;
                        EXIT;
                    -- 相似度匹配
                    ELSIF similarity(jsonb_array_element_text(IN_菜名_jsonb, i), keyword) > similarity_threshold THEN
                        total_score := total_score + score_weight_dish_name_similar;
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END LOOP;
    
    -- 归一化到0-10范围
    IF max_possible_score <= 0 THEN
        RETURN 0;
    END IF;
    
    normalized_score := (total_score / max_possible_score) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;

-- 添加一个通用的分类评分函数，用于替代所有现有的分类评分函数
DROP FUNCTION IF EXISTS score_categories;
-- 通用分类评分函数 - 输出0-10范围的归一化分数
CREATE OR REPLACE FUNCTION score_categories(
    IN_分类 JSONB,                -- 输入的分类数据（食材分类或调料分类）
    categories TEXT[],            -- 需要评分的分类列表
    similarity_threshold FLOAT,   -- 相似度阈值
    score_weight_exact FLOAT8,    -- 精确匹配权重
    score_weight_fuzzy FLOAT8,    -- 模糊匹配权重
    score_weight_similar FLOAT8   -- 相似度匹配权重
)
RETURNS FLOAT8 AS $$
DECLARE
    total_score FLOAT8 := 0;
    cat_score FLOAT8;
    cat TEXT;
    max_possible_score FLOAT8;
    normalized_score FLOAT8;
    cat_count INTEGER;
BEGIN
    -- 如果没有分类条件，返回0分
    IF NOT has_elements(categories) THEN
        RETURN 0;
    END IF;
    
    -- 计算分类数量
    cat_count := array_length(categories, 1);
    
    -- 可能的最大得分(如果所有分类都精确匹配)
    max_possible_score := cat_count * score_weight_exact;
    
    -- 计算每个分类的得分并累加
    FOREACH cat IN ARRAY categories LOOP
        cat_score := get_category_match_score(
            IN_分类, 
            cat,
            score_weight_exact,
            score_weight_fuzzy,
            score_weight_similar,
            similarity_threshold
        );
        total_score := total_score + cat_score;
    END LOOP;
    
    -- 归一化到0-10范围
    -- 如果max_possible_score为0，则返回0
    IF max_possible_score <= 0 THEN
        RETURN 0;
    END IF;
    
    -- 将得分归一化到0-10范围
    normalized_score := (total_score / max_possible_score) * 10.0;
    
    -- 确保得分在0-10范围内
    RETURN GREATEST(LEAST(normalized_score, 10.0), 0);
END;
$$ LANGUAGE plpgsql;