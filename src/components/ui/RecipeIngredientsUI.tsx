import React from 'react';

interface IngredientItem {
  name: string;
  quantity: string;
}

interface RecipeIngredientsUIProps {
  ingredients: IngredientItem[];
  seasonings: IngredientItem[];
  className?: string;
}

export default function RecipeIngredientsUI({
  ingredients,
  seasonings,
  className = ''
}: RecipeIngredientsUIProps) {
  return (
    <div className={`recipe-ingredients mb-8 ${className}`}>
      <h2 className="text-xl font-bold mb-4">食材和调料</h2>
      
      {/* 主要食材 */}
      {ingredients.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">主要食材</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ingredients.map((item, index) => (
              <li 
                key={index} 
                className="flex justify-between py-2 px-3 bg-gray-50 rounded-md"
              >
                <span className="font-medium text-gray-900">{item.name}</span>
                {item.quantity && (
                  <span className="text-gray-900">{item.quantity}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 调料 */}
      {seasonings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">调料</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {seasonings.map((item, index) => (
              <li 
                key={index} 
                className="flex justify-between py-2 px-3 bg-gray-50 rounded-md"
              >
                <span className="font-medium text-gray-900">{item.name}</span>
                {item.quantity && (
                  <span className="text-gray-900">{item.quantity}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 