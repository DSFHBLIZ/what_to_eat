-- search_recipes_main.sql
--
-- 包含搜索菜谱的主函数，组合使用其他模块中的辅助函数
-- 此文件是模块化重构的一部分
--
-- 注意：请确保在执行此文件前，已按以下顺序执行了依赖文件：
-- 1. search_recipes_utils.sql
-- 2. search_recipes_filters.sql
-- 3. search_recipes_scoring.sql
--
-- 重构说明：
-- 1. 已优化评分函数，以required_ingredients的实现模式为基础
-- 2. 必选调料功能已合并到必选食材中(score_required_condiments已弃用)
-- 3. 所有食材/调料相关评分函数现在都调用统一的score_ingredients函数
-- 4. 所有分类评分函数现在都调用统一的score_categories函数
-- 5. 保留所有原始函数名和参数，确保API兼容性

-- 先删除已存在的函数，避免返回类型冲突
DROP FUNCTION IF EXISTS search_recipes;

-- 主搜索函数
CREATE OR REPLACE FUNCTION search_recipes(
    -- 首先定义没有默认值的参数
    trgm_similarity_threshold DOUBLE PRECISION,        -- 模糊匹配相似度阈值，必须从外部传入
    semantic_threshold DOUBLE PRECISION,               -- 默认语义搜索阈值，必须从外部传入
    forbidden_ingredients_threshold DOUBLE PRECISION,  -- 忌口食材的语义搜索阈值，必须从外部传入
    required_ingredients_threshold DOUBLE PRECISION,   -- 必选食材的语义搜索阈值，必须从外部传入
    general_search_threshold DOUBLE PRECISION,         -- 通用搜索的语义搜索阈值，必须从外部传入
    
    -- 然后定义有默认值的参数
    search_query TEXT DEFAULT NULL,                    -- 搜索关键词
    required_ingredients TEXT[] DEFAULT NULL,          -- 必须包含的食材
    optional_ingredients TEXT[] DEFAULT NULL,          -- 可选包含的食材
    optional_condiments TEXT[] DEFAULT NULL,           -- 可选包含的调料
    dish_name_keywords TEXT[] DEFAULT NULL,            -- 菜名关键词
    cuisines TEXT[] DEFAULT NULL,                      -- 菜系筛选
    flavors TEXT[] DEFAULT NULL,                       -- 口味筛选
    difficulties TEXT[] DEFAULT NULL,                  -- 难度筛选
    dietary_restrictions TEXT[] DEFAULT NULL,          -- 饮食限制
    required_ingredient_categories TEXT[] DEFAULT NULL, -- 必须包含的食材分类
    optional_ingredient_categories TEXT[] DEFAULT NULL, -- 可选包含的食材分类
    required_condiment_categories TEXT[] DEFAULT NULL, -- 必须包含的调料分类
    optional_condiment_categories TEXT[] DEFAULT NULL, -- 可选包含的调料分类
    page INTEGER DEFAULT 1,                            -- 分页：页码
    page_size INTEGER DEFAULT 10,                      -- 分页：每页条数
    sort_field TEXT DEFAULT 'relevance_score',         -- 排序字段（注意：当有可选食材/调料时，请使用relevance_score以确保相关项排序优先）
    sort_direction TEXT DEFAULT 'DESC',                -- 排序方向：'asc'升序，'desc'降序
    return_all_results BOOLEAN DEFAULT FALSE,          -- 是否返回所有结果（不分页）
    debug_mode BOOLEAN DEFAULT FALSE,                  -- 是否启用性能调试模式
    stabilize_results BOOLEAN DEFAULT FALSE,           -- 确保结果一致性（移除随机因素）
    forbidden_ingredients TEXT[] DEFAULT NULL,         -- 忌口食材（强排除）
    preview_mode BOOLEAN DEFAULT FALSE,                -- 预览模式：返回更多分页结果用于分析
    preview_page_count INTEGER DEFAULT 3,              -- 预览模式下要返回的页数
    enable_semantic_search BOOLEAN DEFAULT TRUE        -- 是否启用语义搜索功能，默认为启用
)
RETURNS TABLE (
    id UUID,                    -- 菜谱ID
    菜名 TEXT,                  -- 菜名
    菜系 TEXT,                  -- 菜系
    口味特点 JSONB,             -- 口味特点
    烹饪技法 JSONB,             -- 烹饪技法
    食材 JSONB,                 -- 食材JSON
    调料 JSONB,                 -- 调料JSON
    步骤 JSONB,                 -- 步骤JSON
    注意事项 JSONB,             -- 注意事项
    created_at TIMESTAMP WITH TIME ZONE, -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE, -- 更新时间
    烹饪难度 TEXT,              -- 烹饪难度
    是否无麸质 BOOLEAN,         -- 是否无麸质
    调料分类 JSONB,             -- 调料分类
    user_id UUID,               -- 用户ID
    是否清真 BOOLEAN,           -- 是否清真
    食材分类 JSONB,             -- 食材分类
    是否纯素 BOOLEAN,           -- 是否纯素
    菜系_jsonb JSONB,           -- 菜系JSONB
    菜名_jsonb JSONB,           -- 菜名JSONB
    relevance_score FLOAT8,    -- 相关性得分
    original_ingredients_score FLOAT8,  -- 必选食材匹配得分(原required_ing_score)
    opt_ingredients_score FLOAT8,  -- 可选食材匹配得分
    condiments_score FLOAT8,   -- 调料匹配得分
    ingredient_categories_score FLOAT8, -- 食材分类匹配得分
    condiment_categories_score FLOAT8,  -- 调料分类匹配得分
    semantic_score FLOAT8,     -- 语义搜索得分
    -- 性能统计信息
    query_time_ms NUMERIC,                -- 总查询时间(毫秒)
    filter_base_time_ms NUMERIC,          -- 基础筛选时间(毫秒)
    filter_ingredients_time_ms NUMERIC,   -- 食材筛选时间(毫秒)
    filter_condiments_time_ms NUMERIC,    -- 调料筛选时间(毫秒)
    filter_categories_time_ms NUMERIC,    -- 分类筛选时间(毫秒)
    filter_dietary_time_ms NUMERIC,       -- 饮食限制筛选时间(毫秒)
    sort_time_ms NUMERIC,                 -- 排序时间(毫秒)
    pagination_time_ms NUMERIC,           -- 分页时间(毫秒)
    performance_details JSONB,             -- 详细性能统计(JSON格式)
    filtered_count BIGINT,                -- 过滤后的记录总数
    total_count BIGINT                    -- 数据库总记录数
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'  -- 设置为30秒，根据需要可调整
AS $$
DECLARE
    start_offset INTEGER;
    effective_page_size INTEGER;
    valid_sort_field TEXT;
    valid_direction TEXT;
    valid_sort_fields TEXT[] := ARRAY['菜名', '菜系', '烹饪难度', 'relevance_score', 'created_at', 'updated_at'];

    -- 清理过的参数
    clean_req_ingredients TEXT[];
    clean_opt_ingredients TEXT[];
    clean_opt_condiments TEXT[];
    clean_dish_name_keys TEXT[];
    clean_cuisine_param TEXT[];
    clean_flavor_param TEXT[];
    clean_diff_param TEXT[];
    clean_diet_param TEXT[];
    clean_req_ingredient_cat_param TEXT[];
    clean_opt_ingredient_cat_param TEXT[];
    clean_req_condiment_cat_param TEXT[];
    clean_opt_condiment_cat_param TEXT[];
    clean_forbidden_ing TEXT[];
    similarity_threshold DOUBLE PRECISION;

    -- 性能监控变量
    performance_data JSONB := '{}'::JSONB;
    total_start_time TIMESTAMPTZ;
    current_step_start TIMESTAMPTZ;
    step_start TIMESTAMPTZ;
    step_end TIMESTAMPTZ;

    -- 评分权重常量，用于各组件内部计算，输出归一化结果(0-10)
    score_weight_dish_name_exact FLOAT8 := 10.0;  -- 菜名精确匹配权重
    score_weight_dish_name_fuzzy FLOAT8 := 6.0;   -- 菜名模糊匹配权重(LIKE/%)
    score_weight_dish_name_similar FLOAT8 := 4.0; -- 菜名相似度匹配权重

    -- 食材权重
    score_weight_required_ingredient_exact FLOAT8 := 8.0;    -- 必选食材精确匹配
    score_weight_required_ingredient_fuzzy FLOAT8 := 5.0;    -- 必选食材模糊匹配
    score_weight_required_ingredient_similar FLOAT8 := 3.0;  -- 必选食材相似度匹配
    score_weight_optional_ingredient_exact FLOAT8 := 6.0;    -- 可选食材精确匹配
    score_weight_optional_ingredient_fuzzy FLOAT8 := 4.0;    -- 可选食材模糊匹配
    score_weight_optional_ingredient_similar FLOAT8 := 2.0;  -- 可选食材相似度匹配

    -- 调料权重
    score_weight_required_condiment_exact FLOAT8 := 8.0;    -- 必选调料精确匹配
    score_weight_required_condiment_fuzzy FLOAT8 := 5.0;    -- 必选调料模糊匹配
    score_weight_required_condiment_similar FLOAT8 := 3.0;  -- 必选调料相似度匹配
    score_weight_optional_condiment_exact FLOAT8 := 6.0;    -- 可选调料精确匹配
    score_weight_optional_condiment_fuzzy FLOAT8 := 4.0;    -- 可选调料模糊匹配
    score_weight_optional_condiment_similar FLOAT8 := 2.0;  -- 可选调料相似度匹配

    -- 分类权重
    score_weight_required_ingredient_category_exact FLOAT8 := 3.0;    -- 必选食材分类精确匹配
    score_weight_required_ingredient_category_fuzzy FLOAT8 := 2.0;    -- 必选食材分类模糊匹配
    score_weight_required_ingredient_category_similar FLOAT8 := 1.0;  -- 必选食材分类相似度匹配
    score_weight_optional_ingredient_category_exact FLOAT8 := 3.0;    -- 可选食材分类精确匹配
    score_weight_optional_ingredient_category_fuzzy FLOAT8 := 2.0;    -- 可选食材分类模糊匹配
    score_weight_optional_ingredient_category_similar FLOAT8 := 1.0;  -- 可选食材分类相似度匹配
    score_weight_required_condiment_category_exact FLOAT8 := 3.0;     -- 必选调料分类精确匹配
    score_weight_required_condiment_category_fuzzy FLOAT8 := 2.0;     -- 必选调料分类模糊匹配
    score_weight_required_condiment_category_similar FLOAT8 := 1.0;   -- 必选调料分类相似度匹配
    score_weight_optional_condiment_category_exact FLOAT8 := 3.0;     -- 可选调料分类精确匹配
    score_weight_optional_condiment_category_fuzzy FLOAT8 := 2.0;     -- 可选调料分类模糊匹配
    score_weight_optional_condiment_category_similar FLOAT8 := 1.0;   -- 可选调料分类相似度匹配

    -- 菜系权重
    score_weight_cuisine_exact FLOAT8 := 5.0;                -- 菜系精确匹配权重
    score_weight_cuisine_fuzzy FLOAT8 := 3.0;                -- 菜系模糊匹配权重
    score_weight_cuisine_similar FLOAT8 := 2.0;              -- 菜系相似度匹配权重
    score_weight_cuisine_homestyle FLOAT8 := 2.0;            -- 家常菜加分权重

    -- 其他权重
    score_weight_flavor FLOAT8 := 4.0;                       -- 口味匹配权重
    score_weight_difficulty FLOAT8 := 3.0;                   -- 难度匹配权重
    score_weight_dietary FLOAT8 := 5.0;                      -- 饮食限制匹配权重

    -- 语义搜索权重
    score_weight_semantic_match FLOAT8 := 10.0;              -- 语义搜索匹配权重

    -- 最终乘数（应用于归一化后的0-10分组件分数）
    -- 加权线性求和评分系统的关键：对归一化分数应用不同的权重
    final_multiplier_semantic_search FLOAT8 := 3.0;  -- 语义搜索影响最大
    final_multiplier_dish_name FLOAT8 := 2.8;        -- 菜名匹配信号强
    final_multiplier_req_ingredients FLOAT8 := 2.5;  -- "按食材搜索"的核心
    final_multiplier_req_condiments FLOAT8 := 1.5;   -- 重要但次于主要食材
    final_multiplier_cuisine FLOAT8 := 1.2;          -- 显著偏好
    final_multiplier_flavor FLOAT8 := 1.2;           -- 显著偏好
    final_multiplier_opt_ingredients FLOAT8 := 0.8;  -- 优化项，良好的补充
    final_multiplier_opt_condiments FLOAT8 := 0.5;   -- 较不重要的可选项
    final_multiplier_req_ing_cat FLOAT8 := 0.7;      -- 必选但是更广泛的分类匹配
    final_multiplier_req_cond_cat FLOAT8 := 0.4;     -- 必选但广泛，适用于调料
    final_multiplier_opt_ing_cat FLOAT8 := 0.3;      -- 可选且广泛
    final_multiplier_opt_cond_cat FLOAT8 := 0.2;     -- 可选且广泛，适用于调料

    -- 语义搜索变量
    query_embedding vector(1536);                           -- 查询的嵌入向量
    recipe_embedding_vector vector(1536);                   -- 单个菜谱的嵌入向量，用于循环或连接
    v_semantic_threshold FLOAT8;                            -- 语义搜索阈值
BEGIN
    -- 开始总计时
    total_start_time := clock_timestamp();
    current_step_start := total_start_time;

    -- 设置语义搜索阈值 - 不再使用默认值
    v_semantic_threshold := semantic_threshold;

    -- 如果启用语义搜索，获取嵌入向量
    IF enable_semantic_search AND search_query IS NOT NULL AND LENGTH(TRIM(search_query)) > 0 THEN
        -- 尝试从缓存获取嵌入向量
        BEGIN
            SELECT embedding INTO query_embedding
            FROM query_embeddings_cache
            WHERE query = search_query
            AND created_at > NOW() - INTERVAL '1 day';

            -- 记录是否获取到嵌入向量
            IF query_embedding IS NOT NULL AND debug_mode THEN
                performance_data := jsonb_set(
                    performance_data,
                    '{semantic_search}'::text[],
                    jsonb_build_object('embedding_found', true)
                );
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- 记录错误，但不中断整体流程
                IF debug_mode THEN
                    performance_data := jsonb_set(
                        performance_data,
                        '{semantic_search}'::text[],
                        jsonb_build_object('error', SQLERRM)
                    );
                END IF;
        END;

        -- 如果没有从缓存获取到嵌入向量，则创建新的向量
        IF query_embedding IS NULL AND LENGTH(TRIM(search_query)) > 0 THEN
            BEGIN
                -- 调用嵌入向量创建函数
                SELECT generate_query_embedding(search_query) INTO query_embedding;

                -- 如果成功创建了向量，记录到缓存
                IF query_embedding IS NOT NULL THEN
                    INSERT INTO query_embeddings_cache(query, embedding)
                    VALUES (search_query, query_embedding);

                    IF debug_mode THEN
                        performance_data := jsonb_set(
                            performance_data,
                            '{semantic_search}'::text[],
                            jsonb_build_object('embedding_created', true)
                        );
                    END IF;
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    -- 记录错误，但不中断整体流程
                    IF debug_mode THEN
                        performance_data := jsonb_set(
                            performance_data,
                            '{semantic_search}'::text[],
                            jsonb_build_object('error_create_embedding', SQLERRM)
                        );
                    END IF;
            END;
        END IF;
    END IF;

    -- 设置模糊匹配相似度阈值
    similarity_threshold := trgm_similarity_threshold;
    EXECUTE 'SET pg_trgm.similarity_threshold = ' || similarity_threshold;

    -- 参数合理性校验
    IF page < 1 THEN
        page := 1;
    END IF;

    IF page_size < 1 THEN
        page_size := 10;
    ELSIF page_size > 1000000 THEN  -- 将上限从100改为100万，实际上允许返回非常大的结果集
        page_size := 1000000;  -- 设置一个足够大的数字作为上限
    END IF;

    -- 标准化搜索关键词（去除空字符串）
    IF search_query IS NOT NULL AND LENGTH(TRIM(search_query)) = 0 THEN
        search_query := NULL;
    END IF;

    -- 标准化和去重参数处理
    clean_req_ingredients := clean_text_array(required_ingredients);
    clean_opt_ingredients := clean_text_array(optional_ingredients);
    clean_opt_condiments := clean_text_array(optional_condiments);
    clean_dish_name_keys := clean_text_array(dish_name_keywords);
    clean_cuisine_param := clean_text_array(cuisines);
    clean_flavor_param := clean_text_array(flavors);
    clean_diff_param := clean_text_array(difficulties);
    clean_diet_param := clean_text_array(dietary_restrictions);
    clean_req_ingredient_cat_param := clean_text_array(required_ingredient_categories);
    clean_opt_ingredient_cat_param := clean_text_array(optional_ingredient_categories);
    clean_req_condiment_cat_param := clean_text_array(required_condiment_categories);
    clean_opt_condiment_cat_param := clean_text_array(optional_condiment_categories);
    clean_forbidden_ing := clean_text_array(forbidden_ingredients);

    -- 添加COALESCE保护，确保array_agg返回NULL时转为空数组
    clean_req_ingredients := COALESCE(clean_req_ingredients, ARRAY[]::TEXT[]);
    clean_opt_ingredients := COALESCE(clean_opt_ingredients, ARRAY[]::TEXT[]);
    clean_opt_condiments := COALESCE(clean_opt_condiments, ARRAY[]::TEXT[]);
    clean_dish_name_keys := COALESCE(clean_dish_name_keys, ARRAY[]::TEXT[]);
    clean_cuisine_param := COALESCE(clean_cuisine_param, ARRAY[]::TEXT[]);
    clean_flavor_param := COALESCE(clean_flavor_param, ARRAY[]::TEXT[]);
    clean_diff_param := COALESCE(clean_diff_param, ARRAY[]::TEXT[]);
    clean_diet_param := COALESCE(clean_diet_param, ARRAY[]::TEXT[]);
    clean_req_ingredient_cat_param := COALESCE(clean_req_ingredient_cat_param, ARRAY[]::TEXT[]);
    clean_opt_ingredient_cat_param := COALESCE(clean_opt_ingredient_cat_param, ARRAY[]::TEXT[]);
    clean_req_condiment_cat_param := COALESCE(clean_req_condiment_cat_param, ARRAY[]::TEXT[]);
    clean_opt_condiment_cat_param := COALESCE(clean_opt_condiment_cat_param, ARRAY[]::TEXT[]);
    clean_forbidden_ing := COALESCE(clean_forbidden_ing, ARRAY[]::TEXT[]);

    -- 检查关键词交叉（例如：同一个词出现在必选和忌口食材中）
    IF clean_req_ingredients IS NOT NULL AND clean_forbidden_ing IS NOT NULL THEN
        -- 找出同时存在于req_ingredients和forbidden_ing的项目
        WITH conflicting AS (
            SELECT r.ingredient
            FROM unnest(clean_req_ingredients) r(ingredient)
            WHERE EXISTS (
                SELECT 1
                FROM unnest(clean_forbidden_ing) f(ingredient)
                WHERE f.ingredient = r.ingredient
            )
        )
        -- 从req_ingredients中移除冲突项
        SELECT array_agg(r)
        INTO clean_req_ingredients
        FROM unnest(clean_req_ingredients) r
        WHERE NOT EXISTS (
            SELECT 1
            FROM conflicting c
            WHERE c.ingredient = r
        );

        -- 记录冲突警告
        RAISE NOTICE '检测到冲突：某些食材同时出现在必选和忌口列表中，已从必选列表中移除';
    END IF;

    -- 同样检查可选和忌口之间的冲突
    IF clean_opt_ingredients IS NOT NULL AND clean_forbidden_ing IS NOT NULL THEN
        -- 找出同时存在于opt_ingredients和forbidden_ing的项目
        WITH conflicting AS (
            SELECT o.ingredient
            FROM unnest(clean_opt_ingredients) o(ingredient)
            WHERE EXISTS (
                SELECT 1
                FROM unnest(clean_forbidden_ing) f(ingredient)
                WHERE f.ingredient = o.ingredient
            )
        )
        -- 从opt_ingredients中移除冲突项
        SELECT array_agg(o)
        INTO clean_opt_ingredients
        FROM unnest(clean_opt_ingredients) o
        WHERE NOT EXISTS (
            SELECT 1
            FROM conflicting c
            WHERE c.ingredient = o
        );

        -- 记录冲突警告
        RAISE NOTICE '检测到冲突：某些食材同时出现在可选和忌口列表中，已从可选列表中移除';
    END IF;

    -- 添加OFFSET安全限制，防止恶意请求导致性能问题
    -- 计算分页偏移
    IF page <= 1 THEN
        start_offset := 0;
    ELSE
        start_offset := (page - 1) * page_size;
        -- 设置一个合理的偏移上限，避免过大的偏移导致性能问题
        IF start_offset > 10000 THEN
            start_offset := 10000;
        END IF;
    END IF;

    -- 处理预览模式
    IF preview_mode AND NOT return_all_results THEN
        -- 在预览模式下，增加每页返回的记录数量
        effective_page_size := page_size * preview_page_count;
        RAISE NOTICE '启用预览模式，将返回当前页(%页)及后续%页的数据，共%条记录', page, preview_page_count-1, effective_page_size;
    ELSE
        effective_page_size := page_size;
    END IF;

    -- 确保start_offset不为NULL
    IF start_offset IS NULL THEN
        start_offset := 0;
    END IF;

    -- 验证排序方向
    IF UPPER(sort_direction) = 'DESC' THEN
        valid_direction := 'DESC';
    ELSIF UPPER(sort_direction) = 'ASC' THEN
        valid_direction := 'ASC';
    ELSE
        valid_direction := 'DESC'; -- 默认使用降序
    END IF;

    -- 规范化并验证排序字段
    IF sort_field IS NULL OR NOT EXISTS (
        SELECT 1
        FROM unnest(valid_sort_fields) v
        WHERE v = sort_field
        LIMIT 1
    ) THEN
        -- 如果是无效字段，发出警告（仅当提供了无效字段时）
        IF sort_field IS NOT NULL THEN
            RAISE NOTICE '无效的排序字段 "%"，将使用默认排序字段 "relevance_score"', sort_field;
        END IF;
        sort_field := 'relevance_score';
    ELSE
        -- 找到匹配项，使用标准大小写形式
        SELECT v INTO valid_sort_field
        FROM unnest(valid_sort_fields) v
        WHERE v = sort_field
        LIMIT 1;

        sort_field := valid_sort_field;
    END IF;

    -- 记录准备阶段的耗时
    IF debug_mode THEN
        step_end := clock_timestamp();
        performance_data := jsonb_set(performance_data, '{setup_time_ms}', to_jsonb(extract(epoch from (step_end - current_step_start)) * 1000));
        -- 同时填充filter_base_time_ms字段
        performance_data := jsonb_set(performance_data, '{filter_base_time_ms}', to_jsonb(extract(epoch from (step_end - current_step_start)) * 1000));
    END IF;

    -- 使用标准SQL查询，使用CASE实现动态排序
    RETURN QUERY
    WITH total_recipe_count AS (
        -- 获取总记录数，用于准确计算分页
        SELECT COUNT(*) AS count FROM "CHrecipes"
    ),
    cuisine_filtered AS (
        -- 菜系筛选
        SELECT
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            (SELECT count FROM total_recipe_count) AS filtered_total_count
        FROM filter_by_cuisine(clean_cuisine_param)
    ),
    cuisine_count AS (
        -- 记录菜系筛选后的记录数
        SELECT COUNT(*) AS count FROM cuisine_filtered
    ),
    flavor_filtered AS (
        -- 口味筛选
        SELECT
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            filtered_total_count,
            (SELECT count FROM cuisine_count) AS filtered_cuisine_filtered_count,
            null AS filtered_general_search_count
        FROM cuisine_filtered
        WHERE filter_by_flavors(
            filtered_id, filtered_菜名, filtered_菜系, filtered_口味特点, filtered_烹饪技法,
            filtered_食材, filtered_调料, filtered_步骤, filtered_注意事项,
            filtered_created_at, filtered_updated_at, filtered_烹饪难度, filtered_是否无麸质,
            filtered_调料分类, filtered_user_id, filtered_是否清真, filtered_食材分类,
            filtered_是否纯素, filtered_菜系_jsonb, filtered_菜名_jsonb,
            clean_flavor_param
        )
    ),
    flavor_count AS (
        -- 记录口味筛选后的记录数
        SELECT COUNT(*) AS count FROM flavor_filtered
    ),
    difficulty_filtered AS (
        -- 难度筛选
        SELECT
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            filtered_total_count,
            filtered_cuisine_filtered_count,
            filtered_general_search_count,
            (SELECT count FROM flavor_count) AS filtered_flavor_filtered_count
        FROM flavor_filtered
        WHERE filter_by_difficulty(filtered_烹饪难度, clean_diff_param)
    ),
    difficulty_count AS (
        -- 记录难度筛选后的记录数
        SELECT COUNT(*) AS count FROM difficulty_filtered
    ),
    dietary_filtered AS (
        -- 饮食限制筛选
        SELECT
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            filtered_total_count,
            filtered_cuisine_filtered_count,
            filtered_general_search_count,
            filtered_flavor_filtered_count,
            (SELECT count FROM difficulty_count) AS filtered_difficulty_filtered_count
        FROM difficulty_filtered
        WHERE filter_by_dietary(filtered_是否无麸质, filtered_是否清真, filtered_是否纯素, clean_diet_param)
    ),
    dietary_count AS (
        -- 记录饮食限制筛选后的记录数
        SELECT COUNT(*) AS count FROM dietary_filtered
    ),
    forbidden_ingredient_filtered AS (
        -- 忌口食材筛选
        SELECT
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            filtered_total_count,
            filtered_cuisine_filtered_count,
            filtered_general_search_count,
            filtered_flavor_filtered_count,
            filtered_difficulty_filtered_count,
            (SELECT count FROM dietary_count) AS filtered_dietary_filtered_count
        FROM dietary_filtered
        WHERE filter_by_forbidden_ingredients(
            filtered_食材, 
            filtered_调料, 
            filtered_菜名, 
            filtered_菜系, 
            filtered_食材分类, 
            filtered_调料分类, 
            clean_forbidden_ing, 
            forbidden_ingredients_threshold,  -- 传递忌口食材的语义搜索阈值
            trgm_similarity_threshold        -- 传递模糊匹配阈值
        )
    ),
    forbidden_ingredient_count AS (
        -- 记录忌口食材筛选后的记录数
        SELECT COUNT(*) AS count FROM forbidden_ingredient_filtered
    ),
    required_ingredient_filtered AS (
        -- 必选食材筛选
        SELECT
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            filtered_total_count,
            filtered_cuisine_filtered_count,
            filtered_general_search_count,
            filtered_flavor_filtered_count,
            filtered_difficulty_filtered_count,
            filtered_dietary_filtered_count,
            (SELECT count FROM forbidden_ingredient_count) AS filtered_forbidden_ingredient_filtered_count
        FROM forbidden_ingredient_filtered
        WHERE filter_by_required_ingredients(
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            clean_req_ingredients,
            similarity_threshold,  -- 传递模糊匹配阈值
            required_ingredients_threshold  -- 使用传入的语义搜索阈值参数
        )
    ),
    required_ingredient_count AS (
        -- 记录必选食材筛选后的记录数
        SELECT COUNT(*) AS count FROM required_ingredient_filtered
    ),
    general_search_filtered AS (
        -- 通用关键词搜索筛选（移到最后）
        SELECT
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            filtered_total_count,
            filtered_cuisine_filtered_count,
            filtered_general_search_count,
            filtered_flavor_filtered_count,
            filtered_difficulty_filtered_count,
            filtered_dietary_filtered_count,
            filtered_forbidden_ingredient_filtered_count,
            (SELECT count FROM required_ingredient_count) AS filtered_required_ingredient_filtered_count
        FROM required_ingredient_filtered
        WHERE filter_by_general_search(
            filtered_id,
            filtered_菜名,
            filtered_菜系,
            filtered_口味特点,
            filtered_烹饪技法,
            filtered_食材,
            filtered_调料,
            filtered_步骤,
            filtered_注意事项,
            filtered_created_at,
            filtered_updated_at,
            filtered_烹饪难度,
            filtered_是否无麸质,
            filtered_调料分类,
            filtered_user_id,
            filtered_是否清真,
            filtered_食材分类,
            filtered_是否纯素,
            filtered_菜系_jsonb,
            filtered_菜名_jsonb,
            search_query,
            general_search_threshold,  -- 传递通用搜索的语义搜索阈值
            trgm_similarity_threshold  -- 传递模糊匹配阈值
        )
    ),
    general_search_count AS (
        -- 记录通用关键词搜索后的记录数
        SELECT COUNT(*) AS count FROM general_search_filtered
    ),
    final_filtered_count AS (
        -- 记录最终过滤后的记录总数（这是计算分页的基础）
        SELECT COUNT(*) AS count FROM general_search_filtered
    ),
    optional_ingredient_relevance AS (
        -- 可选食材相关性评分
        SELECT
            filtered_id,
            score_optional_ingredients(
                filtered_食材,
                clean_opt_ingredients,
                similarity_threshold,
                score_weight_optional_ingredient_exact,
                score_weight_optional_ingredient_fuzzy,
                score_weight_optional_ingredient_similar
            ) AS opt_ingredients_score
        FROM general_search_filtered
    ),
    optional_condiment_relevance AS (
        -- 可选调料相关性评分
        SELECT
            filtered_id,
            score_optional_condiments(
                filtered_调料,
                clean_opt_condiments,
                similarity_threshold,
                score_weight_optional_condiment_exact,
                score_weight_optional_condiment_fuzzy,
                score_weight_optional_condiment_similar
            ) AS opt_condiments_score
        FROM general_search_filtered
    ),
    optional_ingredient_category_relevance AS (
        -- 可选食材分类相关性评分
        SELECT
            filtered_id,
            score_optional_ingredient_categories(
                filtered_食材分类,
                clean_opt_ingredient_cat_param,
                similarity_threshold,
                score_weight_optional_ingredient_category_exact,
                score_weight_optional_ingredient_category_fuzzy,
                score_weight_optional_ingredient_category_similar
            ) AS opt_ingredient_categories_score
        FROM general_search_filtered
    ),
    optional_condiment_category_relevance AS (
        -- 可选调料分类相关性评分
        SELECT
            filtered_id,
            score_optional_condiment_categories(
                filtered_调料分类,
                clean_opt_condiment_cat_param,
                similarity_threshold,
                score_weight_optional_condiment_category_exact,
                score_weight_optional_condiment_category_fuzzy,
                score_weight_optional_condiment_category_similar
            ) AS opt_condiment_categories_score
        FROM general_search_filtered
    ),
    combined_scores AS (
        -- 组合所有评分指标
        SELECT
            r.filtered_id,
            r.filtered_菜名,
            r.filtered_菜系,
            r.filtered_口味特点,
            r.filtered_烹饪技法,
            r.filtered_食材,
            r.filtered_调料,
            r.filtered_步骤,
            r.filtered_注意事项,
            r.filtered_created_at,
            r.filtered_updated_at,
            r.filtered_烹饪难度,
            r.filtered_是否无麸质,
            r.filtered_调料分类,
            r.filtered_user_id,
            r.filtered_是否清真,
            r.filtered_食材分类,
            r.filtered_是否纯素,
            r.filtered_菜系_jsonb,
            r.filtered_菜名_jsonb,
            r.filtered_total_count,
            r.filtered_cuisine_filtered_count,
            r.filtered_general_search_count,
            r.filtered_flavor_filtered_count,
            r.filtered_difficulty_filtered_count,
            r.filtered_dietary_filtered_count,
            r.filtered_forbidden_ingredient_filtered_count,
            r.filtered_required_ingredient_filtered_count,
            -- 计算各项得分
            -- 必选食材相关性评分
            score_required_ingredients(
                r.filtered_食材,
                clean_req_ingredients,
                similarity_threshold,
                score_weight_required_ingredient_exact,
                score_weight_required_ingredient_fuzzy,
                score_weight_required_ingredient_similar
            ) AS req_ingredients_score,
            -- 必选调料相关性评分已完全移除（已融合到必选食材中）
            -- 保留零值以保持API兼容性
            0.0 AS req_condiments_score,
            -- 必选食材分类相关性评分（在统一搜索中处理）
            score_required_ingredient_categories(
                r.filtered_食材分类,
                clean_req_ingredient_cat_param,
                similarity_threshold,
                score_weight_required_ingredient_category_exact,
                score_weight_required_ingredient_category_fuzzy,
                score_weight_required_ingredient_category_similar
            ) AS req_ing_categories_score,
            -- 必选调料分类相关性评分（在统一搜索中处理）
            score_required_condiment_categories(
                r.filtered_调料分类,
                clean_req_condiment_cat_param,
                similarity_threshold,
                score_weight_required_condiment_category_exact,
                score_weight_required_condiment_category_fuzzy,
                score_weight_required_condiment_category_similar
            ) AS req_cond_categories_score,
            -- 菜系相关性评分
            score_cuisine(
                r.filtered_菜系,
                r.filtered_菜系_jsonb,
                clean_cuisine_param,
                similarity_threshold,
                score_weight_cuisine_exact,
                score_weight_cuisine_fuzzy,
                score_weight_cuisine_similar,
                score_weight_cuisine_homestyle
            ) AS cs_cuisine_score,
            -- 口味相关性评分
            score_flavor(
                r.filtered_口味特点,
                clean_flavor_param,
                score_weight_flavor
            ) AS cs_flavor_score,
            -- 菜名关键词相关性评分
            score_dish_name(
                r.filtered_菜名,
                r.filtered_菜名_jsonb,
                clean_dish_name_keys,
                similarity_threshold,
                score_weight_dish_name_exact,
                score_weight_dish_name_fuzzy,
                score_weight_dish_name_similar
            ) AS cs_dish_name_score,
            -- 语义搜索评分
            (CASE
                WHEN enable_semantic_search AND query_embedding IS NOT NULL AND re.embedding IS NOT NULL THEN
                    score_semantic_search(
                        re.embedding,       -- 菜谱的嵌入向量 (来自 recipe_embeddings)
                        query_embedding,    -- 查询的嵌入向量 (在函数早期获取)
                        v_semantic_threshold, -- 语义相似度阈值
                        score_weight_semantic_match -- 语义匹配权重
                    )
                ELSE
                    0 -- 如果不满足条件，语义评分为0
            END) AS semantic_search_score,
            -- 可选食材评分
            COALESCE(oir.opt_ingredients_score, 0) AS cs_opt_ingredients_score,
            -- 可选调料评分
            COALESCE(ocr.opt_condiments_score, 0) AS cs_opt_condiments_score,
            -- 可选食材分类评分
            COALESCE(oicr.opt_ingredient_categories_score, 0) AS cs_opt_ing_categories_score,
            -- 可选调料分类评分
            COALESCE(occr.opt_condiment_categories_score, 0) AS cs_opt_cond_categories_score
        FROM
            general_search_filtered r
        LEFT JOIN
            recipe_embeddings re ON r.filtered_id = re.recipe_id -- 关联 recipe_embeddings 表以获取菜谱向量
        LEFT JOIN
            optional_ingredient_relevance oir ON r.filtered_id = oir.filtered_id
        LEFT JOIN
            optional_condiment_relevance ocr ON r.filtered_id = ocr.filtered_id
        LEFT JOIN
            optional_ingredient_category_relevance oicr ON r.filtered_id = oicr.filtered_id
        LEFT JOIN
            optional_condiment_category_relevance occr ON r.filtered_id = occr.filtered_id
    ),
    calculated_scores AS (
        -- 计算最终相关性得分，使用归一化分数(0-10)和最终乘数
        -- 加权线性求和：每个归一化的分数乘以其对应权重，然后相加
        SELECT
            *,
            -- 将各项归一化得分乘以其最终乘数，然后加和
            -- 注意：评分函数已经重构，所有功能都使用了通用评分函数
            -- - 所有分类评分函数都基于score_categories
            -- - 所有食材/调料评分函数都基于score_ingredients
            -- - req_condiments_score已合并到req_ingredients_score (保留为0)
            -- - 仍保留所有函数接口以兼容性，但内部实现已简化
            (
                COALESCE(req_ingredients_score, 0) * final_multiplier_req_ingredients +
                COALESCE(req_condiments_score, 0) * final_multiplier_req_condiments +
                COALESCE(req_ing_categories_score, 0) * final_multiplier_req_ing_cat +
                COALESCE(req_cond_categories_score, 0) * final_multiplier_req_cond_cat +
                COALESCE(cs_cuisine_score, 0) * final_multiplier_cuisine +
                COALESCE(cs_flavor_score, 0) * final_multiplier_flavor +
                COALESCE(cs_dish_name_score, 0) * final_multiplier_dish_name +
                COALESCE(semantic_search_score, 0) * final_multiplier_semantic_search +
                COALESCE(cs_opt_ingredients_score, 0) * final_multiplier_opt_ingredients +
                COALESCE(cs_opt_condiments_score, 0) * final_multiplier_opt_condiments +
                COALESCE(cs_opt_ing_categories_score, 0) * final_multiplier_opt_ing_cat +
                COALESCE(cs_opt_cond_categories_score, 0) * final_multiplier_opt_cond_cat
            ) AS calc_relevance_score
        FROM combined_scores
    ),
    final_results AS (
        -- 应用排序和分页
        SELECT
            calculated_scores.*,
            (SELECT count FROM final_filtered_count) AS result_filtered_count,
            -- 添加查询性能数据
            jsonb_build_object(
                'filtered_count', (SELECT count FROM final_filtered_count),
                'total_count', filtered_total_count,
                'cuisine_filtered_count', filtered_cuisine_filtered_count,
                'general_search_filtered_count', filtered_general_search_count,
                'flavor_filtered_count', filtered_flavor_filtered_count,
                'difficulty_filtered_count', filtered_difficulty_filtered_count,
                'dietary_filtered_count', filtered_dietary_filtered_count,
                'forbidden_ingredient_filtered_count', filtered_forbidden_ingredient_filtered_count,
                'required_ingredient_filtered_count', filtered_required_ingredient_filtered_count
            ) AS sr_performance_details
        FROM calculated_scores
        ORDER BY
            CASE WHEN sort_field = 'relevance_score' AND sort_direction = 'DESC' THEN calc_relevance_score END DESC,
            CASE WHEN sort_field = 'relevance_score' AND sort_direction = 'ASC' THEN calc_relevance_score END ASC,
            CASE WHEN sort_field = '菜名' AND sort_direction = 'DESC' THEN filtered_菜名 END DESC,
            CASE WHEN sort_field = '菜名' AND sort_direction = 'ASC' THEN filtered_菜名 END ASC,
            CASE WHEN sort_field = '菜系' AND sort_direction = 'DESC' THEN filtered_菜系 END DESC,
            CASE WHEN sort_field = '菜系' AND sort_direction = 'ASC' THEN filtered_菜系 END ASC,
            CASE WHEN sort_field = '烹饪难度' AND sort_direction = 'DESC' THEN filtered_烹饪难度 END DESC,
            CASE WHEN sort_field = '烹饪难度' AND sort_direction = 'ASC' THEN filtered_烹饪难度 END ASC,
            CASE WHEN sort_field = 'created_at' AND sort_direction = 'DESC' THEN filtered_created_at END DESC,
            CASE WHEN sort_field = 'created_at' AND sort_direction = 'ASC' THEN filtered_created_at END ASC,
            CASE WHEN sort_field = 'updated_at' AND sort_direction = 'DESC' THEN filtered_updated_at END DESC,
            CASE WHEN sort_field = 'updated_at' AND sort_direction = 'ASC' THEN filtered_updated_at END ASC,
            -- 稳定排序：当所有主要条件相同时，按ID排序确保结果稳定
            CASE WHEN stabilize_results THEN filtered_id END,
            -- 默认ID排序用于非稳定模式，加入一定随机性以展示更多内容
            CASE WHEN NOT stabilize_results THEN RANDOM() END
        LIMIT
            CASE
                WHEN (preview_mode = TRUE) THEN preview_page_count * page_size
                WHEN (return_all_results = TRUE) THEN 1000000  -- 实际上是个足够大的数字，近似"无限"
                ELSE page_size
            END
        OFFSET
            CASE
                WHEN (preview_mode = TRUE) THEN 0
                ELSE (page - 1) * page_size
            END
    )
    -- 返回最终结果，使用简化的CASE语句进行排序
    SELECT
        filtered_id AS id,
        filtered_菜名 AS 菜名,
        filtered_菜系 AS 菜系,
        filtered_口味特点 AS 口味特点,
        filtered_烹饪技法 AS 烹饪技法,
        filtered_食材 AS 食材,
        filtered_调料 AS 调料,
        filtered_步骤 AS 步骤,
        filtered_注意事项 AS 注意事项,
        filtered_created_at AS created_at,
        filtered_updated_at AS updated_at,
        filtered_烹饪难度 AS 烹饪难度,
        filtered_是否无麸质 AS 是否无麸质,
        filtered_调料分类 AS 调料分类,
        filtered_user_id AS user_id,
        filtered_是否清真 AS 是否清真,
        filtered_食材分类 AS 食材分类,
        filtered_是否纯素 AS 是否纯素,
        filtered_菜系_jsonb AS 菜系_jsonb,
        filtered_菜名_jsonb AS 菜名_jsonb,
        calc_relevance_score AS relevance_score,
        req_ingredients_score AS original_ingredients_score,
        cs_opt_ingredients_score AS opt_ingredients_score,
        cs_opt_condiments_score AS condiments_score,
        cs_opt_ing_categories_score AS ingredient_categories_score,
        cs_opt_cond_categories_score AS condiment_categories_score,
        semantic_search_score AS semantic_score, -- 保留字段，但实际已融合到其他评分中
        NULL::NUMERIC AS query_time_ms,          -- 避免与函数变量冲突，使用NULL占位
        NULL::NUMERIC AS filter_base_time_ms,    -- 避免与函数变量冲突，使用NULL占位
        NULL::NUMERIC AS filter_ingredients_time_ms, -- 避免与函数变量冲突，使用NULL占位
        NULL::NUMERIC AS filter_condiments_time_ms,  -- 避免与函数变量冲突，使用NULL占位
        NULL::NUMERIC AS filter_categories_time_ms,  -- 避免与函数变量冲突, 使用NULL占位
        NULL::NUMERIC AS filter_dietary_time_ms,     -- 避免与函数变量冲突，使用NULL占位
        NULL::NUMERIC AS sort_time_ms,               -- 避免与函数变量冲突，使用NULL占位
        NULL::NUMERIC AS pagination_time_ms,         -- 避免与函数变量冲突，使用NULL占位
        sr_performance_details AS performance_details,
        result_filtered_count AS filtered_count,     -- 使用重命名的字段，避免与函数变量冲突
        filtered_total_count AS total_count          -- 数据库总记录数
    FROM final_results
    ORDER BY
        CASE
            WHEN sort_field::TEXT = '菜名' AND valid_direction::TEXT = 'ASC' THEN filtered_菜名 END ASC,
        CASE
            WHEN sort_field::TEXT = '菜名' AND valid_direction::TEXT = 'DESC' THEN filtered_菜名 END DESC,
        CASE
            WHEN sort_field::TEXT = '菜系' AND valid_direction::TEXT = 'ASC' THEN filtered_菜系 END ASC,
        CASE
            WHEN sort_field::TEXT = '菜系' AND valid_direction::TEXT = 'DESC' THEN filtered_菜系 END DESC,
        CASE
            WHEN sort_field::TEXT = '烹饪难度' AND valid_direction::TEXT = 'ASC' THEN filtered_烹饪难度 END ASC,
        CASE
            WHEN sort_field::TEXT = '烹饪难度' AND valid_direction::TEXT = 'DESC' THEN filtered_烹饪难度 END DESC,
        CASE
            WHEN sort_field::TEXT = 'created_at' AND valid_direction::TEXT = 'ASC' THEN filtered_created_at END ASC,
        CASE
            WHEN sort_field::TEXT = 'created_at' AND valid_direction::TEXT = 'DESC' THEN filtered_created_at END DESC,
        CASE
            WHEN sort_field::TEXT = 'updated_at' AND valid_direction::TEXT = 'ASC' THEN filtered_updated_at END ASC,
        CASE
            WHEN sort_field::TEXT = 'updated_at' AND valid_direction::TEXT = 'DESC' THEN filtered_updated_at END DESC,
        CASE
            WHEN sort_field::TEXT = 'relevance_score' OR sort_field IS NULL THEN calc_relevance_score END DESC
    LIMIT effective_page_size
    OFFSET start_offset;

    -- 在debug模式下，记录查询执行完毕的总时间
    IF debug_mode THEN
        RAISE NOTICE 'search_recipes总执行时间: % 毫秒', extract(epoch from (clock_timestamp() - total_start_time)) * 1000;
    END IF;
END;
$$;

-- 为函数添加注释
COMMENT ON FUNCTION search_recipes(
    DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
    TEXT, TEXT[], TEXT[], TEXT[], TEXT[],
    TEXT[], TEXT[], TEXT[], TEXT[], TEXT[],
    TEXT[], TEXT[], TEXT[], INTEGER, INTEGER, 
    TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN,
    TEXT[], BOOLEAN, INTEGER, BOOLEAN
) IS
'高效搜索菜谱的数据库函数，根据多种条件在数据库端进行筛选，避免将全部数据传输到前端。

参数:
- trgm_similarity_threshold: 模糊匹配相似度阈值 (DOUBLE PRECISION)，必须从前端配置传入
- semantic_threshold: 默认语义搜索相似度阈值 (DOUBLE PRECISION)，必须从前端配置传入
- forbidden_ingredients_threshold: 忌口食材的语义搜索阈值 (DOUBLE PRECISION)，必须从前端配置传入
- required_ingredients_threshold: 必选食材的语义搜索阈值 (DOUBLE PRECISION)，必须从前端配置传入
- general_search_threshold: 通用搜索的语义搜索阈值 (DOUBLE PRECISION)，必须从前端配置传入
- search_query: 搜索关键词 (TEXT)
- required_ingredients: 必选食材数组 (TEXT[])
- optional_ingredients: 可选食材数组 (TEXT[])
- optional_condiments: 可选调料数组 (TEXT[])
- dish_name_keywords: 菜名关键词数组 (TEXT[])
- cuisines: 菜系筛选数组 (TEXT[])
- flavors: 口味筛选数组 (TEXT[])
- difficulties: 难度筛选数组 (TEXT[])
- dietary_restrictions: 饮食限制数组 (TEXT[])
- required_ingredient_categories: 必选食材分类数组 (TEXT[])
- optional_ingredient_categories: 可选食材分类数组 (TEXT[])
- required_condiment_categories: 必选调料分类数组 (TEXT[])
- optional_condiment_categories: 可选调料分类数组 (TEXT[])
- page: 页码 (INTEGER)
- page_size: 每页数量 (INTEGER)
- sort_field: 排序字段 (TEXT)
- sort_direction: 排序方向 (TEXT)
- return_all_results: 是否返回所有结果 (BOOLEAN)
- debug_mode: 是否启用性能调试模式 (BOOLEAN)
- stabilize_results: 是否确保结果一致性 (BOOLEAN)
- forbidden_ingredients: 忌口食材数组 (TEXT[])
- preview_mode: 预览模式 (BOOLEAN)
- preview_page_count: 预览模式页数 (INTEGER)
- enable_semantic_search: 是否启用语义搜索 (BOOLEAN)

返回值:
- TABLE (包含菜谱的详细信息及评分) ';

-- [已移除] 计算总评分 函数，此功能已直接集成到 search_recipes 函数中
-- 移除此函数以避免代码冗余和维护问题