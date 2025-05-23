import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 环境变量
    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    const openaiProxy = process.env.OPENAI_PROXY || '';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // 检查API密钥
    if (!openaiApiKey) {
      console.error('[API/embedding/route] 缺少OpenAI API密钥');
      return NextResponse.json({
        success: false,
        error: '缺少OpenAI API密钥，请在环境变量中设置OPENAI_API_KEY'
      }, { status: 500 });
    }

    // 解析请求数据
    const requestData = await request.json();
    const { text } = requestData;

    if (!text || typeof text !== 'string') {
      console.warn('[API/embedding/route] 缺少文本参数或格式不正确');
      return NextResponse.json({
        success: false,
        error: '缺少文本参数或格式不正确'
      }, { status: 400 });
    }

    const normalizedText = text.trim().toLowerCase();
    console.log(`[API/embedding/route] 开始处理文本，标准化后长度: ${normalizedText.length}`);

    // 检查数据库缓存
    if (supabaseUrl && supabaseServiceKey) {
      try {
        console.log('[API/embedding/route] 检查数据库缓存...');
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });

        const { data: cachedData, error } = await supabase
          .rpc('get_cached_embedding', {
            p_query: normalizedText
          });

        if (!error && cachedData && cachedData.length > 0) {
          const cached = cachedData[0];
          if (cached.embedding) {
            let embedding: number[];
            
            // 处理不同格式的嵌入向量
            if (Array.isArray(cached.embedding)) {
              // 如果已经是数组，直接使用
              embedding = cached.embedding;
              console.log('[API/embedding/route] 找到数据库缓存（数组格式），维度:', embedding.length);
            } else if (typeof cached.embedding === 'string') {
              // 如果是字符串，尝试解析
              try {
                // 尝试直接JSON解析
                embedding = JSON.parse(cached.embedding);
                console.log('[API/embedding/route] 找到数据库缓存（字符串格式已解析），维度:', embedding.length);
              } catch (parseError) {
                // 如果JSON解析失败，可能是PostgreSQL向量格式
                try {
                  // PostgreSQL vector类型通常返回为 "[1,2,3,...]" 格式
                  const vectorStr = cached.embedding.toString();
                  if (vectorStr.startsWith('[') && vectorStr.endsWith(']')) {
                    embedding = JSON.parse(vectorStr);
                    console.log('[API/embedding/route] 找到数据库缓存（PostgreSQL向量格式已解析），维度:', embedding.length);
                  } else {
                    console.warn('[API/embedding/route] 无法解析向量字符串格式:', vectorStr.slice(0, 100));
                    embedding = null as any;
                  }
                } catch (vectorParseError) {
                  console.error('[API/embedding/route] 解析向量字符串失败:', vectorParseError);
                  embedding = null as any;
                }
              }
            } else {
              console.warn('[API/embedding/route] 未知的嵌入向量格式');
              embedding = null as any;
            }
            
            // 验证解析结果
            if (embedding && Array.isArray(embedding) && embedding.length > 0) {
              console.log('[API/embedding/route] 缓存向量有效，返回缓存结果');
              
              return NextResponse.json({
                success: true,
                embedding: embedding,
                dimension: embedding.length,
                cached: true
              });
            } else {
              console.warn('[API/embedding/route] 解析后的向量无效或为空，将生成新向量');
            }
          }
        } else {
          console.log('[API/embedding/route] 数据库缓存中未找到该查询，将生成新向量');
        }
      } catch (cacheError) {
        console.warn('[API/embedding/route] 查询数据库缓存失败，继续生成新向量:', cacheError);
      }
    } else {
      console.warn('[API/embedding/route] Supabase配置不完整，跳过缓存检查');
    }

    console.log('[API/embedding/route] 开始调用OpenAI API生成新的嵌入向量...');
    console.log('[API/embedding/route] OpenAI代理状态:', openaiProxy ? `已配置 (${openaiProxy})` : '未配置');

    // 创建OpenAI客户端配置
    const config: any = { apiKey: openaiApiKey }; // 使用 any 类型
    
    // 添加代理配置
    if (openaiProxy) {
      console.log('[API/embedding/route] 使用代理:', openaiProxy);
      const agent = new HttpsProxyAgent(openaiProxy);
      config.httpAgent = agent;
    } else {
      console.log('[API/embedding/route] 不使用代理');
    }

    const openai = new OpenAI(config);

    // 生成嵌入向量
    console.log('[API/embedding/route] 调用OpenAI API生成嵌入向量...');
    const startTime = Date.now();

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: normalizedText,
      encoding_format: 'float',
    });

    const endTime = Date.now();
    console.log(`[API/embedding/route] API调用耗时: ${endTime - startTime}ms`);

    if (!response || !response.data || !response.data[0] || !response.data[0].embedding) {
      console.error('[API/embedding/route] API响应无效:', response);
      return NextResponse.json({
        success: false,
        error: 'OpenAI API响应无效，无法获取嵌入向量'
      }, { status: 500 });
    }

    const embedding = response.data[0].embedding;
    console.log(`[API/embedding/route] 成功获取嵌入向量，维度: ${embedding.length}`);

    // 尝试缓存到数据库
    if (supabaseUrl && supabaseServiceKey) {
      try {
        console.log('[API/embedding/route] 缓存新生成的向量到数据库...');
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });

        const { error: cacheError } = await supabase.rpc('cache_query_embedding', {
          query_text: normalizedText,
          query_vector: embedding
        });

        if (cacheError) {
          console.warn('[API/embedding/route] 缓存到数据库失败:', cacheError.message);
        } else {
          console.log('[API/embedding/route] 成功缓存到数据库');
        }
      } catch (dbCacheError) {
        console.warn('[API/embedding/route] 数据库缓存过程中发生错误:', dbCacheError);
      }
    }

    return NextResponse.json({
      success: true,
      embedding: embedding,
      dimension: embedding.length,
      cached: false
    });
  } catch (error) {
    console.error('[API/embedding/route] 生成嵌入向量失败:', error);
    
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
      if ((error as any).cause) {
        console.error('[API/embedding/route] 错误原因(cause):', (error as any).cause);
        errorMessage += ` (Cause: ${(error as any).cause.code || (error as any).cause.message || 'N/A'})`;
      }
      console.error('[API/embedding/route] 错误堆栈:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: `生成嵌入向量失败: ${errorMessage}`
    }, { status: 500 });
  }
}

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic'; 