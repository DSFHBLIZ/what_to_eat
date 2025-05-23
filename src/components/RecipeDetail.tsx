/**
 * component:RecipeDetail 菜谱详情组件
 * 负责显示菜谱详情，包括验证、错误处理和UI渲染
 */
'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { enhancedJsonParse } from '../utils/data/enhancedSafeJsonParse';
import { useRecipeValidator } from '../domain/validation/recipeValidation';
import RecipeDetailUI from './ui/RecipeDetailUI';
import { Recipe } from '../types/recipe';
import { RecipeValidationResult, ValidationPerformance } from '../types/validation';
import ErrorBoundary, { ErrorFallbackProps, ErrorTheme } from './error/ErrorBoundary';
import RecipeError from './error/RecipeError';
import { useRecipeData } from '../hooks/useRecipeData';
import { useRecipeError, RecipeErrorHelper } from '../contexts/AppProvider';
import WithSkeleton from './ui/WithSkeleton';
import { validateAndSanitizeRecipe, safeArray, safeString, safeBoolean } from '../utils/common/safeData';
import RelatedRecipes from './recipe/RelatedRecipes';

// 为每个可能出现问题的位置定义默认值
const DEFAULT_VALUES = {
  name: '菜谱',
  difficulty: '中等',
  cuisine: '家常菜',
  flavorProfile: ['咸', '香'],
  techniques: ['煎', '炒'],
  dietary: [],
  ingredients: [],
  seasonings: [],
  preparationSteps: [],
  cookingSteps: [],
  cookingTips: []
};

// RecipeDetail接口定义，确保所有需要的props都有明确的类型
interface RecipeDetailProps {
  recipeData?: any; // 原始菜谱数据，可选参数
  showValidationDetails?: boolean; // 是否显示验证详情
  errorBoundaryTheme?: ErrorTheme; // 错误边界主题
  onError?: (error: Error) => void; // 错误处理回调
  fallback?: React.ComponentType<ErrorFallbackProps>;
  validate?: boolean; // 是否验证数据
  directRecipe?: Recipe; // 直接传入的菜谱对象，无需验证
}

// RecipeDetails接口定义，确保所有需要的props都有明确的类型
interface RecipeDetailsProps {
  recipe: Recipe;
  showValidationDetails?: boolean;
  validationResult?: RecipeValidationResult | null;
  validationPerformance?: ValidationPerformance;
}

