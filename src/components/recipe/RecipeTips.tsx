'use client';

import React, { useMemo } from 'react';
import { memo } from 'react';
import { Recipe } from '../../types/recipe';
import RecipeTipsSectionUI from '../ui/RecipeTipsSectionUI';

interface RecipeTipsProps {
  // 基本提示信息
  tips?: string[];
  
  // 完整菜谱对象
  recipe?: Recipe;
  
  // 其他配置
  title?: string;
  className?: string;
  
  // 额外信息
  cookingMethods?: string[];
  dietaryRestrictions?: string[];
}

/**
 * 统一的菜谱小贴士组件
 * 合并了RecipeTips和RecipeTipsSection的功能
 */
const RecipeTips = ({
  tips: propTips,
  recipe,
  title,
  className = '',
  cookingMethods: propCookingMethods,
  dietaryRestrictions: propDietaryRestrictions
}: RecipeTipsProps) => {
  // 处理小贴士数据
  const formattedTips = useMemo(() => {
    // 优先使用传入的props
    if (propTips && propTips.length > 0) {
      return propTips;
    }
    
    // 其次从菜谱对象中提取
    if (recipe && recipe.cookingTips && recipe.cookingTips.length > 0) {
      return recipe.cookingTips;
    }
    
    return [];
  }, [recipe, propTips]);

  // 处理烹饪方法
  const cookingMethods = useMemo(() => {
    if (propCookingMethods) {
      return propCookingMethods;
    }
    
    if (recipe?.cookingMethod) {
      return Array.isArray(recipe.cookingMethod) ? recipe.cookingMethod : [];
    }
    
    return [];
  }, [recipe, propCookingMethods]);

  // 处理饮食限制
  const dietaryRestrictions = useMemo(() => {
    if (propDietaryRestrictions) {
      return propDietaryRestrictions;
    }
    
    if (recipe?.dietaryRestrictions) {
      return Array.isArray(recipe.dietaryRestrictions) ? recipe.dietaryRestrictions : [];
    }
    
    return [];
  }, [recipe, propDietaryRestrictions]);

  // 合并所有提示信息
  const allTips = useMemo(() => {
    const tips = [...formattedTips];
    
    // 添加烹饪方法提示
    if (cookingMethods.length > 0) {
      tips.push(`烹饪方法: ${cookingMethods.join('、')}`);
    }
    
    // 添加饮食限制提示
    if (dietaryRestrictions.length > 0) {
      tips.push(`饮食特性: ${dietaryRestrictions.join('、')}`);
    }
    
    return tips;
  }, [formattedTips, cookingMethods, dietaryRestrictions]);

  // 如果没有任何提示信息，则不显示
  if (allTips.length === 0) {
    return null;
  }

  // 使用UI组件显示
  return (
    <RecipeTipsSectionUI
      tips={allTips}
      className={className}
    />
  );
};

export default memo(RecipeTips); 