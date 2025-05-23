'use client';

import React, { useState, useEffect } from 'react';
import { Recipe } from '../../types/recipe';
import RecipeCard from '../RecipeCard';
import { Loader2 } from 'lucide-react';

interface RelatedRecipesProps {
  currentRecipe: Recipe;
  className?: string;
}

/**
 * 相关菜谱推荐组件
 * 基于当前菜谱的菜系、口味等特征推荐相关菜谱，提升SEO内链
 */
export default function RelatedRecipes({ currentRecipe, className = '' }: RelatedRecipesProps) {
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedRecipes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 构建搜索参数，基于当前菜谱的特征
        const searchParams = new URLSearchParams();
        
        // 如果有菜系，按菜系搜索
        if (currentRecipe.cuisine) {
          searchParams.append('cuisine', currentRecipe.cuisine);
        }
        
        // 如果有口味，按口味搜索
        if (currentRecipe.flavors && Array.isArray(currentRecipe.flavors)) {
          currentRecipe.flavors.slice(0, 2).forEach(flavor => {
            searchParams.append('flavor', flavor);
          });
        }
        
        // 设置搜索参数
        searchParams.append('tagLogic', 'OR');
        searchParams.append('page', '1');
        searchParams.append('limit', '6'); // 获取6个相关菜谱
        
        const response = await fetch(`/api/recipes/search?${searchParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('获取相关菜谱失败');
        }
        
        const data = await response.json();
        
        // 过滤掉当前菜谱，最多显示4个相关菜谱
        const filtered = (data.recipes || [])
          .filter((recipe: Recipe) => recipe.id !== currentRecipe.id)
          .slice(0, 4);
        
        setRelatedRecipes(filtered);
      } catch (err) {
        console.error('获取相关菜谱失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    if (currentRecipe?.id) {
      fetchRelatedRecipes();
    }
  }, [currentRecipe]);

  if (loading) {
    return (
      <div className={`related-recipes ${className}`}>
        <h2 className="text-xl font-bold mb-4">相关推荐</h2>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>加载相关菜谱中...</span>
        </div>
      </div>
    );
  }

  if (error || relatedRecipes.length === 0) {
    return null; // 如果出错或没有相关菜谱，就不显示这个区域
  }

  return (
    <div className={`related-recipes ${className}`}>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          相关推荐菜谱
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          基于相同菜系和口味为您推荐的其他美味菜谱
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {relatedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              className="h-full"
              showFavoriteButton={false} // 在相关推荐中不显示收藏按钮，保持简洁
              onClick={() => {
                // 在当前标签页打开，有利于用户浏览和SEO
                window.location.href = `/recipe/${recipe.id}`;
              }}
            />
          ))}
        </div>
        
        {/* SEO优化：添加描述性文本 */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            喜欢《{currentRecipe.name}》的朋友还经常搜索：
            {currentRecipe.cuisine && `${currentRecipe.cuisine}菜谱、`}
            {currentRecipe.flavors && Array.isArray(currentRecipe.flavors) && 
              currentRecipe.flavors.slice(0, 2).map(flavor => `${flavor}味菜谱`).join('、')
            }
          </p>
        </div>
      </div>
    </div>
  );
} 