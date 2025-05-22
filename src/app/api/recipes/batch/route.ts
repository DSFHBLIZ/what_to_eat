import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Recipe } from '../../../../types/recipe';
import { getSupabaseClient } from '../../../../utils/data/dataService';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const { ids } = await request.json();
    console.log('[批量获取API] 收到请求，待获取ID:', ids?.length || 0);
    
    // 验证ID数组
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.error('[批量获取API] 缺少有效的菜谱ID数组');
      return NextResponse.json(
        { error: '请提供有效的菜谱ID数组' },
        { status: 400 }
      );
    }
    
    // 获取Supabase客户端
    const supabase = await getSupabaseClient();
    
    if (!supabase) {
      console.error('[批量获取API] 无法初始化Supabase客户端');
      return NextResponse.json(
        { error: '服务器内部错误' },
        { status: 500 }
      );
    }
    
    // 查询数据库获取菜谱
    console.log(`[批量获取API] 查询${ids.length}个菜谱`);
    
    // 使用IN操作符一次查询所有ID
    const { data: recipes, error } = await supabase
      .from('菜谱')
      .select('*')
      .in('id', ids);
    
    if (error) {
      console.error('[批量获取API] 数据库查询错误:', error);
      return NextResponse.json(
        { error: '查询数据库时出错' },
        { status: 500 }
      );
    }
    
    if (!recipes || recipes.length === 0) {
      console.log('[批量获取API] 未找到匹配的菜谱');
      return NextResponse.json(
        { recipes: [] },
        { status: 200 }
      );
    }
    
    console.log(`[批量获取API] 成功获取${recipes.length}个菜谱`);
    
    // 返回查询结果
    return NextResponse.json(
      { recipes },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('[批量获取API] 处理请求时出错:', error);
    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    );
  }
} 