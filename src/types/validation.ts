/**
 * 验证系统类型定义
 * 提供验证相关的类型定义
 */
import { Recipe } from './recipe';

/**
 * 菜谱验证结果接口
 * 统一菜谱验证结果的格式
 */
export interface RecipeValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 修复后的数据 */
  fixedData: Recipe | null;
  /** 错误列表 */
  errors: Array<{ path: string; message: string }>;
}

/**
 * 验证统计数据接口
 */
export interface ValidationStats {
  /** 是否全部有效 */
  isValid?: boolean;
  /** 总项目数 */
  totalItems?: number;
  /** 无效项目数 */
  invalidItemsCount?: number;
  /** 验证耗时 */
  validationTime?: number;
  /** 类型标识 */
  type?: string;
  /** 时间戳 */
  timestamp?: number;
  /** 是否来自缓存 */
  fromCache?: boolean;
  /** 错误列表 */
  errors?: Array<{ index: number; path: string; message: string }>;
}

/**
 * 验证性能数据接口
 */
export interface ValidationPerformance {
  /** 解析耗时 */
  parsingTime: number;
  /** 验证耗时 */
  validationTime: number;
  /** 总处理耗时 */
  totalTime: number;
} 