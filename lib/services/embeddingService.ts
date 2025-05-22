import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SEMANTIC_SEARCH_THRESHOLDS } from '../../src/utils/data/searchConfig';

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';

// 日志环境变量信息
console.log('[EmbeddingService] 初始化服务...');
console.log('[EmbeddingService] OpenAI API密钥状态:', openaiApiKey ? '已设置' : '未设置');
console.log('[EmbeddingService] Supabase URL状态:', supabaseUrl ? '已设置' : '未设置');
console.log('[EmbeddingService] Supabase服务密钥状态:', supabaseServiceKey ? '已设置' : '未设置');

// 嵌入向量缓存
type EmbeddingCache = {
  [key: string]: number[];
};

let embeddingCache: EmbeddingCache = {};

// 创建Supabase客户端
const getSupabaseClient = (): SupabaseClient | null => {
  if (typeof window !== 'undefined') {
    // 在浏览器端，不使用服务密钥
    console.log('[EmbeddingService] 浏览器环境，不使用服务密钥创建Supabase客户端');
    return null;
  }
  
  // 在服务器端，使用服务密钥
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
};

// 按需创建OpenAI客户端，避免在浏览器中初始化
const createOpenAIClient = () => {
  if (typeof window !== 'undefined') {
    // 在浏览器环境中，不应直接创建OpenAI客户端
    console.log('[EmbeddingService] 浏览器环境，不创建OpenAI客户端');
    return null;
  }
  
  if (!openaiApiKey) {
    console.error('[EmbeddingService] 缺少OpenAI API密钥');
    return null;
  }
  
  try {
    console.log('[EmbeddingService] 服务器端创建OpenAI客户端');
    return new OpenAI({
      apiKey: openaiApiKey,
    });
  } catch (error) {
    console.error('[EmbeddingService] OpenAI客户端创建失败:', error);
    return null;
  }
};

/** 
 * 为文本生成嵌入向量 
 */
