/**
 * 数据安全处理工具函数集
 * 提供各种数据类型的安全访问方法，防止未定义错误和类型异常
 */

import { Recipe } from '../../types/recipe';
import { IngredientItem } from '../../types';

/**
 * 安全地访问数组类型数据
 * @param value 可能是数组的值
 * @param defaultValue 默认值数组
 * @param itemProcessor 可选的元素处理函数
 * @returns 确保是数组的值
 */
export function safeArray<T>(
  value: any, 
  defaultValue: T[] = [],
  itemProcessor?: (item: any) => T
): T[] {
  // 处理空值情况
  if (value === null || value === undefined) {
    return [...defaultValue];
  }
  
  // 已经是数组的情况
  if (Array.isArray(value)) {
    // 过滤掉null和undefined值
    const filteredArray = value.filter(item => item !== null && item !== undefined);
    
    // 如果提供了处理函数，则应用处理
    if (itemProcessor) {
      return filteredArray.map(itemProcessor);
    }
    
    return filteredArray as unknown as T[];
  }
  
  // 尝试将字符串形式的JSON数组转换为数组
  if (typeof value === 'string') {
    // 处理空字符串
    if (!value.trim()) {
      return [...defaultValue];
    }
    
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // 如果提供了处理函数，则应用处理
        if (itemProcessor) {
          return parsed.filter(item => item !== null && item !== undefined).map(itemProcessor);
        }
        return parsed.filter(item => item !== null && item !== undefined) as unknown as T[];
      }
    } catch (e) {
      // 解析失败则尝试其他方法
      
      // 尝试将逗号分隔的字符串转换为数组
      if (value.includes(',')) {
        const items = value.split(',')
          .map(item => item.trim())
          .filter(Boolean);
          
        if (itemProcessor) {
          return items.map(itemProcessor);
        }
        return items as unknown as T[];
      }
      
      // 单个值包装为数组
      if (value.trim()) {
        const singleItem = value.trim();
        if (itemProcessor) {
          return [itemProcessor(singleItem)];
        }
        return [singleItem] as unknown as T[];
      }
    }
  }
  
  // 如果是对象，尝试转换为数组
  if (typeof value === 'object') {
    try {
      const objValues = Object.values(value);
      if (itemProcessor) {
        return objValues.filter(item => item !== null && item !== undefined).map(itemProcessor);
      }
      return objValues.filter(item => item !== null && item !== undefined) as unknown as T[];
    } catch (e) {
      // 转换失败，使用默认值
      return [...defaultValue];
    }
  }
  
  // 将单个值包装为数组
  if (value !== null && value !== undefined) {
    if (itemProcessor) {
      return [itemProcessor(value)];
    }
    return [value] as unknown as T[];
  }
  
  // 所有其他情况，返回默认值
  return [...defaultValue];
}

/**
 * 安全地访问字符串类型数据
 * @param value 可能是字符串的值
 * @param defaultValue 默认值
 * @returns 确保是字符串的值
 */
export function safeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

/**
 * 安全地访问数字类型数据
 * @param value 可能是数字的值
 * @param defaultValue 默认值
 * @returns 确保是数字的值
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return defaultValue;
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return defaultValue;
}

/**
 * 安全地访问对象类型数据
 * @param value 可能是对象的值
 * @param defaultValue 默认值对象
 * @returns 确保是对象的值
 */
export function safeObject<T extends object>(value: any, defaultValue: T): T {
  if (!value) return { ...defaultValue };
  if (typeof value === 'object' && value !== null) return value as T;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) return parsed as T;
    } catch (e) {
      // 解析失败则忽略
    }
  }
  return { ...defaultValue };
}

/**
 * 安全地访问布尔类型数据
 * @param value 可能是布尔的值
 * @param defaultValue 默认值
 * @returns 确保是布尔的值
 */
export function safeBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') return true;
    if (lowerValue === 'false') return false;
    if (lowerValue === '1') return true;
    if (lowerValue === '0') return false;
    return Boolean(value);
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return defaultValue;
}

/**
 * 创建一个空的菜谱数据对象
 * @param errorDetails 可选的错误详情
 * @returns 空菜谱对象
 */
