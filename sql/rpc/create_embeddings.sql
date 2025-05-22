-- 创建菜谱嵌入向量表和索引的SQL脚本
-- 此脚本用于设置pgvector扩展和向量搜索所需的表结构

-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 先删除可能存在的触发器和函数
DROP TRIGGER IF EXISTS set_recipe_embeddings_updated_at ON recipe_embeddings;
DROP FUNCTION IF EXISTS update_recipe_embeddings_updated_at();
DROP FUNCTION IF EXISTS search_recipes_by_embedding(vector, float, int);


-- 创建菜谱嵌入向量表
CREATE TABLE IF NOT EXISTS recipe_embeddings (
  id UUID PRIMARY KEY REFERENCES "CHrecipes"(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL,
  title TEXT NOT NULL,
  ingredients TEXT,
  description TEXT,
  embedding vector(1536), -- 沿用原有维度1536
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建向量索引以加速相似度搜索
DROP INDEX IF EXISTS recipe_embeddings_embedding_idx;
CREATE INDEX IF NOT EXISTS recipe_embeddings_embedding_idx 
ON recipe_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_recipe_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS set_recipe_embeddings_updated_at ON recipe_embeddings;
CREATE TRIGGER set_recipe_embeddings_updated_at
BEFORE UPDATE ON recipe_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_recipe_embeddings_updated_at();

-- 创建查询嵌入向量缓存表
CREATE TABLE IF NOT EXISTS query_embeddings_cache (
    query TEXT UNIQUE NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS query_embeddings_cache_created_at_idx ON query_embeddings_cache (created_at);

-- 创建语义搜索函数
CREATE OR REPLACE FUNCTION search_recipes_by_embedding(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    recipe_id UUID,
    title TEXT,
    ingredients TEXT,
    description TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.recipe_id,
        e.title,
        e.ingredients,
        e.description,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM
        recipe_embeddings e
    WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY
        e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 此处曾有一个score_semantic_search函数，但与search_recipes_scoring.sql中的函数冲突
-- 已移除重复的函数定义，该功能现在由search_recipes_scoring.sql中的score_semantic_search提供

-- 生成查询嵌入向量函数（此函数会调用外部API）
CREATE OR REPLACE FUNCTION generate_query_embedding(query_text TEXT)
RETURNS vector(1536) AS $$
DECLARE
    result vector(1536);
BEGIN
    -- 这里需要一个触发器或存储过程来调用外部API
    -- 实际实现可能需要使用plpython或plpgsql+http扩展
    -- 简化起见，这里只是一个示例
    
    -- 将结果插入缓存
    INSERT INTO query_embeddings_cache (query, embedding)
    VALUES (query_text, result)
    ON CONFLICT (query) DO UPDATE SET 
    embedding = result,
    created_at = NOW();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 语义搜索相关函数
-- 根据语义相似度计算评分
CREATE OR REPLACE FUNCTION embedding_semantic_similarity(
    input_recipe_id UUID,
    search_query TEXT,
    weight FLOAT8
)
RETURNS FLOAT8 AS $$
DECLARE
    v_embedding_semantic_score FLOAT8 := 0;
    query_embedding vector(1536);
    recipe_embedding vector(1536);
BEGIN
    -- 如果搜索查询为空，返回0分
    IF search_query IS NULL OR LENGTH(TRIM(search_query)) = 0 THEN
        RETURN 0;
    END IF;
    
    -- 获取查询的嵌入向量
    SELECT embedding INTO query_embedding
    FROM query_embeddings_cache
    WHERE query = search_query
    AND created_at > NOW() - INTERVAL '1 day';
    
    -- 如果缓存中没有查询向量，则返回0分
    -- 实际系统中会有后台服务生成并缓存查询向量
    IF query_embedding IS NULL THEN
        RETURN 0;
    END IF;
    
    -- 获取菜谱嵌入向量
    SELECT embedding INTO recipe_embedding
    FROM recipe_embeddings
    WHERE id = input_recipe_id;
    
    -- 如果菜谱没有嵌入向量，返回0分
    IF recipe_embedding IS NULL THEN
        RETURN 0;
    END IF;
    
    -- 计算余弦相似度并返回加权分数
    v_embedding_semantic_score := (1 - (recipe_embedding <=> query_embedding)) * weight;
    
    RETURN COALESCE(v_embedding_semantic_score, 0);
END;
$$ LANGUAGE plpgsql; 