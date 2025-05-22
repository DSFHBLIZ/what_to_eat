'use client';

import React, { useEffect, useState } from 'react';
import { isFavorite } from '../utils/favorite';

interface HeartButtonProps {
  recipeId: string;
  onClick: () => void;
  className?: string;
}

export const HeartButton: React.FC<HeartButtonProps> = ({
  recipeId,
  onClick,
  className = '',
}) => {
  const [isActive, setIsActive] = useState(false);
  
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

  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-colors ${className}`}
      aria-label={isActive ? '取消收藏' : '添加到收藏'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isActive ? '#ef4444' : 'none'}
        stroke={isActive ? '#ef4444' : '#666'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 transition-all"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}; 