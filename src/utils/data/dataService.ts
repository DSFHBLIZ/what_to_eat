import { createClient } from '@supabase/supabase-js';
import { Recipe } from '../../types/recipe';
import { dbRecordToFrontendModel, dbRecipesToFrontendModels, DbRecipe } from './dataMapper';
import { logError } from '../common/errorLogger';
import { ensureArray } from '../common/typeChecks';
import { IngredientTag } from '../../types/search';
import { searchIngredientsAndSeasonings } from '../recipe/searchService';

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
    sortDirection: sort?.direction || 'desc'
  });
}

/**
 * 根据食材搜索菜谱
 */
export async function searchRecipesByIngredients({
  requiredIngredients = [],
  optionalIngredients = [],
  requiredSeasonings = [],
  optionalSeasonings = []
}: {
  requiredIngredients?: string[];
  optionalIngredients?: string[];
  requiredSeasonings?: string[];
  optionalSeasonings?: string[];
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
    enableSemanticSearch: false
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
  enableSemanticSearch = false
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

    // 组装 RPC 参数
    const rpcParams: {
      search_query: string;
      required_ingredients: string[];
      optional_ingredients: string[];
      optional_condiments: string[];
      dish_name_keywords: string[];
      cuisines: string[];
      flavors: string[];
      difficulties: string[];
      dietary_restrictions: string[];
      required_ingredient_categories: string[];
      optional_ingredient_categories: string[];
      required_condiment_categories: string[];
      optional_condiment_categories: string[];
      page: number;
      page_size: number;
      sort_field: string;
      sort_direction: string;
      return_all_results: boolean;
      debug_mode: boolean;
      stabilize_results: boolean;
      trgm_similarity_threshold: number;
      forbidden_ingredients: string[];
      preview_mode: boolean;
      preview_page_count: number;
      enable_semantic_search: boolean;
    } = {
      search_query: finalSearchQuery,
      required_ingredients: finalRequiredIngredients,
      optional_ingredients: finalOptionalIngredients,
      optional_condiments: [], // 已由optional_ingredients统一处理
      dish_name_keywords: finalSearchQuery ? [finalSearchQuery] : [],
      cuisines: ensureArray(cuisines),
      flavors: ensureArray(flavors),
      difficulties: ensureArray(difficulties),
      dietary_restrictions: ensureArray(dietaryRestrictions),
      required_ingredient_categories: [],
      optional_ingredient_categories: [],
      required_condiment_categories: [],
      optional_condiment_categories: [],
      page: validatedPage,
      page_size: validatedPageSize,
      sort_field: mappedSortField,
      sort_direction: (sortDirection || 'asc').toUpperCase(),
      return_all_results: false,
      debug_mode: true, // 启用调试模式以返回更多统计信息
      stabilize_results: true,
      trgm_similarity_threshold: 0.35, // 默认相似度阈值
      forbidden_ingredients: finalAvoidIngredients,
      preview_mode: false,
      preview_page_count: 1,
      enable_semantic_search: false // 默认不启用语义搜索，后面会根据条件修改
    };

    // 检查是否有可能启用语义搜索
    const canUseSemanticSearch = finalSearchQuery.length > 0 || finalRequiredIngredients.length > 0;
    console.log('searchRecipes: 是否适合语义搜索:', canUseSemanticSearch);
    
    // 检查OpenAI API密钥是否设置
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    console.log('searchRecipes: OpenAI API密钥状态:', hasOpenAIKey ? '已设置，可启用语义搜索' : '未设置，将使用传统搜索');
    
    // 尝试使用存储过程启用语义搜索
    if (hasOpenAIKey && canUseSemanticSearch) {
      console.log('searchRecipes: 尝试使用语义搜索增强结果...');
      rpcParams.enable_semantic_search = true;
    } else {
      console.log('searchRecipes: 使用传统搜索方法');
      rpcParams.enable_semantic_search = false;
    }
    
    // 如果启用语义搜索并有嵌入向量，增加相关RPC调用
    if (enableSemanticSearch && queryEmbedding) {
      // 使用数据库函数进行语义搜索
      try {
        // 先尝试将嵌入向量缓存到数据库
        await supabase.rpc('cache_query_embedding', {
          query_text: searchQuery,
          query_vector: queryEmbedding
        });
        
        // 设置语义搜索标志
        rpcParams.enable_semantic_search = true;
      } catch (error) {
        console.error('设置语义搜索参数失败:', error);
      }
    }
    
    console.log('searchRecipes: RPC参数', JSON.stringify(rpcParams, null, 2));
    
    // 直接调用 Supabase RPC
    console.log('searchRecipes: 开始调用Supabase RPC函数search_recipes...');
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
        // 优先使用result_filtered_count字段
        if (typeof data[0].result_filtered_count !== 'undefined') {
          total = parseInt(String(data[0].result_filtered_count), 10);
          console.log('从result_filtered_count获取到总记录数:', total);
        } 
        // 尝试从filtered_count字段获取
        else if (typeof data[0].filtered_count !== 'undefined') {
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
      
      // 转换返回结果为前端模型
      for (const item of data) {
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

// 定义版本常量
export const DATA_SERVICE_VERSION = '1.0.2';
export const SEARCH_VERSION = '1.0.2';