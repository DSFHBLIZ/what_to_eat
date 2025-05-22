'use client';

import { useState, useEffect, useCallback } from 'react';
import RecipeList from '../RecipeList';
import { Recipe } from '../../types/recipe';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import { searchRecipes } from '../../utils/recipe/searchService';

/**
 * 菜谱容器组件 
 * 负责数据获取、筛选逻辑、状态管理，UI渲染委托给RecipeList
 */
export default function RecipeContainer() {
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [attemptCount, setAttemptCount] = useState(0); // 重试次数追踪

  const { searchState } = useUnifiedSearchController();
  
  const { 
    searchQuery,
    requiredIngredients, 
    optionalIngredients,
    cuisines,
    flavors,
    difficulties,
    dietaryRestrictions
  } = searchState;

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 通过API获取真实数据，而不是使用示例数据
        const response = await fetch('/api/recipes');
        if (!response.ok) {
          throw new Error(`API错误: ${response.status}`);
        }
        
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('未获取有效的菜谱数据');
        }
        
        setAllRecipes(data);
        console.log('已加载数据:', data.length, '个菜谱');
        setLoading(false);
      } catch (e) {
        console.error('无法加载数据:', e);
        setError('加载菜谱数据失败');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 重新加载数据的处理函数
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttemptCount(prev => prev + 1);
    
    const loadData = async () => {
      try {
        const response = await fetch('/api/recipes');
        if (!response.ok) {
          throw new Error(`API错误: ${response.status}`);
        }
        
        const data = await response.json();
        setAllRecipes(data);
        setLoading(false);
      } catch (e) {
        console.error('重试加载数据失败:', e);
        setError('重试加载菜谱数据失败，请稍后再试');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 当筛选条件变化时，重新过滤菜谱
  useEffect(() => {
    if (allRecipes.length === 0) return;

    setLoading(true);
    
    try {
      // 判断是否有筛选条件
      const hasFilters = 
        requiredIngredients.length > 0 || 
        optionalIngredients.length > 0 ||
        cuisines.length > 0 ||
        flavors.length > 0 ||
        difficulties.length > 0 ||
        dietaryRestrictions.length > 0 ||
        searchQuery.trim() !== '';
      
      if (!hasFilters) {
        // 如果没有筛选条件，显示所有菜谱
        setRecipes(allRecipes);
      } else {
        // 使用统一的searchRecipes函数进行筛选
        const filteredRecipes = searchRecipes(allRecipes, {
          query: searchQuery.trim() !== '' ? searchQuery : undefined,
          requiredIngredients: requiredIngredients.map((item: { tag: string; type: string }) => item.tag),
          optionalIngredients: optionalIngredients.map((item: { tag: string; type: string }) => item.tag),
          flavors,
          cuisines,
          dietaryRestrictions
        });
        
        setRecipes(filteredRecipes);
      }
    } catch (error) {
      console.error('筛选菜谱时出错:', error);
      setError('筛选菜谱失败');
    } finally {
      // 延迟200ms关闭加载状态，避免UI闪烁
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  }, [
    allRecipes, 
    requiredIngredients, 
    optionalIngredients, 
    cuisines, 
    flavors, 
    difficulties,
    dietaryRestrictions, 
    searchQuery,
    attemptCount // 包含重试计数，以便在重试时触发
  ]);

  // 将状态和事件处理函数传递给RecipeList组件
  return (
    <div className="mt-8">
      <RecipeList 
        recipes={recipes}
        loading={loading}
        emptyMessage="没有找到符合条件的菜谱，请尝试其他筛选条件"
        onRetry={handleRetry}
        error={error}
        searchTerm={searchQuery}
      />
    </div>
  );
} 