'use client';

import React, { useMemo } from 'react';
import RecipeStepsUI from '../ui/RecipeStepsUI';
import { Recipe } from '../../types/recipe';

interface RecipeStepsProps {
  recipe: Recipe;
  preparationSteps?: string[];
  cookingSteps?: string[];
  className?: string;
}

/**
 * 统一的菜谱步骤组件 - 负责数据处理和自动分类步骤
 * 替代了之前的RecipeSteps和RecipeCookingSteps组件
 * 所有UI渲染交由RecipeStepsUI处理
 */
const RecipeSteps: React.FC<RecipeStepsProps> = ({
  recipe,
  preparationSteps: propPrepSteps,
  cookingSteps: propCookSteps,
  className
}) => {
  // 从菜谱中提取步骤，或使用属性传入的步骤
  const allSteps = useMemo(() => {
    // 使用recipe.steps作为主要步骤
    if (recipe?.steps && recipe.steps.length > 0) {
      return recipe.steps;
    }
    
    // 其次使用recipe.cookingSteps (如果有)
    if (recipe?.cookingSteps && recipe.cookingSteps.length > 0) {
      return recipe.cookingSteps;
    }
    
    return [];
  }, [recipe]);

  // 准备步骤
  const preparationSteps = useMemo(() => {
    // 优先使用传入的props
    if (propPrepSteps && propPrepSteps.length > 0) {
      return propPrepSteps;
    }
    
    // 其次使用recipe.preparationSteps
    if (recipe?.preparationSteps && recipe.preparationSteps.length > 0) {
      return recipe.preparationSteps;
    }
    
    return [];
  }, [recipe, propPrepSteps]);

  // 烹饪步骤
  const cookingSteps = useMemo(() => {
    // 优先使用传入的props
    if (propCookSteps && propCookSteps.length > 0) {
      return propCookSteps;
    }
    
    // 其次使用recipe.cookingSteps
    if (recipe?.cookingSteps && recipe.cookingSteps.length > 0) {
      return recipe.cookingSteps;
    }
    
    return [];
  }, [recipe, propCookSteps]);

  // 决定是否使用组合模式
  const showCombinedSteps = useMemo(() => {
    return (preparationSteps.length === 0 || cookingSteps.length === 0) && allSteps.length > 0;
  }, [preparationSteps, cookingSteps, allSteps]);

  // 如果既没有步骤也没有准备/烹饪步骤，则不显示
  if (allSteps.length === 0 && preparationSteps.length === 0 && cookingSteps.length === 0) {
    return null;
  }

  // 使用UI组件显示
  return (
    <RecipeStepsUI
      preparationSteps={preparationSteps}
      cookingSteps={cookingSteps}
      combinedSteps={allSteps as string[]}
      showCombinedSteps={showCombinedSteps}
      className={className}
    />
  );
};

export default RecipeSteps; 