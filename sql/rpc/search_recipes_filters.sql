-- search_recipes_filters.sql
--
-- 包含搜索菜谱所用的筛选函数
-- 此文件是模块化重构的一部分

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS filter_by_cuisine CASCADE;
-- 基本筛选：菜系筛选
CREATE OR REPLACE FUNCTION filter_by_cuisine(
    cuisines TEXT[]
)
RETURNS TABLE (
    filtered_id UUID,
    filtered_菜名 TEXT,
    filtered_菜系 TEXT,
    filtered_口味特点 JSONB,
    filtered_烹饪技法 JSONB,
    filtered_食材 JSONB,
    filtered_调料 JSONB,
    filtered_步骤 JSONB,
    filtered_注意事项 JSONB,
    filtered_created_at TIMESTAMP WITH TIME ZONE,
    filtered_updated_at TIMESTAMP WITH TIME ZONE,
    filtered_烹饪难度 TEXT,
    filtered_是否无麸质 BOOLEAN,
    filtered_调料分类 JSONB,
    filtered_user_id UUID,
    filtered_是否清真 BOOLEAN,
    filtered_食材分类 JSONB,
    filtered_是否纯素 BOOLEAN,
    filtered_菜系_jsonb JSONB,
    filtered_菜名_jsonb JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id::UUID,
        r.菜名,
        r.菜系,
        r.口味特点,
        r.烹饪技法,
        r.食材,
        r.调料,
        r.步骤,
        r.注意事项,
        r.created_at,
        r.updated_at,
        r.烹饪难度,
        r.是否无麸质,
        r.调料分类,
        r.user_id,
        r.是否清真,
        r.食材分类,
        r.是否纯素,
        r.菜系_jsonb,
        r.菜名_jsonb
    FROM 
        "CHrecipes" r
    WHERE 
        -- 菜系筛选条件
        (NOT has_elements(cuisines) OR 
        EXISTS (
            SELECT 1
            FROM unnest(cuisines) cuisine
            WHERE cuisine_matches(r.菜系, cuisine)
        ));
END;
$$ LANGUAGE plpgsql;

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS filter_by_flavors CASCADE;
-- 口味筛选
CREATE OR REPLACE FUNCTION filter_by_flavors(
    IN_id UUID,
    IN_菜名 TEXT,
    IN_菜系 TEXT,
    IN_口味特点 JSONB,
    IN_烹饪技法 JSONB,
    IN_食材 JSONB,
    IN_调料 JSONB,
    IN_步骤 JSONB,
    IN_注意事项 JSONB,
    IN_created_at TIMESTAMP WITH TIME ZONE,
    IN_updated_at TIMESTAMP WITH TIME ZONE,
    IN_烹饪难度 TEXT,
    IN_是否无麸质 BOOLEAN,
    IN_调料分类 JSONB,
    IN_user_id UUID,
    IN_是否清真 BOOLEAN,
    IN_食材分类 JSONB,
    IN_是否纯素 BOOLEAN,
    IN_菜系_jsonb JSONB,
    IN_菜名_jsonb JSONB,
    flavors TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
    口味标签 JSONB;
    has_valid_tags BOOLEAN;
BEGIN
    -- 如果没有口味筛选条件，直接返回真
    IF NOT has_elements(flavors) THEN
        RETURN TRUE;
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
    
    -- 检查口味标签是否有效
    has_valid_tags := 口味标签 IS NOT NULL AND jsonb_typeof(口味标签) = 'array' AND jsonb_array_length(口味标签) > 0;
    
    -- 必须包含所有指定口味
    RETURN has_valid_tags AND 
           NOT EXISTS (
               SELECT 1
               FROM unnest(flavors) flavor
               WHERE NOT EXISTS (
                   SELECT 1
                   FROM jsonb_array_elements_text(口味标签) tag
                   WHERE tag = flavor
               )
           );
END;
$$ LANGUAGE plpgsql;

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS filter_by_difficulty;
-- 难度筛选
CREATE OR REPLACE FUNCTION filter_by_difficulty(
    IN_烹饪难度 TEXT,
    difficulties TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 如果没有难度筛选条件，直接返回真
    RETURN NOT has_elements(difficulties) OR
           IN_烹饪难度 = ANY(difficulties);
END;
$$ LANGUAGE plpgsql;

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS filter_by_dietary;
-- 饮食限制筛选
CREATE OR REPLACE FUNCTION filter_by_dietary(
    IN_是否无麸质 BOOLEAN,
    IN_是否清真 BOOLEAN,
    IN_是否纯素 BOOLEAN,
    dietary_restrictions TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 如果没有饮食限制筛选条件，直接返回真
    IF NOT has_elements(dietary_restrictions) THEN
        RETURN TRUE;
    END IF;
    
    RETURN NOT EXISTS (
        SELECT 1
        FROM unnest(dietary_restrictions) diet_restriction
        WHERE (
            (diet_restriction = '无麸质' AND NOT IN_是否无麸质) OR
            (diet_restriction = '清真' AND NOT IN_是否清真) OR
            (diet_restriction = '纯素' AND NOT IN_是否纯素)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS filter_by_forbidden_ingredients;
-- 忌口食材筛选，增强语义搜索集成
CREATE OR REPLACE FUNCTION filter_by_forbidden_ingredients(
    IN_食材 JSONB,
    IN_调料 JSONB,
    IN_菜名 TEXT,
    IN_菜系 TEXT,
    IN_食材分类 JSONB,
    IN_调料分类 JSONB,
    forbidden_ingredients TEXT[],
    semantic_threshold FLOAT,  -- 语义搜索阈值
    similarity_threshold FLOAT -- 添加相似度匹配阈值参数
)
RETURNS BOOLEAN AS $$
DECLARE
    ing TEXT;
    semantic_match BOOLEAN := FALSE;
    similarity_score FLOAT;
    ing_name TEXT;
    query_embedding vector(1536);
    embedding_record RECORD;
    category_record RECORD;
BEGIN
    -- 如果没有忌口食材筛选条件，直接返回真
    IF NOT has_elements(forbidden_ingredients) THEN
        RETURN TRUE;
    END IF;
    
    -- 常规匹配检查
    FOREACH ing IN ARRAY forbidden_ingredients LOOP
        -- 检查食材匹配
        IF ingredient_matches(IN_食材, ing) THEN
            RETURN FALSE; -- 找到匹配，不符合条件
        END IF;
        
        -- 检查调料匹配
        IF ingredient_matches(IN_调料, ing) THEN
            RETURN FALSE; -- 找到匹配，不符合条件
        END IF;
        
        -- 检查菜名中是否包含忌口食材
        IF IN_菜名 ILIKE '%' || ing || '%' OR similarity(IN_菜名, ing) > similarity_threshold THEN
            RETURN FALSE; -- 找到匹配，不符合条件
        END IF;
        
        -- 检查菜系中是否包含忌口食材
        IF IN_菜系 ILIKE '%' || ing || '%' OR similarity(IN_菜系, ing) > similarity_threshold THEN
            RETURN FALSE; -- 找到匹配，不符合条件
        END IF;
        
        -- 检查食材分类中是否包含忌口食材
        IF IN_食材分类 IS NOT NULL AND jsonb_typeof(IN_食材分类) = 'array' AND jsonb_array_length(IN_食材分类) > 0 THEN
            FOR category_record IN
                SELECT 
                    jsonb_array_elements_text(IN_食材分类) AS category
            LOOP
                IF category_record.category ILIKE '%' || ing || '%' OR 
                   similarity(category_record.category, ing) > similarity_threshold THEN
                    RETURN FALSE; -- 找到匹配，不符合条件
                END IF;
            END LOOP;
        END IF;
        
        -- 检查调料分类中是否包含忌口食材
        IF IN_调料分类 IS NOT NULL AND jsonb_typeof(IN_调料分类) = 'array' AND jsonb_array_length(IN_调料分类) > 0 THEN
            FOR category_record IN
                SELECT 
                    jsonb_array_elements_text(IN_调料分类) AS category
            LOOP
                IF category_record.category ILIKE '%' || ing || '%' OR 
                   similarity(category_record.category, ing) > similarity_threshold THEN
                    RETURN FALSE; -- 找到匹配，不符合条件
                END IF;
            END LOOP;
        END IF;
        
        -- 使用语义匹配 - 现在语义搜索始终启用
        -- 尝试获取忌口食材的嵌入向量
        BEGIN
            SELECT embedding INTO STRICT query_embedding
            FROM query_embeddings_cache
            WHERE query = ing
            AND created_at > NOW() - INTERVAL '1 day';
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                -- 如果缓存中没有，尝试生成
                BEGIN
                    query_embedding := generate_query_embedding(ing);
                EXCEPTION
                    WHEN OTHERS THEN
                        query_embedding := NULL;
                END;
        END;
        
        -- 如果有可用的嵌入向量，检查食材的语义相似度
        IF query_embedding IS NOT NULL THEN
            -- 检查食材
            FOR embedding_record IN
                SELECT 
                    (elem->>'名称')::text AS name,
                    1 - (recipe_embeddings.embedding <=> query_embedding) AS sim_score
                FROM 
                    jsonb_array_elements(safe_jsonb_array(IN_食材)) AS elem
                JOIN 
                    recipe_embeddings ON recipe_embeddings.title = (elem->>'名称')::text
                WHERE 
                    (elem->>'名称')::text IS NOT NULL
            LOOP
                -- 如果语义相似度超过阈值，则认为匹配到了忌口食材
                IF embedding_record.sim_score > semantic_threshold THEN
                    RETURN FALSE; -- 找到语义匹配，不符合条件
                END IF;
            END LOOP;
            
            -- 检查调料
            FOR embedding_record IN
                SELECT 
                    (elem->>'名称')::text AS name,
                    1 - (recipe_embeddings.embedding <=> query_embedding) AS sim_score
                FROM 
                    jsonb_array_elements(safe_jsonb_array(IN_调料)) AS elem
                JOIN 
                    recipe_embeddings ON recipe_embeddings.title = (elem->>'名称')::text
                WHERE 
                    (elem->>'名称')::text IS NOT NULL
            LOOP
                -- 如果语义相似度超过阈值，则认为匹配到了忌口食材
                IF embedding_record.sim_score > semantic_threshold THEN
                    RETURN FALSE; -- 找到语义匹配，不符合条件
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN TRUE; -- 没有匹配到任何忌口食材
END;
$$ LANGUAGE plpgsql;

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS filter_by_required_ingredients;
-- 必选食材筛选：必须包含所有指定的食材
CREATE OR REPLACE FUNCTION filter_by_required_ingredients(
    IN_id UUID,
    IN_菜名 TEXT,
    IN_菜系 TEXT,
    IN_口味特点 JSONB,
    IN_烹饪技法 JSONB,
    IN_食材 JSONB,
    IN_调料 JSONB,
    IN_步骤 JSONB,
    IN_注意事项 JSONB,
    IN_created_at TIMESTAMP WITH TIME ZONE,
    IN_updated_at TIMESTAMP WITH TIME ZONE,
    IN_烹饪难度 TEXT,
    IN_是否无麸质 BOOLEAN,
    IN_调料分类 JSONB,
    IN_user_id UUID,
    IN_是否清真 BOOLEAN,
    IN_食材分类 JSONB,
    IN_是否纯素 BOOLEAN,
    IN_菜系_jsonb JSONB,
    IN_菜名_jsonb JSONB,
    required_ingredients TEXT[],
    similarity_threshold FLOAT,  -- 移除默认值，必须从外部传入
    semantic_threshold FLOAT  -- 移除默认值，必须从外部传入
)
RETURNS BOOLEAN AS $$
DECLARE
    ing TEXT;
    query_embedding vector(1536);
    embedding_record RECORD;
    effective_threshold FLOAT := semantic_threshold;  -- 直接使用传入的阈值
BEGIN
    -- 如果没有必选食材，直接返回真
    IF required_ingredients IS NULL OR array_length(required_ingredients, 1) IS NULL THEN
        RETURN TRUE;
    END IF;

    -- 检查每个必选食材
    FOREACH ing IN ARRAY required_ingredients LOOP
        -- 如果食材出现在菜名中，则认为满足
        IF IN_菜名 ILIKE '%' || ing || '%' THEN
            CONTINUE;
        END IF;
        
        -- 1. 检查是否在食材列表中精确匹配
        IF ingredient_exact_match(IN_食材, ing) THEN
            CONTINUE;
        END IF;
        
        -- 2. 检查是否在调料列表中精确匹配
        IF ingredient_exact_match(IN_调料, ing) THEN
            CONTINUE;
        END IF;
        
        -- 3. 检查是否在食材列表中模糊匹配
        IF ingredient_fuzzy_match(IN_食材, ing) THEN
            CONTINUE;
        END IF;
        
        -- 4. 检查是否在调料列表中模糊匹配
        IF ingredient_fuzzy_match(IN_调料, ing) THEN
            CONTINUE;
        END IF;
        
        -- 5. 检查是否在食材列表中使用相似度匹配
        IF ingredient_similarity_match(IN_食材, ing, similarity_threshold) THEN
            CONTINUE;
        END IF;
        
        -- 6. 检查是否在调料列表中使用相似度匹配
        IF ingredient_similarity_match(IN_调料, ing, similarity_threshold) THEN
            CONTINUE;
        END IF;
        
        -- 7. 尝试使用嵌入向量进行语义匹配
        BEGIN
            SELECT embedding INTO STRICT query_embedding
            FROM query_embeddings_cache
            WHERE query = ing
            AND created_at > NOW() - INTERVAL '1 day';
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                -- 如果缓存中没有，尝试生成
                BEGIN
                    query_embedding := generate_query_embedding(ing);
                EXCEPTION
                    WHEN OTHERS THEN
                        query_embedding := NULL;
                END;
        END;
        
        -- 如果有可用的嵌入向量，检查菜谱中的各个属性
        IF query_embedding IS NOT NULL THEN
            -- 7.1 检查食材的语义相似度
            FOR embedding_record IN
                SELECT 
                    (elem->>'名称')::text AS name,
                    1 - (recipe_embeddings.embedding <=> query_embedding) AS sim_score
                FROM 
                    jsonb_array_elements(safe_jsonb_array(IN_食材)) AS elem
                JOIN 
                    recipe_embeddings ON recipe_embeddings.title = (elem->>'名称')::text
                WHERE 
                    (elem->>'名称')::text IS NOT NULL
            LOOP
                -- 如果语义相似度超过阈值，则认为找到了必选食材
                IF embedding_record.sim_score > effective_threshold THEN
                    -- 找到一个语义匹配，继续检查下一个必选食材
                    CONTINUE;
                END IF;
            END LOOP;
            
            -- 7.2 检查调料的语义相似度
            FOR embedding_record IN
                SELECT 
                    (elem->>'名称')::text AS name,
                    1 - (recipe_embeddings.embedding <=> query_embedding) AS sim_score
                FROM 
                    jsonb_array_elements(safe_jsonb_array(IN_调料)) AS elem
                JOIN 
                    recipe_embeddings ON recipe_embeddings.title = (elem->>'名称')::text
                WHERE 
                    (elem->>'名称')::text IS NOT NULL
            LOOP
                -- 如果语义相似度超过阈值，则认为找到了必选食材
                IF embedding_record.sim_score > effective_threshold THEN
                    -- 找到一个语义匹配，继续检查下一个必选食材
                    CONTINUE;
                END IF;
            END LOOP;
        END IF;
        
        -- 如果我们执行到了这里，说明当前必选食材在所有字段中都没有找到匹配
        RETURN FALSE;
    END LOOP;
    
    -- 所有必选食材都找到了匹配
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 删除现有函数，避免冲突
DROP FUNCTION IF EXISTS filter_by_general_search;
-- 通用关键词搜索：在菜名、菜系、食材、调料、分类等多个字段中查找
CREATE OR REPLACE FUNCTION filter_by_general_search(
    IN_id UUID,
    IN_菜名 TEXT,
    IN_菜系 TEXT,
    IN_口味特点 JSONB,
    IN_烹饪技法 JSONB,
    IN_食材 JSONB,
    IN_调料 JSONB,
    IN_步骤 JSONB,
    IN_注意事项 JSONB,
    IN_created_at TIMESTAMP WITH TIME ZONE,
    IN_updated_at TIMESTAMP WITH TIME ZONE,
    IN_烹饪难度 TEXT,
    IN_是否无麸质 BOOLEAN,
    IN_调料分类 JSONB,
    IN_user_id UUID,
    IN_是否清真 BOOLEAN,
    IN_食材分类 JSONB,
    IN_是否纯素 BOOLEAN,
    IN_菜系_jsonb JSONB,
    IN_菜名_jsonb JSONB,
    search_query TEXT,
    semantic_threshold FLOAT,  -- 语义搜索阈值
    similarity_threshold FLOAT  -- 添加相似度匹配阈值参数
)
RETURNS BOOLEAN AS $$
DECLARE
    effective_threshold FLOAT := semantic_threshold;  -- 直接使用传入的阈值
    query_embedding vector(1536);
    embedding_record RECORD;
    category_record RECORD;
BEGIN
    -- 如果没有搜索关键词，直接返回真
    IF search_query IS NULL OR TRIM(search_query) = '' THEN
        RETURN TRUE;
    END IF;
    
    -- 在菜名中匹配
    IF IN_菜名 = search_query OR 
       IN_菜名 % search_query OR 
       search_query % IN_菜名 OR 
       similarity(IN_菜名, search_query) > similarity_threshold THEN
        RETURN TRUE;
    END IF;
    
    -- 在菜系中匹配
    IF IN_菜系 = search_query OR 
       IN_菜系 % search_query OR 
       search_query % IN_菜系 OR 
       similarity(IN_菜系, search_query) > similarity_threshold THEN
        RETURN TRUE;
    END IF;
    
    -- 在食材中匹配
    IF ingredient_matches(IN_食材, search_query) THEN
        RETURN TRUE;
    END IF;
    
    -- 在调料中匹配
    IF ingredient_matches(IN_调料, search_query) THEN
        RETURN TRUE;
    END IF;
    
    -- 在食材分类中匹配
    IF IN_食材分类 IS NOT NULL AND jsonb_typeof(IN_食材分类) = 'array' AND jsonb_array_length(IN_食材分类) > 0 THEN
        FOR category_record IN
            SELECT 
                jsonb_array_elements_text(IN_食材分类) AS category
        LOOP
            IF category_record.category = search_query OR 
               category_record.category % search_query OR 
               search_query % category_record.category OR 
               similarity(category_record.category, search_query) > similarity_threshold THEN
                RETURN TRUE;
            END IF;
        END LOOP;
    END IF;
    
    -- 在调料分类中匹配
    IF IN_调料分类 IS NOT NULL AND jsonb_typeof(IN_调料分类) = 'array' AND jsonb_array_length(IN_调料分类) > 0 THEN
        FOR category_record IN
            SELECT 
                jsonb_array_elements_text(IN_调料分类) AS category
        LOOP
            IF category_record.category = search_query OR 
               category_record.category % search_query OR 
               search_query % category_record.category OR 
               similarity(category_record.category, search_query) > similarity_threshold THEN
                RETURN TRUE;
            END IF;
        END LOOP;
    END IF;
    
    -- 使用语义匹配
    BEGIN
        SELECT embedding INTO STRICT query_embedding
        FROM query_embeddings_cache
        WHERE query = search_query
        AND created_at > NOW() - INTERVAL '1 day';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- 如果缓存中没有，尝试生成
            BEGIN
                query_embedding := generate_query_embedding(search_query);
            EXCEPTION
                WHEN OTHERS THEN
                    query_embedding := NULL;
            END;
    END;
    
    -- 如果有可用的嵌入向量，检查语义相似度
    IF query_embedding IS NOT NULL THEN
        -- 检查菜谱中的食材
        FOR embedding_record IN
            SELECT 
                (elem->>'名称')::text AS name,
                1 - (recipe_embeddings.embedding <=> query_embedding) AS sim_score
            FROM 
                jsonb_array_elements(safe_jsonb_array(IN_食材)) AS elem
            JOIN 
                recipe_embeddings ON recipe_embeddings.title = (elem->>'名称')::text
            WHERE 
                (elem->>'名称')::text IS NOT NULL
        LOOP
            -- 如果语义相似度超过阈值，则认为找到了匹配
            IF embedding_record.sim_score > effective_threshold THEN
                RETURN TRUE;
            END IF;
        END LOOP;
        
        -- 检查菜谱中的调料
        FOR embedding_record IN
            SELECT 
                (elem->>'名称')::text AS name,
                1 - (recipe_embeddings.embedding <=> query_embedding) AS sim_score
            FROM 
                jsonb_array_elements(safe_jsonb_array(IN_调料)) AS elem
            JOIN 
                recipe_embeddings ON recipe_embeddings.title = (elem->>'名称')::text
            WHERE 
                (elem->>'名称')::text IS NOT NULL
        LOOP
            -- 如果语义相似度超过阈值，则认为找到了匹配
            IF embedding_record.sim_score > effective_threshold THEN
                RETURN TRUE;
            END IF;
        END LOOP;
    END IF;
    
    -- 所有匹配尝试都失败，返回假
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;