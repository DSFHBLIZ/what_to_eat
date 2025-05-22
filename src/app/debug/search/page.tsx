'use client';

import React, { useState } from 'react';
import { searchRecipes } from '../../../utils/data/dataService';

interface Ingredient {
  name: string;
  amount?: string;
}

// 自定义Recipe接口
interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  difficulty: string;
  ingredients?: Ingredient[];
  relevance_score?: number;
  performance_details?: any;
  _raw?: any;
}

export default function SearchDebugPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [requiredIngredients, setRequiredIngredients] = useState<string>('');
  const [optionalIngredients, setOptionalIngredients] = useState<string>('');
  const [avoidIngredients, setAvoidIngredients] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [debugMode, setDebugMode] = useState(true);
  const [performanceDetails, setPerformanceDetails] = useState<any>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // 解析食材输入（以逗号分隔）
      const requiredArray = requiredIngredients.split(',').map(s => s.trim()).filter(Boolean);
      const optionalArray = optionalIngredients.split(',').map(s => s.trim()).filter(Boolean);
      const avoidArray = avoidIngredients.split(',').map(s => s.trim()).filter(Boolean);

      const { recipes, total, error } = await searchRecipes({
        searchQuery,
        requiredIngredients: requiredArray,
        optionalIngredients: optionalArray,
        avoidIngredients: avoidArray,
        cuisines: [],
        flavors: [],
        difficulties: [],
        dietaryRestrictions: [],
        page: 1,
        pageSize: 50,
        sortField: 'relevance_score',
        sortDirection: 'desc',
        queryEmbedding: null,
        enableSemanticSearch: false
      });

      setResults(recipes as any[]);
      setTotalResults(total || 0);
      
      // 提取性能详情
      if (recipes.length > 0 && (recipes[0] as any).performance_details) {
        setPerformanceDetails((recipes[0] as any).performance_details);
      }
    } catch (error) {
      console.error("搜索错误:", error);
      alert(`搜索错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">搜索功能调试页面</h1>
      <p className="mb-4 text-gray-600">此页面用于测试改进的搜索功能，特别是中文短词匹配和忌口食材处理。</p>

      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-2 font-medium">搜索关键词:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="例如：家常菜"
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium">必选食材 (逗号分隔):</label>
            <input
              type="text"
              value={requiredIngredients}
              onChange={(e) => setRequiredIngredients(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="例如：葱,蒜,姜"
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium">可选食材 (逗号分隔):</label>
            <input
              type="text"
              value={optionalIngredients}
              onChange={(e) => setOptionalIngredients(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="例如：土豆,胡萝卜"
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium">忌口食材 (逗号分隔):</label>
            <input
              type="text"
              value={avoidIngredients}
              onChange={(e) => setAvoidIngredients(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="例如：洋葱,香菜"
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={previewMode}
                onChange={(e) => setPreviewMode(e.target.checked)}
                className="mr-2"
              />
              预览模式 (返回更多分页结果)
            </label>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="mr-2"
              />
              调试模式 (返回性能详情)
            </label>
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className={`mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? '搜索中...' : '执行搜索'}
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">搜索结果: {totalResults} 个匹配项</h2>
        
        {performanceDetails && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">性能指标</h3>
            <div className="text-sm font-mono overflow-x-auto">
              <pre>{JSON.stringify(performanceDetails, null, 2)}</pre>
            </div>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((recipe) => (
            <div key={recipe.id} className="border rounded p-4 hover:shadow-md">
              <h3 className="font-bold">{recipe.name}</h3>
              <p>菜系: {recipe.cuisine}</p>
              <p>难度: {recipe.difficulty}</p>
              <p className="mt-2">
                <small className="text-gray-500">相关性分数: {recipe.relevance_score?.toFixed(2) || '无'}</small>
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600">查看详情</summary>
                <div className="mt-2 text-sm">
                  <p>食材:</p>
                  <ul className="list-disc pl-5">
                    {recipe.ingredients?.map((ingredient: Ingredient, i: number) => (
                      <li key={i}>{ingredient.name} ({ingredient.amount || '未指定'})</li>
                    ))}
                  </ul>
                </div>
              </details>
            </div>
          ))}
        </div>
        
        {results.length === 0 && !isLoading && (
          <p className="text-gray-500">暂无结果。请尝试其他搜索条件。</p>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-bold mb-2">测试场景建议</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>中文短词测试:</strong> 尝试搜索"葱"和"小葱"，"猪"和"猪肉"等短词，看是否能正确匹配
          </li>
          <li>
            <strong>忌口食材:</strong> 尝试必选和忌口添加相同食材，看是否能正确处理冲突
          </li>
          <li>
            <strong>可选食材排序:</strong> 添加多个可选食材，查看它们是否能正确影响排序
          </li>
        </ol>
      </div>
    </div>
  );
} 