export function createEmptyRecipe(errorDetails?: any): Recipe {
  // 创建默认的食材和调料
  const defaultIngredients = [
    { id: 'ing-default-1', name: '未知食材', quantity: '适量', category: '', type: '', isRequired: true }
  ];
  
  const defaultSeasonings = [
    { id: 'sea-default-1', name: '未知调料', quantity: '适量', category: '', type: '', isRequired: true }
  ];
  
  return {
    id: `empty-${Date.now()}`,
    name: '加载失败',
    description: '无法加载菜谱信息',
    ingredients: defaultIngredients,
    seasonings: defaultSeasonings,
    flavors: ['咸', '香'],
    difficulty: '未知',
    cookingTime: '',
    steps: ['准备食材', '按照个人口味烹饪'],
    preparationSteps: ['准备食材'],
    cookingSteps: ['按照个人口味烹饪'],
    cookingTips: [],
    imageUrl: '',
    cuisine: '家常菜',
    cookingMethod: ['炒'],
    dietaryRestrictions: [],
    tags: [],
    matchScore: 0,
    matchedIngredients: [],
    loadError: errorDetails // 记录加载错误详情
  };
}

/**
 * 收集和处理菜谱小贴士
 * @param recipe 原始菜谱数据
 * @returns 处理后的小贴士数组
 */
function collectCookingTips(recipe: any): string[] {
  let tips: string[] = [];
  
  // 处理cookingTips字段
  if (recipe.cookingTips) {
    // 处理cookingTips是字符串的情况
    if (typeof recipe.cookingTips === 'string') {
      if (recipe.cookingTips.trim()) {
        tips = [recipe.cookingTips.trim()];
      }
    } 
    // 处理cookingTips是数组的情况
    else if (Array.isArray(recipe.cookingTips)) {
      tips = recipe.cookingTips.filter(Boolean);
    }
  }
  
  return tips;
}

/**
 * 验证并安全化菜谱数据
 * @param recipe 原始菜谱数据
 * @returns 经过安全处理的菜谱数据
 */
export function validateAndSanitizeRecipe(recipe: any): Recipe {
  if (!recipe) {
    const errorDetails = {
      message: '菜谱数据为空',
      code: 'EMPTY_RECIPE',
      errorTime: new Date().toISOString()
    };
    console.error('validateAndSanitizeRecipe: 收到无效的菜谱数据', errorDetails);
    return createEmptyRecipe(errorDetails);
  }
  
  try {
    // 收集和整理所有步骤数据
    const allSteps = collectAllSteps(recipe);
    
    // 收集和处理小贴士
    const allTips = collectCookingTips(recipe);
    
    // 处理食材和调料，确保它们有有效的数据
    const processedIngredients = processIngredients(recipe.ingredients);
    const processedSeasonings = processIngredients(recipe.seasonings, true);
    
    // 处理难度和烹饪时间，确保它们不会混淆
    let processedDifficulty = safeString(recipe.difficulty, '普通');
    let processedCookingTime = recipe.cookingTime;
    
    // 检查difficulty是否包含时间信息
    if (typeof processedDifficulty === 'string' && 
        (processedDifficulty.includes('分钟') || /\d+/.test(processedDifficulty))) {
      // 如果难度中包含时间信息，将其视为烹饪时间
      if (!processedCookingTime) {
        const timeMatch = processedDifficulty.match(/(\d+)[\s]*分钟/);
        if (timeMatch && timeMatch[1]) {
          processedCookingTime = `${timeMatch[1]}分钟`;
        } else {
          processedCookingTime = processedDifficulty;
        }
      }
      // 重置难度为标准值
      processedDifficulty = '普通';
    }
    
    // 创建安全的菜谱对象
    const safeRecipe: Recipe = {
      id: safeString(recipe.id, `recipe-${Date.now()}`),
      name: safeString(recipe.name, '未命名菜谱'),
      description: safeString(recipe.description, '这是一道美味的菜品'),
      cuisine: safeString(recipe.cuisine, '未分类'),
      ingredients: processedIngredients,
      seasonings: processedSeasonings,
      flavors: safeArray<string>(recipe.flavors, ['其他']),
      difficulty: processedDifficulty,
      cookingTime: safeString(processedCookingTime, '30分钟'),
      preparationSteps: safeArray<string>(recipe.preparationSteps, (allSteps.preparationSteps || [])),
      cookingSteps: safeArray<string>(recipe.cookingSteps, (allSteps.cookingSteps || [])),
      steps: allSteps.combinedSteps || ['准备食材', '按照个人口味烹饪'],
      cookingTips: allTips,
      imageUrl: safeString(recipe.imageUrl, ''),
      cookingMethod: safeArray<string>(recipe.cookingMethod, []),
      dietaryRestrictions: safeArray<string>(recipe.dietaryRestrictions, []),
      tags: safeArray<string>(recipe.tags, []),
      matchScore: safeNumber(recipe.matchScore, 0),
      matchedIngredients: safeArray<string>(recipe.matchedIngredients, [])
    };
    
    return safeRecipe;
  } catch (error) {
    // 添加详细错误信息
    const errorDetails = {
      message: '菜谱数据处理失败',
      originalError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      errorTime: new Date().toISOString(),
      recipeId: recipe?.id || 'unknown',
      fieldErrors: {}
    };
    
    console.error('validateAndSanitizeRecipe: 处理菜谱数据时出错', errorDetails);
    
    // 创建带有错误信息的空菜谱
    return createEmptyRecipe(errorDetails);
  }
}

