/**
 * 中英文食材名称映射表
 * 用于在找不到匹配图标时进行替代尝试
 */

import { normalizeIngredient } from './index';

export const ingredientNameMap: Record<string, string> = {
  // 肉类
  '猪肉': 'pork',
  '猪': 'pork',
  '肉': 'pork',
  '鸡肉': 'chicken',
  '鸡': 'chicken',
  '牛肉': 'beef',
  '牛': 'beef',
  '羊肉': 'lamb',
  '羊': 'lamb',
  
  // 海鲜
  '鱼': 'fish',
  '鱼肉': 'fish',
  '虾': 'shrimp',
  '虾仁': 'shrimp',
  
  // 蔬菜
  '番茄': 'tomato',
  '西红柿': 'tomato',
  '土豆': 'potato',
  '马铃薯': 'potato',
  '胡萝卜': 'carrot',
  '萝卜': 'carrot',
  '黄瓜': 'cucumber',
  '洋葱': 'onion',
  '葱': 'onion',
  '蘑菇': 'mushroom',
  '香菇': 'mushroom',
  '辣椒': 'pepper',
  '青椒': 'pepper',
  
  // 其他
  '蛋': 'egg',
  '鸡蛋': 'egg'
};

/**
 * 根据食材名称获取对应的图标路径
 * @param ingredient 食材名称
 * @returns 食材图标路径
 */
export async function getIngredientIcon(ingredient: string): Promise<string> {
  const normalizedName = ingredient.toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  
  try {
    // 首先尝试加载SVG格式
    const svgResponse = await fetch(`/icons/${normalizedName}.svg`);
    if (svgResponse.ok) {
      return `/icons/${normalizedName}.svg`;
    }
    
    // 如果找不到SVG，尝试PNG格式
    const pngResponse = await fetch(`/icons/${normalizedName}.png`);
    if (pngResponse.ok) {
      return `/icons/${normalizedName}.png`;
    }
    
    // 尝试从常见食材名称映射
    return await tryCommonIngredientIcon(normalizedName, ingredient);
  } catch (error) {
    // 尝试从常见食材名称映射
    return await tryCommonIngredientIcon(normalizedName, ingredient);
  }
}

/**
 * 尝试根据常见食材映射获取图标
 * @param normalizedName 标准化后的食材名称
 * @param originalName 原始食材名称
 * @returns 食材图标路径
 */
async function tryCommonIngredientIcon(normalizedName: string, originalName: string): Promise<string> {
  // 检查是否有映射匹配
  for (const [key, value] of Object.entries(ingredientNameMap)) {
    if (normalizedName.includes(key.toLowerCase()) || originalName.includes(key)) {
      try {
        // 尝试加载映射的图标
        const response = await fetch(`/icons/${value}.png`);
        if (response.ok) {
          return `/icons/${value}.png`;
        }
      } catch {
        // 忽略错误，继续尝试其他映射
      }
    }
  }
  
  // 如果所有尝试都失败，使用默认图标
  return '/icons/default.svg';
}

/**
 * 根据食材名称检查是否为肉类
 * @param ingredient 食材名称
 * @returns 是否为肉类
 */
export function isMeat(ingredient: string): boolean {
  const meatKeywords = ['肉', 'pork', 'beef', 'chicken', 'lamb', 'duck', '鸡', '鸭', '牛', '猪', '羊'];
  return meatKeywords.some(keyword => ingredient.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * 根据食材名称检查是否为蔬菜
 * @param ingredient 食材名称
 * @returns 是否为蔬菜
 */
export function isVegetable(ingredient: string): boolean {
  const vegKeywords = ['菜', '蔬菜', 'vegetable', '青菜', '白菜', '花菜', '菠菜', '韭菜', '萝卜', '土豆', '洋葱', '黄瓜', '西红柿', '番茄'];
  return vegKeywords.some(keyword => ingredient.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * 获取食材的分类
 * @param ingredient 食材名称
 * @returns 食材分类
 */
export function getIngredientCategory(ingredient: string): 'meat' | 'vegetable' | 'seafood' | 'other' {
  if (isMeat(ingredient)) return 'meat';
  if (isVegetable(ingredient)) return 'vegetable';
  
  const seafoodKeywords = ['鱼', '虾', '蟹', '贝', '海鲜', 'fish', 'seafood', 'shrimp', 'crab'];
  if (seafoodKeywords.some(keyword => ingredient.toLowerCase().includes(keyword.toLowerCase()))) {
    return 'seafood';
  }
  
  return 'other';
} 