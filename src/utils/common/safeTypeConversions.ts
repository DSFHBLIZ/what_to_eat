/**
 * 安全类型转换工具函数
 * 用于安全处理类型转换，防止类型转换错误和安全隐患
 */

import { z } from 'zod';
import { RecipeValidatorSchema, validateRecipe } from '../../domain/validation/recipeValidation';
import { Recipe } from '../../types/recipe';

type ConversionOptions = {
  logPrefix?: string;
  customWarningCheck?: (value: unknown) => { valid: boolean; message?: string };
};

/**
 * 通用的类型转换错误处理逻辑
 */
const handleConversionError = <T>(
  value: unknown, 
  defaultValue: T, 
  options: ConversionOptions = {}
): { useDefault: boolean; result?: T; message?: string } => {
  const { logPrefix = '', customWarningCheck } = options;
  
  // 处理null和undefined
  if (value === null || value === undefined) {
    return { 
      useDefault: true, 
      message: `${logPrefix}: 输入值为${value === null ? 'null' : 'undefined'}` 
    };
  }
  
  // 处理空字符串
  if (typeof value === 'string' && value.trim() === '') {
    return { 
      useDefault: true, 
      message: `${logPrefix}: 输入值为空字符串` 
    };
  }
  
  // 执行自定义检查
  if (customWarningCheck) {
    const check = customWarningCheck(value);
    if (!check.valid) {
      return {
        useDefault: true,
        message: check.message
      };
    }
  }
  
  // 检查复杂类型
  if (typeof value === 'object' && value !== null) {
    return {
      useDefault: false,
      message: `${logPrefix}: 尝试转换复杂对象类型 ${typeof value}`
    };
  }
  
  return { useDefault: false };
};

/**
 * 安全的parseInt函数，处理各种异常情况
 * @param value 要转换的值
 * @param defaultValue 转换失败时的默认值
 * @param radix 进制数，默认为10
 * @returns 转换后的整数或默认值
 */
export function safeParseInt(
  value: unknown, 
  defaultValue: number = 0, 
  radix: number = 10
): number {
  const errorCheck = handleConversionError(value, defaultValue, { 
    logPrefix: 'safeParseInt'
  });
  
  if (errorCheck.useDefault) {
    console.warn(errorCheck.message);
    return defaultValue;
  }
  
  if (errorCheck.message) {
    console.warn(errorCheck.message);
  }
  
  try {
    // 强制转换为字符串后解析
    const parsed = parseInt(String(value), radix);
    
    // 检查是否为NaN或Infinity
    if (isNaN(parsed) || !isFinite(parsed)) {
      console.warn(`safeParseInt: 无法解析值 "${value}" 为有效整数`);
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.error('safeParseInt错误:', error);
    return defaultValue;
  }
}

/**
 * 安全的parseFloat函数，处理各种异常情况
 * @param value 要转换的值
 * @param defaultValue 转换失败时的默认值
 * @returns 转换后的浮点数或默认值
 */
export function safeParseFloat(
  value: unknown, 
  defaultValue: number = 0
): number {
  const errorCheck = handleConversionError(value, defaultValue, { 
    logPrefix: 'safeParseFloat'
  });
  
  if (errorCheck.useDefault) {
    console.warn(errorCheck.message);
    return defaultValue;
  }
  
  if (errorCheck.message) {
    console.warn(errorCheck.message);
  }
  
  try {
    // 强制转换为字符串后解析
    const parsed = parseFloat(String(value));
    
    // 检查是否为NaN或Infinity
    if (isNaN(parsed) || !isFinite(parsed)) {
      console.warn(`safeParseFloat: 无法解析值 "${value}" 为有效浮点数`);
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.error('safeParseFloat错误:', error);
    return defaultValue;
  }
}

/**
 * 安全的Number转换函数，处理各种异常情况
 * @param value 要转换的值
 * @param defaultValue 转换失败时的默认值
 * @returns 转换后的数字或默认值
 */
export function safeToNumber(
  value: unknown, 
  defaultValue: number = 0
): number {
  // 对于已经是数字类型的值，只需检查是否为NaN或Infinity
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      console.warn(`safeToNumber: 输入值 ${value} 为NaN或Infinity`);
      return defaultValue;
    }
    return value;
  }
  
  const errorCheck = handleConversionError(value, defaultValue, { 
    logPrefix: 'safeToNumber'
  });
  
  if (errorCheck.useDefault) {
    console.warn(errorCheck.message);
    return defaultValue;
  }
  
  if (errorCheck.message) {
    console.warn(errorCheck.message);
  }
  
  try {
    // 使用Number()转换
    const parsed = Number(value);
    
    // 检查是否为NaN或Infinity
    if (isNaN(parsed) || !isFinite(parsed)) {
      console.warn(`safeToNumber: 无法转换值 "${value}" 为有效数字`);
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.error('safeToNumber错误:', error);
    return defaultValue;
  }
}

/**
 * 安全的布尔值转换函数
 * @param value 要转换的值
 * @param defaultValue 转换失败时的默认值
 * @returns 转换后的布尔值
 */
export function safeToBoolean(
  value: unknown, 
  defaultValue: boolean = false
): boolean {
  // 处理null和undefined
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // 已经是布尔类型
  if (typeof value === 'boolean') {
    return value;
  }
  
  // 字符串类型处理
  if (typeof value === 'string') {
    const lowerValue = value.trim().toLowerCase();
    
    // 常见的表示"真"的字符串
    if (['true', 'yes', 'y', '1', 'on'].includes(lowerValue)) {
      return true;
    }
    
    // 常见的表示"假"的字符串
    if (['false', 'no', 'n', '0', 'off', ''].includes(lowerValue)) {
      return false;
    }
    
    // 其他字符串无法明确判断
    console.warn(`safeToBoolean: 无法明确将字符串 "${value}" 转换为布尔值，使用默认值`);
    return defaultValue;
  }
  
  // 数字类型处理
  if (typeof value === 'number') {
    // 0被视为false，非0视为true
    return value !== 0;
  }
  
  // 处理其他类型
  console.warn(`safeToBoolean: 无法明确将类型 ${typeof value} 转换为布尔值，使用默认值`);
  return defaultValue;
}

/**
 * 将值安全地转换为指定类型
 * @param value 要转换的值
 * @param type 目标类型
 * @param defaultValue 默认值
 * @returns 转换后的值
 */
export function safeCast<T>(
  value: unknown, 
  type: 'string' | 'number' | 'boolean' | 'array' | 'object', 
  defaultValue: T
): T {
  try {
    switch (type) {
      case 'string':
        return (value === null || value === undefined) 
          ? defaultValue 
          : String(value) as unknown as T;
        
      case 'number':
        return safeToNumber(value, defaultValue as unknown as number) as unknown as T;
        
      case 'boolean':
        return safeToBoolean(value, defaultValue as unknown as boolean) as unknown as T;
        
      case 'array':
        if (Array.isArray(value)) {
          return value as unknown as T;
        }
        console.warn('safeCast: 值不是数组类型');
        return defaultValue;
        
      case 'object':
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return value as unknown as T;
        }
        console.warn('safeCast: 值不是对象类型');
        return defaultValue;
        
      default:
        console.warn(`safeCast: 不支持的类型 ${type}`);
        return defaultValue;
    }
  } catch (error) {
    console.error(`safeCast to ${type} 错误:`, error);
    return defaultValue;
  }
}