/**
 * 收集和整理所有步骤数据
 * @param recipe 原始菜谱数据
 * @returns 整理后的步骤数据
 */
function collectAllSteps(recipe: any): {
  preparationSteps: string[];
  cookingSteps: string[];
  combinedSteps: string[];
} {
  console.log('collectAllSteps: 原始步骤数据', { 
    preparationSteps: recipe.preparationSteps, 
    cookingSteps: recipe.cookingSteps, 
    steps: recipe.steps 
  });

  const result = {
    preparationSteps: [] as string[],
    cookingSteps: [] as string[],
    combinedSteps: [] as string[]
  };
  
  // 尝试解析可能为JSON字符串的字段
  const tryParseSteps = (steps: any): string[] => {
    if (!steps) return [];
    
    // 如果已经是数组且非空
    if (Array.isArray(steps) && steps.length > 0) {
      return steps.map(step => typeof step === 'string' ? step : JSON.stringify(step)).filter(Boolean);
    }
    
    // 如果是字符串，尝试解析为JSON
    if (typeof steps === 'string') {
      try {
        if (steps.trim().startsWith('[') && steps.trim().endsWith(']')) {
          const parsed = JSON.parse(steps);
          if (Array.isArray(parsed)) {
            return parsed.map(step => typeof step === 'string' ? step : JSON.stringify(step)).filter(Boolean);
          }
        }
        
        // 处理非JSON数组字符串
        if (steps.includes('\n')) {
          return steps.split('\n').map(s => s.trim()).filter(Boolean);
        }
        
        return [steps]; // 单个字符串
      } catch (e) {
        console.error('步骤解析失败:', e);
        return [steps]; // 解析失败，保留原字符串
      }
    }
    
    // 处理对象格式
    if (typeof steps === 'object' && steps !== null) {
      // 检查常见步骤对象嵌套模式
      if (steps.准备步骤 || steps.烹饪步骤 || steps.steps || steps.content) {
        const potentialSteps = steps.准备步骤 || steps.烹饪步骤 || steps.steps || steps.content;
        return tryParseSteps(potentialSteps); // 递归调用
      }
      
      // 尝试检查是否有数字键的对象
      const stepValues = Object.values(steps);
      if (stepValues.length > 0) {
        return stepValues.map(step => typeof step === 'string' ? step : JSON.stringify(step)).filter(Boolean);
      }
    }
    
    return [];
  };
  
  // 处理可能的嵌套步骤对象
  if (recipe.步骤 && typeof recipe.步骤 === 'object' && !Array.isArray(recipe.步骤)) {
    if (recipe.步骤.准备步骤) {
      result.preparationSteps = tryParseSteps(recipe.步骤.准备步骤);
    }
    if (recipe.步骤.烹饪步骤) {
      result.cookingSteps = tryParseSteps(recipe.步骤.烹饪步骤);
    }
    if (!result.preparationSteps.length && !result.cookingSteps.length && recipe.步骤.steps) {
      // 如果没有找到准备和烹饪步骤，但存在steps
      result.combinedSteps = tryParseSteps(recipe.步骤.steps);
    }
  } else {
    // 收集准备步骤
    result.preparationSteps = tryParseSteps(recipe.preparationSteps);
    
    // 收集烹饪步骤
    result.cookingSteps = tryParseSteps(recipe.cookingSteps);
    
    // 收集综合步骤
    const combinedSteps = tryParseSteps(recipe.steps || recipe.步骤);
    if (combinedSteps.length > 0) {
      result.combinedSteps = combinedSteps;
    }
  }
  
  // 优先使用准备和烹饪步骤
  if (result.preparationSteps.length || result.cookingSteps.length) {
    result.combinedSteps = [...result.preparationSteps, ...result.cookingSteps];
  } 
  // 如果没有详细步骤，但有综合步骤，则使用综合步骤
  else if (result.combinedSteps.length > 0) {
    // 为了保持一致性，可以尝试智能拆分综合步骤到准备和烹饪步骤
    // 这里使用简单规则：前20%作为准备步骤，其余为烹饪步骤
    const prepStepsCount = Math.max(1, Math.ceil(result.combinedSteps.length * 0.2));
    result.preparationSteps = result.combinedSteps.slice(0, prepStepsCount);
    result.cookingSteps = result.combinedSteps.slice(prepStepsCount);
  }
  
  // 确保至少有一个步骤
  if (result.combinedSteps.length === 0) {
    const defaultSteps = ['准备食材', '按照个人口味烹饪'];
    result.combinedSteps = defaultSteps;
    result.cookingSteps = defaultSteps;
    
    // 查找菜谱描述中可能包含步骤信息
    if (recipe.description && typeof recipe.description === 'string' && recipe.description.length > 20) {
      // 如果描述较长，可能包含步骤信息
      console.log('尝试从描述中提取步骤信息');
      const descLines = recipe.description.split(/[。.；;\n]/).filter(Boolean).map((s: string) => s.trim());
      if (descLines.length >= 3) {
        result.combinedSteps = descLines;
        // 同样按比例拆分
        const prepStepsCount = Math.max(1, Math.ceil(descLines.length * 0.2));
        result.preparationSteps = descLines.slice(0, prepStepsCount);
        result.cookingSteps = descLines.slice(prepStepsCount);
      }
    }
  }
  
  console.log('collectAllSteps: 处理后的步骤数据', { 
    preparationSteps: result.preparationSteps, 
    cookingSteps: result.cookingSteps, 
    combinedSteps: result.combinedSteps 
  });
  
  return result;
}

