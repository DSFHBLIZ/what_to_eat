'use client';

import React from 'react';
import { memo } from 'react';
import { ensureArray } from '../../utils/common/typeChecks';

// 通用食材/调料项
export interface RecipeItemType {
  name: string;
  quantity?: string;
  amount?: string;
}

// 可以传入字符串或完整对象数组
export type RecipeItemsArrayType = Array<string | RecipeItemType>;

// 组件属性接口
export interface RecipeRowItemProps {
  // 数据属性
  items: RecipeItemsArrayType;
  
  // 类型控制（决定显示样式和图标）
  type?: 'ingredient' | 'seasoning' | 'tool' | 'custom';
  
  // 配置选项
  title?: string;
  icon?: string;
  layout?: 'grid' | 'list';
  
  // 样式
  className?: string;
  headerClassName?: string;
  itemClassName?: string;
  
  // 自定义颜色（可选）
  customColors?: {
    bg?: string;
    title?: string;
    border?: string;
    printBg?: string;
  };
}

/**
 * 统一的食材/调料行列表UI组件
 */
const RecipeRowItem = ({
  // 数据属性
  items,
  
  // 类型控制
  type = 'ingredient',
  
  // 配置选项
  title,
  icon,
  layout = 'grid',
  
  // 样式
  className = '',
  headerClassName = '',
  itemClassName = '',
  
  // 自定义颜色
  customColors
}: RecipeRowItemProps) => {
  // 获取类型对应的默认设置
  const getTypeDefaults = () => {
    switch (type) {
      case 'seasoning':
        return {
          title: '调料',
          icon: 'kitchen',
          bg: 'bg-yellow-50',
          titleColor: 'text-yellow-800',
          borderColor: 'print:border-yellow-200',
        };
      case 'tool':
        return {
          title: '厨具',
          icon: 'cooking',
          bg: 'bg-purple-50',
          titleColor: 'text-purple-800',
          borderColor: 'print:border-purple-200',
        };
      case 'ingredient':
      default:
        return {
          title: '食材',
          icon: 'lunch_dining',
          bg: 'bg-green-50',
          titleColor: 'text-green-800',
          borderColor: 'print:border-green-200',
        };
    }
  };

  const defaults = getTypeDefaults();
  
  // 使用提供的值或默认值
  const displayTitle = title || defaults.title;
  const displayIcon = icon || defaults.icon;
  const bgColor = customColors?.bg || defaults.bg;
  const titleColor = customColors?.title || defaults.titleColor;
  const borderColor = customColors?.border || defaults.borderColor;
  const printBg = customColors?.printBg || 'print:bg-white';

  // 格式化项目数据
  const formatItems = () => {
    return ensureArray<any>(items, []).map((item, index) => {
      if (typeof item === 'string') {
        return { 
          name: item, 
          quantity: '适量', 
          key: `${type}-item-${index}` 
        };
      }
      
      return {
        name: item.name || '',
        quantity: item.quantity || item.amount || '适量',
        key: `${type}-item-${index}`
      };
    }).filter(item => item.name && item.name !== '未知' && item.name.trim() !== '');
  };

  const formattedItems = formatItems();

  // 如果没有项目，则不显示
  if (formattedItems.length === 0) {
    return null;
  }

  // 确定布局样式
  const layoutClasses = layout === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' 
    : 'space-y-2';

  return (
    <div className={`${bgColor} p-4 rounded-lg ${printBg} ${borderColor} ${className}`}>
      <h2 className={`text-xl font-semibold mb-3 ${titleColor} ${headerClassName}`}>
        {displayIcon && <span className="material-symbols-outlined mr-2">{displayIcon}</span>}
        {displayTitle}
      </h2>
      
      <ul className={layoutClasses}>
        {formattedItems.map((item) => (
          <li 
            key={item.key} 
            className={`flex justify-between py-2 px-3 bg-white/50 rounded-md ${itemClassName}`}
          >
            <span className="font-medium">{item.name}</span>
            <span className="text-gray-600">{item.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default memo(RecipeRowItem); 