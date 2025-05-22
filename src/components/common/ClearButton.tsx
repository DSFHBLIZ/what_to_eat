'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ClearButtonProps {
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * 通用的清除按钮组件
 * 提供统一的清除按钮样式和行为
 */
export const ClearButton: React.FC<ClearButtonProps> = ({ 
  onClick, 
  label = '清除',
  className = '',
  iconSize = 14,
  showLabel = false,
  size = 'sm'
}) => {
  // 根据尺寸调整图标大小
  const sizeToIconSize = {
    xs: 12,
    sm: 14,
    md: 16, 
    lg: 18
  };
  
  // 使用指定的尺寸或从映射中获取
  const finalIconSize = typeof iconSize === 'number' ? iconSize : sizeToIconSize[size] || 14;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none transition-colors ${className}`}
      aria-label={label}
    >
      <X size={finalIconSize} />
      {showLabel && <span className="ml-1">{label}</span>}
    </button>
  );
};

export default ClearButton; 