export async function generateEmbedding(text: string, useLocalApi: boolean = true): Promise<number[]> {
  console.log('[EmbeddingService] generateEmbedding: 开始生成嵌入向量');
  console.log('[EmbeddingService] generateEmbedding: 输入文本长度:', text.length);
  console.log('[EmbeddingService] generateEmbedding: 使用本地API:', useLocalApi ? '是' : '否');
  
  // 文本标准化处理
  const normalizedText = text.trim().toLowerCase();
  console.log('[EmbeddingService] generateEmbedding: 标准化后的文本长度:', normalizedText.length);
  
  // 检查缓存
  if (embeddingCache[normalizedText]) {
    console.log('[EmbeddingService] generateEmbedding: 使用缓存的嵌入向量');
    return embeddingCache[normalizedText];
  }
  
  try {
    // 在浏览器环境中，始终使用本地API路由
    if (typeof window !== 'undefined') {
      console.log('[EmbeddingService] generateEmbedding: 浏览器环境，使用本地API路由');
      
      const response = await fetch('/api/embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: normalizedText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[EmbeddingService] generateEmbedding: 本地API响应错误:', errorData);
        throw new Error(`本地API响应错误: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.embedding || !Array.isArray(data.embedding)) {
        console.error('[EmbeddingService] generateEmbedding: 本地API响应无效:', data);
        throw new Error('本地API响应无效，无法获取嵌入向量');
      }
      
      const embedding = data.embedding;
      console.log('[EmbeddingService] generateEmbedding: 成功获取嵌入向量，维度:', embedding.length);
      
      // 更新缓存
      embeddingCache[normalizedText] = embedding;
      console.log('[EmbeddingService] generateEmbedding: 嵌入向量已添加到缓存');
      
      return embedding;
    }
    // 服务器端环境
    else {
      if (useLocalApi) {
        // 即使在服务器端，也可以使用API路由
        console.log('[EmbeddingService] generateEmbedding: 服务器端使用API路由');
        
        // 这里可以使用内部调用而不是HTTP请求
        // 简化处理，仍然使用OpenAI直接调用
        const openai = createOpenAIClient();
        if (!openai) {
          throw new Error('无法创建OpenAI客户端');
        }
        
        console.log('[EmbeddingService] generateEmbedding: 调用OpenAI API生成嵌入向量...');
        console.log('[EmbeddingService] generateEmbedding: 使用模型:', 'text-embedding-3-small');
        
        const startTime = Date.now();
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: normalizedText,
          encoding_format: 'float',
        });
        const endTime = Date.now();
        
        console.log('[EmbeddingService] generateEmbedding: API调用耗时:', endTime - startTime, 'ms');
        
        if (!response || !response.data || !response.data[0] || !response.data[0].embedding) {
          console.error('[EmbeddingService] generateEmbedding: API响应无效:', JSON.stringify(response));
          throw new Error('OpenAI API响应无效，无法获取嵌入向量');
        }
        
        const embedding = response.data[0].embedding;
        console.log('[EmbeddingService] generateEmbedding: 成功获取嵌入向量，维度:', embedding.length);
        
        // 更新缓存
        embeddingCache[normalizedText] = embedding;
        console.log('[EmbeddingService] generateEmbedding: 嵌入向量已添加到缓存');
        
        return embedding;
      }
    }
    
    throw new Error('无法生成嵌入向量，当前环境不支持');
  } catch (error) {
    console.error('[EmbeddingService] generateEmbedding: 生成嵌入向量失败:', error);
    console.error('[EmbeddingService] generateEmbedding: 错误详情:', JSON.stringify(error, null, 2));
    
    if (error instanceof Error) {
      console.error('[EmbeddingService] 错误信息:', error.message);
      console.error('[EmbeddingService] 堆栈跟踪:', error.stack);
    }
    
    throw new Error(`生成嵌入向量失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 从菜谱数据生成用于嵌入的源文本
 */
export function generateRecipeSourceText(recipe: any): string {
  const parts: string[] = [];
  
  // 添加菜名
  if (recipe.菜名) {
    parts.push(`菜名: ${recipe.菜名}`);
  }
  
  // 添加菜系
  if (recipe.菜系) {
    parts.push(`菜系: ${recipe.菜系}`);
  }
  
  // 添加食材
  if (recipe.食材 && Array.isArray(recipe.食材)) {
    const ingredientNames = recipe.食材
      .map((ing: any) => ing.名称 || ing.name)
      .filter(Boolean);
    
    if (ingredientNames.length > 0) {
      parts.push(`食材: ${ingredientNames.join(', ')}`);
    }
  }
  
  // 添加调料
  if (recipe.调料 && Array.isArray(recipe.调料)) {
    const seasoningNames = recipe.调料
      .map((s: any) => s.名称 || s.name)
      .filter(Boolean);
    
    if (seasoningNames.length > 0) {
      parts.push(`调料: ${seasoningNames.join(', ')}`);
    }
  }
  
  // 添加口味特点
  if (recipe.口味特点) {
    const flavors = recipe.口味特点.标签 || recipe.口味特点.tags;
    if (Array.isArray(flavors) && flavors.length > 0) {
      parts.push(`口味: ${flavors.join(', ')}`);
    }
  }
  
  // 添加步骤简述
  if (recipe.步骤) {
    if (recipe.步骤.准备步骤 && Array.isArray(recipe.步骤.准备步骤)) {
      parts.push(`准备: ${recipe.步骤.准备步骤.join(' ')}`);
    }
    
    if (recipe.步骤.烹饪步骤 && Array.isArray(recipe.步骤.烹饪步骤)) {
      parts.push(`烹饪: ${recipe.步骤.烹饪步骤.join(' ')}`);
    }
  }
  
  return parts.join('\n');
}

/**
 * 为单个菜谱生成并存储嵌入向量
 */
export async function createRecipeEmbedding(recipeId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('无法创建Supabase客户端');
    }
    
    // 获取菜谱数据
    const { data: recipe, error: recipeError } = await supabase
      .from('CHrecipes')
      .select('*')
      .eq('id', recipeId)
      .single();
    
    if (recipeError || !recipe) {
      throw new Error(`获取菜谱失败: ${recipeError?.message || '未找到菜谱'}`);
    }
    
    // 检查是否已存在嵌入向量
    const { data: existingEmbedding } = await supabase
      .from('recipe_embeddings')
      .select('id')
      .eq('recipe_id', recipeId)
      .maybeSingle();
    
    if (existingEmbedding) {
      console.log(`菜谱 ${recipeId} 的嵌入向量已存在`);
      return;
    }
    
    // 生成源文本
    const sourceText = generateRecipeSourceText(recipe);
    
    // 提取标题和食材文本
    const title = recipe.菜名 || '';
    const ingredients = recipe.食材 && Array.isArray(recipe.食材)
      ? recipe.食材.map((i: any) => i.名称 || i.name).filter(Boolean).join(', ')
      : '';
      
    // 生成描述文本
    const description = sourceText;
    
    // 生成嵌入向量
    const embedding = await generateEmbedding(sourceText);
    
    // 存储嵌入向量
    const { error: insertError } = await supabase
      .from('recipe_embeddings')
      .insert({
        recipe_id: recipeId,
        title,
        ingredients,
        description,
        embedding,
        source_text: sourceText,
      });
    
    if (insertError) {
      throw new Error(`存储嵌入向量失败: ${insertError.message}`);
    }
    
    console.log(`成功为菜谱 ${recipeId} 创建嵌入向量`);
  } catch (error) {
    console.error('创建菜谱嵌入向量失败:', error);
    throw error;
  }
}

/**
 * 为所有菜谱生成嵌入向量
 */
export async function createAllRecipeEmbeddings(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('无法创建Supabase客户端');
    }
    
    // 获取所有菜谱ID
    const { data: recipes, error } = await supabase
      .from('CHrecipes')
      .select('id')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`获取菜谱列表失败: ${error.message}`);
    }
    
    console.log(`准备为 ${recipes.length} 个菜谱创建嵌入向量`);
    
    // 批量处理，每批20个
    const batchSize = 20;
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      
      // 并行处理批次
      await Promise.all(
        batch.map(recipe => createRecipeEmbedding(recipe.id).catch(err => {
          console.error(`处理菜谱 ${recipe.id} 时出错:`, err);
          return null;
        }))
      );
      
      console.log(`完成批次 ${i / batchSize + 1}/${Math.ceil(recipes.length / batchSize)}`);
    }
    
    console.log('所有菜谱嵌入向量生成完成');
  } catch (error) {
    console.error('批量生成嵌入向量失败:', error);
    throw error;
  }
}

