// test_search_rpc.js
// 测试脚本，用于验证search_recipes RPC函数是否正常工作
// 运行方式: node test_search_rpc.js
// 作者: DSFHBLIZ
// 创建日期: 2023-05-02

// 导入Supabase客户端
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase连接信息
const supabaseUrl = 'https://ijwimydlumbolmpnmezt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqd2lteWRsdW1ib2xtcG5tZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NjExMDUsImV4cCI6MjA1ODAzNzEwNX0.ynhuFYG6dkoxDgEyDwEnWdZ-DRWx3illLZGyYwn_UnA';

// 创建Supabase客户端，添加超时处理
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15秒超时
      }).catch(error => {
        console.error('网络请求错误:', error);
        throw error;
      });
    }
  }
});

// 测试场景配置
const testCases = [
  {
    name: '基本搜索 - 无筛选条件',
    params: {
      search_query: null,
      required_ingredients: null,
      optional_ingredients: null,
      cuisines: null,
      flavors: null,
      difficulties: null,
      dietary_restrictions: null,
      tag_logic: 'OR',
      page: 1,
      page_size: 5,
      sort_field: '菜名',
      sort_direction: 'asc',
      return_all_results: false
    }
  },
  {
    name: '关键词搜索 - 西红柿',
    params: {
      search_query: '西红柿',
      required_ingredients: null,
      optional_ingredients: null,
      cuisines: null,
      flavors: null,
      difficulties: null,
      dietary_restrictions: null,
      tag_logic: 'OR',
      page: 1,
      page_size: 5,
      sort_field: '菜名',
      sort_direction: 'asc',
      return_all_results: false
    }
  },
  {
    name: '必选食材 - 鸡蛋',
    params: {
      search_query: null,
      required_ingredients: ['鸡蛋'],
      optional_ingredients: null,
      cuisines: null,
      flavors: null,
      difficulties: null,
      dietary_restrictions: null,
      tag_logic: 'OR',
      page: 1,
      page_size: 5,
      sort_field: '菜名',
      sort_direction: 'asc',
      return_all_results: false
    }
  },
  {
    name: '复合搜索 - 川菜 + 麻辣',
    params: {
      search_query: null,
      required_ingredients: null,
      optional_ingredients: null,
      cuisines: ['川菜'],
      flavors: ['麻辣'],
      difficulties: null,
      dietary_restrictions: null,
      tag_logic: 'AND',
      page: 1,
      page_size: 5,
      sort_field: '菜名',
      sort_direction: 'asc',
      return_all_results: false
    }
  },
  {
    name: '复杂搜索 - 辣椒 + 简单 + 素食',
    params: {
      search_query: null,
      required_ingredients: ['辣椒'],
      optional_ingredients: ['大蒜'],
      cuisines: null,
      flavors: null,
      difficulties: ['简单'],
      dietary_restrictions: ['纯素'],
      tag_logic: 'AND',
      page: 1,
      page_size: 5,
      sort_field: 'relevance_score',
      sort_direction: 'desc',
      return_all_results: false
    }
  },
  {
    name: '参数类型测试 - 空数组vs空值',
    params: {
      search_query: '鸡蛋',
      required_ingredients: [],  // 测试空数组
      optional_ingredients: null, // 测试null
      cuisines: [],
      flavors: null,
      difficulties: [],
      dietary_restrictions: null,
      tag_logic: 'OR',
      page: 1,
      page_size: 5,
      sort_field: '菜名',
      sort_direction: 'asc',
      return_all_results: false
    }
  },
  {
    name: '可选食材功能测试 - 土豆和胡萝卜',
    params: {
      search_query: null,
      required_ingredients: null,
      optional_ingredients: ['土豆', '胡萝卜'],  // 指定可选食材
      cuisines: null,
      flavors: null,
      difficulties: null,
      dietary_restrictions: null,
      page: 1,
      page_size: 10,
      sort_field: 'relevance_score',
      sort_direction: 'desc',  // 降序排列，高分在前
      return_all_results: false,
      debug_mode: true,  // 开启调试模式看得分
      trgm_similarity_threshold: 0.2  // 设置较低的相似度阈值
    }
  },
  {
    name: '忌口食材功能测试 - 排除洋葱',
    params: {
      search_query: null,
      required_ingredients: null,
      optional_ingredients: ['土豆'],  // 添加一个可选食材以便分辨结果
      cuisines: null,
      flavors: null,
      difficulties: null,
      dietary_restrictions: null,
      page: 1,
      page_size: 10,
      sort_field: 'relevance_score',
      sort_direction: 'desc',
      return_all_results: false,
      debug_mode: true,
      trgm_similarity_threshold: 0.2,
      forbidden_ingredients: ['洋葱']  // 指定忌口食材
    }
  },
  {
    name: '忌口食材对比测试 - 不排除洋葱',
    params: {
      search_query: null,
      required_ingredients: null,
      optional_ingredients: ['土豆'],  // 与上面测试用例相同的可选食材
      cuisines: null,
      flavors: null,
      difficulties: null,
      dietary_restrictions: null,
      page: 1,
      page_size: 10,
      sort_field: 'relevance_score',
      sort_direction: 'desc',
      return_all_results: false,
      debug_mode: true,
      trgm_similarity_threshold: 0.2
      // 不设置忌口食材，用于对比
    }
  }
];

