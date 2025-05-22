'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchRecipes } from '../../../utils/data/dataService';

export default function InspectDataPage() {
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        const { recipes } = await fetchRecipes({});
        if (recipes && recipes.length > 0) {
          setRecipe(recipes[0]);
          console.log('加载的第一个菜谱:', recipes[0]);
        } else {
          setError('未找到菜谱数据');
        }
      } catch (err) {
        console.error('加载数据出错:', err);
        setError('加载数据失败');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  function renderValue(value: any): React.ReactNode {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return (
          <div className="pl-4 border-l-2 border-gray-200">
            {value.map((item, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">{index}: </span>
                {renderValue(item)}
              </div>
            ))}
          </div>
        );
      }
      
      return (
        <div className="pl-4 border-l-2 border-gray-200">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="mb-1">
              <span className="text-indigo-500">{key}: </span>
              {renderValue(val)}
            </div>
          ))}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  }
  
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">数据结构检查</h1>
        <p className="text-gray-600">查看从Supabase加载的原始菜谱数据结构</p>
      </div>
      
      <div className="mb-4">
        <Link href="/debug" className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
          返回调试面板
        </Link>
      </div>
      
      {loading ? (
        <div className="animate-pulse bg-gray-100 h-40 rounded"></div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded text-red-700">{error}</div>
      ) : recipe ? (
        <div className="bg-white p-6 rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-4">菜谱数据结构</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">基本信息</h3>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium">ID:</span> {recipe.id}</div>
                <div><span className="font-medium">名称:</span> {recipe.name}</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">食材（型别: {typeof recipe.ingredients}）</h3>
              {Array.isArray(recipe.ingredients) ? (
                <div className="bg-gray-50 p-4 rounded">
                  {recipe.ingredients.map((ingredient: any, index: number) => (
                    <div key={index} className="mb-2">
                      <div><strong>索引 {index}</strong></div>
                      <div><strong>类型:</strong> {typeof ingredient}</div>
                      <div><strong>值:</strong> {renderValue(ingredient)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-red-500">食材不是数组: {String(recipe.ingredients)}</div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">调料（型别: {typeof recipe.seasonings}）</h3>
              {Array.isArray(recipe.seasonings) ? (
                <div className="bg-gray-50 p-4 rounded">
                  {recipe.seasonings.map((seasoning: any, index: number) => (
                    <div key={index} className="mb-2">
                      <div><strong>索引 {index}</strong></div>
                      <div><strong>类型:</strong> {typeof seasoning}</div>
                      <div><strong>值:</strong> {renderValue(seasoning)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-red-500">调料不是数组: {String(recipe.seasonings)}</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded">
          <p className="text-gray-700">未找到菜谱数据</p>
        </div>
      )}
    </div>
  );
} 
