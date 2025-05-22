import { NextRequest, NextResponse } from 'next/server';
import { Recipe } from '../../../../types/recipe';
import { fetchRecipes, searchRecipes, getSupabaseClient } from '../../../../utils/data/dataService';
import { logError } from '../../../../utils/common/errorLogger';
import { generateEmbedding } from '../../../../../lib/services/embeddingService';

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic';
// 修改runtime配置，从edge改为nodejs
export const runtime = 'nodejs';

// 定义接口，用于统一参数类型
interface SearchRecipeParams {
  searchQuery: string;
  requiredIngredients: string[];
  optionalIngredients: string[];
  avoidIngredients: string[];
  cuisines: string[];
  flavors: string[];
  difficulties: string[];
  dietaryRestrictions: string[];
  tagLogic: string;
  page: number;
  limit: number;
  requestId: string;
}

/**
 * 处理GET请求，返回搜索结果
 * 支持分页功能，默认每页返回50条记录
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API: 搜索菜谱，接收到请求');
    console.log('API: 请求URL:', request.url);
    
    // 验证Supabase环境变量是否配置
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('API: 缺少Supabase环境变量配置');
      console.error('API: NEXT_PUBLIC_SUPABASE_URL =', process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置');
      console.error('API: NEXT_PUBLIC_SUPABASE_ANON_KEY =', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置');
      return NextResponse.json(
        { error: '服务器配置错误，请联系管理员' },
        { status: 500 }
      );
    }
    
    console.log('API: Supabase环境变量已确认配置');
    console.log('API: 当前Node环境:', process.env.NODE_ENV);
    
    const searchParams = request.nextUrl.searchParams;
    
    // 优化: 一次性获取URLSearchParams对象，避免重复解析
    // 修复：使用稳定的请求ID跟踪每次搜索请求
    const requestId = `api-search-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
    
    // 简化的参数获取函数，使用统一参数结构
    const getValidParams = (searchParams: URLSearchParams): SearchRecipeParams => {
      // 获取搜索关键词
      const searchQuery = searchParams.get('q') || searchParams.get('query') || '';
      
      // 获取分页参数
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const tagLogic = searchParams.get('tagLogic') || 'OR';
      
      // 提取数组类型参数的辅助函数
      const getArrayParam = (paramName: string): string[] => {
        // 尝试获取多个值
        const values = searchParams.getAll(paramName);
        if (values && values.length > 0) {
          return values.map(v => v.trim()).filter(Boolean);
        }
        
        // 尝试获取单个值，可能是逗号分隔的列表
        const singleValue = searchParams.get(paramName);
        if (singleValue) {
          // 检查是否包含逗号，如果有则拆分
          if (singleValue.includes(',')) {
            return singleValue.split(',').map(v => v.trim()).filter(Boolean);
          }
          return [singleValue.trim()].filter(Boolean);
        }
        
        return [];
      };
      
      // 统一获取所有数组类型参数
      return {
        searchQuery: searchQuery.trim(),
        requiredIngredients: getArrayParam('requiredIngredient'),
        optionalIngredients: getArrayParam('optionalIngredient'),
        avoidIngredients: getArrayParam('avoid'),
        cuisines: getArrayParam('cuisine'),
        flavors: getArrayParam('flavor'),
        difficulties: getArrayParam('difficulty'),
        dietaryRestrictions: getArrayParam('dietary'),
        tagLogic,
        page,
        limit,
        requestId
      };
    };
    
    // 获取所有参数
    const searchParamsObj = getValidParams(searchParams);
    
    console.log(`API: 搜索参数 [${requestId}]:`, JSON.stringify(searchParamsObj, null, 2));
    
    // 添加调试信息 - 记录必选食材
    if (searchParamsObj.requiredIngredients.length > 0) {
      console.log(`API: 详细跟踪必选食材 [${requestId}]:`);
      searchParamsObj.requiredIngredients.forEach((ing, idx) => {
        console.log(`  ${idx+1}. "${ing}" (${typeof ing}, 长度: ${ing.length})`);
      });
    }
    
    console.log('API: 开始查询数据库...');
    
    // 获取参数后，为搜索查询生成嵌入向量
    let queryEmbedding = null;
    if (searchParamsObj.searchQuery) {
      try {
        // 生成查询的嵌入向量
        queryEmbedding = await generateEmbedding(searchParamsObj.searchQuery);
        console.log(`API: 成功为查询"${searchParamsObj.searchQuery}"生成嵌入向量`);
        
        // 尝试缓存嵌入向量 - 通过API端点
        // 这里在服务器端，所以需要进行额外的处理来调用API
        try {
          // 创建Supabase客户端
          const supabase = getSupabaseClient();
          if (supabase) {
            console.log(`API: 尝试缓存查询"${searchParamsObj.searchQuery}"的嵌入向量`);
            
            // 直接使用服务端的RPC调用，更可靠
            const { error: rpcError } = await supabase.rpc('cache_query_embedding', {
              query_text: searchParamsObj.searchQuery,
              query_vector: queryEmbedding
            });
            
            if (rpcError) {
              console.warn(`API: 缓存嵌入向量失败，但继续搜索:`, rpcError.message);
            } else {
              console.log(`API: 成功缓存嵌入向量`);
            }
          }
        } catch (cacheError) {
          console.error(`API: 缓存嵌入向量过程中发生错误:`, cacheError);
          // 不阻止搜索流程继续
        }
      } catch (error) {
        console.error('API: 生成嵌入向量失败:', error);
      }
    }
    
    try {
      // 修改searchRecipes调用，添加嵌入向量参数
      const { recipes, total, error } = await searchRecipes({
        searchQuery: searchParamsObj.searchQuery,
        requiredIngredients: searchParamsObj.requiredIngredients,
        optionalIngredients: searchParamsObj.optionalIngredients,
        cuisines: searchParamsObj.cuisines,
        flavors: searchParamsObj.flavors,
        difficulties: searchParamsObj.difficulties,
        dietaryRestrictions: searchParamsObj.dietaryRestrictions,
        avoidIngredients: searchParamsObj.avoidIngredients,
        page: searchParamsObj.page,
        pageSize: searchParamsObj.limit,
        sortField: 'relevance_score',
        sortDirection: 'desc',
        queryEmbedding,
        enableSemanticSearch: !!queryEmbedding
      });
      
      if (error) {
        console.error(`API: 搜索失败:`, error);
        throw new Error(error);
      }
      
      // 添加分页元数据
      const totalPages = total ? Math.ceil(total / searchParamsObj.limit) : 1;
      const hasNextPage = searchParamsObj.page < totalPages;
      const hasPrevPage = searchParamsObj.page > 1;
      
      console.log(`API: 搜索完成，找到 ${recipes.length} 个结果，总数：${total || recipes.length}`);
      
      // 返回搜索结果和分页信息
      return NextResponse.json({
        recipes,
        pagination: {
          page: searchParamsObj.page,
          limit: searchParamsObj.limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      });
    } catch (searchError) {
      console.error(`API: 搜索菜谱时出错:`, searchError);
      
      // 记录详细错误日志
      const errorLog = {
        statusCode: 500,
        message: '搜索失败',
        details: searchError instanceof Error ? searchError.message : String(searchError),
        timestamp: new Date().toISOString(),
        stack: searchError instanceof Error ? searchError.stack : undefined
      };
      
      console.error(`API: 错误日志:`, JSON.stringify(errorLog, null, 2));
      
      // 返回友好的错误信息
      return NextResponse.json(
        { 
          error: '搜索失败，请稍后重试或尝试简化搜索条件', 
          details: searchError instanceof Error ? searchError.message : '处理请求时出错'
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    console.error(`API: 搜索菜谱时出错 [${requestId}]:`, error);
    
    // 捕获特定的错误类型
    let statusCode = 500;
    let errorMessage = '搜索失败';
    let details = error instanceof Error ? error.message : String(error);
    
    if (error instanceof Error) {
      // 检查常见错误类型
      if (error.message.includes('too many connections')) {
        statusCode = 503;
        errorMessage = '数据库连接数过多，请稍后再试';
      } else if (error.message.includes('timed out')) {
        statusCode = 504;
        errorMessage = '数据库查询超时，请简化搜索条件';
      } else if (error.message.toLowerCase().includes('syntax') ||
                error.message.toLowerCase().includes('token') ||
                error.message.toLowerCase().includes('flavor') || 
                error.message.toLowerCase().includes('口味') ||
                error.message.toLowerCase().includes('invalid input') ||
                error.message.toLowerCase().includes('difficulty') ||
                error.message.toLowerCase().includes('难度') ||
                error.message.toLowerCase().includes('dietary') ||
                error.message.toLowerCase().includes('饮食限制')) {
        // 统一的筛选参数错误处理
        statusCode = 400;
        errorMessage = '筛选参数格式错误，请检查筛选条件';
      }
    }
    
    // 记录详细错误信息
    const errorLog = {
      statusCode,
      message: errorMessage,
      details,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    };
    
    console.error(`API: 错误日志 [${requestId}]:`, JSON.stringify(errorLog, null, 2));
    
    return NextResponse.json(
      { error: errorMessage, message: details, code: statusCode, requestId }, 
      { status: statusCode }
    );
  }
}

/**
 * 处理OPTIONS请求，支持CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 