// 格式化输出结果
function formatRecipe(recipe) {
  const formatted = {
    id: recipe.id,
    菜名: recipe.菜名,
    菜系: recipe.菜系,
    烹饪难度: recipe.烹饪难度,
    relevance_score: recipe.relevance_score ? recipe.relevance_score.toFixed(2) : '无得分',
    // 优化食材显示
    食材: recipe.食材 ? formatIngredientsList(recipe.食材) : '无食材数据',
  };
  
  // 如果有性能数据，添加到格式化输出中
  if (recipe.performance_details) {
    formatted.性能统计 = {
      总耗时: recipe.performance_details.total_time_ms ? `${recipe.performance_details.total_time_ms.toFixed(2)}毫秒` : '未知',
      查询执行时间: recipe.performance_details.query_execution_time_ms ? `${recipe.performance_details.query_execution_time_ms.toFixed(2)}毫秒` : '未知',
      筛选阶段: {
        菜系筛选: recipe.performance_details.cuisine_filtered_ms ? `${recipe.performance_details.cuisine_filtered_ms.toFixed(2)}毫秒` : '未知',
        口味筛选: recipe.performance_details.flavor_filtered_ms ? `${recipe.performance_details.flavor_filtered_ms.toFixed(2)}毫秒` : '未知',
        难度筛选: recipe.performance_details.difficulty_filtered_ms ? `${recipe.performance_details.difficulty_filtered_ms.toFixed(2)}毫秒` : '未知',
        食材筛选: recipe.performance_details.required_ingredients_filtered_ms ? `${recipe.performance_details.required_ingredients_filtered_ms.toFixed(2)}毫秒` : '未知',
        忌口筛选: recipe.performance_details.forbidden_ingredients_filtered_ms ? `${recipe.performance_details.forbidden_ingredients_filtered_ms.toFixed(2)}毫秒` : '未知',
        可选食材加分: recipe.performance_details.optional_ingredients_scored_ms ? `${recipe.performance_details.optional_ingredients_scored_ms.toFixed(2)}毫秒` : '未知'
      }
    };
  }
  
  return formatted;
}

// 格式化食材列表，显示更多细节
function formatIngredientsList(ingredientsJson) {
  if (!ingredientsJson) return '无数据';
  
  try {
    // 确保是数组
    const ingredients = Array.isArray(ingredientsJson) ? ingredientsJson : [];
    
    // 格式化每个食材项
    return ingredients.map(ing => {
      if (typeof ing === 'string') return ing;
      if (typeof ing === 'object') {
        // 包含食材名称和用量
        return `${ing.名称}${ing.用量 ? ` (${ing.用量})` : ''}`;
      }
      return JSON.stringify(ing);
    }).join(', ');
  } catch (err) {
    console.error('格式化食材列表失败:', err);
    return '格式化失败: ' + JSON.stringify(ingredientsJson).substring(0, 100) + '...';
  }
}

// 将结果保存到文件
function saveResults(testName, data) {
  try {
    const resultsDir = path.resolve(__dirname, '../test_results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const cleanName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = path.join(resultsDir, `test_${cleanName}_${new Date().toISOString().replace(/:/g, '-')}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify({
      testName,
      date: new Date().toISOString(),
      resultCount: data.length,
      results: data.slice(0, 10) // 只保存前10条结果避免文件过大
    }, null, 2));
    
    console.log(`测试结果已保存到: ${filePath}`);
  } catch (err) {
    console.error('保存测试结果失败:', err);
  }
}

