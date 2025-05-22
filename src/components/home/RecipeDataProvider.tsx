'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Recipe } from '../../types/recipe';
import { fetchRecipes } from '../../utils/data/dataService';
import { logInfo } from '../../utils';

// 创建上下文
interface RecipeDataContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
}

const RecipeDataContext = createContext<RecipeDataContextType>({
  recipes: [],
  loading: true,
  error: null
});

// 导出自定义Hook
export const useRecipeData = () => useContext(RecipeDataContext);

interface RecipeDataProviderProps {
  initialRecipes?: Recipe[];
  children: ReactNode;
}

/**
 * 菜谱数据提供者组件
 * 负责加载和管理菜谱数据
 */
export const RecipeDataProvider: React.FC<RecipeDataProviderProps> = ({
  initialRecipes = [],
  children
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 加载数据
  useEffect(() => {
    const safeInitialRecipes = Array.isArray(initialRecipes) ? initialRecipes : [];
    logInfo('RecipeDataProvider', 'init', `初始化数据提供者，初始菜谱数量: ${safeInitialRecipes.length}`);
    
    // 添加重试次数限制
    let retryCount = 0;
    const MAX_RETRIES = 1; // 最多只重试一次，失败后直接使用备用数据
    
    const loadData = async () => {
      setLoading(true);
      
      try {
        // 尝试加载数据
        logInfo('RecipeDataProvider', 'loadData', '尝试从数据服务加载数据');
        const { recipes: loadedRecipes } = await fetchRecipes();
        
        if (loadedRecipes && loadedRecipes.length > 0) {
          logInfo('RecipeDataProvider', 'loadData', `成功加载${loadedRecipes.length}个菜谱`);
          setRecipes(loadedRecipes);
        } else {
          // 如果没有数据，则使用空数组或默认初始数据
          logInfo('RecipeDataProvider', 'loadData', `数据服务无数据，使用初始数据`);
          setRecipes(safeInitialRecipes);
          setError("未能获取菜谱数据");
        }
      } catch (err) {
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          logInfo('RecipeDataProvider', 'loadData', `加载失败，尝试重试 ${retryCount}/${MAX_RETRIES}`);
          // 延迟500ms后重试
          setTimeout(loadData, 500);
          return;
        }
        
        // 超过重试次数，使用初始数据
        logInfo('RecipeDataProvider', 'loadData', 
          `数据服务连接失败，已达到最大重试次数，使用初始数据。错误: ${err instanceof Error ? err.message : String(err)}`);
        setRecipes(safeInitialRecipes);
        setError("无法连接到数据服务");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // 设置全局更新函数，用于后台加载完成后更新数据
    if (typeof window !== 'undefined') {
      // @ts-ignore - 全局更新函数
      window.updateRecipesCache = (newRecipes: Recipe[]) => {
        logInfo('RecipeDataProvider', 'updateCache', `接收到后台加载的${newRecipes.length}条菜谱数据，更新状态...`);
        setRecipes(newRecipes);
      };
    }
    
    // 尝试从sessionStorage加载额外数据
    if (typeof window !== 'undefined') {
      try {
        const additionalRecipesStr = sessionStorage.getItem('additionalRecipes');
        if (additionalRecipesStr) {
          const additionalRecipes = JSON.parse(additionalRecipesStr);
          if (Array.isArray(additionalRecipes) && additionalRecipes.length > 0) {
            logInfo('RecipeDataProvider', 'loadCache', `从sessionStorage恢复了${additionalRecipes.length}条额外菜谱数据`);
            // 合并菜谱数据
            const allRecipes = [...recipes, ...additionalRecipes];
            setRecipes(allRecipes);
          }
        }
      } catch (e) {
        console.warn('从sessionStorage恢复额外数据失败:', e);
      }
    }
  }, [initialRecipes, recipes]);

  // 提供数据给子组件
  const contextValue: RecipeDataContextType = {
    recipes,
    loading,
    error
  };

  return (
    <RecipeDataContext.Provider value={contextValue}>
      {children}
    </RecipeDataContext.Provider>
  );
};

export default RecipeDataProvider; 