/**
 * 数据映射器
 * 负责数据库记录与前端模型间的转换
 */

import { Recipe } from '../../types/recipe';
import { IngredientItem } from '../../types';
import { logger } from '../../observability';

/**
 * 数据库记录结构 - 更新为与Supabase一致的结构
 */
export interface DbRecipe {
  id: string;
  菜名?: string;
  菜系?: string;
  口味特点?: string | string[];
  烹饪技法?: string | string[];
  食材?: string | IngredientItem[];
  调料?: string | string[];
  步骤?: string | string[];
  注意事项?: string | string[];
  created_at?: string;
  updated_at?: string;
  烹饪难度?: string | string[];
  是否无麸质?: boolean;
  调料分类?: string | any[];
  user_id?: string;
  是否清真?: boolean;
  食材分类?: string | any[];
  是否纯素?: boolean;
  食材名称文本?: string;
  调料名称文本?: string;
  // 兼容旧版字段
  name?: string;
  description?: string;
  ingredients?: string | IngredientItem[];
  steps?: string | string[];
  image_url?: string;
  cuisine?: string;
  cooking_time?: number;
  difficulty?: string;
  servings?: number;
  flavors?: string | string[];
  tags?: string | string[];
  dietary_restrictions?: string | string[];
  nutrition_info?: string | object;
  // 其他可能的字段
  [key: string]: any;
}

/**
 * 安全解析JSONB数据
 */
