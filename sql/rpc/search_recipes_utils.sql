-- search_recipes_utils.sql
--
-- 包含搜索菜谱所需的辅助函数
-- 此文件是模块化重构的一部分

-- 检查并启用pg_trgm扩展，支持模糊匹配和相似度计算
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
    ) THEN
        RAISE NOTICE '正在安装pg_trgm扩展以支持模糊匹配...';
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
    END IF;
END $$;

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS safe_jsonb_array;
-- 创建辅助函数用于安全处理JSONB数组，避免类型错误
CREATE OR REPLACE FUNCTION safe_jsonb_array(input JSONB) 
RETURNS JSONB AS $$
BEGIN
    RETURN CASE 
        WHEN input IS NULL THEN '[]'::jsonb 
        WHEN jsonb_typeof(input) = 'array' THEN input 
        ELSE '[]'::jsonb 
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS normalize_keyword;
-- 创建辅助函数用于标准化关键词，返回去除空格且转为小写的字符串
CREATE OR REPLACE FUNCTION normalize_keyword(input TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(input));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS chinese_string_match;
-- 创建辅助函数用于中文字符串匹配，结合ILIKE和trigram相似度
CREATE OR REPLACE FUNCTION chinese_string_match(input_str TEXT, search_term TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN CASE
        -- 处理短词（2个字符或更少）- 使用ILIKE更精确匹配
        WHEN LENGTH(search_term) <= 2 THEN 
            input_str ILIKE '%' || search_term || '%'
        -- 长词使用传统的trigram匹配
        ELSE
            input_str % search_term OR search_term % input_str OR
            similarity(input_str, search_term) > 0.3 OR
            input_str ILIKE '%' || search_term || '%'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS clean_text_array;
-- 参数处理函数：清理和标准化字符串数组参数
CREATE OR REPLACE FUNCTION clean_text_array(input_array TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    result TEXT[];
BEGIN
    IF input_array IS NULL THEN
        RETURN NULL;
    ELSIF array_length(array_remove(input_array, ''), 1) IS NULL THEN
        RETURN NULL;
    ELSE 
        WITH normalized AS (
            SELECT DISTINCT normalize_keyword(unnest) AS item
            FROM unnest(array_remove(input_array, ''))
            WHERE LENGTH(TRIM(unnest)) > 0
        )
        SELECT array_agg(item) INTO result
        FROM normalized;
        
        RETURN result;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS has_elements;
-- 检查数组是否有元素
CREATE OR REPLACE FUNCTION has_elements(arr TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(array_length(arr, 1), 0) > 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS get_ingredient_match_score;
-- 获取食材匹配得分
CREATE OR REPLACE FUNCTION get_ingredient_match_score(
    ingredients JSONB, 
    keyword TEXT,
    exact_weight FLOAT8,
    fuzzy_weight FLOAT8,
    similar_weight FLOAT8,
    similarity_threshold FLOAT
)
RETURNS FLOAT8 AS $$
DECLARE
    score FLOAT8 := 0;
BEGIN
    -- 精确匹配
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(ingredients)) AS ingredient
        WHERE ingredient->>'名称' = keyword
    ) THEN 
        RETURN exact_weight;
    END IF;
    
    -- 使用中文匹配函数
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(ingredients)) AS ingredient,
        LATERAL (
            SELECT (ingredient->>'名称')::text AS ingredient_name
        ) i
        WHERE 
            i.ingredient_name IS NOT NULL AND
            chinese_string_match(i.ingredient_name, keyword)
    ) THEN 
        RETURN fuzzy_weight;
    END IF;
    
    -- 相似度匹配
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(ingredients)) AS ingredient,
        LATERAL (
            SELECT (ingredient->>'名称')::text AS ingredient_name,
                   similarity(ingredient->>'名称', keyword) AS sim_score
        ) i
        WHERE i.ingredient_name IS NOT NULL AND
              i.sim_score > similarity_threshold
    ) THEN 
        RETURN (
            SELECT similar_weight * MAX(similarity(ingredient->>'名称', keyword))
            FROM jsonb_array_elements(safe_jsonb_array(ingredients)) AS ingredient
            WHERE (ingredient->>'名称') IS NOT NULL
        );
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS get_category_match_score;
-- 获取分类匹配得分
CREATE OR REPLACE FUNCTION get_category_match_score(
    categories JSONB, 
    category_name TEXT,
    exact_weight FLOAT8,
    fuzzy_weight FLOAT8,
    similar_weight FLOAT8,
    similarity_threshold FLOAT
)
RETURNS FLOAT8 AS $$
DECLARE
    score FLOAT8 := 0;