/**
 * 安全解析JSON字符串为对象
 * @param json JSON字符串
 * @param defaultValue 默认值（解析失败时返回）
 * @param logPrefix 日志前缀
 * @returns 解析后的对象或默认值
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  defaultValue: T,
  logPrefix: string = 'safeJsonParse'
): T {
  // 标准化日志前缀
  const prefix = logPrefix ? `[${logPrefix}] ` : '';
  
  try {
    // 处理空值
    if (json === null || json === undefined || json.trim() === '') {
      return defaultValue;
    }
    
    // 解析JSON
    const parsed = JSON.parse(json);
    
    // 类型检查：确保解析结果与默认值类型匹配
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      // 预期是对象，但解析结果不是对象
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) !== Array.isArray(defaultValue)) {
        console.warn(`${prefix}类型不匹配：预期${Array.isArray(defaultValue) ? '数组' : '对象'}，实际是${typeof parsed}`);
        return defaultValue;
      }
    } else if (typeof defaultValue !== typeof parsed) {
      // 预期是基本类型，但解析结果类型不匹配
      console.warn(`${prefix}类型不匹配：预期${typeof defaultValue}，实际是${typeof parsed}`);
      return defaultValue;
    }
    
    return parsed as T;
  } catch (error) {
    console.error(`${prefix}JSON解析错误:`, error);
    return defaultValue;
  }
}

/**
 * 使用Zod模式验证的安全JSON解析函数
 * @param json JSON字符串
 * @param schema Zod验证模式
 * @param defaultValue 解析或验证失败时返回的默认值
 * @param options 可选配置
 * @returns 解析并验证后的对象或默认值
 */
