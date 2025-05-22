-- 根据嵌入向量搜索菜谱的存储过程
-- 使用余弦相似度来匹配相似的菜谱
-- 该存储过程将返回匹配的菜谱ID及其相似度分数

-- 先删除可能存在的函数
DROP FUNCTION IF EXISTS search_recipes_by_embedding_simple(vector, float, int);
DROP FUNCTION IF EXISTS search_recipes_by_embedding(vector, float, int);

CREATE OR REPLACE FUNCTION search_recipes_by_embedding_simple(
  query_embedding vector(1536),  -- 查询文本的嵌入向量
  match_threshold float,         -- 相似度阈值，例如0.5
  match_count int                -- 返回的最大匹配数量
)
RETURNS TABLE (
  id UUID,                      -- 嵌入向量记录ID
  recipe_id UUID,               -- 菜谱ID
  title TEXT,                   -- 菜谱名称
  ingredients TEXT,             -- 食材列表
  similarity FLOAT              -- 相似度分数
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    re.recipe_id,
    re.title,
    re.ingredients,
    1 - (re.embedding <=> query_embedding) AS similarity  -- 余弦相似度计算
  FROM
    recipe_embeddings re
  WHERE
    1 - (re.embedding <=> query_embedding) > match_threshold
  ORDER BY
    re.embedding <=> query_embedding  -- 距离越小，相似度越高
  LIMIT
    match_count;
END;
$$;

-- 添加注释说明两个函数的区别
COMMENT ON FUNCTION search_recipes_by_embedding_simple(vector, float, int) IS 
'简化版的嵌入向量搜索函数，返回较少的字段。主要用于简单场景。
注意：create_embeddings.sql中定义了完整版的search_recipes_by_embedding函数，包含更多字段和安全设置。'; 