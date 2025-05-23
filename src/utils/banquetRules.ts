/**
 * 宴会选菜规则计算工具
 */

import { DishAllocation, SelectedDish, DishType, MeatType, RuleCheckResult } from '../types/banquet';

/**
 * 根据人数计算菜品分配方案
 * @param guestCount 客人数量
 * @returns 菜品分配方案
 */
export function calculateDishAllocation(guestCount: number): DishAllocation {
  // 1. 基本数量范围：[人数+1, 人数+4]
  const baseCount = guestCount + Math.floor(Math.random() * 4) + 1;
  
  // 2. 强制偶数原则
  let totalDishes = baseCount % 2 === 0 ? baseCount : baseCount + 1;
  
  // 3. 避开数字"4"和"14"
  if (totalDishes === 4) totalDishes = 6;
  if (totalDishes === 14) totalDishes = 16;
  if (totalDishes === 3) totalDishes = 6;
  
  // 4. 冷热搭配：凉菜占15%~25%
  let coldDishes = Math.round(totalDishes * 0.2);
  
  // 强制至少2道凉菜，且为偶数
  if (coldDishes < 2) coldDishes = 2;
  if (coldDishes % 2 !== 0) coldDishes = coldDishes + 1;
  
  // 确保凉菜数量不超过总数
  if (coldDishes >= totalDishes) {
    coldDishes = Math.max(2, totalDishes - 4); // 至少留4道热菜
  }
  
  const hotDishes = totalDishes - coldDishes;
  
  // 5. 荤素搭配：荤菜60%~70%
  const meatHotDishes = Math.round(hotDishes * 0.65);
  const vegetarianHotDishes = hotDishes - meatHotDishes;
  
  // 6. 荤菜细分
  const seafoodCount = Math.min(meatHotDishes, Math.floor(Math.random() * 2) + 1); // 1-2道
  const poultryCount = Math.min(meatHotDishes - seafoodCount, Math.floor(Math.random() * 2) + 1); // 1-2道
  const livestockCount = Math.max(1, meatHotDishes - seafoodCount - poultryCount); // 剩余的，至少1道
  
  return {
    totalDishes,
    coldDishes,
    hotDishes,
    meatHotDishes,
    vegetarianHotDishes,
    seafoodCount,
    poultryCount,
    livestockCount
  };
}

/**
 * 检查宴会选菜规则
 * @param selectedDishes 已选菜品
 * @param allocation 菜品分配方案
 * @returns 规则检查结果
 */
export function checkBanquetRules(
  selectedDishes: SelectedDish[], 
  allocation: DishAllocation
): RuleCheckResult {
  const result: RuleCheckResult = {
    isValid: true,
    forbidden: [],
    missing: [],
    warnings: [],
    suggestions: []
  };

  // 统计当前选择
  const stats = {
    total: selectedDishes.length,
    cold: selectedDishes.filter(d => d.type === DishType.COLD).length,
    hot: selectedDishes.filter(d => d.type === DishType.HOT).length,
    soup: selectedDishes.filter(d => d.type === DishType.SOUP).length,
    staple: selectedDishes.filter(d => d.type === DishType.STAPLE).length,
    seafood: selectedDishes.filter(d => d.meatType === MeatType.SEAFOOD).length,
    poultry: selectedDishes.filter(d => d.meatType === MeatType.POULTRY).length,
    livestock: selectedDishes.filter(d => d.meatType === MeatType.LIVESTOCK).length
  };

  // 检查忌讳菜品
  const forbiddenItems = selectedDishes.filter(dish => dish.isForbidden);
  if (forbiddenItems.length > 0) {
    result.forbidden.push(...forbiddenItems.map(dish => `${dish.name} - 宴会忌讳菜品`));
    result.isValid = false;
  }

  // 检查必备菜品
  if (stats.soup === 0) {
    result.missing.push('缺少汤品');
  }
  if (stats.staple === 0) {
    result.missing.push('缺少主食');
  }

  // 检查数量规则
  if (stats.total < allocation.totalDishes) {
    result.missing.push(`还需选择 ${allocation.totalDishes - stats.total} 道菜`);
  } else if (stats.total > allocation.totalDishes) {
    result.warnings.push(`已超出建议菜品数量 ${stats.total}/${allocation.totalDishes}`);
  }

  // 检查冷热搭配
  if (stats.cold < allocation.coldDishes) {
    result.missing.push(`还需 ${allocation.coldDishes - stats.cold} 道凉菜`);
  }
  if (stats.hot < allocation.hotDishes) {
    result.missing.push(`还需 ${allocation.hotDishes - stats.hot} 道热菜`);
  }

  // 检查荤素搭配
  const meatCount = stats.seafood + stats.poultry + stats.livestock;
  if (meatCount < allocation.meatHotDishes) {
    result.missing.push(`还需 ${allocation.meatHotDishes - meatCount} 道荤菜`);
  }

  // 提供建议
  if (stats.seafood === 0) {
    result.suggestions.push('建议添加一道海鲜类菜品，寓意年年有余');
  }
  if (stats.poultry === 0) {
    result.suggestions.push('建议添加一道鸡肉类菜品，寓意大吉大利');
  }

  // 更新验证状态
  if (result.missing.length > 0) {
    result.isValid = false;
  }

  return result;
}

/**
 * 将Recipe转换为SelectedDish
 * @param recipe 菜谱对象
 * @returns 选中菜品对象
 */
export function convertRecipeToSelectedDish(recipe: any): SelectedDish {
  // 简单的菜品类型判断逻辑
  const name = recipe.name || '未命名菜品';
  
  // 判断菜品类型
  let type = DishType.HOT; // 默认热菜
  if (name.includes('凉') || name.includes('拌') || name.includes('醉')) {
    type = DishType.COLD;
  } else if (name.includes('汤') || name.includes('羹')) {
    type = DishType.SOUP;
  } else if (name.includes('饭') || name.includes('面') || name.includes('粥')) {
    type = DishType.STAPLE;
  }

  // 判断肉类类型
  let meatType: MeatType | undefined;
  let isVegetarian = true;
  
  if (name.includes('鱼') || name.includes('虾') || name.includes('蟹') || name.includes('贝')) {
    meatType = MeatType.SEAFOOD;
    isVegetarian = false;
  } else if (name.includes('鸡') || name.includes('鸭') || name.includes('鸽')) {
    meatType = MeatType.POULTRY;
    isVegetarian = false;
  } else if (name.includes('猪') || name.includes('牛') || name.includes('羊') || name.includes('肉')) {
    meatType = MeatType.LIVESTOCK;
    isVegetarian = false;
  }

  // 检查是否为忌讳菜品
  const forbiddenKeywords = ['梨', '苦瓜', '烤乳猪'];
  const isForbidden = forbiddenKeywords.some(keyword => name.includes(keyword));

  return {
    id: recipe.id,
    name,
    type,
    meatType,
    isVegetarian,
    isForbidden
  };
} 