/**
 * 处理食材或调料数组
 * @param items 原始食材/调料数组
 * @param isSeasonings 是否为调料类型
 * @returns 处理后的安全数组
 */
function processIngredients(items: any, isSeasonings: boolean = false): Array<string | IngredientItem> {
  // 确保始终有至少一个默认项
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return [{ 
      id: `${isSeasonings ? 'sea' : 'ing'}-default-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: isSeasonings ? '未知调料' : '未知食材',
      quantity: '适量',
      category: '',
      type: '',
      isRequired: true
    }];
  }
  
  // 使用改进的safeArray，提供项目处理函数
  const processed = safeArray(items, [], (ing: any): string | IngredientItem => {
    // 如果是字符串，直接返回，但确保不是空字符串
    if (typeof ing === 'string') {
      const trimmed = ing.trim();
      return trimmed || (isSeasonings ? '未知调料' : '未知食材');
    }
    
    // 处理非对象或null/undefined情况
    if (!ing || typeof ing !== 'object') {
      return isSeasonings ? '未知调料' : '未知食材';
    }
    
    // 当对象缺少name属性时的特殊处理
    let name = ing.name;
    if (!name) {
      // 尝试各种可能的属性名
      if (ing.text) {
        name = ing.text;
      } else if (ing.名称) {
        name = ing.名称;
      } else if (isSeasonings && ing.调料名) {
        name = ing.调料名;
      } else if (!isSeasonings && ing.食材名) {
        name = ing.食材名;
      }
    }
    
    // 如果对象有id但没有name，尝试从id中提取名称
    if (!name && ing.id && typeof ing.id === 'string') {
      const idParts = ing.id.split('-');
      if (idParts.length > 1) {
        name = idParts[idParts.length - 1];
      }
    }
    
    // 处理量词问题，确保quantity有值且格式合理
    let quantity = ing.quantity;
    if (!quantity) {
      if (ing.用量) {
        quantity = ing.用量;
      } else if (ing.amount) {
        quantity = ing.amount;
      }
    }
    
    if (typeof quantity === 'number') {
      quantity = String(quantity);
      // 如果是整数，加上适当的量词（简单实现）
      if (Number.isInteger(Number(quantity)) && !ing.unit) {
        quantity += isSeasonings ? '勺' : '个';
      }
    }
    
    // 如果有单位但没有合并到quantity中
    if (quantity && ing.unit && typeof ing.unit === 'string') {
      quantity = `${quantity}${ing.unit}`;
    }
    
    // 创建符合IngredientItem接口的对象
    const ingredientItem = {
      id: safeString(ing.id, `${isSeasonings ? 'sea' : 'ing'}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`),
      name: safeString(name, isSeasonings ? '未知调料' : '未知食材'),
      quantity: safeString(quantity, '适量'),
      category: safeString(ing.category, ''),
      type: safeString(ing.type, ''),
      isRequired: safeBoolean(ing.isRequired, true)
    } as IngredientItem;
    
    console.log(`处理${isSeasonings ? '调料' : '食材'}:`, {
      原始数据: ing,
      处理结果: ingredientItem
    });
    
    return ingredientItem;
  });
  
  // 确保结果不为空数组
  if (processed.length === 0) {
    return [{ 
      id: `${isSeasonings ? 'sea' : 'ing'}-default-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: isSeasonings ? '未知调料' : '未知食材',
      quantity: '适量',
      category: '',
      type: '',
      isRequired: true
    }];
  }
  
  return processed;
} 