import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // 环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // 检查Supabase配置
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: '缺少Supabase配置，请确保NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY环境变量已设置'
      }, { status: 500 });
    }

    console.log('[API/embedding/get-cache] 开始获取缓存数据');

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 获取缓存数据
    const { data, error } = await supabase
      .from('query_embeddings_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[API/embedding/get-cache] 获取缓存数据失败:', error);
      return NextResponse.json({
        error: `获取缓存数据失败: ${error.message}`
      }, { status: 500 });
    }

    console.log(`[API/embedding/get-cache] 成功获取${data.length}条缓存数据`);
    
    // 检查嵌入向量是否为空
    const emptyEmbeddings = data.filter(item => !item.embedding || (Array.isArray(item.embedding) && item.embedding.length === 0)).length;
    if (emptyEmbeddings > 0) {
      console.warn(`[API/embedding/get-cache] 警告: 有${emptyEmbeddings}条记录的嵌入向量为空`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API/embedding/get-cache] 获取缓存数据失败:', error);
    
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[API/embedding/get-cache] 错误详情:', error.stack);
    }
    
    return NextResponse.json({
      error: `获取缓存数据失败: ${errorMessage}`
    }, { status: 500 });
  }
}

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic'; 