export function safeParseJsonb<T>(data: string | object | null, defaultValue: T): T {
  if (data === null || data === undefined) {
    return defaultValue;
  }
  
  // 如果已经是对象类型（包括数组），直接返回
  if (typeof data === 'object') {
    return data as unknown as T;
  }
  
  // 处理字符串情况
  if (typeof data === 'string') {
    // 空字符串直接返回默认值
    if (data.trim() === '') {
      return defaultValue;
    }
    
    try {
      // 尝试作为JSON解析
      const parsed = JSON.parse(data) as T;
      return parsed;
    } catch (e) {
      // 如果默认值是数组，尝试使用逗号分隔处理方式
      if (Array.isArray(defaultValue)) {
        // 处理逗号分隔的字符串
        if (data.includes(',')) {
          const result = data.split(',')
            .map(item => item.trim())
            .filter(Boolean) as unknown as T;
          return result;
        }
        
        // 单个字符串值，包装为数组返回
        return [data.trim()] as unknown as T;
      }
      
      // 如果字符串看起来像对象或数组但解析失败，尝试清理后重新解析
      if ((data.startsWith('{') && data.endsWith('}')) || 
          (data.startsWith('[') && data.endsWith(']'))) {
        try {
          // 尝试清理和重新解析
          const cleaned = data
            .replace(/\\"/g, '"')  // 替换转义的双引号
            .replace(/\\'/g, "'")  // 替换转义的单引号
            .replace(/'/g, '"')    // 将单引号替换为双引号（JSON标准使用双引号）
            .replace(/(\w+):/g, '"$1":') // 将非引号的键名转换为带引号的键名
            .replace(/\\/g, '\\\\'); // 处理反斜杠
          
          const parsedCleaned = JSON.parse(cleaned) as T;
          return parsedCleaned;
        } catch (cleanError) {
          // 如果所有解析尝试都失败，返回默认值
          console.warn('JSON解析失败:', data.substring(0, 100));
          return defaultValue;
        }
      }
      
      return defaultValue;
    }
  }
  
  // 其他类型，记录错误并返回默认值
  console.warn('不支持的数据类型:', typeof data);
  return defaultValue;
}

/**
 * 将数据库记录转换为前端模型
 */
export function dbRecordToFrontendModel(record: DbRecipe): Recipe {
  try {
    if (!record) {
      throw new Error('记录为空');
    }
    
    if (typeof record !== 'object' || !('id' in record)) {
      throw new Error('记录格式无效');
    }
    
    // 获取菜名 (优先使用中文字段，然后使用旧版字段)
    const name = record.菜名 || record.name || '';
    
    // 获取菜系
    const cuisine = record.菜系 || record.cuisine || '';
    
    // 获取描述 (使用旧版字段，新版本似乎没有对应字段)
    const description = record.description || '';
    
    // 解析食材
    let ingredients = safeParseJsonb<any[]>(
      record.食材 || record.ingredients || [], 
      []
    );
    
    // 确保食材和调料即使为空数组也会有默认值
    if (!ingredients.length) {
      ingredients = [{ id: 'default-ing-1', name: '未知食材', quantity: '适量' }];
    } else {
      // 处理原始数据可能是嵌套的情况
      ingredients = ingredients.map((ing: any) => {
        if (typeof ing === 'string') {
          return { id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, name: ing, quantity: '适量' };
        }
        
        if (ing && typeof ing === 'object') {
          // 尝试找到名称字段
          let name = ing.name;
          if (!name) {
            if (ing.名称) name = ing.名称;
            else if (ing.食材名) name = ing.食材名;
            else if (ing.text) name = ing.text;
          }
          
          // 尝试找到数量字段
          let quantity = ing.quantity;
          if (!quantity) {
            if (ing.用量) quantity = ing.用量;
            else if (ing.amount) quantity = ing.amount;
          }
          
          return {
            id: ing.id || `ing-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: name || '未知食材',
            quantity: quantity || '适量',
            category: ing.category || '',
            type: ing.type || '',
            isRequired: typeof ing.isRequired === 'boolean' ? ing.isRequired : true
          };
        }
        
        // 默认项
        return { id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, name: '未知食材', quantity: '适量' };
      });
    }
    
    // 解析调料
    let seasonings = safeParseJsonb<any[]>(
      record.调料 || [], 
      []
    );
    
    if (!seasonings.length) {
      seasonings = [{ id: 'default-sea-1', name: '未知调料', quantity: '适量' }];
    } else {
      // 处理原始数据可能是嵌套的情况
      seasonings = seasonings.map((sea: any) => {
        if (typeof sea === 'string') {
          return { id: `sea-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, name: sea, quantity: '适量' };
        }
        
        if (sea && typeof sea === 'object') {
          // 尝试找到名称字段
          let name = sea.name;
          if (!name) {
            if (sea.名称) name = sea.名称;
            else if (sea.调料名) name = sea.调料名;
            else if (sea.text) name = sea.text;
          }
          
          // 尝试找到数量字段
          let quantity = sea.quantity;
          if (!quantity) {
            if (sea.用量) quantity = sea.用量;
            else if (sea.amount) quantity = sea.amount;
          }
          
          return {
            id: sea.id || `sea-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: name || '未知调料',
            quantity: quantity || '适量',
            category: sea.category || '',
            type: sea.type || '',
            isRequired: typeof sea.isRequired === 'boolean' ? sea.isRequired : true
          };
        }
        
        // 默认项
        return { id: `sea-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, name: '未知调料', quantity: '适量' };
      });
    }
    
    // 解析步骤
    const steps = safeParseJsonb<string[]>(
      record.步骤 || record.steps || [],
      []
    );
    
    // 尝试获取准备步骤和烹饪步骤
    let preparationSteps: string[] = [];
    let cookingSteps: string[] = [];
    
    // 检查可能包含步骤的嵌套结构
    if (typeof record.步骤 === 'object' && record.步骤 !== null && !Array.isArray(record.步骤)) {
      // 使用类型断言处理嵌套对象
      const stepsObject = record.步骤 as Record<string, any>;
      
      // 直接访问可能的嵌套字段
      if (stepsObject.准备步骤) {
        preparationSteps = safeParseJsonb<string[]>(stepsObject.准备步骤, []);
      }
      if (stepsObject.烹饪步骤) {
        cookingSteps = safeParseJsonb<string[]>(stepsObject.烹饪步骤, []);
      }
    }
    
    // 如果步骤为空，尝试智能拆分步骤数据
    if (steps.length > 0 && (!preparationSteps.length && !cookingSteps.length)) {
      // 简单规则：前20%作为准备步骤，其余作为烹饪步骤
      const prepStepsCount = Math.max(1, Math.floor(steps.length * 0.2));
      preparationSteps = steps.slice(0, prepStepsCount);
      cookingSteps = steps.slice(prepStepsCount);
    }
    
    // 解析口味
    const flavors = safeParseJsonb<string[]>(
      record.口味特点 || record.flavors || [],
      []
    );
    
    // 解析烹饪方法
    const cookingMethod = safeParseJsonb<string[]>(
      record.烹饪技法 || [],
      []
    );
    
    // 解析烹饪提示
    const cookingTips = safeParseJsonb<string[]>(
      record.注意事项 || [],
      []
    );
    
    // 解析饮食限制
    const dietaryRestrictions: string[] = [];
    if (record.是否纯素) dietaryRestrictions.push('纯素');
    if (record.是否清真) dietaryRestrictions.push('清真');
    if (record.是否无麸质) dietaryRestrictions.push('无麸质');
    
    // 使用旧版字段的饮食限制（如果有）
    if (record.dietary_restrictions) {
      // 使用帮助函数处理饮食限制
      const processedRestrictions = processDietaryRestrictions(record.dietary_restrictions);
      dietaryRestrictions.push(...processedRestrictions);
    }
    
    // 烹饪难度
    const difficulty = Array.isArray(record.烹饪难度) 
      ? record.烹饪难度[0] 
      : (typeof record.烹饪难度 === 'string' ? record.烹饪难度 : (record.difficulty || '普通'));
    
    // 处理烹饪难度中可能存在的多余引号问题
    const cleanDifficulty = typeof difficulty === 'string' 
      ? difficulty.replace(/^"|"$/g, '') // 去除开头和结尾的引号
      : difficulty;
    
    // 处理烹饪时间 - 检查是否有时间信息
    let cookingTime = record.cooking_time || '';
    
    // 检查难度字段是否包含时间信息(如"30分钟")
    let finalDifficulty = cleanDifficulty;
    let containsTimeInfo = false;
    
    if (typeof cleanDifficulty === 'string' && cleanDifficulty.match(/\d+\s*分钟/)) {
      const timeMatch = cleanDifficulty.match(/(\d+)\s*分钟/);
      if (timeMatch && timeMatch[1]) {
        cookingTime = parseInt(timeMatch[1], 10);
        finalDifficulty = '普通'; // 如果难度字段包含时间，使用标准难度值
        containsTimeInfo = true;
      }
    }
    
    // 营养信息
    const nutritionInfo = safeParseJsonb<Record<string, any>>(
      record.nutrition_info || {},
      typeof record.nutrition_info === 'object' ? record.nutrition_info : {}
    );
    
    // 图片URL (使用旧版字段)
    const imageUrl = record.image_url || '';
    
    // 完整Recipe接口实现
    return {
      id: record.id,
      name,
      description,
      ingredients,
      seasonings,
      steps,
      imageUrl,
      cuisine,
      cookingTime: cookingTime, // 使用提取的烹饪时间
      difficulty: finalDifficulty, // 使用最终确定的难度值
      flavors,
      tags: [],
      dietaryRestrictions,
      nutritionInfo,
      cookingTips,
      cookingMethod,
      preparationSteps,
      cookingSteps
    };
  } catch (error) {
    logger.error('数据库记录转换失败', { 
      error: error instanceof Error ? error.message : String(error),
      recordId: record?.id || '未知ID'
    });
    throw error;
  }
}

/**
 * 将多条数据库记录转换为前端模型数组
 */
export function dbRecipesToFrontendModels(dbRecipes: DbRecipe[]): Recipe[] {
  // 增强类型检查和错误处理
  if (!dbRecipes) {
    console.warn('dbRecipesToFrontendModels: 收到空数据');
    return [];
  }
  
  // 处理非数组类型输入
  if (!Array.isArray(dbRecipes)) {
    console.warn('dbRecipesToFrontendModels: 输入不是数组类型:', typeof dbRecipes);
    
    // 尝试将对象转换为数组
    if (typeof dbRecipes === 'object') {
      try {
        // 如果是单个菜谱对象
        if (dbRecipes && 'id' in dbRecipes) {
          console.log('dbRecipesToFrontendModels: 尝试将单个对象转换为数组');
          return [dbRecordToFrontendModel(dbRecipes as DbRecipe)];
        }
        
        // 如果对象有recipes属性且为数组
        if (dbRecipes && 'recipes' in dbRecipes && Array.isArray((dbRecipes as any).recipes)) {
          console.log('dbRecipesToFrontendModels: 从对象中提取recipes数组');
          return (dbRecipes as any).recipes.map((recipe: DbRecipe) => dbRecordToFrontendModel(recipe));
        }
        
        // 尝试将对象转换为数组（如果有值的情况）
        const objValues = Object.values(dbRecipes);
        if (objValues.length > 0) {
          console.log('dbRecipesToFrontendModels: 尝试将对象的值转换为数组');
          return objValues
            .filter(item => item && typeof item === 'object')
            .map((item: any) => dbRecordToFrontendModel(item));
        }
      } catch (error) {
        console.error('dbRecipesToFrontendModels: 处理非数组输入时出错:', error);
      }
    }
    
    // 无法处理的情况，返回空数组
    console.error('dbRecipesToFrontendModels: 无法处理的数据类型:', typeof dbRecipes);
    return [];
  }
  
  // 正常处理数组
  try {
    return dbRecipes.map(dbRecipe => {
      try {
        return dbRecordToFrontendModel(dbRecipe);
      } catch (error) {
        console.error('dbRecipesToFrontendModels: 单条记录转换失败:', error, dbRecipe);
        // 返回一个基本的菜谱对象，防止整个数组处理失败
        return {
          id: dbRecipe?.id || `error-${Date.now()}`,
          name: dbRecipe?.菜名 || dbRecipe?.name || '转换错误的菜谱',
          description: '此菜谱数据格式有误',
          ingredients: [{ id: 'error-1', name: '数据错误', quantity: '未知' }],
          seasonings: [{ id: 'error-1', name: '数据错误', quantity: '未知' }],
          steps: ['数据格式错误，无法显示步骤'],
          imageUrl: '',
          cuisine: dbRecipe?.菜系 || dbRecipe?.cuisine || '未知',
          cookingTime: '',
          difficulty: dbRecipe?.烹饪难度 || dbRecipe?.difficulty || '未知',
          flavors: [],
          tags: [],
          dietaryRestrictions: [],
          nutritionInfo: {},
          cookingTips: ['此菜谱数据格式有误，请联系管理员'],
          cookingMethod: [],
          preparationSteps: [],
          cookingSteps: []
        };
      }
    });
  } catch (error) {
    console.error('dbRecipesToFrontendModels: 批量转换失败:', error);
    return [];
  }
}

/**
 * 将前端模型转换为数据库记录
 */
export function frontendModelToDbRecord(recipe: Recipe): DbRecipe {
  try {
    // 确保所有字段都有有效值
    return {
      id: recipe.id,
      菜名: recipe.name || '',
      描述: recipe.description || '',
      食材: JSON.stringify(recipe.ingredients),
      调料: JSON.stringify(recipe.seasonings),
      步骤: JSON.stringify(recipe.steps),
      image_url: recipe.imageUrl || '',
      菜系: recipe.cuisine || '',
      烹饪难度: recipe.difficulty || '普通', // 修改：直接存储字符串，而不是JSON字符串数组
      口味特点: JSON.stringify(recipe.flavors || []), // 已正确使用JSON.stringify
      烹饪技法: JSON.stringify(recipe.cookingMethod || []),
      注意事项: JSON.stringify(recipe.cookingTips || []),
      是否纯素: recipe.dietaryRestrictions?.includes('纯素') || false,
      是否清真: recipe.dietaryRestrictions?.includes('清真') || false,
      是否无麸质: recipe.dietaryRestrictions?.includes('无麸质') || false
    };
  } catch (error) {
    logger.error('前端模型转换失败', { error, recipe });
    throw error;
  }
}

/**
 * 处理饮食限制数据
 */
export function processDietaryRestrictions(restrictions: string | string[] | null | object): string[] {
  if (!restrictions) return [];
  
  logger.info('处理饮食限制数据', {
    type: typeof restrictions,
    isArray: Array.isArray(restrictions),
    value: restrictions
  });
  
  // 处理字符串情况
  if (typeof restrictions === 'string') {
    try {
      // 检查是否是JSON字符串（数组或对象）
      if ((restrictions.trim().startsWith('[') && restrictions.trim().endsWith(']')) ||
          (restrictions.trim().startsWith('{') && restrictions.trim().endsWith('}'))) {
        try {
          const parsed = JSON.parse(restrictions);
          
          // 如果解析为数组
          if (Array.isArray(parsed)) {
            return parsed
              .filter(item => item !== null && item !== undefined)
              .map(item => typeof item === 'string' ? item.trim() : String(item))
              .filter(Boolean);
          }
          
          // 如果解析为对象，提取值为true的键
          if (typeof parsed === 'object' && parsed !== null) {
            return Object.entries(parsed)
              .filter(([_, value]) => 
                value === true || value === 'true' || value === 1 || value === '1'
              )
              .map(([key, _]) => key.trim())
              .filter(Boolean);
          }
        } catch (jsonError) {
          logger.warn('解析饮食限制JSON字符串失败', { restrictions, error: jsonError });
          // 解析失败，继续使用逗号分隔处理
        }
      }
      
      // 处理逗号分隔字符串
      if (restrictions.includes(',')) {
        return restrictions
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
      }
      
      // 单个字符串值
      return [restrictions.trim()].filter(Boolean);
    } catch (e) {
      logger.warn('处理饮食限制字符串失败', { restrictions, error: e });
      return [];
    }
  }
  
  // 处理数组情况
  if (Array.isArray(restrictions)) {
    return restrictions
      .filter(item => item !== null && item !== undefined)
      .map(item => typeof item === 'string' ? item.trim() : String(item))
      .filter(Boolean);
  }
  
  // 处理对象情况
  if (typeof restrictions === 'object' && restrictions !== null) {
    try {
      // 提取值为true的键
      const result: string[] = [];
      
      Object.entries(restrictions).forEach(([key, value]) => {
        if (value === true || value === 'true' || value === 1 || value === '1') {
          result.push(key.trim());
        }
      });
      
      return result.filter(Boolean);
    } catch (objError) {
      logger.warn('处理饮食限制对象失败', { restrictions, error: objError });
      return [];
    }
  }
  
  // 其他类型，尝试转换为字符串
  try {
    const strValue = String(restrictions).trim();
    return strValue ? [strValue] : [];
  } catch (e) {
    logger.warn('饮食限制数据类型不支持', { type: typeof restrictions });
    return [];
  }
} 