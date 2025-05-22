import { NextResponse } from 'next/server';
import { fetchRecipes, getSupabaseClient } from '../../../utils/data/dataService';
import { logError } from '../../../utils';

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * 处理GET请求，返回菜谱数据
 * 直接使用统一的fetchRecipes函数
 */
export async function GET(request: Request) {
  // 检测是否在构建过程中
  const isSSG = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
  
  // 在构建过程中返回空数组，避免触发数据库查询
  if (isSSG) {
    console.log('API路由: 静态构建环境，跳过查询');
    return new NextResponse(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  try {
    console.log('API路由: 开始获取菜谱数据...');
    
    // 解析URL查询参数
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // 构建统一的过滤参数
    const filters = {
      searchQuery: searchParams.get('q') || '',
      requiredIngredients: searchParams.getAll('required'),
      optionalIngredients: searchParams.getAll('optional'),
      cuisines: searchParams.getAll('cuisine'),
      flavors: searchParams.getAll('flavor'),
      difficulties: searchParams.getAll('difficulty'),
      cookingMethods: searchParams.getAll('method'),
      dietaryRestrictions: searchParams.getAll('diet'),
    };
    
    // 构建统一的排序参数
    const sort = searchParams.has('sort') ? {
      field: searchParams.get('sort') || 'name',
      direction: (searchParams.get('order') === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
    } : undefined;
    
    // 构建分页对象
    const paginator = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 50,
    };
    
    // 调用统一的数据服务函数
    const { recipes, total, error } = await fetchRecipes({
      filters,
      sort,
      pagination: paginator,
      useCache: true,
      clearCache: Boolean(searchParams.get('nocache'))
    });
    
    if (error) {
      console.error('API路由: 数据获取错误:', error);
      logError('API', 'GET /api/recipes', error);
      
      return new NextResponse(JSON.stringify({ error }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // 获取总菜谱数量 - 从Supabase直接获取以确保准确性
    let totalCount = total || recipes.length;
    
    // 如果是第一页，并且没有total值，直接从数据库获取总数
    if (paginator.page === 1 && !total) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { count } = await supabase
            .from('CHrecipes')
            .select('*', { count: 'exact', head: true });
          
          if (count) {
            totalCount = count;
            console.log(`API路由: 直接获取菜谱总数: ${count}`);
          }
        }
      } catch (err) {
        console.error('获取总数失败:', err);
      }
    }
    
    // 计算分页信息
    const totalPages = Math.ceil(totalCount / paginator.limit);
    const hasMore = paginator.page < totalPages;
    
    console.log(`API路由: 成功获取数据，本页 ${recipes.length} 条，总共 ${totalCount} 条，共 ${totalPages} 页，当前第 ${paginator.page} 页，是否有更多: ${hasMore}`);
    
    // 返回数据和分页信息
    return new NextResponse(JSON.stringify({
      data: recipes,
      total: totalCount,
      page: paginator.page,
      limit: paginator.limit,
      totalPages,
      hasMore
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('API路由: 处理请求失败:', error);
    logError('API', 'GET /api/recipes', error instanceof Error ? error.message : String(error));
    
    return new NextResponse(JSON.stringify({
      error: '处理请求失败',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 