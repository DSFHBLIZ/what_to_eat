'use client';

import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Recipe } from '../../types/recipe';
// 使用收藏工具
import { isFavorite, toggleFavorite, addToFavorites, removeFromFavorites } from '../../utils/favorite';

interface FavoriteButtonProps {
  recipeId: string;
  recipe?: Recipe;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: {
    add: string;
    remove: string;
  };
  onToggle?: (isFavorite: boolean) => void;
}

/**
 * 统一的收藏按钮组件
 * 使用localStorage存储收藏状态，无需登录即可使用
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  recipeId,
  recipe,
  className = '',
  size = 'md',
  showText = false,
  text = { add: '收藏', remove: '已收藏' },
  onToggle
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  // 检查当前菜谱是否已收藏
  useEffect(() => {
    setIsActive(isFavorite(recipeId));
  }, [recipeId]);

  // 监听存储变化以更新收藏状态
  useEffect(() => {
    const handleStorageChange = () => {
      setIsActive(isFavorite(recipeId));
    };
    
    window.addEventListener('favoritechange', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('favoritechange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [recipeId]);

  const handleToggle = async () => {
    if (!recipe && !isActive) {
      console.error('FavoriteButton: Missing recipe data for adding to favorites');
      return;
    }
    
    setIsToggling(true);
    try {
      // 添加调试日志
      console.log('FavoriteButton: 开始切换收藏状态', { 
        recipeId, 
        currentStatus: isActive,
        recipeData: recipe ? { id: recipe.id, name: recipe.name } : null
      });
      
      let newState: boolean;
      
      if (recipe) {
        // 如果有完整菜谱数据，使用toggleFavorite
        newState = toggleFavorite(recipe);
        console.log('FavoriteButton: 切换后状态', { newState, recipeId });
        
        // 手动触发自定义事件，确保所有组件都能接收到更新
        window.dispatchEvent(new CustomEvent('favoritechange', {
          detail: { recipeId, isFavorite: newState, recipe }
        }));
      } else {
        // 否则基于当前状态进行切换
        if (isActive) {
          removeFromFavorites(recipeId);
          newState = false;
          console.log('FavoriteButton: 移除收藏后状态', { newState, recipeId });
          
          // 手动触发自定义事件
          window.dispatchEvent(new CustomEvent('favoritechange', {
            detail: { recipeId, isFavorite: false }
          }));
        } else {
          // 如果没有菜谱数据但要添加收藏，这是一个错误状态
          console.error('FavoriteButton: Cannot add to favorites without recipe data');
          return;
        }
      }
      
      setIsActive(newState);
      if (onToggle) {
        onToggle(newState);
      }
    } catch (error) {
      console.error('FavoriteButton: Error toggling favorite status', error);
    } finally {
      setIsToggling(false);
    }
  };

  // 根据尺寸定义图标大小
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  // 根据尺寸定义padding
  const buttonPadding = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  }[size];

  // 根据尺寸定义文本大小
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`
        group transition-all duration-150 ease-in-out
        ${buttonPadding} 
        rounded-full 
        ${isActive 
          ? 'bg-red-100 hover:bg-red-200 text-red-600' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500'
        }
        ${className}
      `}
      aria-label={isActive ? "取消收藏" : "添加收藏"}
    >
      <div className="flex items-center gap-1">
        <Heart
          size={iconSize}
          className={`
            ${isActive ? 'fill-red-500' : 'fill-none group-hover:fill-red-200'}
            transition-all duration-300 
            ${isToggling ? 'animate-pulse' : ''}
          `}
        />
        
        {showText && (
          <span className={`${textSize} font-medium`}>
            {isActive ? text.remove : text.add}
          </span>
        )}
      </div>
    </button>
  );
};

export default FavoriteButton; 