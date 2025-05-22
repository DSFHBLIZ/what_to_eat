'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import IngredientSelectorUI from './ui/IngredientSelectorUI';
import ClearButton from './common/ClearButton';
import type { IngredientItem } from '../types';

export type IngredientSelectorMode = 'standard' | 'main';

interface IngredientSelectorProps {
  // 基础数据
  availableIngredients: IngredientItem[];
  initialSelected?: string[];
  
  // 配置
  title?: string;
  mode?: IngredientSelectorMode; // 新增mode属性替代isMainSelector
  maxHeight?: string;
  showCategories?: boolean;
  className?: string;

  // 回调
  onSelectionChange?: (selectedIds: string[]) => void;
}

/**
 * 食材选择器组件 - 客户端交互逻辑
 * 包装统一的IngredientSelectorUI组件，添加交互功能
 * 支持标准和主食材两种模式
 */
const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  // 数据
  availableIngredients,
  initialSelected = [],
  
  // 配置
  title,
  mode = 'standard', // 默认使用标准模式
  maxHeight,
  showCategories = true,
  className = '',
  
  // 回调
  onSelectionChange
}) => {
  // 状态
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(initialSelected);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState<IngredientItem[]>(availableIngredients);
  
  // 过滤食材
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIngredients(availableIngredients);
      return;
    }
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const filtered = availableIngredients.filter(ingredient => 
      (ingredient.name ? ingredient.name.toLowerCase().includes(normalizedSearchTerm) : false) ||
      (ingredient.category && ingredient.category.toLowerCase().includes(normalizedSearchTerm))
    );
    
    setFilteredIngredients(filtered);
  }, [searchTerm, availableIngredients]);
  
  // 选择状态变化时通知父组件
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIngredients);
    }
  }, [selectedIngredients, onSelectionChange]);
  
  // 处理食材切换
  const handleToggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        return prev.filter(id => id !== ingredientId);
      } else {
        return [...prev, ingredientId];
      }
    });
  };
  
  // 清空选择
  const handleClearAll = () => {
    setSelectedIngredients([]);
  };
  
  // 自定义渲染食材项，添加点击事件
  const renderIngredient = (ingredient: IngredientItem, isSelected: boolean) => {
    return (
      <div 
        onClick={() => ingredient.id ? handleToggleIngredient(ingredient.id) : undefined} 
        className={`
          inline-block px-3 py-1.5 rounded-full text-sm
          transition-colors duration-200 cursor-pointer
          ${isSelected 
            ? 'bg-indigo-500 text-white' 
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
        `}
      >
        {ingredient.name || ingredient.名称 || '未命名食材'}
      </div>
    );
  };
  
  return (
    <div className="ingredient-selector-wrapper">
      {/* 搜索框 */}
      <div className="mb-4">
        <div className="relative">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索食材..."
            className="w-full px-3 py-2 pl-10 border rounded-md"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </span>
          {searchTerm && (
            <ClearButton
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              label="清除搜索"
            />
          )}
        </div>
      </div>
      
      {/* 已选食材 */}
      {selectedIngredients.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">已选食材:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedIngredients.map(id => {
              const ingredient = availableIngredients.find(ing => ing.id === id);
              return ingredient ? (
                <div 
                  key={id}
                  className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                >
                  {ingredient.name || ingredient.名称 || '未命名食材'}
                  <ClearButton 
                    onClick={() => handleToggleIngredient(id)}
                    iconSize={12}
                    className="ml-1"
                    label="移除食材"
                  />
                </div>
              ) : null;
            })}
            {selectedIngredients.length > 0 && (
              <ClearButton 
                onClick={handleClearAll}
                showLabel={true}
                label="清空"
                className="text-xs text-gray-500 hover:text-gray-700"
              />
            )}
          </div>
        </div>
      )}
      
      {/* 食材选择器UI */}
      <IngredientSelectorUI
        ingredients={filteredIngredients}
        selectedIngredients={selectedIngredients}
        title={title}
        showSearch={false} // 我们已经在外部提供了搜索框
        maxHeight={maxHeight}
        className={className}
        isMainSelector={mode === 'main'} // 根据mode设置isMainSelector
        showCategories={showCategories}
        renderIngredient={renderIngredient}
      />
    </div>
  );
};

export default IngredientSelector; 