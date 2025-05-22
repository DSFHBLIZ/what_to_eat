import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// 初始化Supabase客户端（使用硬编码的值）
const supabaseUrl = 'https://ijwimydlumbolmpnmezt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqd2lteWRsdW1ib2xtcG5tZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NjExMDUsImV4cCI6MjA1ODAzNzEwNX0.ynhuFYG6dkoxDgEyDwEnWdZ-DRWx3illLZGyYwn_UnA';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 获取随机菜谱API
 * 支持通过cuisine参数筛选菜系
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析筛选参数
    const cuisine = searchParams.get('cuisine') || null;
    
    console.log(`[random API] 请求参数: cuisine=${cuisine}`);
    
    // 根据是否指定菜系构建查询
    let query = supabase.from('CHrecipes').select('id, 菜名');
    
    if (cuisine) {
      // 如果指定了菜系，添加筛选条件
      query = query.eq('菜系', cuisine);
    }
    
    // 获取所有菜谱ID
    const { data: recipes, error } = await query;
    
    if (error) {
      console.error('获取菜谱失败:', error);
      return NextResponse.json({ error: '获取菜谱失败' }, { status: 500 });
    }
    
    if (!recipes || recipes.length === 0) {
      console.log('[random API] 未找到符合条件的菜谱');
      return NextResponse.json({ error: '未找到符合条件的菜谱' }, { status: 404 });
    }
    
    console.log(`[random API] 找到${recipes.length}个菜谱`);
    
    // 从结果中随机选择一个菜谱
    const randomIndex = Math.floor(Math.random() * recipes.length);
    const randomRecipe = recipes[randomIndex] as Record<string, any>;
    
    console.log(`[random API] 随机选择:`, randomRecipe);
    
    if (!randomRecipe) {
      throw new Error('无效的菜谱数据');
    }
    
    // 构建响应对象，确保数据格式正确
    const responseData = {
      id: randomRecipe['id'] || '',
      菜名: randomRecipe['菜名'] || '未知菜名'
    };
    
    // 使用正确的Content-Type确保UTF-8编码
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('随机菜谱API错误:', error);
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