// RecipeDetails组件声明
const RecipeDetails: React.FC<RecipeDetailsProps> = ({
  recipe,
  showValidationDetails,
  validationResult,
  validationPerformance
}) => {
  // 处理食材和调料数据
  const processedIngredients = useMemo(() => {
    console.log("原始食材数据:", recipe.ingredients);
    
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      console.log("食材数据为空或非数组，使用默认值");
      return [{ name: '未知食材', quantity: '适量' }];
    }
    
    return recipe.ingredients.map((ing: any) => {
      console.log("处理单个食材:", ing);
      if (typeof ing === 'string') {
        return { name: ing, quantity: '适量' };
      } else if (ing && typeof ing === 'object') {
        // 确保对象有name属性
        if (!ing.name) {
          // 检查可能的替代属性名称
          if (ing.食材名) {
            ing.name = ing.食材名;
          } else if (ing.名称) {
            ing.name = ing.名称;
          } else if (ing.text) {
            ing.name = ing.text;
          }
        }
        
        // 检查可能的替代数量属性名称
        let quantity = ing.quantity;
        if (!quantity) {
          if (ing.用量) {
            quantity = ing.用量;
          } else if (ing.amount) {
            quantity = ing.amount;
          }
        }
        
        return {
          name: ing.name || '未命名食材',
          quantity: quantity || '适量'
        };
      }
      return { name: '未知食材', quantity: '适量' };
    });
  }, [recipe.ingredients]);

  const processedSeasonings = useMemo(() => {
    console.log("原始调料数据:", recipe.seasonings);
    
    if (!recipe.seasonings || !Array.isArray(recipe.seasonings) || recipe.seasonings.length === 0) {
      console.log("调料数据为空或非数组，使用默认值");
      return [{ name: '未知调料', quantity: '适量' }];
    }
    
    return recipe.seasonings.map((sea: any) => {
      console.log("处理单个调料:", sea);
      if (typeof sea === 'string') {
        return { name: sea, quantity: '适量' };
      } else if (sea && typeof sea === 'object') {
        // 确保对象有name属性
        if (!sea.name) {
          // 检查可能的替代属性名称
          if (sea.调料名) {
            sea.name = sea.调料名;
          } else if (sea.名称) {
            sea.name = sea.名称;
          } else if (sea.text) {
            sea.name = sea.text;
          }
        }
        
        // 检查可能的替代数量属性名称
        let quantity = sea.quantity;
        if (!quantity) {
          if (sea.用量) {
            quantity = sea.用量;
          } else if (sea.amount) {
            quantity = sea.amount;
          }
        }
        
        return {
          name: sea.name || '未命名调料',
          quantity: quantity || '适量'
        };
      }
      return { name: '未知调料', quantity: '适量' };
    });
  }, [recipe.seasonings]);
  
  return (
    <RecipeDetailUI
      recipe={recipe}
      processedIngredients={processedIngredients}
      processedSeasonings={processedSeasonings}
      preparationSteps={recipe.preparationSteps || []}
      cookingSteps={recipe.cookingSteps || []}
      combinedSteps={recipe.steps || []}
      showCombinedSteps={!(recipe.preparationSteps?.length || recipe.cookingSteps?.length)}
      cookingTips={recipe.cookingTips || []}
    >
      {showValidationDetails && validationResult && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-sm">
          <h3 className="font-bold text-indigo-700">验证统计</h3>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>验证状态:</div>
            <div className={validationResult.isValid ? "text-green-600" : "text-red-600"}>
              {validationResult.isValid ? "通过" : "失败"}
            </div>
            
            <div>解析时间:</div>
            <div>{validationPerformance?.parsingTime.toFixed(2)}ms</div>
            
            <div>验证时间:</div>
            <div>{validationPerformance?.validationTime.toFixed(2)}ms</div>
            
            <div>总处理时间:</div>
            <div>{validationPerformance?.totalTime.toFixed(2)}ms</div>
            
            <div>错误数量:</div>
            <div>{validationResult.errors.length}</div>
          </div>
        </div>
      )}
    </RecipeDetailUI>
  );
};

/**
 * 统一的菜谱详情组件 - 负责数据处理和验证
 * UI渲染交由RecipeDetailUI处理
 */
