'use client';

import React from 'react';
import { Recipe } from '../../types/recipe';
import RecipeIngredientsUI from '../ui/RecipeIngredientsUI';
import { useRecipeData } from '../../hooks/useRecipeData';

interface RecipeIngredientsProps {
  recipe?: Recipe;
  ingredients?: Array<string | { name: string; quantity?: string; amount?: string; }>;
  seasonings?: Array<string | { name: string; quantity?: string; amount?: string; }>;
  className?: string;
}

/**
 * 菜谱食材/调料组件 - 负责数据处理
 * 所有UI渲染交由RecipeIngredientsUI处理
 */
const RecipeIngredients = ({
  recipe,
  ingredients: propIngredients,
  seasonings: propSeasonings,
  className
}: RecipeIngredientsProps) => {
  // 使用统一的useRecipeData hook处理数据
  const { processRecipeData } = useRecipeData();
  
  // 如果有recipe对象，则处理整个菜谱
  let formattedIngredients = [];
  let formattedSeasonings = [];
  
  if (recipe) {
    // 使用处理好的菜谱数据
    const processedData = processRecipeData(recipe);
    formattedIngredients = processedData.processedIngredients;
    formattedSeasonings = processedData.processedSeasonings;
  } else {
    // 直接处理传入的props
    const tempRecipe = {
      ingredients: propIngredients || [],
      seasonings: propSeasonings || []
    } as Recipe;
    
    const processedData = processRecipeData(tempRecipe);
    formattedIngredients = processedData.processedIngredients;
    formattedSeasonings = processedData.processedSeasonings;
  }

  // 如果没有食材和调料，则不显示
  if (formattedIngredients.length === 0 && formattedSeasonings.length === 0) {
    return null;
  }

  // 使用UI组件显示
  return (
    <RecipeIngredientsUI
      ingredients={formattedIngredients}
      seasonings={formattedSeasonings}
      className={className}
    />
  );
};

export default RecipeIngredients; 