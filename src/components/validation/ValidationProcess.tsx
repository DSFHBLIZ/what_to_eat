/**
 * component:ValidationProcess 验证处理组件
 * 处理验证过程和性能度量
 */
import React, { useEffect, useState } from 'react';
import { enhancedJsonParse } from '../../utils/data/enhancedSafeJsonParse';
import { Recipe } from '../../types/recipe';
import { RecipeValidationResult, ValidationPerformance } from '../../types/validation';
import WithSkeleton from '../ui/WithSkeleton';

interface ValidationProcessProps {
  recipeData: any;
  validateRecipe: (data: any) => RecipeValidationResult;
  onValidationComplete: (result: RecipeValidationResult, performance: ValidationPerformance) => void;
}

/**
 * 处理验证逻辑的组件
 */
const ValidationProcess: React.FC<ValidationProcessProps> = ({
  recipeData,
  validateRecipe,
  onValidationComplete
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // 创建一个本地标记，用于追踪验证过程
    const validationMarkName = `ValidationProcess:${Date.now()}`;
    
    const validateData = async () => {
      setIsLoading(true);
      
      try {
        // 测量验证性能
        const startTime = performance.now();
        
        // 1. 先执行安全解析
        let parseStartTime = performance.now();
        let parsedData: any;
        
        // 如果数据是字符串，需要解析
        if (typeof recipeData === 'string') {
          parsedData = enhancedJsonParse(recipeData, {
            defaultValue: {} as Recipe,
            componentName: 'ValidationProcess',
            attemptFix: true
          });
        } else {
          parsedData = recipeData;
        }
        
        const parseEndTime = performance.now();
        const parsingTime = parseEndTime - parseStartTime;
        
        // 2. 执行验证
        const validationStartTime = performance.now();
        const result = validateRecipe(parsedData);
        const validationEndTime = performance.now();
        const validationTime = validationEndTime - validationStartTime;
        
        // 总处理时间
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // 将结果传递给父组件
        onValidationComplete(result, {
          parsingTime,
          validationTime,
          totalTime
        });
      } catch (error) {
        console.error('菜谱验证过程出错:', error);
        
        // 创建一个符合Recipe类型的默认值
        const emptyRecipe: Recipe = {
          id: 'error',
          name: '错误数据',
          description: '验证过程出错',
          ingredients: [],
          seasonings: [],
          flavors: [],
          difficulty: '简单',
          cookingTime: '30分钟',
          steps: [],
          cookingTips: [],
          imageUrl: ''
        };
        
        // 即使出错也返回一个失败的验证结果
        onValidationComplete(
          {
            isValid: false,
            fixedData: emptyRecipe,
            errors: [{ message: `验证过程出错: ${error}`, path: '' }]
          },
          { parsingTime: 0, validationTime: 0, totalTime: 0 }
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    validateData();
  }, [recipeData, validateRecipe, onValidationComplete]);

  // 组件只用于处理验证逻辑，不实际渲染内容
  return (
    <WithSkeleton loading={isLoading} variant="spinner">
      {null}
    </WithSkeleton>
  );
};

export default ValidationProcess; 