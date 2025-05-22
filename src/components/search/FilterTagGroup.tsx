import React, { useMemo } from 'react';
import { FilterType } from '../../types/search';
import TagWrapper from '../ui/TagWrapper';

// 定义组件props类型
interface FilterTagGroupProps {
  title: string;
  options: string[] | { id: string; label: string; value?: string }[];
  activeFilters?: string[];
  handleFilterClick: (id: string, type: string, isActive: boolean) => void;
  type: string;
}

// 根据类型和值返回标签颜色
const getTagColor = (value: string, type: string): "blue" | "green" | "red" | "gray" | "amber" | "purple" | "orange" => {
  switch (type) {
    case 'cuisine':
      return 'blue';
    case 'flavor':
      return 'orange';
    case 'difficulty':
      return 'green';
    case 'dietary':
      return 'purple';
    default:
      return 'blue';
  }
};

const FilterTagGroup: React.FC<FilterTagGroupProps> = ({ 
  title, 
  options, 
  activeFilters = [], 
  handleFilterClick, 
  type 
}) => {
  const renderFilterOptions = useMemo(() => {
    console.log(`FilterTagGroup: ${title} 的可用选项:`, options);
    
    return options.map((option) => {
      // 处理选项格式，支持"值:标签"格式
      let value: string;
      let label: string;
      
      if (typeof option === 'string') {
        if (option.includes(':')) {
          // 处理"值:标签"格式
          const parts = option.split(':');
          value = parts[0];
          label = parts[1] || parts[0];
        } else {
          value = option;
          label = option;
        }
      } else if (option && typeof option === 'object') {
        value = option.value || option.id || '';
        label = option.label || value;
      } else {
        console.warn('无效的过滤选项:', option);
        return null;
      }
      
      // 检查过滤值是否已激活
      const isActive = activeFilters?.includes(value);
      
      return (
        <TagWrapper
          key={value}
          label={label}
          value={value}
          onClick={() => handleFilterClick(value, type, isActive || false)}
          type={isActive ? 'filter-selected' : 'filter'}
          color={getTagColor(value, type)}
          rounded={true}
          isClickable={true}
          data-testid={`filter-tag-${type}-${value}`}
        />
      );
    });
  }, [options, activeFilters, type, title, handleFilterClick]);

  return (
    <div className="filter-tag-group">
      {renderFilterOptions}
    </div>
  );
};

export default FilterTagGroup; 