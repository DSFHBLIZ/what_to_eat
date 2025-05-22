import React from 'react';
import { usePreferenceTheme } from '../../theme/themeStore';
import { 
  getDifficultyLevel, 
  getCuisineType,
  formatMatchScore,
  formatCookingTime
} from '../../utils/recipe';
import { Recipe } from '../../types/recipe';
import { safeString, safeArray } from '../../utils/common/safeData';
import TagWrapper from './TagWrapper';
import FavoriteButton from './FavoriteButton';

interface RecipeDetailHeaderUIProps {
  recipe: Recipe;
  name: string;
  cuisine?: string;
  difficulty?: string;
  cookingTime?: string | number;
  matchScore?: number;
  matchedIngredients?: string[] | { name: string }[] | { name: string; quantity: string }[]; 
}

export default function RecipeDetailHeaderUI({
  recipe,
  name,
  cuisine,
  difficulty,
  cookingTime,
  matchScore,
  matchedIngredients
}: RecipeDetailHeaderUIProps) {
  // 使用主题
  const { isDarkMode } = usePreferenceTheme();
  
  // 不要重新格式化难度和菜系，直接使用传递的值
  const formattedDifficulty = difficulty || '';
  const formattedCuisine = cuisine || '';
  
  // 处理匹配的食材
  const hasMatchData = !!matchScore && matchScore > 0;
  let processedMatchedIngredients: string[] = [];
  
  if (matchedIngredients) {
    if (Array.isArray(matchedIngredients)) {
      processedMatchedIngredients = matchedIngredients.map((ing) => {
        if (typeof ing === 'string') {
          return ing;
        } else if (ing && typeof ing === 'object' && 'name' in ing) {
          return ing.name;
        }
        return '未知食材';
      });
    }
  }
  
  // 转换分数为百分比
  const matchPercentage = matchScore ? Math.round(matchScore * 100) : 0;
  
  // 风味和描述分离
  // 基本口味关键词，这些是纯口味不是描述
  const basicFlavorKeywords = ['咸', '甜', '酸', '辣', '苦', '鲜', '麻'];
  let flavorTags: string[] = [];
  let flavorDescription: string = '';
  
  if (recipe.flavors && recipe.flavors.length > 0) {
    // 将所有flavor组合成单个字符串，方便拆分
    const allFlavorsStr = recipe.flavors.join('，');
    
    // 提取基本口味标签
    const basicFlavorTags = basicFlavorKeywords
      .filter(keyword => allFlavorsStr.includes(keyword))
      .filter(Boolean);
    
    // 尝试提取描述性文本（通常含有"香"、"糯"、"嫩"等）
    const descKeywords = ['香糯', '鲜嫩', '香', '糯', '嫩', '软', '脆', '滑'];
    const descriptions = descKeywords
      .map(keyword => {
        // 如果找到这个关键词所在的整个短语
        if (allFlavorsStr.includes(keyword)) {
          // 查找包含该关键词的完整短语
          const regex = new RegExp(`[^，,]*${keyword}[^，,]*`);
          const match = allFlavorsStr.match(regex);
          return match ? match[0] : '';
        }
        return '';
      })
      .filter(Boolean);
    
    // 如果找到描述，使用第一个找到的最长描述
    if (descriptions.length > 0) {
      flavorDescription = descriptions.sort((a, b) => b.length - a.length)[0];
    }
    
    // 如果有基本口味标签，则显示它们
    flavorTags = basicFlavorTags;
  }
  
  return (
    <div className="recipe-header mb-8">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-bold mb-2">{safeString(name, '菜谱详情')}</h1>
        {/* 添加收藏按钮 */}
        <FavoriteButton 
          recipeId={recipe.id} 
          recipe={recipe} 
          size="lg" 
          showText={true} 
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {/* 使用与菜谱卡片一致的展示形式 */}
        {formattedCuisine && (
          <TagWrapper
            label={formattedCuisine}
            type="filter-selected"
            color="blue"
            rounded={true}
          />
        )}
        
        {cookingTime && (
          <TagWrapper
            label={`时间: ${formatCookingTime(cookingTime)}`}
            type="filter-selected"
            color="green"
            rounded={true}
          />
        )}

        {/* 只在标签中展示口味，不包含描述 */}
        {flavorTags.length > 0 && (
          <TagWrapper
            label={`口味: ${flavorTags.join('，')}`}
            type="filter-selected"
            color="orange"
            rounded={true}
          />
        )}
        
        {/* 添加饮食限制标签，与搜索页保持一致 */}
        {recipe.dietaryRestrictions && recipe.dietaryRestrictions.length > 0 && (
          <TagWrapper
            label={recipe.dietaryRestrictions[0]}
            type="filter-selected"
            color="purple"
            rounded={true}
          />
        )}
      </div>

      {/* 单独显示风味描述，以斜体方式展示 */}
      {flavorDescription && (
        <div className="mb-4 text-base text-gray-500 italic">{flavorDescription}</div>
      )}

      {/* 食材匹配分数 */}
      {hasMatchData && (
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'} transition-colors duration-200`}>
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            食材匹配度: {matchPercentage}%
          </h3>
          {processedMatchedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>匹配食材:</span>
              {processedMatchedIngredients.map((ing, index) => (
                <TagWrapper
                  key={index}
                  label={ing}
                  type="filter-selected"
                  color="blue"
                  size="sm"
                  rounded={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 如果有描述，显示描述 */}
      {recipe.description && (
        <p className={`text-base mb-6 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {recipe.description}
        </p>
      )}
    </div>
  );
} 