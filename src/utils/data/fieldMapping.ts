/**
 * 字段名映射工具
 * 用于统一处理中英文字段名
 */

// 中英文字段名映射表
export const fieldMappings = {
  // 基本信息
  name: ['菜名', '名称', '名字', 'name'],
  description: ['描述', '简介', '介绍', '菜品介绍', 'description'],
  cuisine: ['菜系', '分类', 'cuisine'],
  difficulty: ['难度', '复杂度', 'difficulty'],
  cookingTime: ['烹饪时间', '制作时间', '时间', 'cookingTime', 'time'],
  
  // 食材和调料
  ingredients: ['食材', '原料', '材料', 'ingredients'],
  seasonings: ['调料', '调味料', '佐料', 'seasonings'],
  
  // 步骤
  steps: ['步骤', '做法', 'steps'],
  preparationSteps: ['准备步骤', '预备步骤', 'preparationSteps'],
  cookingSteps: ['烹饪步骤', '制作步骤', 'cookingSteps'],
  
  // 属性
  flavors: ['口味', '口味特点', '味道', 'flavors'],
  cookingMethods: ['烹饪方式', '烹饪方法', 'cookingMethods'],
  dietaryRestrictions: ['饮食限制', '膳食限制', 'dietaryRestrictions'],
  
  // 内部对象字段
  ingredientName: ['名称', '食材名称', '食材', 'name'],
  ingredientQuantity: ['用量', '数量', '份量', 'quantity'],
  
  // 其他
  cookingTips: ['小贴士', '提示', '注意事项', '烹饪技巧', 'tips'],
  imageUrl: ['图片', '图片链接', '图片地址', 'imageUrl', 'image'],
  ratings: ['评分', '评级', 'ratings'],
};

// 英文到中文的映射表
export const englishToChineseMapping: Record<string, string> = {
  name: '菜名',
  description: '描述',
  cuisine: '菜系',
  difficulty: '难度',
  cookingTime: '烹饪时间',
  ingredients: '食材',
  seasonings: '调料',
  steps: '步骤',
  preparationSteps: '准备步骤',
  cookingSteps: '烹饪步骤',
  flavors: '口味',
  cookingMethods: '烹饪方式',
  dietaryRestrictions: '饮食限制',
  cookingTips: '小贴士'
};

// 中文到英文的映射表
export const chineseToEnglishMapping: Record<string, string> = Object.entries(englishToChineseMapping)
  .reduce((obj, [key, value]) => {
    obj[value] = key;
    return obj;
  }, {} as Record<string, string>);

/**
 * 智能获取对象字段，尝试多种可能的字段名
 * @param obj 对象
 * @param fieldKey 字段键名（英文标准名）
 * @param defaultValue 默认值
 * @returns 字段值或默认值
 */
export function smartGetField<T>(obj: any, fieldKey: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  // 尝试直接获取
  if (fieldKey in obj && obj[fieldKey] !== undefined && obj[fieldKey] !== null) {
    return obj[fieldKey] as T;
  }
  
  // 尝试使用映射表中的备选键名
  const possibleKeys = fieldMappings[fieldKey as keyof typeof fieldMappings] || [];
  
  for (const key of possibleKeys) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key] as T;
    }
  }
  
  return defaultValue;
}

/**
 * 处理嵌套对象或数组
 * @param obj 对象或数组
 * @param mapping 字段映射函数
 * @returns 处理后的对象或数组
 */
export function processNestedObject(obj: any, mapping = englishToChineseMapping): any {
  if (!obj) return obj;
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => processNestedObject(item, mapping));
  }
  
  // 处理对象
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // 转换键名
      const newKey = mapping[key] || key;
      
      // 递归处理值
      if (typeof value === 'object' && value !== null) {
        result[newKey] = processNestedObject(value, mapping);
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }
  
  return obj;
}

/**
 * 将数据对象从英文字段转换为中文字段
 * @param obj 英文字段对象
 * @returns 中文字段对象
 */
export function convertToChineseFields(obj: any): any {
  return processNestedObject(obj, englishToChineseMapping);
}

/**
 * 将数据对象从中文字段转换为英文字段
 * @param obj 中文字段对象
 * @returns 英文字段对象
 */
export function convertToEnglishFields(obj: any): any {
  return processNestedObject(obj, chineseToEnglishMapping);
} 