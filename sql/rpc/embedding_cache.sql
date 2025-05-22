-- Step 0a: 删除旧函数（防止类型冲突）
DROP FUNCTION IF EXISTS get_cached_embedding(TEXT);
DROP FUNCTION IF EXISTS update_embedding_cache(UUID, FLOAT[], TIMESTAMPTZ);
DROP FUNCTION IF EXISTS insert_embedding_cache(TEXT, FLOAT[], TIMESTAMPTZ);
DROP FUNCTION IF EXISTS cache_query_embedding(TEXT, numeric[]);
DROP FUNCTION IF EXISTS cache_query_embedding(TEXT, vector);
DROP FUNCTION IF EXISTS cache_query_embedding(TEXT, vector(1536));

-- Step 0b: 删除旧表（如果存在）
DROP TABLE IF EXISTS query_embeddings_cache;

-- Step 1: 创建表
CREATE TABLE IF NOT EXISTS query_embeddings_cache (
    query TEXT NOT NULL UNIQUE,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    embedding_json JSONB
);

-- Update embedding cache procedure
CREATE OR REPLACE FUNCTION update_embedding_cache(
  p_id UUID,
  p_embedding vector(1536),
  p_created_at TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  UPDATE query_embeddings_cache
  SET 
    embedding = p_embedding,
    created_at = p_created_at
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Insert embedding cache procedure
CREATE OR REPLACE FUNCTION insert_embedding_cache(
  p_query TEXT,
  p_embedding vector(1536),
  p_created_at TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  INSERT INTO query_embeddings_cache(query, embedding, created_at)
  VALUES(p_query, p_embedding, p_created_at)
  ON CONFLICT (query) DO UPDATE SET
    embedding = p_embedding,
    created_at = p_created_at;
END;
$$ LANGUAGE plpgsql;

-- 添加ID列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'query_embeddings_cache' AND column_name = 'id'
  ) THEN
    ALTER TABLE query_embeddings_cache ADD COLUMN id UUID DEFAULT uuid_generate_v4() PRIMARY KEY;
    RAISE NOTICE 'Added id column to query_embeddings_cache table';
  ELSE
    RAISE NOTICE 'id column already exists in query_embeddings_cache table';
  END IF;
END;
$$;

-- Add JSON column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'query_embeddings_cache' AND column_name = 'embedding_json'
  ) THEN
    ALTER TABLE query_embeddings_cache ADD COLUMN embedding_json JSONB;
    RAISE NOTICE 'Added embedding_json column to query_embeddings_cache table';
  ELSE
    RAISE NOTICE 'embedding_json column already exists in query_embeddings_cache table';
  END IF;
END;
$$;

-- 添加唯一约束（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'query_embeddings_cache_query_key' 
    AND n.nspname = 'public'
  ) THEN
    ALTER TABLE query_embeddings_cache ADD CONSTRAINT query_embeddings_cache_query_key UNIQUE (query);
    RAISE NOTICE 'Added unique constraint on query column';
  ELSE
    RAISE NOTICE 'Unique constraint on query column already exists';
  END IF;
END;
$$;

-- Get cached embedding function
CREATE OR REPLACE FUNCTION get_cached_embedding(
  p_query TEXT
) RETURNS TABLE (
  id UUID,
  embedding vector(1536),
  embedding_json JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qec.id,
    qec.embedding,
    qec.embedding_json
  FROM query_embeddings_cache qec
  WHERE qec.query = p_query
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 创建缓存查询嵌入向量的函数
CREATE OR REPLACE FUNCTION cache_query_embedding(
    query_text TEXT,
    query_vector vector(1536)  -- 明确指定为vector(1536)类型，不要使用numeric[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 将结果插入或更新缓存
    INSERT INTO query_embeddings_cache (query, embedding, created_at)
    VALUES (query_text, query_vector, NOW())
    ON CONFLICT (query) DO UPDATE SET 
    embedding = query_vector,
    created_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 添加注释说明函数用途
COMMENT ON FUNCTION cache_query_embedding(TEXT, vector(1536)) IS 
'缓存查询嵌入向量的函数，用于存储生成的嵌入向量以避免重复计算。
参数:
  query_text - 查询文本
  query_vector - 1536维度的嵌入向量（必须是vector(1536)类型）
返回:
  成功返回TRUE'; 