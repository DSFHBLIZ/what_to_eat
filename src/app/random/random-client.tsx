'use client';

import React, { useEffect, useState } from 'react';
import { Recipe } from '../../types/recipe';
import RecipeCard from '../../components/RecipeCard';
import { Loader2, RefreshCw, AlertCircle, ArrowDownAZ, Home } from 'lucide-react';
import Link from 'next/link';
import { fetchRecipes } from '../../utils/data/dataService';
import { safeArray } from '../../utils/common/safeTypeConversions';
import WithSkeleton from '../../components/ui/WithSkeleton';

interface RandomRecipesClientProps {
  initialCount?: number;
}

export default function RandomRecipesClient({ initialCount = 6 }: RandomRecipesClientProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(initialCount);

  // 加载随机食谱
  const loadRandomRecipes = async (recipeCount = count) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recipes/random?count=${recipeCount}`);
      
      if (!response.ok) {
        throw new Error(`获取随机推荐失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRecipes(data);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('获取随机推荐时发生未知错误');
      }
    } catch (err) {
      console.error('随机推荐加载失败:', err);
      setError(err instanceof Error ? err.message : '加载随机推荐失败');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadRandomRecipes();
  }, []);

  return (
    <div className="container">
      {/* 标题和刷新按钮 */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">随机推荐</h1>
        
        {!loading && (
          <button
            onClick={() => loadRandomRecipes()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            <RefreshCw size={16} />
            换一批
          </button>
        )}
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadRandomRecipes()}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            重试
          </button>
        </div>
      )}
      
      {/* 使用WithSkeleton组件替代条件渲染 */}
      <WithSkeleton loading={loading && !error} variant="grid" count={count}>
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">没有找到任何食谱，请稍后再试。</p>
            <button
              onClick={() => loadRandomRecipes()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              重试
            </button>
          </div>
        )}
      </WithSkeleton>
      
      {/* 数量选择器 */}
      {!loading && recipes.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <p className="text-gray-600">想要更多或更少的推荐？</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-700">显示数量:</span>
            <select
              value={count}
              onChange={(e) => {
                const newCount = parseInt(e.target.value, 10);
                setCount(newCount);
                loadRandomRecipes(newCount);
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[3, 6, 9, 12, 15, 18].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
} 