/** 
 * 基于向量相似度搜索菜谱 
 */
export async function searchRecipesByEmbedding(
  query: string,
  options: {
    similarityThreshold?: number;
    matchCount?: number;
    cuisines?: string[];
    difficulties?: string[];
    flavors?: string[];
    dietary?: string[];
    avoidIngredients?: string[];
  } = {}
): Promise<any[]> {
  console.log('[EmbeddingService] searchRecipesByEmbedding: 开始向量搜索', {
    query,
    options
  });
  
  try {
    // 检查查询文本
    if (!query || query.trim().length === 0) {
      console.warn('[EmbeddingService] searchRecipesByEmbedding: 查询文本为空');
      return [];
    }
    
    console.log('[EmbeddingService] searchRecipesByEmbedding: 开始生成查询文本的嵌入向量');
    
    try {
      // 生成查询文本的嵌入向量
      const embedding = await generateEmbedding(query);
      console.log('[EmbeddingService] searchRecipesByEmbedding: 成功生成嵌入向量，维度:', embedding.length);
      
      // 设置默认值 - 使用配置文件中的DEFAULT值而不是硬编码的0.5
      const {
        similarityThreshold = SEMANTIC_SEARCH_THRESHOLDS.DEFAULT,
        matchCount = 10,
        cuisines,
        difficulties,
        flavors,
        dietary,
        avoidIngredients,
      } = options;
      
      console.log('[EmbeddingService] searchRecipesByEmbedding: 请求参数', {
        similarityThreshold,
        matchCount,
        cuisines,
        difficulties,
        flavors,
        dietary,
        avoidIngredients
      });
      
      // 获取Supabase客户端
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('[EmbeddingService] searchRecipesByEmbedding: Supabase客户端未初始化');
        throw new Error('Supabase客户端未初始化，无法执行向量搜索');
      }
      
      console.log('[EmbeddingService] searchRecipesByEmbedding: 调用Supabase RPC进行向量搜索...');
      const startTime = Date.now();
      
      // 调用存储过程执行向量搜索
      const { data, error } = await supabase.rpc(
        'search_recipes_by_embedding',
        {
          query_embedding: embedding,
          similarity_threshold: similarityThreshold,
          match_count: matchCount,
          filter_cuisines: cuisines,
          filter_difficulties: difficulties,
          filter_flavors: flavors,
          filter_dietary: dietary,
          avoid_ingredients: avoidIngredients,
        }
      );
      
      const endTime = Date.now();
      console.log('[EmbeddingService] searchRecipesByEmbedding: RPC调用耗时:', endTime - startTime, 'ms');
      
      if (error) {
        console.error('[EmbeddingService] searchRecipesByEmbedding: 向量搜索RPC调用失败:', error);
        throw new Error(`向量搜索失败: ${error.message}`);
      }
      
      if (!data) {
        console.warn('[EmbeddingService] searchRecipesByEmbedding: 向量搜索结果为空');
        return [];
      }
      
      console.log(`[EmbeddingService] searchRecipesByEmbedding: 搜索成功，找到${data.length}个结果`);
      
      // 输出部分结果示例
      if (data.length > 0) {
        console.log('[EmbeddingService] searchRecipesByEmbedding: 第一个结果:', JSON.stringify(data[0], null, 2));
      }
      
      return data;
    } catch (embeddingError) {
      console.error('[EmbeddingService] searchRecipesByEmbedding: 生成嵌入向量失败:', embeddingError);
      throw embeddingError;
    }
  } catch (error) {
    console.error('[EmbeddingService] searchRecipesByEmbedding: 搜索菜谱失败:', error);
    console.error('[EmbeddingService] searchRecipesByEmbedding: 错误类型:', error instanceof Error ? error.constructor.name : typeof error);
    
    if (error instanceof Error) {
      console.error('[EmbeddingService] searchRecipesByEmbedding: 错误信息:', error.message);
      console.error('[EmbeddingService] searchRecipesByEmbedding: 堆栈跟踪:', error.stack);
    }
    
    throw error;
  }
}

