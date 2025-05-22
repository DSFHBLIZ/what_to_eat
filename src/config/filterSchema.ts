/**
 * 筛选器配置架构
 * 集中管理所有筛选选项的元数据和配置信息
 */

import { FilterSchemaType, OptionBase } from '../types/filter';
import { getQueryString } from '../utils/helpers/queryHelper';

// 菜谱筛选条件
export const recipeFilters: FilterSchemaType[] = [
  {
    id: 'cookingTime',
    label: '烹饪时间',
    type: 'radio',
    fieldName: '预计时间',
    clearable: true,
    options: [
      { id: '10分钟内', label: '10分钟内' },
      { id: '30分钟内', label: '30分钟内' },
      { id: '60分钟内', label: '60分钟内' },
      { id: '60分钟以上', label: '60分钟以上' },
    ],
    defaultValue: null,
  },
  {
    id: 'difficulty',
    label: '烹饪时间',
    type: 'radio',
    fieldName: '烹饪难度',
    clearable: true,
    options: [
      // 注意：ID必须与数据库中的'烹饪难度'字段值完全匹配
      { id: '10分钟', label: '10分钟' },
      { id: '30分钟', label: '30分钟' },
      { id: '60分钟及以上', label: '60分钟及以上' },
    ],
    defaultValue: null,
  },
  {
    id: 'dietaryRestrictions',
    label: '饮食限制',
    type: 'checkbox',
    fieldName: '饮食限制',
    clearable: true,
    multiSelect: true,
    options: [
      { id: '纯素', label: '纯素' },
      { id: '清真', label: '清真' },
      { id: '无麸质', label: '无麸质' },
    ],
    defaultValue: [],
  },
  {
    id: 'flavor',
    label: '口味特点',
    type: 'checkbox',
    fieldName: ['口味', '口味特点', '味道', 'flavors'],
    clearable: true,
    multiSelect: true,
    options: [
      { id: '咸', label: '咸' },
      { id: '甜', label: '甜' },
      { id: '苦', label: '苦' },
      { id: '辣', label: '辣' },
      { id: '酸', label: '酸' },
      { id: '鲜', label: '鲜' },
    ],
    defaultValue: [],
  },
  {
    id: 'cuisine',
    label: '菜系',
    type: 'checkbox',
    fieldName: '菜系',
    clearable: true,
    multiSelect: true,
    options: [
      { id: '中餐-家常菜', label: '中餐-家常菜' },
      { id: '中餐-鲁菜', label: '中餐-鲁菜' },
      { id: '中餐-湘菜', label: '中餐-湘菜' },
      { id: '中餐-苏菜', label: '中餐-苏菜' },
      { id: '中餐-小吃', label: '中餐-小吃' },
      { id: '中餐-川菜', label: '中餐-川菜' },
      { id: '中餐-粤菜', label: '中餐-粤菜' },
      { id: '中餐-徽菜', label: '中餐-徽菜' },
      { id: '中餐-闽菜', label: '中餐-闽菜' },
      { id: '中餐-浙菜', label: '中餐-浙菜' },
      { id: '中餐-其它', label: '中餐-其它' },
    ],
    defaultValue: [],
  },
  {
    id: 'tags',
    label: '常用标签',
    type: 'checkbox',
    fieldName: 'tags',
    clearable: true,
    multiSelect: true,
    options: [
      { id: '快手菜', label: '快手菜' },
      { id: '家常菜', label: '家常菜' },
      { id: '下饭菜', label: '下饭菜' },
      { id: '早餐', label: '早餐' },
      { id: '午餐', label: '午餐' },
      { id: '晚餐', label: '晚餐' },
      { id: '宵夜', label: '宵夜' },
      { id: '主食', label: '主食' },
      { id: '甜点', label: '甜点' },
      { id: '节日', label: '节日' },
      { id: '宴客', label: '宴客' },
    ],
    defaultValue: [],
  },
];

/**
 * 获取筛选器选项
 * @param filterId 筛选器ID
 * @returns 筛选器选项
 */
export function getFilterOptions(filterId: string): OptionBase[] {
  const filter = recipeFilters.find(f => f.id === filterId);
  return filter ? filter.options : [];
}

/**
 * 获取筛选器默认值
 * @param filterId 筛选器ID
 * @returns 筛选器默认值
 */
export function getFilterDefaultValue(filterId: string): any {
  const filter = recipeFilters.find(f => f.id === filterId);
  return filter ? filter.defaultValue : null;
}

// 导出筛选器ID类型
export type RecipeFilterName = typeof recipeFilters[number]['id'];

// Generate filter query based on selected filters
export const getFilterQuery = (selectedFilters: Record<string, string[]>) => {
  const query: Record<string, string> = {};
  
  Object.entries(selectedFilters).forEach(([filterName, values]) => {
    if (values.length === 0) return;
    
    const filter = recipeFilters.find((f) => f.id === filterName);
    if (!filter) return;
    
    if (Array.isArray(filter.fieldName)) {
      // Handle boolean fields like dietary restrictions
      if (filter.fieldMapping) {
        values.forEach(value => {
          const dbField = filter.fieldMapping?.[value];
          if (dbField) {
            query[dbField] = 'true';
          }
        });
      }
    } else if (filter.fieldName) {
      // Handle array fields
      query[filter.fieldName] = values.join(',');
    }
  });
  
  return query;
};

// 辅助函数：根据架构生成默认值
export function generateDefaultValues() {
  const defaults: Record<string, any> = {};
  
  recipeFilters.forEach((filter) => {
    if (filter.multiSelect) {
      defaults[filter.id] = [];
    } else {
      defaults[filter.id] = '';
    }
  });
  
  return defaults;
}

export default recipeFilters; 