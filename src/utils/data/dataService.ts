import { createClient } from '@supabase/supabase-js';
import { Recipe } from '../../types/recipe';
import { dbRecordToFrontendModel, dbRecipesToFrontendModels, DbRecipe } from './dataMapper';
import { logError } from '../common/errorLogger';
import { ensureArray } from '../common/typeChecks';
import { IngredientTag } from '../../types/search';
import { searchIngredientsAndSeasonings } from '../recipe/searchService';
import { SEMANTIC_SEARCH_THRESHOLDS, TRGM_SIMILARITY_THRESHOLD, SEARCH_CONFIG } from './searchConfig';

// ======== Supabase客户端部分 ========

// Supabase 连接信息
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 单例模式保证全局唯一客户端实例
let supabaseInstance: ReturnType<typeof createClient> | null = null;
const STORAGE_KEY = 'whattoeat-supabase-auth';

// 检测运行环境
const isSSG = false;
const isClient = typeof window !== 'undefined';

/**
 * 获取Supabase客户端实例(单例模式)
 */
export function getSupabaseClient() {
  // 如果已经有实例，直接返回
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  if (isSSG) {
    // 在静态构建过程中返回模拟的客户端
    supabaseInstance = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
            execute: async () => ({ data: [], error: null }),
          }),
          in: () => ({
            execute: async () => ({ data: [], error: null }),
          }),
          limit: () => ({
            range: () => ({
              execute: async () => ({ data: [], error: null, count: 0 }),
            }),
            execute: async () => ({ data: [], error: null }),
          }),
          range: () => ({
            execute: async () => ({ data: [], error: null }),
          }),
          filter: () => ({
            execute: async () => ({ data: [], error: null }),
          }),
          execute: async () => ({ data: [], error: null, count: 0 }),
          textSearch: () => ({
            execute: async () => ({ data: [], error: null }),
          }),
        }),
      }),
      rpc: () => ({
        execute: async () => ({ data: null, error: null }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as any;
  } else {
    try {
      // 确保环境变量存在
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[getSupabaseClient] Supabase环境变量未配置！');
        console.error('NEXT_PUBLIC_SUPABASE_URL: ' + (supabaseUrl ? '已设置' : '未设置'));
        console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY: ' + (supabaseAnonKey ? '已设置' : '未设置'));
        
        logError('dataService', 'getSupabaseClient', 'Supabase环境变量未配置，请检查.env.local文件或部署环境变量');
        return null;
      }
      
      // 创建客户端，添加超时和错误处理配置
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storageKey: STORAGE_KEY,
          detectSessionInUrl: false
        },
        global: {
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(30000),
            }).catch(error => {
              logError('dataService', 'getSupabaseClient.fetch', `Supabase请求错误: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            });
          }
        }
      });
    } catch (error) {
      console.error('[getSupabaseClient] 创建Supabase客户端失败:', error);
      logError('dataService', 'getSupabaseClient', `创建Supabase客户端失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  return supabaseInstance;
}

// 导出一个默认实例方便使用
export const supabase = getSupabaseClient();

// ======== 数据访问层 ========

// 跟踪最新的食材搜索请求ID
let currentIngredientSearchId = 0;

// 标准化的过滤条件接口
export interface FilterCriteria {
  searchQuery?: string;
  requiredIngredients?: string[];
  optionalIngredients?: string[];
  cuisines?: string[];
  flavors?: string[];
  difficulties?: string[];
  cookingMethods?: string[];
  dietaryRestrictions?: string[];
  requiredSeasonings?: string[];
  optionalSeasonings?: string[];
  tagLogic?: 'AND' | 'OR';
}

// 标准化的排序选项
export interface SortOptions {
  field?: string;
  direction?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export const DEFAULT_SORT_OPTIONS: SortOptions = {
  field: 'created_at',
  direction: 'desc',
  limit: 100000,
  page: 1,
};

// 标准化的分页选项
export interface PaginationOptions {
  page: number;
  limit: number;
}

// 统一的获取菜谱选项接口
export interface FetchRecipesOptions {
  filters?: FilterCriteria;
  sort?: SortOptions;
  pagination?: PaginationOptions;
  useCache?: boolean;
  clearCache?: boolean;
}

// 扩展Recipe类型，添加相关性分数属性
export interface RecipeWithScore extends Recipe {
  relevanceScore?: number;
}

// ======== 核心数据访问函数 ========

/**
 * 根据ID获取单个菜谱
 */
export async function fetchRecipeById(id: string): Promise<{
  recipe: Recipe | null;
  error?: string;
}> {
  try {
    if (!id || typeof id !== 'string') {
      console.error('无效的菜谱ID:', id);
      return { recipe: null, error: '无效的菜谱ID' };
    }
    
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      throw new Error('Supabase客户端未初始化');
    }
    
    const { data, error } = await supabase
      .from('CHrecipes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('获取菜谱详情失败:', error);
      throw new Error(`获取菜谱详情失败: ${error.message}`);
    }
    
    if (!data) {
      console.warn(`未找到ID为${id}的菜谱`);
      return { recipe: null };
    }
    
    try {
      // 直接使用单条记录转换函数，避免额外的数组包装
      const recipe = dbRecordToFrontendModel(data as DbRecipe);
      return { recipe };
    } catch (conversionError) {
      console.error('菜谱数据转换失败:', conversionError);
      throw new Error('菜谱数据格式错误');
    }
  } catch (error) {
    console.error('fetchRecipeById失败:', error);
    return { 
      recipe: null, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
}

// 保留原函数签名，内部实现调用searchRecipes
export async function fetchRecipes(options: FetchRecipesOptions = {}): Promise<{
  recipes: Recipe[];
  total?: number;
  error?: string;
}> {
  console.warn('fetchRecipes函数已弃用，请直接使用searchRecipes函数');
  const { filters, sort, pagination } = options;
  
  // 简单地调用searchRecipes函数，不进行额外处理
  return searchRecipes({
    searchQuery: filters?.searchQuery,
    requiredIngredients: filters?.requiredIngredients,
    optionalIngredients: filters?.optionalIngredients,
    cuisines: filters?.cuisines,
    flavors: filters?.flavors,
    difficulties: filters?.difficulties,
    dietaryRestrictions: filters?.dietaryRestrictions,
    page: pagination?.page || 1,
    pageSize: pagination?.limit || 20,
    sortField: sort?.field || 'created_at',
    sortDirection: sort?.direction || 'desc',
    semanticSimilarityThreshold: SEMANTIC_SEARCH_THRESHOLDS.DEFAULT // 使用统一的常量
  });
}

/**
 * 根据食材搜索菜谱
 */
export async function searchRecipesByIngredients({
  requiredIngredients = [],
  optionalIngredients = [],
  requiredSeasonings = [],
  optionalSeasonings = [],
  semanticSimilarityThreshold = SEMANTIC_SEARCH_THRESHOLDS.DEFAULT // 使用统一的常量
}: {
  requiredIngredients?: string[];
  optionalIngredients?: string[];
  requiredSeasonings?: string[];
  optionalSeasonings?: string[];
  semanticSimilarityThreshold?: number;
}): Promise<Recipe[]> {
  // 使用统一的searchRecipes函数
  const { recipes } = await searchRecipes({
    // 直接合并食材和调料
    requiredIngredients: [...requiredIngredients, ...requiredSeasonings],
    optionalIngredients: [...optionalIngredients, ...optionalSeasonings],
    cuisines: [],
    flavors: [],
    difficulties: [],
    dietaryRestrictions: [],
    avoidIngredients: [],
    page: 1,
    pageSize: 10000,
    sortField: 'relevance_score',
    sortDirection: 'desc',
    queryEmbedding: null,
    enableSemanticSearch: false,
    semanticSimilarityThreshold
  });
  
  return recipes;
}

/**
 * 使用Supabase查询函数进行搜索
 * 直接调用search_recipes存储过程
 */
export async function searchRecipes({
  searchQuery = '',
  requiredIngredients = [],
  optionalIngredients = [],
  cuisines = [],
  flavors = [],
  difficulties = [],
  dietaryRestrictions = [],
  avoidIngredients = [],
  page = 1,
  pageSize = 20,
  sortField = '菜名',
  sortDirection = 'asc',
  queryEmbedding = null,
  enableSemanticSearch = false,
  semanticSimilarityThreshold = SEMANTIC_SEARCH_THRESHOLDS.DEFAULT // 默认使用配置中的DEFAULT阈值
}: {
  searchQuery?: string;
  requiredIngredients?: string[] | IngredientTag[];
  optionalIngredients?: string[] | IngredientTag[];
  cuisines?: string[];
  flavors?: string[];
  difficulties?: string[];
  dietaryRestrictions?: string[];
  avoidIngredients?: string[] | IngredientTag[];
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  queryEmbedding?: number[] | null;
  enableSemanticSearch?: boolean;
  semanticSimilarityThreshold?: number;
}): Promise<{
  recipes: Recipe[];
  total?: number;
  error?: string;
}> {
  console.log('================== 开始菜谱搜索 ==================');
  console.log('searchRecipes: 搜索参数', {
    searchQuery,
    requiredIngredients: Array.isArray(requiredIngredients) ? requiredIngredients.map(i => typeof i === 'string' ? i : i.tag) : requiredIngredients,
    optionalIngredients: Array.isArray(optionalIngredients) ? optionalIngredients.map(i => typeof i === 'string' ? i : i.tag) : optionalIngredients,
    avoidIngredients: Array.isArray(avoidIngredients) ? avoidIngredients.map(i => typeof i === 'string' ? i : i.tag) : avoidIngredients,
    cuisines,
    flavors,
    difficulties,
    dietaryRestrictions,
    sortField,
    sortDirection
  });
  
  console.log('searchRecipes: 检查环境变量');
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '已设置' : '未设置');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置');
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('searchRecipes: Supabase客户端初始化失败');
    return { recipes: [], total: 0, error: 'Supabase client not initialized' };
  }
  
  console.log('searchRecipes: Supabase客户端初始化成功');

  try {
    // 验证并规范化参数
    const validatedPage = Math.max(1, page || 1);
    const validatedPageSize = Math.max(1, pageSize || 20);

    // 提取标签（适用于 IngredientTag 类型或字符串数组）
    const extractTags = (items: string[] | IngredientTag[] | undefined): string[] => {
      if (!items) return [];
      return items.map(item => (typeof item === 'string' ? item : item.tag));
    };

    // 处理食材参数
    const finalRequiredIngredients = extractTags(requiredIngredients);
    const finalOptionalIngredients = extractTags(optionalIngredients);
    const finalAvoidIngredients = extractTags(avoidIngredients);
    
    // 处理搜索关键词
    const finalSearchQuery = searchQuery || '';
    
    // 处理排序字段
    const sortFieldMapping: Record<string, string> = {
      name: '菜名',
      cuisine: '菜系',
      difficulty: '烹饪难度',
      created_at: 'created_at',
      updated_at: 'updated_at',
      relevance: 'relevance_score',
      relevance_score: 'relevance_score',
      '菜名': '菜名'
    };
    
    let mappedSortField = sortFieldMapping[sortField] || '菜名';
    
    // 特殊排序处理逻辑
    if (!finalSearchQuery && 
        finalRequiredIngredients.length === 0 && 
        finalOptionalIngredients.length === 0 && 
        ensureArray(cuisines).length === 0 &&
        ensureArray(flavors).length === 0 &&
        mappedSortField === 'relevance_score') {
      mappedSortField = '菜名';
    }

    // 提取出具体的语义搜索阈值 - 从配置中获取，确保SQL函数不依赖任何默认值
    const forbiddenIngredientsThreshold = SEMANTIC_SEARCH_THRESHOLDS.FORBIDDEN_INGREDIENTS;
    const requiredIngredientsThreshold = SEMANTIC_SEARCH_THRESHOLDS.REQUIRED_INGREDIENTS;
    const generalSearchThreshold = SEMANTIC_SEARCH_THRESHOLDS.GENERAL_SEARCH;
    
    // 确保使用配置中的阈值，同时保留函数参数中的值作为总体控制
    const effectiveThreshold = semanticSimilarityThreshold || SEMANTIC_SEARCH_THRESHOLDS.DEFAULT;
    
    // 日志记录所有使用的阈值，以便调试
    console.log('searchRecipes: 使用的语义搜索阈值:', {
      effectiveThreshold,
      forbiddenIngredientsThreshold,
      requiredIngredientsThreshold,
      generalSearchThreshold,
      trgmSimilarityThreshold: TRGM_SIMILARITY_THRESHOLD
    });
    
    // 组装 RPC 参数
    const requiredIngredientsArray = finalRequiredIngredients.map(i => i.toString());
    const optionalIngredientsArray = finalOptionalIngredients.map(i => i.toString());
    const forbiddenIngredientsArray = finalAvoidIngredients.map(i => i.toString());
    
    // 检查是否有可能启用语义搜索
    const canUseSemanticSearch = finalSearchQuery.length > 0 || finalRequiredIngredients.length > 0;
    console.log('searchRecipes: 是否适合语义搜索:', canUseSemanticSearch);
    console.log('searchRecipes: 查询文本:', finalSearchQuery);
    console.log('searchRecipes: 必选食材:', finalRequiredIngredients);
    
    // 检查OpenAI API密钥是否设置
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    console.log('searchRecipes: OpenAI API密钥状态:', hasOpenAIKey ? '已设置，可启用语义搜索' : '未设置，将使用传统搜索');
    
    // 检查是否提供了查询嵌入向量
    console.log('searchRecipes: 是否提供了查询嵌入向量:', queryEmbedding ? '是' : '否');
    console.log('searchRecipes: enableSemanticSearch参数:', enableSemanticSearch);
    
    // 最终决定是否启用语义搜索
    const finalEnableSemanticSearch = hasOpenAIKey && canUseSemanticSearch && enableSemanticSearch;
    console.log('searchRecipes: 最终决定是否启用语义搜索:', finalEnableSemanticSearch);
    
    // 如果启用语义搜索并有嵌入向量，直接设置RPC参数
    if (finalEnableSemanticSearch && queryEmbedding) {
      console.log('searchRecipes: 启用语义搜索，嵌入向量已生成');
    } else {
      console.log('searchRecipes: 不启用语义搜索或未提供嵌入向量');
    }
    
    // 优化RPC参数，减少不必要的开销
    const rpcParams = {
      search_query: searchQuery || '',
      required_ingredients: requiredIngredientsArray,
      optional_ingredients: optionalIngredientsArray,
      optional_condiments: [],
      dish_name_keywords: [],
      cuisines: cuisines || [],
      flavors: flavors || [],
      difficulties: difficulties || [],
      dietary_restrictions: dietaryRestrictions || [],
      required_ingredient_categories: [],
      optional_ingredient_categories: [],
      required_condiment_categories: [],
      optional_condiment_categories: [],
      forbidden_ingredients: forbiddenIngredientsArray,
      page: page,
      page_size: Math.min(pageSize, 50), // 限制最大页面大小
      sort_field: sortField,
      sort_direction: sortDirection.toUpperCase(),
      return_all_results: false,
      debug_mode: false, // 关闭调试模式提高性能
      stabilize_results: false, // 关闭结果稳定化提高性能
      trgm_similarity_threshold: SEMANTIC_SEARCH_THRESHOLDS.RELAXED, // 使用较宽松的阈值
      preview_mode: false,
      preview_page_count: 1,
      enable_semantic_search: finalEnableSemanticSearch,
      semantic_threshold: SEMANTIC_SEARCH_THRESHOLDS.DEFAULT,
      forbidden_ingredients_threshold: SEMANTIC_SEARCH_THRESHOLDS.STRICT,
      required_ingredients_threshold: SEMANTIC_SEARCH_THRESHOLDS.REQUIRED_INGREDIENTS,
      general_search_threshold: SEMANTIC_SEARCH_THRESHOLDS.DEFAULT
    };

    // 记录最终的RPC参数
    console.log('searchRecipes: RPC参数', JSON.stringify(rpcParams, null, 2));
    
    // 直接调用 Supabase RPC
    console.log('searchRecipes: 开始调用Supabase RPC函数search_recipes，传递所有语义搜索阈值...');
    const startTime = Date.now();
    const { data, error } = await supabase.rpc('search_recipes', rpcParams);
    const endTime = Date.now();
    console.log(`searchRecipes: RPC调用完成，耗时 ${endTime - startTime}ms`);

    if (error) {
      console.error('searchRecipes: 从RPC获取数据失败:', error);
      console.error('searchRecipes: 错误详情:', JSON.stringify(error, null, 2));
      throw new Error(`数据库查询失败: ${error.message || JSON.stringify(error)}`);
    }
    
    if (!data) {
      console.log('searchRecipes: RPC返回空数据');
      return { recipes: [], total: 0 };
    }
    
    console.log(`searchRecipes: RPC返回数据，长度: ${Array.isArray(data) ? data.length : '未知'}`);
    
    // 检查是否有语义搜索调试信息
    if (Array.isArray(data) && data.length > 0 && data[0].sr_performance_details) {
      console.log('searchRecipes: 语义搜索性能详情:', JSON.stringify(data[0].sr_performance_details, null, 2));
    }

    // 处理返回数据
    const recipes: Recipe[] = [];
    let total = 0;
    
    try {
      // 确保 data 是数组类型
      if (!Array.isArray(data)) {
        return { recipes: [], total: 0 };
      }
      
      // 获取总数 - 修复分页问题
      // RPC函数返回的result_filtered_count字段包含总记录数
      if (data.length > 0) {
        // 优先使用result_filtered_count字段（即使记录本身是NULL，元数据也会存在）
        if (typeof data[0].result_filtered_count !== 'undefined' && data[0].result_filtered_count !== null) {
          total = parseInt(String(data[0].result_filtered_count), 10);
          console.log('从result_filtered_count获取到总记录数:', total);
        } 
        // 尝试从filtered_count字段获取
        else if (typeof data[0].filtered_count !== 'undefined' && data[0].filtered_count !== null) {
          total = parseInt(String(data[0].filtered_count), 10);
          console.log('从filtered_count获取到总记录数:', total);
        }
        // 如果存在sr_performance_details字段，尝试从中提取
        else if (data[0].sr_performance_details && 
                 typeof data[0].sr_performance_details === 'object' &&
                 data[0].sr_performance_details.filtered_count) {
          total = parseInt(String(data[0].sr_performance_details.filtered_count), 10);
          console.log('从sr_performance_details.filtered_count获取到总记录数:', total);
        }
        // 如果前面都没有找到，使用返回的结果长度作为最小估计值
        else {
          // 在分页的情况下，总数至少是当前页的记录数加上前面页的记录数
          if (validatedPage > 1) {
            total = (validatedPage - 1) * validatedPageSize + data.length;
            console.log('估算总记录数(分页情况):', total);
          } else {
            total = data.length;
            console.log('使用当前结果数量作为总记录数:', total);
          }
        }
      } else {
        total = 0;
        console.log('结果为空，总记录数设为0');
      }
      
      // 确保total是有效值
      if (isNaN(total) || total < 0) {
        total = 0;
      }
      
      // 转换返回结果为前端模型 - 过滤掉NULL记录（元数据记录）
      for (const item of data) {
        // 跳过用于传递元数据的NULL记录
        if (item.id === null || item.id === undefined) {
          console.log('跳过元数据记录，总记录数已从该记录获取');
          continue;
        }
        
        const recipe = dbRecordToFrontendModel(item);
        // 合并相关性得分，用于显示
        if (typeof item.relevance_score === 'number') {
          (recipe as RecipeWithScore).relevanceScore = item.relevance_score;
        }
        recipes.push(recipe);
      }
    } catch (conversionError) {
      console.error('转换菜谱数据失败:', conversionError);
      throw new Error(`数据转换错误: ${conversionError instanceof Error ? conversionError.message : '未知错误'}`);
    }

    return { 
      recipes,
      total
    };
  } catch (error) {
    console.error('searchRecipes失败:', error);
    return { 
      recipes: [], 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
}

/**
 * 使用食材和调料搜索服务获取建议
 * 直接代理到 searchService 中的实现
 */
export async function getIngredientsAndSeasoningSuggestions(searchTerm: string): Promise<{
  data: any[];
  error: any | null;
}> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { data: [], error: null };
    }
    
    // 为每个请求创建唯一标识符
    const requestId = ++currentIngredientSearchId;
    
    // 使用 searchIngredientsAndSeasonings 函数获取结果
    const result = await searchIngredientsAndSeasonings(searchTerm, `${requestId}-dataservice`);
    
    // 检查请求是否还有效
    if (requestId !== currentIngredientSearchId) {
      return { data: [], error: null };
    }
    
    // 格式化结果 - 只需要标签列表
    const uniqueTags = Array.from(new Set(result.map(item => item.tag)));
    
    return { 
      data: uniqueTags, 
      error: null 
    };
  } catch (error) {
    console.error('搜索食材调料出错:', error);
    return { 
      data: [], 
      error: error 
    };
  }
}

/**
 * 自动初始化Supabase客户端
 * 此函数在模块加载时自动调用，确保客户端被初始化
 */
export function initializeSupabaseClientOnLoad() {
  console.log('正在初始化Supabase客户端...');
  const client = getSupabaseClient();
  if (client) {
    console.log('Supabase客户端初始化成功 (自动初始化)');
    return true;
  } else {
    console.error('Supabase客户端初始化失败 (自动初始化)');
    return false;
  }
}

// 在模块加载时自动初始化客户端
initializeSupabaseClientOnLoad();

/**
 * 根据ID数组获取多个菜谱
 */
export async function getRecipesByIds(ids: string[]): Promise<any[]> {
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.log('getRecipesByIds: 没有提供有效的ID数组');
      return [];
    }
    
    console.log(`getRecipesByIds: 获取${ids.length}个菜谱`);
    
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.error('getRecipesByIds: Supabase客户端未初始化');
      throw new Error('Supabase客户端未初始化');
    }
    
    const { data, error } = await supabase
      .from('CHrecipes')
      .select('*')
      .in('id', ids);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log(`getRecipesByIds: 未找到ID为${ids.join(', ')}的菜谱`);
      return [];
    }
    
    console.log(`getRecipesByIds: 成功获取${data.length}个菜谱`);
    return data;
  } catch (error) {
    console.error('getRecipesByIds错误:', error);
    return [];
  }
}

// 定义版本常量 - 使用配置中的版本号
export const DATA_SERVICE_VERSION = SEARCH_CONFIG.VERSION;
export const SEARCH_VERSION = SEARCH_CONFIG.VERSION;