// 转换参数以匹配新版search_recipes函数并按字母顺序排列
function prepareParamsForRPC(params) {
  // 创建包含新参数的对象
  const newParams = {
    search_query: params.search_query,
    required_ingredients: params.required_ingredients,
    optional_ingredients: params.optional_ingredients,
    required_condiments: null,      // 新增
    optional_condiments: null,      // 新增
    dish_name_keywords: null,       // 新增
    cuisines: params.cuisines,
    flavors: params.flavors,
    difficulties: params.difficulties,
    dietary_restrictions: params.dietary_restrictions,
    required_ingredient_categories: null, // 新增
    optional_ingredient_categories: null, // 新增
    required_condiment_categories: null,  // 新增
    optional_condiment_categories: null,  // 新增
    page: params.page,
    page_size: params.page_size,
    sort_field: params.sort_field,
    sort_direction: params.sort_direction,
    return_all_results: params.return_all_results,
    debug_mode: params.debug_mode || false,  // 支持调试模式参数
    stabilize_results: params.stabilize_results || false, // 支持结果稳定性参数
    trgm_similarity_threshold: params.trgm_similarity_threshold || 0.2, // 支持相似度阈值参数
    forbidden_ingredients: params.forbidden_ingredients || null  // 支持忌口食材参数
  };
  
  // 检查数组参数，将空数组转为null
  for (const key of Object.keys(newParams)) {
    if (Array.isArray(newParams[key]) && newParams[key].length === 0) {
      console.log(`警告: 参数 ${key} 是空数组，将被转为null`);
      newParams[key] = null;
    }
  }
  
  // 确保排序字段有效
  const validSortFields = ['菜名', '菜系', '烹饪难度', 'relevance_score', 'created_at', 'updated_at'];
  if (!validSortFields.includes(newParams.sort_field)) {
    console.log(`警告: sort_field参数值 ${newParams.sort_field} 可能不受支持`);
  }
  
  // 按参数字母顺序排列（重要！这是为了匹配PostgreSQL RPC调用的要求）
  const alphaOrderedParams = {
    cuisines: newParams.cuisines,
    debug_mode: newParams.debug_mode,
    dietary_restrictions: newParams.dietary_restrictions,
    difficulties: newParams.difficulties,
    dish_name_keywords: newParams.dish_name_keywords,
    enable_semantic_search: true, // 默认启用语义搜索
    flavors: newParams.flavors,
    forbidden_ingredients: newParams.forbidden_ingredients, // 忌口食材参数
    optional_condiment_categories: newParams.optional_condiment_categories,
    optional_condiments: newParams.optional_condiments,
    optional_ingredient_categories: newParams.optional_ingredient_categories,
    optional_ingredients: newParams.optional_ingredients,
    page: newParams.page,
    page_size: newParams.page_size,
    preview_mode: false, // 默认不启用预览模式
    preview_page_count: 1, // 预览页数默认为1
    required_condiment_categories: newParams.required_condiment_categories,
    required_ingredient_categories: newParams.required_ingredient_categories,
    required_ingredients: newParams.required_ingredients,
    return_all_results: newParams.return_all_results,
    search_query: newParams.search_query,
    sort_direction: newParams.sort_direction,
    sort_field: newParams.sort_field,
    stabilize_results: newParams.stabilize_results, // 结果稳定性参数
    trgm_similarity_threshold: newParams.trgm_similarity_threshold // 相似度阈值参数
  };
  
  return alphaOrderedParams;
}

// 运行测试
async function runTests() {
  console.log('===== 开始RPC搜索测试(优化版) =====');

  for (const test of testCases) {
    console.log(`\n[测试] ${test.name}`);
    
    // 深拷贝参数以避免修改原始测试用例
    const params = JSON.parse(JSON.stringify(test.params));
    
    // 转换参数并按字母顺序排列
    const rpcParams = prepareParamsForRPC(params);
    
    console.log('RPC参数(按字母顺序):', JSON.stringify(rpcParams, null, 2));

    try {
      console.time('查询耗时');
      // 调用原始search_recipes函数，但使用按字母顺序排列的参数
      const { data, error, count } = await supabase.rpc('search_recipes', rpcParams);
      console.timeEnd('查询耗时');

      if (error) {
        console.error('测试失败! 错误详情:');
        console.error(`- 错误代码: ${error.code}`);
        console.error(`- 错误消息: ${error.message}`);
        console.error(`- 错误详情: ${error.details || 'none'}`);
        console.error(`- 错误提示: ${error.hint || 'none'}`);
        continue;
      }

      console.log(`成功! 找到 ${data.length} 条匹配的菜谱`);
      
      // 保存测试结果到文件
      saveResults(test.name, data);
      
      if (data.length > 0) {
        console.log('\n前5条结果:');
        data.slice(0, 5).forEach((recipe, index) => {
          console.log(`\n${index + 1}. ${recipe.菜名}`);
          console.log(JSON.stringify(formatRecipe(recipe), null, 2));
        });
        
        // 如果有性能统计数据，显示第一条记录的详细统计
        if (data[0].performance_details) {
          console.log('\n=== 性能统计详情 ===');
          console.log(JSON.stringify(data[0].performance_details, null, 2));
        }
      } else {
        console.log('未找到匹配的菜谱');
      }
    } catch (e) {
      console.error('测试执行出错:', e);
      if (e.stack) {
        console.error('错误堆栈:', e.stack);
      }
    }
  }

  console.log('\n===== 测试完成 =====');
}

// 执行测试
runTests().catch(err => {
  console.error('测试脚本执行失败:', err);
  if (err.stack) {
    console.error('错误堆栈:', err.stack);
  }
  process.exit(1);
});