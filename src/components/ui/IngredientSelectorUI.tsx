import React from 'react';
import { Search } from 'lucide-react';
import IngredientIcon from '../IngredientIcon';
import type { IngredientItem } from '../../types';

// 食材类型
export type IngredientType = 'main' | 'secondary' | 'seasoning';

// 组件属性
export interface IngredientSelectorUIProps {
  // 数据
  ingredients: IngredientItem[];
  selectedIngredients: string[];
  
  // 配置
  title?: string;
  emptyMessage?: string;
  showCategories?: boolean;
  showSearch?: boolean;
  maxHeight?: string;
  className?: string;
  isMainSelector?: boolean; // 是否为主食材选择器
  
  // 自定义渲染
  renderIngredient?: (ingredient: IngredientItem, isSelected: boolean) => React.ReactNode;
  
  // 只读模式，不包含交互，用于服务端渲染
  readOnly?: boolean;
}

/**
 * 统一的食材选择器UI组件 - 纯UI部分，无交互逻辑
 * 可用于服务端渲染或复用于不同的交互实现
 */
const IngredientSelectorUI: React.FC<IngredientSelectorUIProps> = ({
  // 数据
  ingredients,
  selectedIngredients,
  
  // 配置
  title = '选择食材',
  emptyMessage = '没有匹配的食材',
  showCategories = true,
  showSearch = true,
  maxHeight = '500px',
  className = '',
  isMainSelector = false,
  
  // 自定义渲染
  renderIngredient,
  
  // 只读模式
  readOnly = false
}) => {
  // 根据类别组织食材
  const ingredientsByCategory: Record<string, IngredientItem[]> = {};
  const categoriesOrder: string[] = [];
  
  // 在主食材选择模式下，优先显示常见食材
  if (isMainSelector) {
    ingredients.forEach(ingredient => {
      const category = ingredient.isCommon ? '常见食材' : (ingredient.category || '其他');
      
      if (!ingredientsByCategory[category]) {
        ingredientsByCategory[category] = [];
        categoriesOrder.push(category);
      }
      
      ingredientsByCategory[category].push(ingredient);
    });
    
    // 确保常见食材排在最前
    if (categoriesOrder.includes('常见食材')) {
      categoriesOrder.sort((a) => a === '常见食材' ? -1 : 1);
    }
  } else {
    // 普通食材选择器，按类别分组
    ingredients.forEach(ingredient => {
      const category = ingredient.category || '其他';
      
      if (!ingredientsByCategory[category]) {
        ingredientsByCategory[category] = [];
        categoriesOrder.push(category);
      }
      
      ingredientsByCategory[category].push(ingredient);
    });
    
    // 按首字母排序类别
    categoriesOrder.sort();
  }
  
  return (
    <div className={`ingredient-selector ${className}`}>
      {/* 标题 */}
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      
      {/* 搜索框 - 仅展示UI */}
      {showSearch && !readOnly && (
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full px-3 py-2 pl-10 border rounded-md"
            placeholder="搜索食材..."
            readOnly={true}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </span>
        </div>
      )}
      
      {/* 食材列表容器 */}
      <div 
        className="ingredients-container overflow-y-auto"
        style={{ maxHeight }}
      >
        {/* 无数据状态 */}
        {ingredients.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            {emptyMessage}
          </div>
        ) : (
          <>
            {/* 按类别显示食材 */}
            {showCategories ? (
              categoriesOrder.map(category => (
                <div key={category} className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {ingredientsByCategory[category].map(ingredient => (
                      <IngredientItem
                        key={ingredient.id}
                        ingredient={ingredient}
                        isSelected={ingredient.id ? selectedIngredients.includes(ingredient.id) : false}
                        renderCustom={renderIngredient}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // 不分类别直接显示所有食材
              <div className="flex flex-wrap gap-2">
                {ingredients.map(ingredient => (
                  <IngredientItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    isSelected={ingredient.id ? selectedIngredients.includes(ingredient.id) : false}
                    renderCustom={renderIngredient}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// 内部食材项渲染组件
interface IngredientItemProps {
  ingredient: IngredientItem;
  isSelected: boolean;
  readOnly?: boolean;
  renderCustom?: (ingredient: IngredientItem, isSelected: boolean) => React.ReactNode;
}

const IngredientItem: React.FC<IngredientItemProps> = ({
  ingredient,
  isSelected,
  readOnly = false,
  renderCustom
}) => {
  // 如果提供了自定义渲染函数，使用它
  if (renderCustom) {
    return <>{renderCustom(ingredient, isSelected)}</>;
  }
  
  // 否则使用默认渲染
  return (
    <div 
      className={`
        inline-block px-3 py-1.5 rounded-full text-sm
        transition-colors duration-200 cursor-pointer
        ${isSelected 
          ? 'bg-indigo-500 text-white' 
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
        ${readOnly ? 'cursor-default' : 'cursor-pointer'}
      `}
    >
      {ingredient.name}
    </div>
  );
};

export default IngredientSelectorUI; 