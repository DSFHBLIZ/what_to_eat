/**
 * 宴会模式相关类型定义
 */

// 菜品类型枚举
export enum DishType {
  COLD = 'cold',      // 凉菜
  HOT = 'hot',        // 热菜
  SOUP = 'soup',      // 汤品
  STAPLE = 'staple'   // 主食
}

// 肉类细分枚举
export enum MeatType {
  SEAFOOD = 'seafood',     // 海鲜类
  POULTRY = 'poultry',     // 禽类
  LIVESTOCK = 'livestock', // 畜肉类
  SPECIAL = 'special'      // 特殊肉类
}

// 菜品分类计算结果
export interface DishAllocation {
  totalDishes: number;
  coldDishes: number;
  hotDishes: number;
  meatHotDishes: number;
  vegetarianHotDishes: number;
  seafoodCount: number;
  poultryCount: number;
  livestockCount: number;
}

// 宴会配置
export interface BanquetConfig {
  isEnabled: boolean;
  guestCount: number;
  allocation: DishAllocation | null;
}

// 选中的菜品信息
export interface SelectedDish {
  id: string;
  name: string;
  type: DishType;
  meatType?: MeatType;
  isVegetarian: boolean;
  isForbidden: boolean; // 是否为忌讳菜品
}

// 规则检查结果
export interface RuleCheckResult {
  isValid: boolean;
  suggestions: string[];
  warnings: string[];
  missing: string[];
  forbidden: string[];
}

// 食材汇总
export interface IngredientSummary {
  ingredients: Array<{
    name: string;
    count: number;
    recipes: string[];
    details?: Array<{ recipe: string; quantity?: string }>;
  }>;
  seasonings: Array<{
    name: string;
    count: number;
    recipes: string[];
    details?: Array<{ recipe: string; quantity?: string }>;
  }>;
} 