export function safeJsonParseWithSchema<T>(
  json: string | null | undefined,
  schema: z.ZodSchema<T>,
  defaultValue: T,
  options: {
    logPrefix?: string;
    logErrors?: boolean;
    transformErrors?: boolean;
  } = {}
): T {
  const { logPrefix = '', logErrors = true, transformErrors = false } = options;
  
  // 处理空值
  if (json === null || json === undefined || json.trim() === '') {
    if (logErrors) {
      console.warn(`${logPrefix}JSON字符串为空，返回默认值`);
    }
    return defaultValue;
  }
  
  try {
    // 第一步：尝试解析JSON
    const parsedData = JSON.parse(json);
    
    // 第二步：使用Zod验证解析后的数据
    try {
      const validatedData = schema.parse(parsedData);
      return validatedData;
    } catch (validationError) {
      if (logErrors) {
        console.error(`${logPrefix}Zod验证错误:`, validationError);
      }
      
      // 如果启用了transformErrors，尝试部分解析
      if (transformErrors) {
        try {
          // 尝试使用宽松模式（.safeParse）获取部分有效数据
          const safeResult = schema.safeParse(parsedData);
          if (safeResult.success) {
            return safeResult.data;
          }
          
          // 如果可能，处理部分数据
          if (typeof parsedData === 'object' && parsedData !== null) {
            // 尝试返回尽可能多的有效字段
            console.warn(`${logPrefix}尝试提取部分有效数据`);
            return defaultValue;
          }
        } catch (error) {
          console.error(`${logPrefix}转换错误失败:`, error);
        }
      }
      
      return defaultValue;
    }
  } catch (parseError) {
    // JSON解析失败
    if (logErrors) {
      console.error(`${logPrefix}JSON解析错误:`, parseError);
    }
    return defaultValue;
  }
}

/**
 * 安全解析并验证Recipe JSON数据
 * @param json Recipe的JSON字符串
 * @param defaultValue 默认Recipe对象
 * @returns 解析并验证后的Recipe对象
 */
export function safeParseRecipeJson(
  json: string | null | undefined,
  defaultValue: Recipe
): Recipe {
  try {
    // 尝试解析JSON
    if (!json) {
      return defaultValue;
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(json);
    } catch (error) {
      console.error('Recipe JSON解析错误:', error);
      return defaultValue;
    }
    
    if (!parsedData) {
      return defaultValue;
    }
    
    // 直接使用validateRecipe进行验证
    const validationResult = validateRecipe(parsedData);
    
    // 如果验证成功，返回验证后的数据
    if (validationResult.isValid) {
      return validationResult.fixedData as Recipe;
    }
    
    // 验证失败但仍有修复数据
    if (validationResult.fixedData) {
      console.warn('Recipe验证警告:', validationResult.errors);
      return validationResult.fixedData as Recipe;
    }
    
    // 无法验证，返回默认值
    return defaultValue;
  } catch (error) {
    console.error('Recipe解析验证错误:', error);
    return defaultValue;
  }
}

/**
 * 安全数组转换函数，确保返回一个有效的数组
 * 增强版支持更多边缘情况的处理和更详细的日志
 * 
 * @param value 要转换为数组的值
 * @param defaultValue 转换失败时的默认数组
 * @param options 可选配置项
 * @returns 有效的数组
 */