/**
 * 获取两个食材之间的语义相似度
 */
export async function checkIngredientsSemanticSimilarity(
  ingredient1: string,
  ingredient2: string
): Promise<number> {
  try {
    // 生成两个食材的嵌入向量
    const [embedding1, embedding2] = await Promise.all([
      generateEmbedding(ingredient1),
      generateEmbedding(ingredient2),
    ]);
    
    // 计算余弦相似度 (使用点积除以向量长度的乘积)
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      mag1 += embedding1[i] * embedding1[i];
      mag2 += embedding2[i] * embedding2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    const similarity = dotProduct / (mag1 * mag2);
    
    return similarity;
  } catch (error) {
    console.error('计算食材相似度失败:', error);
    throw error;
  }
}

/**
 * 查找与给定食材语义相似的其他食材
 */
export async function getSemanticSimilarIngredients(
  ingredient: string,
  similarityThreshold: number = SEMANTIC_SEARCH_THRESHOLDS.STRICT,
  maxResults: number = 5
): Promise<{ name: string; similarity: number }[]> {
  try {
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('无法创建Supabase客户端');
    }
    
    // 记录使用的阈值
    console.log(`[EmbeddingService] getSemanticSimilarIngredients: 使用阈值 ${similarityThreshold}`);
    
    // 获取已知食材列表
    const { data: ingredientsData, error: ingredientsError } = await supabase
      .rpc('get_unique_ingredients');
    
    if (ingredientsError || !ingredientsData) {
      throw new Error(`获取食材列表失败: ${ingredientsError?.message || '未找到食材'}`);
    }
    
    // 生成查询食材的嵌入向量
    const queryEmbedding = await generateEmbedding(ingredient);
    
    // 处理每批食材
    const batchSize = 20;
    let results: { name: string; similarity: number }[] = [];
    
    // 这里简化处理，仅支持少量食材比较
    // 实际生产环境应该使用更高效的向量存储和搜索方法
    for (let i = 0; i < Math.min(100, ingredientsData.length); i++) {
      const otherIngredient = ingredientsData[i];
      
      // 跳过相同的食材
      if (otherIngredient.toLowerCase() === ingredient.toLowerCase()) {
        continue;
      }
      
      const otherEmbedding = await generateEmbedding(otherIngredient);
      
      // 计算余弦相似度
      let dotProduct = 0;
      let mag1 = 0;
      let mag2 = 0;
      
      for (let j = 0; j < queryEmbedding.length; j++) {
        dotProduct += queryEmbedding[j] * otherEmbedding[j];
        mag1 += queryEmbedding[j] * queryEmbedding[j];
        mag2 += otherEmbedding[j] * otherEmbedding[j];
      }
      
      mag1 = Math.sqrt(mag1);
      mag2 = Math.sqrt(mag2);
      
      const similarity = dotProduct / (mag1 * mag2);
      
      // 仅保留高于阈值的结果
      if (similarity >= similarityThreshold) {
        results.push({
          name: otherIngredient,
          similarity,
        });
      }
    }
    
    // 按相似度降序排序并限制结果数量
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  } catch (error) {
    console.error('获取相似食材失败:', error);
    throw error;
  }
}

// 导出嵌入服务
export default {
  generateEmbedding,
  generateRecipeSourceText,
  createRecipeEmbedding,
  createAllRecipeEmbeddings,
  searchRecipesByEmbedding,
  checkIngredientsSemanticSimilarity,
  getSemanticSimilarIngredients,
}; 