import { describe, it, expect, beforeAll } from 'vitest';
import { searchRecipesByEmbedding } from '../../lib/services/embeddingService';
import { createClient } from '@supabase/supabase-js';

// 为了测试需要初始化Supabase客户端
let supabase: any;

// 测试前准备：创建Supabase客户端
beforeAll(() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('环境变量未设置。请确保NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY在.env.local中设置正确。');
  }
  
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
});

describe('语义搜索功能测试', () => {
  // 测试基本语义搜索功能
  it('应该返回与查询语义相关的菜谱结果', async () => {
    const query = '家常简单的蔬菜料理';
    const results = await searchRecipesByEmbedding(query);
    
    // 确保有搜索结果返回
    expect(results.length).toBeGreaterThan(0);
    
    // 验证结果包含预期的字段
    const firstResult = results[0];
    expect(firstResult).toHaveProperty('recipe_id');
    expect(firstResult).toHaveProperty('title');
    expect(firstResult).toHaveProperty('similarity');
    
    // 验证相似度分数
    expect(firstResult.similarity).toBeGreaterThan(0.5);
  }, 15000); // 增加超时时间，因为API调用可能需要更多时间
  
  // 测试带筛选条件的语义搜索
  it('应该根据筛选条件返回相关菜谱', async () => {
    const query = '清淡的肉类料理';
    const results = await searchRecipesByEmbedding(query, {
      cuisines: ['川菜'],
      matchCount: 5
    });
    
    // 确保有结果
    expect(results.length).toBeGreaterThan(0);
    
    // 验证所有结果都是川菜
    results.forEach((recipe: any) => {
      expect(recipe.cuisine).toBe('川菜');
    });
  }, 15000);
  
  // 测试忌口食材过滤
  it('应该排除包含忌口食材的菜谱', async () => {
    const query = '家常菜';
    const avoidIngredients = ['香菜']; // 避免香菜
    
    const results = await searchRecipesByEmbedding(query, {
      avoidIngredients,
      matchCount: 10
    });
    
    // 确保有结果
    expect(results.length).toBeGreaterThan(0);
    
    // 验证结果中不包含忌口食材
    for (const recipe of results) {
      // 检查菜名不含忌口食材
      for (const avoidItem of avoidIngredients) {
        expect(recipe.title.toLowerCase()).not.toContain(avoidItem.toLowerCase());
      }
      
      // 如果我们有详细的食材数据，也可以检查食材列表
      if (recipe.ingredients) {
        const ingredientsJson = typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients) 
          : recipe.ingredients;
          
        if (Array.isArray(ingredientsJson)) {
          for (const ingredient of ingredientsJson) {
            for (const avoidItem of avoidIngredients) {
              const ingredientName = ingredient.名称 || ingredient.name;
              if (ingredientName) {
                expect(ingredientName.toLowerCase()).not.toContain(avoidItem.toLowerCase());
              }
            }
          }
        }
      }
    }
  }, 15000);
  
  // 测试语义相似度阈值
  it('应该根据相似度阈值筛选结果', async () => {
    const query = '简单的早餐';
    
    // 使用较高的相似度阈值
    const resultsHighThreshold = await searchRecipesByEmbedding(query, {
      similarityThreshold: 0.8,
      matchCount: 10
    });
    
    // 使用较低的相似度阈值
    const resultsLowThreshold = await searchRecipesByEmbedding(query, {
      similarityThreshold: 0.5,
      matchCount: 10
    });
    
    // 较高阈值应返回更少的结果
    expect(resultsHighThreshold.length).toBeLessThanOrEqual(resultsLowThreshold.length);
    
    // 验证高阈值结果的相似度都大于设定值
    for (const result of resultsHighThreshold) {
      expect(result.similarity).toBeGreaterThanOrEqual(0.8);
    }
  }, 15000);
}); 