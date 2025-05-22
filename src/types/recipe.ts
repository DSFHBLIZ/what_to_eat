/**
 * 统一的菜谱类型定义
 * 整合现有的所有Recipe接口，确保类型一致性
 */
import { IngredientItem } from './index';

export interface Recipe {
  // 核心属性（必选）
  id: string;                 // 菜谱唯一标识符
  name: string;               // 菜谱名称
  description: string;        // 菜谱描述

  // 食材和调料信息
  ingredients: Array<string | IngredientItem>; // 食材列表
  seasonings: Array<string | IngredientItem>; // 调料列表
  
  // 口味、难度和时间信息
  flavors: Flavor[];          // 口味标签数组
  difficulty: string | string[];  // 烹饪难度，支持字符串或字符串数组（JSONB类型）
  cookingTime: string | number; // 烹饪时间，字符串如"30分钟"或数字表示分钟数
  
  // 烹饪步骤
  steps: string[];            // 烹饪步骤（完整步骤）
  preparationSteps?: string[]; // 准备工作步骤（可选）
  cookingSteps?: string[];    // 详细烹饪步骤（可选）
  
  // 提示和附加信息
  cookingTips: string[];      // 烹饪小贴士
  
  // 媒体和展示
  imageUrl: string;           // 菜谱图片URL
  
  // 分类相关（可选）
  cuisine?: Cuisine;          // 菜系分类
  dietaryRestrictions?: DietaryRestriction[]; // 饮食限制
  cookingMethod?: string | string[]; // 烹饪方法
  
  // 标签和搜索
  tags?: string[];            // 菜谱标签，用于搜索和分类
  
  // 搜索匹配相关（可选）
  matchScore?: number;        // 匹配度得分
  matchedIngredients?: string[]; // 匹配的食材或调料
  
  // 额外信息
  servings?: number;          // 食用人数
  prepTime?: number;          // 准备时间（分钟）
  cookTime?: number;          // 烹饪时间（分钟）
  nutritionInfo?: {           // 营养信息
    calories?: number;        // 卡路里
    protein?: number;         // 蛋白质（克）
    carbs?: number;           // 碳水（克）
    fat?: number;             // 脂肪（克）
    fiber?: number;           // 纤维（克）
    sugar?: number;           // 糖（克）
  };
  rating?: number;            // 评分
  reviewCount?: number;       // 评价数量
  authorId?: string;          // 作者ID
  authorName?: string;        // 作者名称
  createdAt?: number | string; // 创建时间
  updatedAt?: number | string; // 更新时间
  isPublic?: boolean;         // 是否公开
  
  // 错误处理相关
  loadError?: any;            // 加载错误信息

  // 原始数据（用于高级搜索）
  _raw?: {
    食材分类?: any;
    调料分类?: any;
    食材名称文本?: string;
    调料名称文本?: string;
    步骤?: {
      准备步骤?: string[];
      烹饪步骤?: string[];
    };
    菜系?: string | string[];   // 原始的菜系数据
    cuisine?: string | string[]; // 原始的英文菜系数据
    [key: string]: any;        // 添加索引签名以支持动态属性访问
  };
}

// 口味类型（增加string基类型）
export type Flavor = string | '酸' | '咸' | '苦' | '辣' | '鲜' | '甜' | '香' | '麻' | '清淡' | '咸鲜' | '酸甜' | '麻辣' | '鲜香' | '甜酸';

// 烹饪时间类型
export type CookingTime = '15分钟内' | '15-30分钟' | '30-60分钟' | '60分钟以上';

// 难度类型
export type Difficulty = '简单' | '中等' | '复杂' | 'easy' | 'medium' | 'hard';

// 菜系类型
export type Cuisine = string | '中餐-鲁菜' | '中餐-湘菜' | '中餐-苏菜' | '中餐-小吃' | '中餐-川菜' | '中餐-家常菜' | '中餐-其它' | '中餐-粤菜' | '中餐-徽菜' | '中餐-闽菜' | '中餐-浙菜' | '西餐' | '日料' | '韩餐' | '东南亚' | '其他';

// 饮食限制类型（增加string基类型）
export type DietaryRestriction = string | '纯素' | '清真' | '无麸质';

/**
 * 创建类型安全的辅助函数
 */

// 获取默认的空Recipe对象
export function getEmptyRecipe(): Recipe {
  return {
    id: '',
    name: '',
    description: '',
    ingredients: [],
    seasonings: [],
    flavors: [],
    difficulty: '普通',
    cookingTime: '',
    steps: [],
    cookingTips: [],
    imageUrl: '',
  };
}