import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchRecipeById } from '../../../../utils';

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * 获取单个菜谱详情API
 * 根据ID获取菜谱完整信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: '缺少菜谱ID' }, { status: 400 });
    }
    
    console.log(`[GET /api/recipes/${id}] 获取菜谱详情`);
    
    // 使用统一的数据获取函数
    const { recipe, error } = await fetchRecipeById(id);
    
    if (error) {
      console.error(`获取菜谱详情失败，ID=${id}:`, error);
      return NextResponse.json({ error: `获取菜谱详情失败: ${error}` }, { status: 500 });
    }
    
    if (!recipe) {
      console.log(`[GET /api/recipes/${id}] 未找到菜谱`);
      return NextResponse.json({ error: '未找到菜谱' }, { status: 404 });
    }
    
    console.log(`[GET /api/recipes/${id}] 成功获取菜谱: ${recipe.name}`);
    
    // 返回菜谱数据
    return new NextResponse(JSON.stringify(recipe), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'max-age=60'
      }
    });
  } catch (error) {
    console.error('菜谱详情API错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/**
 * 处理OPTIONS请求，用于CORS预检
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