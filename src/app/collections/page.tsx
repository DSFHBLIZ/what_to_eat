'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Recipe } from '../../types/recipe';
import { 
  getLocalStorageItem, 
  setLocalStorageItem
} from '../../utils/data/localStorage';
import { Home } from 'lucide-react';
import RecipeCard from '../../components/RecipeCard';

// 安全处理数组切片的辅助函数
function safeArraySlice<T>(arr: T[] | undefined | null, start: number, end?: number): T[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.slice(start, end);
}

export default function CollectionsPage() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从本地存储加载收藏的菜谱
    try {
      console.log('[CollectionsPage] 开始加载收藏菜谱数据');

      // 调试：输出localStorage所有键
      console.log('[CollectionsPage] localStorage所有键:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          console.log(`[CollectionsPage] localStorage[${i}]: ${key}`);
        }
      }

      const savedIds = getLocalStorageItem<string[]>('savedRecipes', [], 'CollectionsPage');
      console.log('[CollectionsPage] 加载到的savedRecipes:', savedIds);
      
      if (savedIds.length === 0) {
        setLoading(false);
        return;
      }
      
      // 这里可以从API获取完整的菜谱信息
      // 目前我们使用一个模拟实现，前端存储完整菜谱对象
      const savedRecipesData = getLocalStorageItem<Recipe[]>('savedRecipesData', [], 'CollectionsPage');
      console.log('[CollectionsPage] 加载到的savedRecipesData:', savedRecipesData.map(r => ({id: r.id, name: r.name})));
      
      setSavedRecipes(savedRecipesData);
      setLoading(false);
    } catch (error) {
      console.error('加载收藏菜谱失败:', error);
      setLoading(false);
    }

    // 添加存储变化监听器
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'savedRecipes' || event.key === 'savedRecipesData') {
        console.log('[CollectionsPage] 检测到本地存储变化，重新加载收藏菜谱');
        try {
          const savedIds = getLocalStorageItem<string[]>('savedRecipes', [], 'CollectionsPage');
          const savedRecipesData = getLocalStorageItem<Recipe[]>('savedRecipesData', [], 'CollectionsPage');
          setSavedRecipes(savedRecipesData);
        } catch (error) {
          console.error('重新加载收藏菜谱失败:', error);
        }
      }
    };

    // 添加自定义事件监听，用于内部收藏状态变化
    const handleFavoriteChange = () => {
      console.log('[CollectionsPage] 检测到favoritechange事件，重新加载收藏菜谱');
      try {
        const savedIds = getLocalStorageItem<string[]>('savedRecipes', [], 'CollectionsPage');
        const savedRecipesData = getLocalStorageItem<Recipe[]>('savedRecipesData', [], 'CollectionsPage');
        setSavedRecipes(savedRecipesData);
      } catch (error) {
        console.error('重新加载收藏菜谱失败:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoritechange', handleFavoriteChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritechange', handleFavoriteChange);
    };
  }, []);

  const removeFromSaved = (id: string) => {
    // 更新收藏菜谱ID列表
    const currentIds = getLocalStorageItem<string[]>('savedRecipes', [], 'CollectionsPage');
    const updatedIds = currentIds.filter((recipeId: string) => recipeId !== id);
    setLocalStorageItem('savedRecipes', updatedIds, 'CollectionsPage');
    
    // 更新收藏菜谱详情
    const currentSaved = [...savedRecipes];
    const updatedSaved = currentSaved.filter(recipe => recipe.id !== id);
    setSavedRecipes(updatedSaved);
    setLocalStorageItem('savedRecipesData', updatedSaved, 'CollectionsPage');
  };

  // 处理收藏切换
  const handleFavoriteToggle = (recipeId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      removeFromSaved(recipeId);
    }
  };

  return (
    <div className="container mx-auto py-8 bg-white">
      {/* 面包屑导航 */}
      <div className="mb-6 flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-indigo-600 flex items-center">
          <Home size={14} className="mr-1" />
          首页
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">收藏夹</span>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-6">收藏夹</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ) : savedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRecipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">还没有收藏菜谱</h3>
          <p className="text-gray-600 mb-6">
            浏览菜谱并点击收藏按钮，这里会显示您保存的所有菜谱
          </p>
          <Link 
            href="/recipes"
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
          >
            浏览菜谱
          </Link>
        </div>
      )}
    </div>
  );
} 