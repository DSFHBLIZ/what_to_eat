'use client';

import React from 'react';
import { Recipe } from '../../types/recipe';
import RecipeCard, { RecipeCardProps } from '../RecipeCard';

interface BanquetRecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onToggleSelection: (recipeId: string) => void;
  onCardClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  showMatchPercentage?: boolean;
  className?: string;
}

/**
 * 宴会模式下的菜谱卡片组件
 * 支持多选功能，显示选中状态
 */
export default function BanquetRecipeCard({
  recipe,
  isSelected,
  onToggleSelection,
  onCardClick,
  ...otherProps
}: BanquetRecipeCardProps) {
  
  const handleCardClick = (e?: React.MouseEvent<HTMLDivElement>) => {
    if (!e) return;
    
    // 检查是否点击了选择按钮
    if ((e.target as HTMLElement).closest('.selection-button')) {
      e.stopPropagation();
      onToggleSelection(recipe.id);
      return;
    }
    
    // 其他点击事件交给父组件处理
    if (onCardClick) {
      onCardClick(e);
    }
  };

  return (
    <div className="relative group">
      {/* 基础菜谱卡片 - 简化选中状态样式，统一悬停效果 */}
      <div className={`
        transition-all duration-200 relative overflow-hidden cursor-pointer
        ${isSelected 
          ? 'ring-2 ring-amber-400 shadow-md' 
          : 'hover:shadow-md hover:ring-1 hover:ring-gray-300'
        }
      `}>
        <RecipeCard
          {...otherProps}
          recipe={recipe}
          onClick={handleCardClick}
          className={`${otherProps.className || ''} ${
            isSelected 
              ? 'border-amber-400 border-2' 
              : 'border-gray-200 hover:border-gray-300'
          } transition-all duration-200`}
        />
      </div>
      
      {/* 右下角选择按钮 */}
      <div className="absolute bottom-3 right-3 selection-button">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(recipe.id);
          }}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm
            ${isSelected 
              ? 'bg-amber-500 text-white' 
              : 'bg-white text-gray-400 border border-gray-300 hover:bg-gray-50 hover:text-gray-600'
            }
          `}
          title={isSelected ? '取消选择' : '选择此菜'}
        >
          {isSelected ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
} 