BEGIN
    -- 精确匹配
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(categories)) AS category
        WHERE category->>'分类名称' = category_name
    ) THEN 
        RETURN exact_weight;
    END IF;
    
    -- trigram匹配
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(categories)) AS category,
        LATERAL (
            SELECT (category->>'分类名称')::text AS cat_name
        ) c
        WHERE 
            c.cat_name IS NOT NULL AND
            (c.cat_name % category_name OR category_name % c.cat_name)
    ) THEN 
        RETURN fuzzy_weight;
    END IF;
    
    -- 相似度匹配
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(categories)) AS category,
        LATERAL (
            SELECT (category->>'分类名称')::text AS cat_name,
                   similarity(category->>'分类名称', category_name) AS sim_score
        ) c
        WHERE c.cat_name IS NOT NULL AND
              c.sim_score > similarity_threshold
    ) THEN 
        RETURN (
            SELECT similar_weight * MAX(similarity(category->>'分类名称', category_name))
            FROM jsonb_array_elements(safe_jsonb_array(categories)) AS category
            WHERE (category->>'分类名称') IS NOT NULL
        );
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS ingredient_matches;
-- 检查食材是否匹配关键词
CREATE OR REPLACE FUNCTION ingredient_matches(ingredients JSONB, keyword TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(ingredients)) AS ingredient,
        LATERAL (
            SELECT (ingredient->>'名称')::text AS ingredient_name
        ) i
        WHERE 
            i.ingredient_name IS NOT NULL AND
            (
                -- 精确匹配
                i.ingredient_name = keyword OR
                -- 使用改进的中文匹配函数
                chinese_string_match(i.ingredient_name, keyword)
            )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS category_matches;