const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipeData,
  showValidationDetails = false,
  errorBoundaryTheme = 'recipe',
  onError,
  fallback = RecipeError,
  validate = true,
  directRecipe
}) => {
  // 验证状态
  const [validationResult, setValidationResult] = useState<RecipeValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(validate && !directRecipe);
  const [validationPerformance, setValidationPerformance] = useState<ValidationPerformance>({
    parsingTime: 0,
    validationTime: 0,
    totalTime: 0,
  });
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);

  // 使用菜谱验证器和数据处理器
  const { validateRecipe } = useRecipeValidator();
  const { processRecipeData: processRecipeDataHook } = useRecipeData();
  const { addError, clearError } = useRecipeError();

  // 性能监控标记引用
  const markRef = useRef<string | null>(null);
  
  // 使用ref保存依赖值，避免它们变化导致useEffect重新执行
  const depsRef = useRef({
    recipeData,
    validateRecipe,
    validate,
    directRecipe,
    addError,
    clearError,
    onError
  });
  
  // 组件挂载状态引用
  const mountedRef = useRef(true);
  
  // 跟踪数据变化的引用
  const dataChangeRef = useRef({
    recipeData,
    directRecipe
  });

  // 处理显示的菜谱数据，确保所有字段都有合理的默认值
  const getRecipeToDisplay = useCallback((): Recipe => {
    try {
      // 如果有验证结果且有数据，使用验证后的数据
      if (validationResult?.isValid && validationResult.fixedData) {
        // 二次安全处理，确保UI永远不会出现undefined或null
        const recipe = validationResult.fixedData;
        const result = {
          ...recipe,
          name: safeString(recipe.name, DEFAULT_VALUES.name),
          difficulty: safeString(recipe.difficulty, DEFAULT_VALUES.difficulty),
          cuisine: safeString(recipe.cuisine, DEFAULT_VALUES.cuisine),
          flavors: safeArray(recipe.flavors, DEFAULT_VALUES.flavorProfile),
          cookingMethod: safeArray(recipe.cookingMethod, DEFAULT_VALUES.techniques),
          dietaryRestrictions: safeArray(recipe.dietaryRestrictions, DEFAULT_VALUES.dietary),
          ingredients: safeArray(recipe.ingredients, DEFAULT_VALUES.ingredients),
          seasonings: safeArray(recipe.seasonings, DEFAULT_VALUES.seasonings),
          preparationSteps: safeArray(recipe.preparationSteps, DEFAULT_VALUES.preparationSteps),
          cookingSteps: safeArray(recipe.cookingSteps, DEFAULT_VALUES.cookingSteps),
          cookingTips: safeArray(recipe.cookingTips, DEFAULT_VALUES.cookingTips),
        };
        return result;
      }
      
      // 如果有验证结果但无效，使用修复后的数据
      if (validationResult && validationResult.fixedData) {
        const fixedRecipe = validationResult.fixedData;
        const result = {
          ...fixedRecipe,
          name: safeString(fixedRecipe.name, DEFAULT_VALUES.name),
          difficulty: safeString(fixedRecipe.difficulty, DEFAULT_VALUES.difficulty),
          cuisine: safeString(fixedRecipe.cuisine, DEFAULT_VALUES.cuisine),
          flavors: safeArray(fixedRecipe.flavors, DEFAULT_VALUES.flavorProfile),
          cookingMethod: safeArray(fixedRecipe.cookingMethod, DEFAULT_VALUES.techniques),
          dietaryRestrictions: safeArray(fixedRecipe.dietaryRestrictions, DEFAULT_VALUES.dietary),
          ingredients: safeArray(fixedRecipe.ingredients, DEFAULT_VALUES.ingredients),
          seasonings: safeArray(fixedRecipe.seasonings, DEFAULT_VALUES.seasonings),
          preparationSteps: safeArray(fixedRecipe.preparationSteps, DEFAULT_VALUES.preparationSteps),
          cookingSteps: safeArray(fixedRecipe.cookingSteps, DEFAULT_VALUES.cookingSteps),
          cookingTips: safeArray(fixedRecipe.cookingTips, DEFAULT_VALUES.cookingTips),
          loadError: { _hasValidationErrors: true }
        };
        return result;
      }
      
      // 直接使用传入的原始数据创建安全对象
      if (directRecipe) {
        const result = validateAndSanitizeRecipe(directRecipe);
        return result;
      }
      
      // 最后的备选方案：直接使用原始数据创建安全对象
      const result = validateAndSanitizeRecipe(recipeData || {});
      return result;
    } catch (error) {
      console.error("在getRecipeToDisplay中发生错误:", error);
      // 即使在此处发生错误，也返回一个安全的默认菜谱对象
      return validateAndSanitizeRecipe(null);
    }
  }, [validationResult, directRecipe, recipeData]);

  // 处理菜谱数据的函数
  const handleRecipeData = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    
    let recipeId = '';
    
    // 获取当前最新的依赖值
    const { 
      recipeData, 
      validateRecipe, 
      validate, 
      directRecipe, 
      addError, 
      clearError, 
      onError 
    } = depsRef.current;
    
    // 如果直接传入了Recipe对象，进行安全处理
    if (directRecipe) {
      try {
        const safeRecipe = validateAndSanitizeRecipe(directRecipe);
        
        // 手动确保所有字段都有默认值
        const processedRecipe = {
          ...safeRecipe,
          name: safeString(safeRecipe.name, DEFAULT_VALUES.name),
          difficulty: safeString(safeRecipe.difficulty, DEFAULT_VALUES.difficulty),
          cuisine: safeString(safeRecipe.cuisine, DEFAULT_VALUES.cuisine),
          flavors: safeArray(safeRecipe.flavors, DEFAULT_VALUES.flavorProfile),
          cookingMethod: safeArray(safeRecipe.cookingMethod, DEFAULT_VALUES.techniques),
          dietaryRestrictions: safeArray(safeRecipe.dietaryRestrictions, DEFAULT_VALUES.dietary),
          ingredients: safeArray(safeRecipe.ingredients, DEFAULT_VALUES.ingredients),
          seasonings: safeArray(safeRecipe.seasonings, DEFAULT_VALUES.seasonings),
          preparationSteps: safeArray(safeRecipe.preparationSteps, DEFAULT_VALUES.preparationSteps),
          cookingSteps: safeArray(safeRecipe.cookingSteps, DEFAULT_VALUES.cookingSteps),
          cookingTips: safeArray(safeRecipe.cookingTips, DEFAULT_VALUES.cookingTips),
        };
        
        if (mountedRef.current) {
          setValidationResult({
            isValid: true,
            fixedData: processedRecipe,
            errors: []
          });
        }
        
        if (directRecipe.id) {
          clearError(directRecipe.id);
        }
      } catch (error) {
        if (mountedRef.current) {
          setHasError(true);
          setErrorDetails(error instanceof Error ? error : new Error('菜谱处理失败'));
          
          // 尝试提供一个降级方案
          const safeRecipe = validateAndSanitizeRecipe(null);
          setValidationResult({
            isValid: false,
            fixedData: safeRecipe,
            errors: [{ path: 'global', message: '直接菜谱处理失败' }]
          });
        }
        
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
      return;
    }

    // 如果不需要验证，直接进行安全处理
    if (!validate) {
      try {
        // 确保recipeData存在，否则创建空对象
        const dataToProcess = recipeData || {};
        const safeRecipe = validateAndSanitizeRecipe(dataToProcess);
        if (mountedRef.current) {
          setValidationResult({
            isValid: true,
            fixedData: safeRecipe,
            errors: []
          });
        }
      } catch (error) {
        if (mountedRef.current) {
          setHasError(true);
          setErrorDetails(error instanceof Error ? error : new Error('菜谱处理失败'));
        }
        
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
      return;
    }
    
    // 创建一个本地标记，用于追踪验证过程
    const validationMarkName = `RecipeValidation:${Date.now()}`;
    
    const validateRecipeData = async () => {
      try {
        const startTime = performance.now();
        
        // 解析阶段
        const parseStart = performance.now();
        const parsedData = typeof recipeData === 'string'
          ? enhancedJsonParse(recipeData, { defaultValue: {} as Recipe })
          : recipeData;
        const parseEnd = performance.now();
        const parsingTime = parseEnd - parseStart;
        
        // 获取recipe ID
        recipeId = parsedData?.id || 'unknown';
        
        // 验证阶段
        const validateStart = performance.now();
        const result = validateRecipe(parsedData);
        const validateEnd = performance.now();
        const validationTime = validateEnd - validateStart;
        
        // 计算总时间
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // 检查组件是否仍然挂载
        if (!mountedRef.current) return;
        
        setValidationPerformance({
          parsingTime,
          validationTime,
          totalTime
        });
        
        // 应用更加强健的数据安全处理
        let safeRecipe;
        if (result.isValid && result.fixedData) {
          // 使用验证通过的数据，但仍进行安全处理
          safeRecipe = validateAndSanitizeRecipe(result.fixedData);
          setValidationResult({
            ...result,
            fixedData: safeRecipe
          });
        } else {
          // 验证失败，使用更严格的安全处理创建有效的菜谱对象
          safeRecipe = validateAndSanitizeRecipe(parsedData);
          setValidationResult({
            isValid: false,
            fixedData: safeRecipe,
            errors: result.errors
          });
          
          // 设置错误状态但不阻止UI渲染
          setHasError(true);
          setErrorDetails(new Error('菜谱验证失败'));
          
          const errorDetails = result.errors.map(e => `${e.path ? `${e.path}: ` : ''}${e.message}`).join('; ');
          addError(recipeId, RecipeErrorHelper.createValidationError(recipeId, result.errors));
          
          if (onError) {
            onError(new Error(errorDetails));
          }
        }
        
      } catch (error) {
        console.error('菜谱验证过程出错:', error);
        
        // 检查组件是否仍然挂载
        if (!mountedRef.current) return;
        
        // 设置错误状态
        setHasError(true);
        setErrorDetails(error instanceof Error ? error : new Error('菜谱验证过程出错'));
        
        // 创建安全的空菜谱对象
        const safeRecipe = validateAndSanitizeRecipe(null);
        setValidationResult({
          isValid: false,
          fixedData: safeRecipe,
          errors: [{ path: 'global', message: '菜谱验证失败' }]
        });
        
        // 记录错误到全局状态
        if (recipeId) {
          addError(recipeId, RecipeErrorHelper.createLoadError(recipeId, error));
        }
        
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    validateRecipeData();
  }, []);

  // 记录组件性能
  useEffect(() => {
    const markName = `RecipeDetail:render:${Date.now()}`;
    markRef.current = markName;
    
    return () => {
      if (markRef.current) {
        markRef.current = null;
      }
    };
  }, []);

  // 在首次渲染时处理验证
  useEffect(() => {
    // 首次挂载时处理数据
    handleRecipeData();
    
    // 组件卸载时清理
    return () => {
      mountedRef.current = false;
    };
  }, []); // 使用空依赖数组，只在组件挂载时运行一次

  // 检测数据变化，重新加载数据
  useEffect(() => {
    // 如果recipeData或directRecipe发生变化，重新处理数据
    const hasRecipeDataChanged = recipeData && recipeData !== dataChangeRef.current.recipeData;
    const hasDirectRecipeChanged = directRecipe && directRecipe !== dataChangeRef.current.directRecipe;
    
    if (hasRecipeDataChanged || hasDirectRecipeChanged) {
      dataChangeRef.current = {
        recipeData,
        directRecipe
      };
      
      // 只有在组件已挂载的情况下才重新处理
      if (mountedRef.current) {
        handleRecipeData();
      }
    }
  }, [recipeData, directRecipe, handleRecipeData]);

  // 当props变化时更新refs中的值，但不触发useEffect重新执行
  useEffect(() => {
    depsRef.current = {
      recipeData,
      validateRecipe,
      validate,
      directRecipe,
      addError,
      clearError,
      onError
    };
  }, [recipeData, validateRecipe, validate, directRecipe, addError, clearError, onError]);

  // 使用缓存的getRecipeToDisplay函数获取菜谱数据
  const recipeToDisplay = useMemo(() => getRecipeToDisplay(), [getRecipeToDisplay]);

  // 缓存错误处理函数，避免每次渲染创建新函数
  const handleError = useCallback((error: Error) => {
    if (onError) onError(error);
  }, [onError]);

  // 使用useMemo创建一个稳定的key，避免在每次渲染时生成新的key
  const errorBoundaryKey = useMemo(() => {
    return `recipe-${recipeData?.id || directRecipe?.id || 'unknown'}`;
  }, [recipeData?.id, directRecipe?.id]);

  // 自定义错误回调包装器，适配ErrorBoundary的fallback属性
  const errorFallbackWrapper = useCallback((props: ErrorFallbackProps) => {
    const ErrorComponent = fallback;
    return <ErrorComponent {...props} />;
  }, [fallback]);

  return (
    <ErrorBoundary
      fallback={errorFallbackWrapper}
      theme={errorBoundaryTheme}
      key={errorBoundaryKey}
      onError={handleError}
    >
      <WithSkeleton 
        loading={isLoading} 
        variant="detail" 
        count={20}
      >
        {hasError && showValidationDetails ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <h3 className="text-red-700 text-lg font-medium">菜谱数据问题</h3>
            <p className="text-red-600">发现{validationResult?.errors.length || 0}个验证错误，但已尝试修复并显示</p>
            {errorDetails && <p className="text-sm text-red-500 mt-2">{errorDetails.message}</p>}
          </div>
        ) : null}
        
        <RecipeDetails 
          recipe={recipeToDisplay} 
          showValidationDetails={showValidationDetails}
          validationResult={validationResult}
          validationPerformance={validationPerformance}
        />
        
        {/* 在菜谱详情末尾添加相关推荐 */}
        {recipeToDisplay && (
          <RelatedRecipes 
            currentRecipe={recipeToDisplay}
            className="mt-8"
          />
        )}
      </WithSkeleton>
    </ErrorBoundary>
  );
};

export default RecipeDetail;