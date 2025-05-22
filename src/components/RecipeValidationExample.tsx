/**
 * component:RecipeValidationExample 菜谱验证示例组件
 * 展示如何使用验证API的示例
 */
import React, { useState } from 'react';
import { useRecipeValidator } from '../domain/validation/recipeValidation';
import ValidationPanel from './validation/ValidationPanel';
import { Recipe } from '../types/recipe';
import { RecipeValidationResult } from '../types/validation';

/**
 * 菜谱验证示例组件
 * 展示如何使用新的验证组件架构
 */
const RecipeValidationExample: React.FC = () => {
  const {
    validateRecipe,
    validateField,
    validatePartial
  } = useRecipeValidator();
  
  // 验证结果状态
  const [recipeResult, setRecipeResult] = useState<RecipeValidationResult | null>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  
  // 示例数据
  const sampleRecipe = {
    id: "sample-1",
    name: "红烧肉",
    description: "经典红烧肉做法",
    cuisine: "川菜",
    ingredients: [
      { name: "五花肉", quantity: "500g" },
      { name: "葱", quantity: "2根" }
    ],
    seasonings: [
      { name: "生抽", quantity: "2勺" },
      { name: "老抽", quantity: "1勺" }
    ],
    flavors: ["咸鲜", "香"],
    difficulty: "普通",
    cookingTime: "60分钟",
    steps: [
      "将五花肉切成小块",
      "锅中加入适量油，放入肉块煸炒至微黄",
      "加入适量水，小火炖煮40分钟"
    ],
    cookingTips: ["可以加入适量冰糖增加口感"],
    imageUrl: "https://example.com/image.jpg"
  };
  
  // 有问题的示例数据
  const invalidRecipe = {
    id: "invalid-1",
    name: "",  // 名称为空，会触发验证错误
    description: "描述",
    ingredients: [],  // 食材为空，会触发验证错误
    seasonings: [],
    flavors: [],
    difficulty: "",
    cookingTime: "",
    steps: [],  // 烹饪步骤为空，会触发验证错误
    cookingTips: [],
    imageUrl: "invalid-url"
  };
  
  // 处理单个菜谱验证
  const handleValidateSingle = () => {
    const result = validateRecipe(sampleRecipe);
    setRecipeResult(result);
  };
  
  // 处理无效菜谱验证
  const handleValidateInvalid = () => {
    const result = validateRecipe(invalidRecipe);
    setRecipeResult(result);
  };
  
  // 处理批量验证
  const handleValidateBatch = () => {
    // 创建一组食谱
    const recipes = [
      sampleRecipe,
      invalidRecipe,
      { ...sampleRecipe, id: "sample-2", name: "糖醋排骨" }
    ];
    
    // 手动批量验证
    const results = recipes.map(recipe => validateRecipe(recipe));
    const validCount = results.filter(r => r.isValid).length;
    
    setBatchResult({
      recipes: recipes,
      stats: {
        total: recipes.length,
        valid: validCount,
        invalid: recipes.length - validCount
      }
    });
  };
  
  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">菜谱验证示例</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleValidateSingle}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          验证有效菜谱
        </button>
        
        <button
          onClick={handleValidateInvalid}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          验证无效菜谱
        </button>
        
        <button
          onClick={handleValidateBatch}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          批量验证菜谱
        </button>
      </div>
      
      {/* 单个菜谱验证结果 */}
      {recipeResult && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">单个菜谱验证结果</h2>
          <ValidationPanel 
            result={recipeResult}
            showDetails={true}
            title="菜谱验证"
          />
          
          {recipeResult.isValid && (
            <div className="mt-4 p-4 bg-gray-50 border rounded">
              <h3 className="font-medium mb-2">验证后的数据</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(recipeResult.fixedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {/* 批量验证结果 */}
      {batchResult && (
        <div>
          <h2 className="text-xl font-semibold mb-2">批量验证结果</h2>
          <ValidationPanel 
            stats={batchResult.stats}
            showStats={true}
            title="批量菜谱验证"
          />
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">验证后的菜谱列表</h3>
            {batchResult.recipes.map((recipe: Recipe, index: number) => (
              <div key={index} className="p-3 border mb-3 rounded">
                <div className="font-medium">{recipe.name || '未命名菜谱'}</div>
                <div className="text-sm text-gray-600">
                  食材: {recipe.ingredients?.length || 0} 个，
                  步骤: {recipe.steps?.length || 0} 个
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeValidationExample; 