-- 检查分类是否匹配关键词
CREATE OR REPLACE FUNCTION category_matches(categories JSONB, category_name TEXT, similarity_threshold FLOAT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM jsonb_array_elements(safe_jsonb_array(categories)) AS category,
        LATERAL (
            SELECT (category->>'分类名称')::text AS cat_name
        ) c
        WHERE 
            c.cat_name IS NOT NULL AND
            (
                -- 精确匹配
                c.cat_name = category_name OR 
                -- trigram 相似度匹配
                c.cat_name % category_name OR category_name % c.cat_name OR
                -- 相似度函数匹配
                similarity(c.cat_name, category_name) > similarity_threshold
            )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS get_dish_name_match_score;
-- 获取菜名匹配得分
CREATE OR REPLACE FUNCTION get_dish_name_match_score(
    dish_name TEXT, 
    keyword TEXT,
    exact_weight FLOAT8,
    fuzzy_weight FLOAT8,
    similar_weight FLOAT8,
    similarity_threshold FLOAT
)
RETURNS FLOAT8 AS $$
BEGIN
    -- 精确匹配
    IF dish_name = keyword THEN
        RETURN exact_weight;
    END IF;
    
    -- ILIKE匹配（更强的模糊匹配）
    IF dish_name ILIKE '%' || keyword || '%' THEN
        RETURN fuzzy_weight;
    END IF;
    
    -- 相似度匹配，提高阈值为原来的1.5倍，以获取更多匹配
    IF similarity(dish_name, keyword) > similarity_threshold * 0.8 THEN
        RETURN similar_weight * similarity(dish_name, keyword) * 1.2; -- 增加20%的权重
    END IF;
    
    -- 支持多语言搜索，使用自定义中文匹配函数
    IF chinese_string_match(dish_name, keyword) THEN
        RETURN fuzzy_weight * 0.9; -- 略低于直接模糊匹配
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS cuisine_matches;
-- 创建函数来检查菜系特殊匹配
CREATE OR REPLACE FUNCTION cuisine_matches(cuisine TEXT, target_cuisine TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 
        cuisine = target_cuisine OR 
        -- 特殊处理中式菜系子类别匹配
        (target_cuisine LIKE '中餐-%' AND cuisine = REPLACE(target_cuisine, '中餐-', '')) OR
        (cuisine LIKE '中餐-%' AND REPLACE(cuisine, '中餐-', '') = target_cuisine);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS ingredients_contain_any;
-- 检查食材列表中是否有任何一个包含指定关键词
CREATE OR REPLACE FUNCTION ingredients_contain_any(ingredients JSONB, keywords TEXT[], similarity_threshold FLOAT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM unnest(keywords) keyword
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements(safe_jsonb_array(ingredients)) AS ingredient,
            LATERAL (
                SELECT (ingredient->>'名称')::text AS ingredient_name
            ) i
            WHERE 
                i.ingredient_name IS NOT NULL AND
                (
                    -- 精确匹配
                    i.ingredient_name = keyword OR
                    -- 使用改进的中文匹配函数
                    chinese_string_match(i.ingredient_name, keyword) OR
                    -- 相似度匹配
                    similarity(i.ingredient_name, keyword) > similarity_threshold
                )
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS cuisine_matches_any;
-- 检查菜系是否匹配任何指定的菜系
CREATE OR REPLACE FUNCTION cuisine_matches_any(cuisine TEXT, cuisines TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    IF cuisines IS NULL OR array_length(cuisines, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM unnest(cuisines) c
        WHERE cuisine_matches(cuisine, c)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS flavor_contains_any;
-- 检查口味特点是否包含任何指定的口味
CREATE OR REPLACE FUNCTION flavor_contains_any(flavor_features JSONB, flavors TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    flavor_tags JSONB;
BEGIN
    IF flavors IS NULL OR array_length(flavors, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- 计算口味标签
    flavor_tags := CASE
        WHEN (flavor_features IS NOT NULL AND 
            jsonb_typeof(flavor_features) = 'object' AND
            (flavor_features ? '标签')::boolean AND
            jsonb_typeof(flavor_features->'标签') = 'array')
        THEN flavor_features->'标签'
        WHEN (flavor_features IS NOT NULL AND jsonb_typeof(flavor_features) = 'array')
        THEN flavor_features
        ELSE '[]'::jsonb
    END;
    
    -- 检查是否包含任一口味
    RETURN EXISTS (
        SELECT 1
        FROM unnest(flavors) flavor
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(flavor_tags) tag
            WHERE tag = flavor
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS difficulty_matches_any;
-- 检查烹饪难度是否匹配任何指定的难度
CREATE OR REPLACE FUNCTION difficulty_matches_any(difficulty TEXT, difficulties TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    IF difficulties IS NULL OR array_length(difficulties, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN difficulty = ANY(difficulties);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS dietary_matches_any;
-- 检查菜谱是否符合任何指定的饮食限制
CREATE OR REPLACE FUNCTION dietary_matches_any(recipe "CHrecipes", dietary_restrictions TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    IF dietary_restrictions IS NULL OR array_length(dietary_restrictions, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM unnest(dietary_restrictions) diet_restriction
        WHERE (
            (diet_restriction = '无麸质' AND recipe.是否无麸质) OR
            (diet_restriction = '清真' AND recipe.是否清真) OR
            (diet_restriction = '纯素' AND recipe.是否纯素)
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS categories_contain_any;
-- 检查分类列表中是否有任何一个匹配指定的分类
CREATE OR REPLACE FUNCTION categories_contain_any(categories JSONB, category_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    IF category_names IS NULL OR array_length(category_names, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM unnest(category_names) category_name
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements(safe_jsonb_array(categories)) AS category,
            LATERAL (
                SELECT (category->>'分类名称')::text AS cat_name
            ) c
            WHERE 
                c.cat_name IS NOT NULL AND
                (
                    -- 精确匹配
                    c.cat_name = category_name OR 
                    -- trigram 相似度匹配
                    c.cat_name % category_name OR category_name % c.cat_name OR
                    -- 相似度函数匹配
                    similarity(c.cat_name, category_name) > 0.4
                )
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS ingredient_has_any;
-- 检查食材列表中是否包含任何指定的食材
CREATE OR REPLACE FUNCTION ingredient_has_any(ingredients JSONB, ingredient_names TEXT[], similarity_threshold FLOAT)
RETURNS BOOLEAN AS $$
BEGIN
    IF ingredient_names IS NULL OR array_length(ingredient_names, 1) = 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM unnest(ingredient_names) ingredient_name
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements(safe_jsonb_array(ingredients)) AS ingredient,
            LATERAL (
                SELECT (ingredient->>'名称')::text AS ing_name
            ) i
            WHERE 
                i.ing_name IS NOT NULL AND
                (
                    -- 精确匹配
                    i.ing_name = ingredient_name OR
                    -- 使用改进的中文匹配函数
                    chinese_string_match(i.ing_name, ingredient_name) OR
                    -- 相似度匹配
                    similarity(i.ing_name, ingredient_name) > similarity_threshold
                )
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS dish_name_matches_any;
-- 检查菜名是否匹配任何指定的关键词
CREATE OR REPLACE FUNCTION dish_name_matches_any(dish_name TEXT, keywords TEXT[], similarity_threshold FLOAT)
RETURNS BOOLEAN AS $$
BEGIN
    IF keywords IS NULL OR array_length(keywords, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM unnest(keywords) keyword
        WHERE 
            -- 精确匹配
            dish_name = keyword OR
            -- ILIKE匹配
            dish_name ILIKE '%' || keyword || '%' OR
            -- 相似度匹配
            similarity(dish_name, keyword) > similarity_threshold OR
            -- 使用中文匹配函数
            chinese_string_match(dish_name, keyword)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE; 