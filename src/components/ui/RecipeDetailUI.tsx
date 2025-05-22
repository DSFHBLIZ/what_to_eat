import React, { ReactNode } from 'react';
import { Recipe } from '../../types/recipe';
import RecipeDetailHeaderUI from './RecipeDetailHeaderUI';
import RecipeIngredientsUI from './RecipeIngredientsUI';
import RecipeStepsUI from './RecipeStepsUI';
import { getMatchScore } from '../../utils/recipe';
import { usePreferenceTheme } from '../../theme/themeStore';
import LayoutWrapper from './LayoutWrapper';
import { safeArray } from '../../utils/common/safeData';

interface IngredientItem {
  name: string;
  quantity: string;
}

interface RecipeDetailUIProps {
  recipe: Recipe;
  processedIngredients: IngredientItem[];
  processedSeasonings: IngredientItem[];
  preparationSteps: string[];
  cookingSteps: string[];
  combinedSteps: string[];
  showCombinedSteps: boolean;
  cookingTips: string[];
  children?: ReactNode; // 用于额外的操作按钮或其他组件
}

/**
 * 菜谱详情UI组件
 * 负责展示菜谱的所有详细信息，包括标题、食材、步骤和提示
 */
export default function RecipeDetailUI({
  recipe,
  processedIngredients,
  processedSeasonings,
  preparationSteps,
  cookingSteps,
  combinedSteps,
  showCombinedSteps,
  cookingTips,
  children
}: RecipeDetailUIProps) {
  // 使用通用的主题钩子
  const { isDarkMode } = usePreferenceTheme();
  
  // 转换匹配分数
  const matchScore = getMatchScore(recipe);
  
  // 确保数据安全
  const safeIngredients = safeArray(processedIngredients, []);
  const safeSeasonings = safeArray(processedSeasonings, []);
  const safePreparationSteps = safeArray(preparationSteps, []);
  const safeCookingSteps = safeArray(cookingSteps, []);
  const safeCombinedSteps = safeArray(combinedSteps, []);
  const safeCookingTips = safeArray(cookingTips, []);

  // 处理菜谱难度属性，与卡片组件保持一致
  const difficulty = typeof recipe.difficulty === 'string' ? 
    recipe.difficulty : 
    (Array.isArray(recipe.difficulty) && recipe.difficulty.length > 0) ? 
      recipe.difficulty[0] : 
      '普通';

  // 处理菜系属性，与卡片组件保持一致
  const cuisine = typeof recipe.cuisine === 'string' ? 
    recipe.cuisine : 
    '';

  // 显示加载错误信息
  if (recipe.loadError) {
    return (
      <LayoutWrapper
        variant="card"
        radius="lg"
        padding="lg"
        darkMode={isDarkMode}
        className="recipe-detail-error"
      >
        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'}`}>
          <h2 className="text-xl font-bold mb-2">加载菜谱时出错</h2>
          <p className="mb-2">{recipe.loadError.message || '未知错误'}</p>
          {recipe.loadError.recipeId && (
            <p className="text-sm">菜谱ID: {recipe.loadError.recipeId}</p>
          )}
          {recipe.loadError.errorTime && (
            <p className="text-sm">错误时间: {new Date(recipe.loadError.errorTime as string).toLocaleString()}</p>
          )}
          {recipe.loadError.fieldErrors && Object.keys(recipe.loadError.fieldErrors).length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-1">字段错误:</h3>
              <ul className="list-disc list-inside text-sm">
                {Object.entries(recipe.loadError.fieldErrors as Record<string, string>).map(([field, message]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span> {message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      variant="card"
      radius="lg"
      padding="lg"
      darkMode={isDarkMode}
      className="recipe-detail"
    >
      {/* 菜谱标题头部 */}
      <RecipeDetailHeaderUI
        recipe={recipe}
        name={recipe.name}
        cuisine={cuisine}
        difficulty={difficulty}
        cookingTime={recipe.cookingTime}
        matchScore={matchScore}
        matchedIngredients={recipe.matchedIngredients}
      />
      
      {/* 食材和调料 */}
      <RecipeIngredientsUI
        ingredients={safeIngredients}
        seasonings={safeSeasonings}
      />
      
      {/* 烹饪步骤 */}
      <RecipeStepsUI
        preparationSteps={safePreparationSteps}
        cookingSteps={safeCookingSteps}
        combinedSteps={safeCombinedSteps}
        showCombinedSteps={showCombinedSteps}
      />
      
      {/* 烹饪小贴士 */}
      {safeCookingTips.length > 0 && (
        <div className="recipe-tips mb-8">
          <h2 className="text-xl font-bold mb-4">小贴士</h2>
          <ul className={`space-y-2 ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50'} p-4 rounded-md`}>
            {safeCookingTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 额外的操作按钮或其他组件 */}
      {children && (
        <div className="recipe-actions mt-8">
          {children}
        </div>
      )}
    </LayoutWrapper>
  );
} 