import { NextResponse } from 'next/server';
import { supabase, getSupabaseClient } from '../../../utils/data/dataService';

/**
 * API端点用于诊断Supabase连接问题
 */
export async function GET() {
  try {
    // 获取客户端实例，确保非空
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      throw new Error('无法获取Supabase客户端');
    }
    
    // 尝试连接Supabase并查询一些基本数据
    const { data, error } = await supabaseClient
      .from('CHrecipes')
      .select('id, 菜名')
      .limit(1);
    
    if (error) {
      console.error('API测试连接失败:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '连接成功',
      data: data ? { recordCount: data.length } : { recordCount: 0 }
    });
  } catch (error) {
    console.error('API测试连接异常:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 