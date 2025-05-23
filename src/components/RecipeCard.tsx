'use client';

import React, { useEffect, useState } from 'react';
import { Recipe } from '../types/recipe';
import { highlightText } from '../utils/highlightUtils';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TagWrapper from './ui/TagWrapper';
import { isFavorite, toggleFavorite } from '../utils/favorite';
import FavoriteButton from './ui/FavoriteButton';
import { formatCookingTime } from '../utils/recipe';

export interface RecipeCardProps {
  // 基础数据
  recipe: Recipe;
  
  // 显示配置
  className?: string;
  
  // 交互行为
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  
  // 搜索相关
  highlightTerms?: string[];
  showMatchPercentage?: boolean;
  
  // 收藏相关
  onFavoriteToggle?: (recipeId: string, isFavorite: boolean) => void;
  showFavoriteButton?: boolean;
}

/**
 * 菜谱卡片客户端组件
 * 整个卡片可点击进入详情页
 */
const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  className = '',
  onClick,
  highlightTerms = [],
  onFavoriteToggle,
  showFavoriteButton = true,
}) => {
  const {
    id,
    name,
    cookingTime,
    cuisine,
    imageUrl,
    dietaryRestrictions,
    flavors
  } = recipe;
  
  const router = useRouter();
  
  // 高亮菜谱名称（用于搜索结果）
  const recipeName = name || (recipe as any).菜名 || '未命名菜谱';
  const highlightedName = highlightTerms.length > 0 
    ? highlightText(recipeName, highlightTerms) 
    : undefined;
  
  // 从菜谱数据中获取信息
  const cuisineType = typeof cuisine === 'string' ? cuisine : '';
  const difficulty = typeof recipe.difficulty === 'string' ? 
    recipe.difficulty : 
    (Array.isArray(recipe.difficulty) && recipe.difficulty.length > 0) ? 
      recipe.difficulty[0] : 
      '普通';
  
  // 获取食材列表
  const ingredientList = recipe.ingredients
    ? recipe.ingredients.slice(0, 5).map(ing => typeof ing === 'string' ? ing : (ing as any).name)
    : [];
    
  // 处理口味数据 - 处理特殊格式
  let flavorTags: string[] = [];
  let mainFlavors: string[] = [];
  
  if (flavors) {
    if (Array.isArray(flavors) && typeof flavors[0] === 'string') {
      // 标准字符串数组格式
      flavorTags = flavors;
    } else if (flavors && typeof flavors === 'object') {
      // 处理 {"标签": ["酸", "甜"], "主要口味": ["色泽红亮", "酥脆细嫩"]} 格式
      try {
        // 尝试获取标签和主要口味
        if ((flavors as any).标签 && Array.isArray((flavors as any).标签)) {
          flavorTags = (flavors as any).标签;
        }
        if ((flavors as any).主要口味 && Array.isArray((flavors as any).主要口味)) {
          mainFlavors = (flavors as any).主要口味;
        }
      } catch (e) {
        console.error('解析口味数据出错:', e);
      }
    }
  }
  
  // 处理收藏状态变化回调
  const handleFavoriteToggle = (newState: boolean) => {
    if (onFavoriteToggle) {
      onFavoriteToggle(id, newState);
    }
  };

  return (
    <Card 
      className={`group relative overflow-hidden border bg-white hover:shadow-md transition-all cursor-pointer recipe-card-fixed-height ${className}`} 
      onClick={(e?: React.MouseEvent<HTMLDivElement>) => {
        if (!e) return;
        
        // 阻止收藏按钮点击事件冒泡到卡片
        if ((e.target as HTMLElement).closest('.favorite-button-container')) {
          e.stopPropagation();
          return;
        }
        
        if (onClick) {
          // 传递事件给上层组件，让上层组件决定如何处理导航
          onClick(e);
        } else {
          // 在没有onClick回调时，默认在新标签页打开
          window.open(`/recipe/${id}`, '_blank');
        }
      }}
    >
      {/* 收藏按钮 */}
      {showFavoriteButton && (
        <div 
          className="absolute -top-4 right-6 z-4 favorite-button-container" 
          onClick={(e) => e.stopPropagation()}
        >
          <FavoriteButton 
            recipeId={id}
            recipe={recipe}
            size="sm"
            onToggle={handleFavoriteToggle}
          />
        </div>
      )}
      
      <CardHeader className="p-4 pb-2 flex-shrink-0">
        <CardTitle className="text-lg font-semibold line-clamp-2 recipe-card-title">
          {highlightedName || recipeName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex flex-col flex-1">
        {/* 标签区域 - 固定高度 */}
        <div className="flex-shrink-0 recipe-card-tags-area">
          <div className="flex flex-wrap gap-2 mb-2">
            {/* 菜系标签 */}
            {cuisineType && (
              <TagWrapper
                label={cuisineType}
                type="filter-selected"
                color="blue"
                size="sm"
              />
            )}
            
            {/* 烹饪时间标签 */}
            {cookingTime && (
              <TagWrapper
                label={`时间: ${formatCookingTime(cookingTime)}`}
                type="filter-selected"
                color="green"
                size="sm"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* 口味标签 */}
            {flavorTags.length > 0 && (
              <TagWrapper
                label={`口味: ${flavorTags.join('，')}`}
                type="filter-selected"
                color="orange"
                size="sm"
              />
            )}
            
            {/* 饮食限制标签 */}
            {dietaryRestrictions && dietaryRestrictions.length > 0 && (
              <TagWrapper
                label={dietaryRestrictions[0]}
                type="filter-selected"
                color="amber"
                size="sm"
              />
            )}
          </div>
        </div>
        
        {/* 显示主要口味描述 - 固定高度 */}
        <div className="flex-shrink-0 mb-2 text-sm text-gray-500 italic recipe-card-flavors">
          {mainFlavors.length > 0 ? mainFlavors.join('，') : ''}
        </div>
        
        {/* 主要食材信息 - 占据剩余空间 */}
        <div className="flex-1 flex items-end">
          <div className="text-sm font-normal text-gray-900 w-full">
            {ingredientList.length > 0 ? (
              <>
                <span className="font-medium">主要食材:</span> {ingredientList.join('、')}
                {recipe.ingredients && recipe.ingredients.length > 5 && '...'}
              </>
            ) : (
              <span className="text-gray-400">暂无食材信息</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard; 