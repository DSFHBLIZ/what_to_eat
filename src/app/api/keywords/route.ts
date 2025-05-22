import { NextResponse } from 'next/server';
import { supabase, getSupabaseClient, logError } from '../../../utils';

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// 定义API响应类型
interface ApiErrorResponse {
  error: string;
  details?: string;
}

/**
 * 处理GET请求，根据搜索词返回关键词建议
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    console.log(`API路由: 正在搜索关键词建议，搜索词: "${query}"`);
    
    // 在静态构建时或者没有搜索词时，返回空数组
    if (!query || process.env.NODE_ENV === 'production') {
      return new NextResponse(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // 获取客户端实例，确保非空
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      throw new Error('无法获取Supabase客户端');
    }
    
    // 搜索关键词表 - 将表名从'keywords'改为'keyword'
    const { data, error } = await supabaseClient
      .from('keyword')
      .select('*')
      .ilike('keyword', `%${query}%`)
      .limit(10);
    
    if (error) {
      console.error('API路由: 搜索关键词错误:', error);
      logError('API', '搜索关键词', error.message);
      const errorResponse: ApiErrorResponse = { 
        error: `关键词搜索失败: ${error.message}` 
      };
      
      return new NextResponse(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    if (!data || data.length === 0) {
      console.log('API路由: 关键词建议搜索无结果');
      return new NextResponse(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    console.log(`API路由: 成功获取关键词建议，共 ${data.length} 条`);
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('API路由: 处理关键词搜索请求时出错:', error);
    logError('API', '处理关键词搜索请求', error instanceof Error ? error.message : String(error));
    
    const errorResponse: ApiErrorResponse = { 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : String(error)
    };
    
    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

/**
 * 处理OPTIONS请求，支持CORS预检
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 