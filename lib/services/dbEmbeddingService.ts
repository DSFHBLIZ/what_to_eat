import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddingService';

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 详细记录环境配置
console.log('[dbEmbeddingService] 初始化服务...');
console.log('[dbEmbeddingService] Supabase URL:', supabaseUrl);
console.log('[dbEmbeddingService] Supabase服务密钥状态:', supabaseServiceKey ? '已设置' : '未设置');
console.log('[dbEmbeddingService] Supabase密钥长度:', supabaseServiceKey.length);

// 创建Supabase客户端
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    // 在浏览器端，不使用服务密钥
    console.log('[dbEmbeddingService] 浏览器环境，不使用服务密钥创建Supabase客户端');
    return null;
  }
  
  // 在服务器端，使用服务密钥
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
};

/**
 * 为查询生成嵌入向量并缓存到数据库
 */
export async function generateAndCacheQueryEmbedding(query: string): Promise<boolean> {
  try {
    console.log('[dbEmbeddingService] 开始为查询生成嵌入向量:', query);
    
    // 检查环境
    if (typeof window !== 'undefined') {
      console.log('[dbEmbeddingService] 浏览器环境，使用API路由缓存向量');
      
      // 在浏览器环境中，使用API路由
      const response = await fetch('/api/embedding/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[dbEmbeddingService] API响应错误:', errorData);
        throw new Error(errorData.error || response.statusText);
      }
      
      const data = await response.json();
      console.log('[dbEmbeddingService] 服务端缓存结果:', data.success ? '成功' : '失败');
      
      return data.success;
    }
    
    // 服务器端环境
    // 生成嵌入向量
    const embedding = await generateEmbedding(query, false);
    
    console.log('[dbEmbeddingService] 成功生成嵌入向量，维度:', embedding.length);
    console.log('[dbEmbeddingService] 嵌入向量样本 (前5个元素):', embedding.slice(0, 5));
    
    // 检查向量格式
    const isValidVector = Array.isArray(embedding) && embedding.length > 0 && 
                         embedding.every(val => typeof val === 'number' && !isNaN(val));
    
    if (!isValidVector) {
      console.error('[dbEmbeddingService] 生成的向量格式无效:', embedding);
      return false;
    }
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('[dbEmbeddingService] 无法创建Supabase客户端');
      return false;
    }
    
    console.log('[dbEmbeddingService] 开始调用Supabase RPC cache_query_embedding...');
    
    // 缓存到数据库
    const response = await supabase.rpc('cache_query_embedding', {
      query_text: query,
      query_vector: embedding
    });
    
    console.log('[dbEmbeddingService] Supabase RPC响应:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      console.error('[dbEmbeddingService] 缓存嵌入向量失败:', response.error);
      console.error('[dbEmbeddingService] 错误详情:', response.error.message);
      console.error('[dbEmbeddingService] 错误代码:', response.error.code);
      return false;
    }
    
    console.log('[dbEmbeddingService] 成功缓存嵌入向量到数据库');
    
    // 验证缓存是否成功
    const { data: cachedData, error: fetchError } = await supabase
      .from('query_embeddings_cache')
      .select('*')
      .eq('query', query)
      .single();
      
    if (fetchError) {
      console.error('[dbEmbeddingService] 验证缓存失败:', fetchError);
    } else {
      console.log('[dbEmbeddingService] 缓存验证结果:', cachedData ? '成功' : '未找到');
      if (cachedData) {
        console.log('[dbEmbeddingService] 缓存ID:', cachedData.id);
        console.log('[dbEmbeddingService] 缓存向量存在:', !!cachedData.embedding);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[dbEmbeddingService] 生成或缓存嵌入向量失败:', error);
    if (error instanceof Error) {
      console.error('[dbEmbeddingService] 错误详情:', error.message);
      console.error('[dbEmbeddingService] 堆栈跟踪:', error.stack);
    }
    return false;
  }
} 