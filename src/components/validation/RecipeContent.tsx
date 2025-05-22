import React from 'react';
import { Recipe } from '../../types/recipe';
import { IngredientItem } from '../../types';

interface RecipeContentProps {
  recipe: Recipe;
}

/**
 * 验证后的菜谱内容展示组件
 */
const RecipeContent: React.FC<RecipeContentProps> = ({ recipe }) => {
  // 渲染安全的菜谱属性
  const renderSafeValue = (value: any, defaultValue: string = "暂无"): string => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // 确保字符串类型
    return String(value);
  };

  // 安全的数组获取函数
  const safeArray = <T extends any>(value: T[] | null | undefined): T[] => {
    if (!value) return [];
    if (!Array.isArray(value)) {
      console.warn('Expected array but got', typeof value);
      return [];
    }
    return value;
  };

  return (
    <div className="recipe-content">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">{recipe.name}</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">基本信息</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">菜系:</div>
              <div>{renderSafeValue(recipe.cuisine)}</div>
              
              <div className="text-gray-600">烹饪难度:</div>
              <div>{renderSafeValue(recipe.difficulty)}</div>
              
              <div className="text-gray-600">标签:</div>
              <div>{safeArray(recipe.tags).join(', ') || '暂无'}</div>
              
              <div className="text-gray-600">烹饪时间:</div>
              <div>{renderSafeValue(recipe.cookingTime)}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">食材</h2>
            <ul className="list-disc pl-5">
              {safeArray(recipe.ingredients).map((ingredient, index) => (
                <li key={index} className="mb-1">
                  {typeof ingredient === 'string' ? (
                    <span className="font-medium">{ingredient}</span>
                  ) : (
                    <>
                      <span className="font-medium">{ingredient.name}</span>
                      {ingredient.quantity && <span className="text-gray-600"> {ingredient.quantity}</span>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">烹饪步骤</h2>
            <ol className="list-decimal pl-5">
              {safeArray(recipe.steps).map((step, index) => (
                <li key={index} className="mb-2">
                  {typeof step === 'object' && step !== null ? 
                    (step as any).description || JSON.stringify(step) : 
                    String(step)}
                </li>
              ))}
            </ol>
          </div>
          
          {recipe.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-1">菜谱描述</h2>
              <p className="text-gray-700">{recipe.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeContent; 