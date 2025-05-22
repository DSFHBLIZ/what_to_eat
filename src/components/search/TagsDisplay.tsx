'use client';

import React from 'react';
import TagWrapper, { TagColor } from '../ui/TagWrapper';
import { IngredientTag } from '../../types/search';

// 统一Tag类型与IngredientTag，删除多余接口
interface TagsDisplayProps {
  tags: IngredientTag[];
  onRemoveTag?: (id: string) => void; // 保留旧的API，但设为可选
  onRemove?: (id: string) => void; // 新的API名称
  className?: string;
  color?: TagColor;
  tagType?: 'badge' | 'ingredient-required' | 'default' | 'filter-selected'; // 添加filter-selected类型
  tagClassName?: string; // 新增：自定义标签样式类
  prefix?: string; // 新增：标签前缀文本
}

/**
 * 标签显示组件
 * 显示已选择的标签并处理移除操作
 * 使用TagWrapper作为基础组件
 */
const TagsDisplay: React.FC<TagsDisplayProps> = ({
  tags,
  onRemoveTag,
  onRemove,
  className = '',
  color = 'blue',
  tagType = 'default',
  tagClassName,
  prefix = ''
}) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  // 使用移除回调 - 兼容新旧API
  const handleRemove = (id: string) => {
    if (onRemove) {
      onRemove(id);
    } else if (onRemoveTag) {
      onRemoveTag(id);
    }
  };

  // 获取标签颜色
  const getTagColor = (type: string): TagColor => {
    switch (type) {
      case 'ingredient': return 'blue';
      case 'seasoning': return 'orange';
      case 'cuisine': return 'blue'; // 菜系使用蓝色
      case 'flavor': 
      case 'flavors': return 'orange'; // 口味使用橙色
      case 'difficulty': return 'green'; // 时间/难度使用绿色
      case 'cookingMethods': return 'green';
      case 'dietaryRestrictions': return 'purple';
      default: return color;
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tagItem) => {
        const id = tagItem.id || `${tagItem.tag}-${Math.random()}`;
        const tagLabel = prefix 
          ? `${prefix}${tagItem.tag}` 
          : (tagItem.type === 'seasoning' ? `${tagItem.tag} (调料)` : 
             tagItem.type === 'difficulty' ? `时间: ${tagItem.tag}` : 
             tagItem.tag);
          
        return (
          <TagWrapper
            key={id}
            label={tagLabel}
            value={tagItem.tag}
            color={getTagColor(tagItem.type)}
            type={tagType as any}
            onRemove={() => handleRemove(id)}
            className={tagClassName}
          />
        );
      })}
    </div>
  );
};

export default TagsDisplay; 