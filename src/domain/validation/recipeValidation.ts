'use client';

/**
 * 领域层：食谱验证
 * 包含食谱相关的验证逻辑和Schema
 */
import { z } from 'zod';
import { useState, useCallback } from 'react';
import { Recipe } from '../../types/recipe';
import { RecipeValidationResult } from '../../types/validation';

// 错误类型 - 仅在内部使用
type RecipeValidationErrors = Record<string, string | any>;

// 定义食谱验证Schema
export const RecipeValidatorSchema = z.object({
  id: z.string().min(1, "ID不能为空"),
  name: z.string().min(2, "菜谱名称至少需要2个字符").max(100, "菜谱名称不能超过100个字符"),
  description: z.string().min(10, "描述至少需要10个字符").max(2000, "描述不能超过2000个字符"),
  ingredients: z.array(
    z.union([
      z.string().min(2, "食材名称至少需要2个字符"),
      z.object({
        name: z.string().min(2, "食材名称至少需要2个字符"),
        quantity: z.string().optional()
      })
    ])
  ).min(1, "至少需要1种食材"),
  seasonings: z.array(
    z.union([
      z.string().min(1, "调料名称不能为空"),
      z.object({
        name: z.string().min(1, "调料名称不能为空"),
        quantity: z.string().optional()
      })
    ])
  ).optional(),
  flavors: z.array(z.string()).min(1, "至少需要一个口味标签"),
  difficulty: z.string().min(1, "菜谱难度不能为空"),
  cookingTime: z.union([z.string(), z.number()]),
  steps: z.array(z.string().min(5, "步骤描述至少需要5个字符")).min(1, "至少需要1个步骤"),
  preparationSteps: z.array(z.string()).optional(),
  cookingSteps: z.array(z.string()).optional(),
  cookingTips: z.array(z.string()),
  imageUrl: z.string().url("请输入有效的图片URL地址"),
  cuisine: z.string().optional(),
  cookingMethod: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  matchScore: z.number().optional(),
  matchedIngredients: z.array(z.string()).optional(),
  servings: z.number().int().min(1, "份量不能小于1").max(100, "份量不能超过100").optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  rating: z.number().min(0).max(5).optional(),
});

/**
 * 将内部错误格式转换为标准化的错误数组
 * @param errors 内部错误对象
 * @returns 标准化的错误数组
 */
function formatValidationErrors(errors?: RecipeValidationErrors): Array<{ path: string; message: string }> {
  if (!errors) return [];
  
  const errorMap: Record<string, string> = {};
  
  Object.entries(errors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      errorMap[key] = value;
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === 'object' && item.errors) {
          Object.entries(item.errors).forEach(([subKey, subValue]) => {
            errorMap[`${key}[${idx}].${subKey}`] = subValue as string;
          });
        }
      });
    }
  });
  
  return Object.entries(errorMap).map(([path, message]) => ({ 
    path, 
    message: message as string 
  }));
}

/**
 * 菜谱验证器类
 * 提供菜谱数据验证方法
 */
export class RecipeValidator {
  /**
   * 验证单个字段
   * @param field 字段名
   * @param value 字段值
   * @returns 是否有效
   */
  static validateField<K extends keyof Recipe>(field: K, value: Recipe[K]): boolean {
    try {
      // 使用临时对象创建验证
      const testObj = { [field]: value } as any;
      const schema = RecipeValidatorSchema.partial();
      const result = schema.safeParse(testObj);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证部分菜谱对象
   * @param data 部分菜谱数据
   * @returns 验证结果
   */
  static validatePartial(data: Partial<Recipe>): { success: boolean, errors?: z.ZodError } {
    const partialSchema = RecipeValidatorSchema.partial();
    const result = partialSchema.safeParse(data);
    
    return {
      success: result.success,
      errors: result.success ? undefined : result.error
    };
  }

  /**
   * 验证食谱数据
   * @param data 要验证的食谱数据
   * @returns 验证结果对象
   */
  static validateRecipeData(data: unknown): {
    valid: boolean;
    recipe?: Recipe;
    errors?: RecipeValidationErrors;
  } {
    try {
      const result = RecipeValidatorSchema.safeParse(data);
      
      if (result.success) {
        return {
          valid: true,
          recipe: result.data as Recipe
        };
      } else {
        const errors: RecipeValidationErrors = {};
        
        result.error.errors.forEach((err) => {
          const path = err.path;
          
          if (path.length === 1) {
            // 顶级字段错误
            errors[path[0] as keyof Recipe] = err.message;
          } 
          else if (path.length >= 3 && Array.isArray(path)) {
            // 数组内对象字段错误
            const arrayField = path[0] as keyof Recipe;
            const index = path[1] as number;
            const subField = path[2] as string;
            
            if (!errors[arrayField]) {
              errors[arrayField] = [];
            }
            
            const arrayErrors = errors[arrayField] as { index: number; errors: { [key: string]: string } }[];
            let itemError = arrayErrors.find(item => item.index === index);
            
            if (!itemError) {
              itemError = { index, errors: {} };
              arrayErrors.push(itemError);
            }
            
            itemError.errors[subField] = err.message;
          }
        });
        
        return {
          valid: false,
          errors
        };
      }
    } catch (error) {
      return {
        valid: false,
        errors: {
          _form: '验证过程中发生错误'
        }
      };
    }
  }
}

/**
 * 菜谱验证Hook
 * 提供React组件中使用的验证函数
 */
export function useRecipeValidator() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 统一Hook内部验证函数与外部导出函数的返回值格式
  const validateRecipe = useCallback((data: unknown): RecipeValidationResult => {
    // 直接调用公共验证函数
    const validationResult = RecipeValidator.validateRecipeData(data);
    
    if (validationResult.valid && validationResult.recipe) {
      setErrors({});
      return { 
        isValid: true, 
        fixedData: validationResult.recipe, 
        errors: [] 
      };
    } else {
      // 格式化错误信息并设置到状态
      const formattedErrors = formatValidationErrors(validationResult.errors);
      const errorMap = Object.fromEntries(
        formattedErrors.map(({ path, message }) => [path, message])
      );
      
      setErrors(errorMap);
      
      return { 
        isValid: false, 
        fixedData: data as Recipe, 
        errors: formattedErrors
      };
    }
  }, []);
  
  const validateField = useCallback((field: keyof Recipe, value: any) => {
    return RecipeValidator.validateField(field, value);
  }, []);
  
  const validatePartial = useCallback((data: Partial<Recipe>) => {
    const result = RecipeValidator.validatePartial(data);
    return result.success;
  }, []);
  
  return {
    errors,
    validateRecipe,
    validateField,
    validatePartial,
    validator: RecipeValidatorSchema
  };
}

// 导出便捷函数
export const validateRecipe = (data: unknown, source?: string): RecipeValidationResult => {
  // 使用validateRecipeData方法进行验证
  const result = RecipeValidator.validateRecipeData(data);
  
  if (result.valid && result.recipe) {
    return {
      isValid: true,
      fixedData: result.recipe,
      errors: []
    };
  }
  
  // 记录验证源
  if (source) {
    console.warn(`${source}验证菜谱失败:`, result.errors);
  }
  
  // 使用辅助函数格式化错误
  return {
    isValid: false,
    fixedData: data as Recipe,  // 返回原始数据，由调用方处理
    errors: formatValidationErrors(result.errors)
  };
};