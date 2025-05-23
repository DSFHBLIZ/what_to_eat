'use client';

import React, { useState, useEffect } from 'react';
import { Recipe } from '../../types/recipe';
import { DishAllocation, IngredientSummary } from '../../types/banquet';
import { ChefHat, Users, ArrowLeft, Clock, Utensils, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RecipeDetail from '../../components/RecipeDetail';

interface BanquetConfig {
  guestCount: number;
  allocation: DishAllocation | null;
}

/**
 * 宴会菜谱汇总页面
 * 显示所有选中菜谱的详情和食材汇总
 */
export default function BanquetSummaryPage() {
  const router = useRouter();
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [banquetConfig, setBanquetConfig] = useState<BanquetConfig | null>(null);
  const [ingredientSummary, setIngredientSummary] = useState<IngredientSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // 从sessionStorage加载数据
  useEffect(() => {
    try {
      const recipesData = sessionStorage.getItem('banquet-selected-recipes');
      const configData = sessionStorage.getItem('banquet-config');
      
      if (recipesData && configData) {
        const recipes = JSON.parse(recipesData);
        const config = JSON.parse(configData);
        
        setSelectedRecipes(recipes);
        setBanquetConfig(config);
        
        // 计算食材汇总
        calculateIngredientSummary(recipes);
      } else {
        // 如果没有数据，返回首页
        router.push('/');
      }
    } catch (error) {
      console.error('加载宴会数据失败:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // 计算食材和调料汇总 - 优化版本，不合并相似食材
  const calculateIngredientSummary = (recipes: Recipe[]) => {
    const allIngredients: Array<{ name: string; recipe: string; quantity?: string }> = [];
    const allSeasonings: Array<{ name: string; recipe: string; quantity?: string }> = [];

    // 常见调料关键词（用于区分食材和调料）
    const seasoningKeywords = [
      '盐', '糖', '醋', '生抽', '老抽', '料酒', '香油', '胡椒粉', '花椒',
      '八角', '桂皮', '香叶', '干辣椒', '蒜', '姜', '葱', '香菜',
      '蚝油', '豆瓣酱', '甜面酱', '芝麻油', '鸡精', '味精', '淀粉',
      '白胡椒粉', '黑胡椒粉', '孜然粉', '五香粉', '十三香', '辣椒',
      '油', '酱', '粉', '精'
    ];

    recipes.forEach(recipe => {
      const recipeName = recipe.name || '未命名菜品';
      
      // 处理食材
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          let ingredientName = '';
          let quantity = '';
          
          if (typeof ingredient === 'string') {
            ingredientName = ingredient;
          } else if (ingredient && typeof ingredient === 'object') {
            ingredientName = ingredient.name || ingredient.ingredient || ingredient['名称'] || '';
            quantity = ingredient.quantity || ingredient['用量'] || '';
          }
            
          if (ingredientName) {
            // 判断是调料还是食材
            const isSeasoning = seasoningKeywords.some(keyword => 
              ingredientName.includes(keyword) || ingredientName.endsWith(keyword)
            );
            
            const targetArray = isSeasoning ? allSeasonings : allIngredients;
            targetArray.push({
              name: ingredientName,
              recipe: recipeName,
              quantity
            });
          }
        });
      }

      // 处理调料（如果有单独的调料字段）
      if (recipe.seasonings && Array.isArray(recipe.seasonings)) {
        recipe.seasonings.forEach(seasoning => {
          let seasoningName = '';
          let quantity = '';
          
          if (typeof seasoning === 'string') {
            seasoningName = seasoning;
          } else if (seasoning && typeof seasoning === 'object') {
            seasoningName = seasoning.name || seasoning['名称'] || '';
            quantity = seasoning.quantity || seasoning['用量'] || '';
          }
            
          if (seasoningName) {
            allSeasonings.push({
              name: seasoningName,
              recipe: recipeName,
              quantity
            });
          }
        });
      }
    });

    // 按名称分组但保留所有条目（不合并）
    const groupedIngredients = new Map<string, Array<{ recipe: string; quantity?: string }>>();
    const groupedSeasonings = new Map<string, Array<{ recipe: string; quantity?: string }>>();

    allIngredients.forEach(item => {
      if (!groupedIngredients.has(item.name)) {
        groupedIngredients.set(item.name, []);
      }
      groupedIngredients.get(item.name)!.push({
        recipe: item.recipe,
        quantity: item.quantity
      });
    });

    allSeasonings.forEach(item => {
      if (!groupedSeasonings.has(item.name)) {
        groupedSeasonings.set(item.name, []);
      }
      groupedSeasonings.get(item.name)!.push({
        recipe: item.recipe,
        quantity: item.quantity
      });
    });

    setIngredientSummary({
      ingredients: Array.from(groupedIngredients.entries()).map(([name, usages]) => ({
        name,
        count: usages.length,
        recipes: usages.map(u => u.recipe),
        details: usages // 新增详细信息
      })).sort((a, b) => b.count - a.count),
      seasonings: Array.from(groupedSeasonings.entries()).map(([name, usages]) => ({
        name,
        count: usages.length,
        recipes: usages.map(u => u.recipe),
        details: usages // 新增详细信息
      })).sort((a, b) => b.count - a.count)
    });
  };

  // 计算总烹饪时间
  const calculateTotalCookingTime = () => {
    return selectedRecipes.reduce((total, recipe) => {
      let cookingTime = 0;
      if (recipe.cookingTime) {
        if (typeof recipe.cookingTime === 'number') {
          cookingTime = recipe.cookingTime;
        } else if (typeof recipe.cookingTime === 'string') {
          // 从字符串中提取数字，如"30分钟"
          const match = recipe.cookingTime.match(/\d+/);
          cookingTime = match ? parseInt(match[0]) : 0;
        }
      }
      return total + cookingTime;
    }, 0);
  };

  // 菜谱排序函数
  const sortRecipesByComplexity = (recipes: Recipe[]) => {
    return [...recipes].sort((a, b) => {
      // 1. 首先按烹饪时间排序（时间长的在前）
      const timeA = getCookingTimeInMinutes(a.cookingTime);
      const timeB = getCookingTimeInMinutes(b.cookingTime);
      if (timeA !== timeB) return timeB - timeA;
      
      // 2. 然后按步骤数量排序（步骤多的在前）
      const stepsA = getStepCount(a);
      const stepsB = getStepCount(b);
      if (stepsA !== stepsB) return stepsB - stepsA;
      
      // 3. 然后按食材数量排序（食材多的在前）
      const ingredientsA = (a.ingredients || []).length;
      const ingredientsB = (b.ingredients || []).length;
      if (ingredientsA !== ingredientsB) return ingredientsB - ingredientsA;
      
      // 4. 最后按调料数量排序（调料多的在前）
      const seasoningsA = (a.seasonings || []).length;
      const seasoningsB = (b.seasonings || []).length;
      return seasoningsB - seasoningsA;
    });
  };

  // 辅助函数：获取烹饪时间（分钟）
  const getCookingTimeInMinutes = (cookingTime: string | number | undefined): number => {
    if (!cookingTime) return 0;
    if (typeof cookingTime === 'number') return cookingTime;
    if (typeof cookingTime === 'string') {
      const match = cookingTime.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }
    return 0;
  };

  // 辅助函数：获取步骤总数
  const getStepCount = (recipe: Recipe): number => {
    let totalSteps = 0;
    
    // 统计所有类型的步骤
    if (recipe.steps && Array.isArray(recipe.steps)) {
      totalSteps += recipe.steps.length;
    }
    if (recipe.preparationSteps && Array.isArray(recipe.preparationSteps)) {
      totalSteps += recipe.preparationSteps.length;
    }
    if (recipe.cookingSteps && Array.isArray(recipe.cookingSteps)) {
      totalSteps += recipe.cookingSteps.length;
    }
    
    // 如果没有详细步骤，使用主步骤
    if (totalSteps === 0 && recipe.steps && Array.isArray(recipe.steps)) {
      totalSteps = recipe.steps.length;
    }
    
    return totalSteps;
  };

  // 对选中的菜谱进行排序
  const sortedSelectedRecipes = sortRecipesByComplexity(selectedRecipes);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="mx-auto mb-4 text-amber-500" size={48} />
          <p className="text-gray-600">正在加载宴会菜单...</p>
        </div>
      </div>
    );
  }

  if (!banquetConfig || selectedRecipes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-4">没有找到宴会菜单数据</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>返回</span>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-amber-600">
                <ChefHat size={20} />
                <span className="font-semibold">宴会菜单</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{banquetConfig.guestCount}人桌</span>
                </div>
                <div className="flex items-center gap-1">
                  <Utensils size={16} />
                  <span>{selectedRecipes.length}道菜</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 食材汇总卡片 */}
        {ingredientSummary && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
                <ShoppingCart size={24} className="text-amber-600" />
                食材采购清单
              </h2>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* 主要食材 */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Utensils size={18} className="text-green-600" />
                    主要食材 ({ingredientSummary.ingredients.length}种)
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {ingredientSummary.ingredients.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            {item.count}道菜使用
                          </span>
                        </div>
                        
                        {/* 详细使用信息 */}
                        {item.details && item.details.length > 0 && (
                          <div className="space-y-1">
                            {item.details.map((detail, detailIndex) => (
                              <div key={detailIndex} className="text-sm text-gray-600 flex justify-between">
                                <span>• {detail.recipe}</span>
                                {detail.quantity && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {detail.quantity}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {ingredientSummary.ingredients.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        暂无主要食材
                      </div>
                    )}
                  </div>
                </div>

                {/* 调料配菜 */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <ChefHat size={18} className="text-orange-600" />
                    调料配菜 ({ingredientSummary.seasonings.length}种)
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {ingredientSummary.seasonings.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            {item.count}道菜使用
                          </span>
                        </div>
                        
                        {/* 详细使用信息 */}
                        {item.details && item.details.length > 0 && (
                          <div className="space-y-1">
                            {item.details.map((detail, detailIndex) => (
                              <div key={detailIndex} className="text-sm text-gray-600 flex justify-between">
                                <span>• {detail.recipe}</span>
                                {detail.quantity && (
                                  <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                    {detail.quantity}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {ingredientSummary.seasonings.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        暂无调料配菜
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 菜谱详情列表 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Utensils size={24} className="text-amber-600" />
              宴会菜单详情 ({selectedRecipes.length}道菜)
            </h2>
            
            {/* 菜单汇总信息 */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>预计总时长：{calculateTotalCookingTime()}分钟</span>
              </div>
            </div>
          </div>
          
          {sortedSelectedRecipes.map((recipe, index) => {
            const dishNumber = index + 1;
            const isEven = dishNumber % 2 === 0;
            
            return (
              <div key={recipe.id} className={`
                bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md
                ${isEven ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-orange-400'}
              `}>
                {/* 菜品标题栏 */}
                <div className={`
                  p-4 border-b rounded-t-xl
                  ${isEven ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gradient-to-r from-orange-50 to-red-50'}
                `}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg
                        ${isEven ? 'bg-amber-500' : 'bg-orange-500'}
                      `}>
                        {dishNumber}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {recipe.name || '未命名菜品'}
                        </h3>
                        
                        {/* 菜品类型和特点标签 */}
                        <div className="flex items-center gap-2 mt-1">
                          {recipe.cuisine && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {recipe.cuisine}
                            </span>
                          )}
                          {recipe.difficulty && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {Array.isArray(recipe.difficulty) ? recipe.difficulty[0] : recipe.difficulty}
                            </span>
                          )}
                          {recipe.flavors && recipe.flavors.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {recipe.flavors[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {recipe.cookingTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock size={14} />
                          <span>{recipe.cookingTime}</span>
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="text-xs text-gray-500 mt-1">
                          约{recipe.servings}人份
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 菜品详情内容 */}
                <div className="p-6">
                  <RecipeDetail 
                    directRecipe={recipe}
                    showValidationDetails={false}
                    validate={false}
                  />
                </div>
              </div>
            );
          })}
          
          {selectedRecipes.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-gray-500">暂无选中的菜品</p>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>💡 建议提前准备食材，按菜谱顺序进行烹饪</p>
        </div>
      </div>
    </div>
  );
} 