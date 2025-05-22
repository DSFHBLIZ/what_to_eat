'use client';

import { useState } from 'react';
import { searchRecipes } from '../../../utils/data/dataService';
import Link from 'next/link';

// 调试测试用的简化版Recipe类型
interface SimpleRecipe {
  id: string;
  name: string;
  cuisine?: string;
  flavors: string[];
  difficulty?: string;
}

export default function FilterTestPage() {
  const [recipes, setRecipes] = useState<SimpleRecipe[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 测试不同的过滤条件
  const filterTests = [
    {
      name: '测试1: 单个口味特点 - 麻辣',
      filters: { flavors: ['麻辣'] }
    },
    {
      name: '测试2: 多个口味特点 - 麻辣或酸甜',
      filters: { flavors: ['麻辣', '酸甜'] }
    },
    {
      name: '测试3: 单个烹饪难度 - 简单',
      filters: { difficulties: ['简单'] }
    },
    {
      name: '测试4: 多个烹饪难度 - 简单或中等',
      filters: { difficulties: ['简单', '中等'] }
    },
    {
      name: '测试5: 组合过滤 - 川菜 + 麻辣',
      filters: { cuisines: ['川菜'], flavors: ['麻辣'] }
    },
    {
      name: '测试6: 烹饪难度 - 10分钟',
      filters: { difficulties: ['10分钟'] }
    },
    {
      name: '测试7: 烹饪难度 - 10分钟 (带额外空格)',
      filters: { difficulties: [' 10分钟 '] }
    },
    {
      name: '测试8: 烹饪难度 - 30分钟',
      filters: { difficulties: ['30分钟'] }
    }
  ];
  
  async function runTest(filters: any) {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`执行查询，过滤条件:`, filters);
      
      // 如果包含烹饪难度，添加调试日志
      if (filters.difficulties) {
        console.log(`烹饪难度过滤值:`, filters.difficulties);
      }
      
      // 调用新的searchRecipes函数代替queryRecipesFromSupabase
      const result = await searchRecipes({
        searchQuery: '',
        requiredIngredients: [],
        optionalIngredients: [],
        cuisines: filters.cuisines || [],
        flavors: filters.flavors || [],
        difficulties: filters.difficulties || [],
        dietaryRestrictions: [],
        avoidIngredients: [],
        page: 1,
        pageSize: 100,
        sortField: 'relevance_score',
        sortDirection: 'desc',
        queryEmbedding: null,
        enableSemanticSearch: false
      });
      
      if (result.error) {
        console.error(`查询失败:`, result.error);
        setError(`查询失败: ${result.error}`);
        setRecipes([]);
        setCount(0);
      } else {
        console.log(`查询成功，获取到 ${result.total} 条结果`);
        // 记录第一条结果的原始数据格式以便调试
        if (result.recipes && result.recipes.length > 0) {
          console.log(`第一条结果烹饪难度数据:`, result.recipes[0].difficulty);
        }
        
        // 简化的数据转换，只提取需要显示的字段
        const convertedRecipes = result.recipes.map(item => ({
          id: item.id || '',
          name: item.name || '未命名菜谱',
          cuisine: item.cuisine,
          flavors: Array.isArray(item.flavors) ? item.flavors : [],
          difficulty: Array.isArray(item.difficulty) ? item.difficulty[0] : (typeof item.difficulty === 'string' ? item.difficulty : '未知')
        })) as SimpleRecipe[];
        
        setRecipes(convertedRecipes);
        setCount(result.total || 0);
      }
    } catch (err) {
      setError(`执行查询时发生错误: ${err instanceof Error ? err.message : String(err)}`);
      setRecipes([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">过滤功能测试页面</h1>
      <p className="mb-4">此页面用于测试JSONB过滤功能，特别是口味特点和烹饪难度的查询。</p>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">测试集</h2>
        <div className="space-y-2">
          {filterTests.map((test, index) => (
            <div key={index} className="p-2 border rounded">
              <h3 className="font-semibold">{test.name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                过滤条件: {JSON.stringify(test.filters)}
              </p>
              <button 
                onClick={() => runTest(test.filters)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                运行测试
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {loading && <div className="text-blue-500">加载中...</div>}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {!loading && recipes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">查询结果 (共 {count} 条)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(recipe => (
              <div key={recipe.id} className="border p-3 rounded shadow">
                <h3 className="font-bold">{recipe.name}</h3>
                <div className="text-sm">
                  <p>菜系: {recipe.cuisine || '未分类'}</p>
                  <p>口味: {recipe.flavors.length > 0 ? recipe.flavors.join(', ') : '未标记'}</p>
                  <p>难度: {recipe.difficulty || '未标记'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && recipes.length === 0 && !error && (
        <div className="text-gray-500">无匹配结果</div>
      )}
      
      <div className="mt-8">
        <Link href="/debug" className="text-blue-500 hover:underline">
          返回调试主页
        </Link>
      </div>
    </div>
  );
} 