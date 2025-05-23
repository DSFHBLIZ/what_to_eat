'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TodayPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRandomRecipe() {
      try {
        setLoading(true);
        console.log('今日菜谱: 客户端开始获取随机菜谱');
        
        // 确定API基础URL
        const baseUrl = window.location.origin;
        console.log('今日菜谱: 使用基础URL', baseUrl);
        
        // 获取随机菜谱
        const response = await fetch(
          `${baseUrl}/api/recipes/random?cuisine=中餐-家常菜`,
          { cache: 'no-store' }
        );
        
        console.log('今日菜谱: 随机API响应状态:', response.status);
        
        if (!response.ok) {
          throw new Error(`获取随机菜谱失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('今日菜谱: 获取到随机菜谱数据:', data);
        
        if (!data || !data.id) {
          throw new Error('未找到有效的菜谱数据');
        }
        
        // 再次验证菜谱ID
        const recipeId = data.id;
        console.log('今日菜谱: 菜谱ID =', recipeId);
        
        // 验证菜谱详情
        console.log(`今日菜谱: 验证菜谱详情API: ${baseUrl}/api/recipes/${recipeId}`);
        const verifyResponse = await fetch(
          `${baseUrl}/api/recipes/${recipeId}`,
          { cache: 'no-store' }
        );
        
        console.log('今日菜谱: 详情API响应状态:', verifyResponse.status);
        
        if (!verifyResponse.ok) {
          throw new Error(`验证菜谱详情失败: ${verifyResponse.status} ${verifyResponse.statusText}`);
        }
        
        const recipeData = await verifyResponse.json();
        console.log('今日菜谱: 获取到菜谱详情数据:', recipeData);
        
        // 重定向到菜谱详情页
        console.log(`今日菜谱: 准备重定向到 /recipe/${recipeId}`);
        router.push(`/recipe/${recipeId}`);
      } catch (err) {
        console.error('今日菜谱获取失败:', err);
        setError(err instanceof Error ? err.message : '获取随机菜谱时发生未知错误');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRandomRecipe();
  }, [router]);
  
  if (error) {
    return (
      <main className="min-h-screen bg-white pb-10">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">今日菜谱</h1>
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-red-500">
              {error}
            </div>
          </div>
          <div className="mt-4 text-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              重试
            </button>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">今日菜谱</h1>
        <div className="flex justify-center items-center min-h-[50vh]">
          {loading ? (
            <div className="flex items-center text-gray-500">
              <svg className="animate-spin h-10 w-10 mr-3" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="ml-2">获取今日推荐菜谱中...</span>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
} 