export function safeArray<T>(
  value: unknown, 
  defaultValue: T[] = [],
  options: {
    componentName?: string;
    propertyName?: string;
    allowEmpty?: boolean;
    itemValidator?: (item: unknown) => boolean;
    itemTransformer?: (item: unknown) => T;
  } = {}
): T[] {
  const {
    componentName = '',
    propertyName = '',
    allowEmpty = true,
    itemValidator,
    itemTransformer
  } = options;
  
  const logPrefix = componentName && propertyName 
    ? `[${componentName}] ${propertyName}`
    : componentName 
      ? `[${componentName}]` 
      : propertyName 
        ? `${propertyName}` 
        : 'safeArray';

  // 处理null或undefined
  if (value === null || value === undefined) {
    console.warn(`${logPrefix}: 输入值为 ${value === null ? 'null' : 'undefined'}，返回默认数组`);
    return [...defaultValue]; // 返回默认数组的副本，避免修改原数组
  }

  // 已经是数组的情况
  if (Array.isArray(value)) {
    // 空数组检查
    if (value.length === 0 && !allowEmpty) {
      console.warn(`${logPrefix}: 输入数组为空，返回默认数组`);
      return [...defaultValue];
    }
    
    // 如果提供了验证函数，过滤无效项
    if (itemValidator) {
      const validItems = value.filter(item => {
        const isValid = itemValidator(item);
        if (!isValid) {
          console.warn(`${logPrefix}: 数组项验证失败`, item);
        }
        return isValid;
      });
      
      // 验证后为空数组的处理
      if (validItems.length === 0 && !allowEmpty) {
        console.warn(`${logPrefix}: 验证后数组为空，返回默认数组`);
        return [...defaultValue];
      }
      
      // 如果提供了转换函数，应用到每个有效项
      if (itemTransformer) {
        return validItems.map(item => itemTransformer(item));
      }
      
      return validItems as T[];
    }
    
    // 如果只提供了转换函数，应用到每个项
    if (itemTransformer) {
      return value.map(item => itemTransformer(item));
    }
    
    return value as T[];
  }

  // 字符串处理 - 尝试解析JSON
  if (typeof value === 'string') {
    try {
      // 空字符串处理
      if (value.trim() === '') {
        console.warn(`${logPrefix}: 输入为空字符串，返回默认数组`);
        return [...defaultValue];
      }
      
      // 尝试解析JSON字符串
      const parsed = JSON.parse(value);
      
      // 确保解析结果是数组
      if (Array.isArray(parsed)) {
        // 递归调用safeArray处理解析出的数组
        return safeArray(parsed, defaultValue, options);
      } else {
        console.warn(`${logPrefix}: JSON字符串解析结果不是数组`, parsed);
        // 尝试将对象转换为数组的处理
        if (typeof parsed === 'object' && parsed !== null) {
          const objValues = Object.values(parsed);
          if (objValues.length > 0) {
            console.info(`${logPrefix}: 将对象转换为数组`, objValues);
            return safeArray(objValues, defaultValue, options);
          }
        }
        return [...defaultValue];
      }
    } catch (error) {
      console.warn(`${logPrefix}: JSON解析失败`, error);
      
      // 尝试将字符串按逗号分割为数组
      if (value.includes(',')) {
        const items = value.split(',').map(item => item.trim()).filter(Boolean);
        console.info(`${logPrefix}: 将字符串按逗号分割为数组`, items);
        
        if (items.length > 0) {
          if (itemTransformer) {
            return items.map(item => itemTransformer(item as unknown));
          }
          return items as unknown as T[];
        }
      }
      
      // 将单个字符串作为数组的一个元素
      if (value.trim() && !value.startsWith('[') && !value.startsWith('{')) {
        console.info(`${logPrefix}: 将单个字符串作为数组元素`, [value]);
        const singleItem = [value.trim()];
        
        if (itemTransformer) {
          return singleItem.map(item => itemTransformer(item as unknown));
        }
        return singleItem as unknown as T[];
      }
      
      return [...defaultValue];
    }
  }

  // 对象处理 - 尝试转换为数组
  if (typeof value === 'object' && value !== null) {
    // 检查是否有数组相关属性
    const objWithArrayProps = value as Record<string, unknown>;
    
    // 检查是否是类数组对象
    if ('length' in objWithArrayProps && typeof objWithArrayProps.length === 'number') {
      try {
        // 尝试将类数组对象转换为数组
        const arrFromObj = Array.from(objWithArrayProps as unknown as ArrayLike<unknown>);
        console.info(`${logPrefix}: 将类数组对象转换为数组`, arrFromObj);
        return safeArray(arrFromObj, defaultValue, options);
      } catch (e) {
        console.warn(`${logPrefix}: 类数组对象转换失败`, e);
      }
    }
    
    // 检查是否有值数组属性
    const arrayProps = ['items', 'values', 'list', 'data', 'array', 'elements', 'content'];
    for (const prop of arrayProps) {
      if (prop in objWithArrayProps && objWithArrayProps[prop] !== undefined) {
        console.info(`${logPrefix}: 使用对象的 ${prop} 属性作为数组`);
        return safeArray(objWithArrayProps[prop], defaultValue, options);
      }
    }
    
    // 将对象的所有值作为数组
    const objValues = Object.values(objWithArrayProps);
    if (objValues.length > 0) {
      console.info(`${logPrefix}: 将对象值转换为数组`, objValues);
      return safeArray(objValues, defaultValue, options);
    }
  }

  // 其他情况：将单个值包装为数组
  console.warn(`${logPrefix}: 无法识别的输入类型 ${typeof value}，包装为单元素数组`);
  const singleItemArray = value !== null && value !== undefined ? [value] : [];
  
  if (singleItemArray.length === 0 && !allowEmpty) {
    return [...defaultValue];
  }
  
  if (itemValidator && singleItemArray.length > 0) {
    const isValid = itemValidator(singleItemArray[0]);
    if (!isValid) {
      console.warn(`${logPrefix}: 单个值验证失败`, value);
      return [...defaultValue];
    }
  }
  
  if (itemTransformer && singleItemArray.length > 0) {
    return [itemTransformer(singleItemArray[0])];
  }
  
  return singleItemArray as unknown as T[];
}

export default {
  safeParseInt,
  safeParseFloat,
  safeToNumber,
  safeToBoolean,
  safeCast,
  safeJsonParse,
  safeJsonParseWithSchema,
  safeParseRecipeJson,
  safeArray
}; 