'use client';

import React, { useState, useEffect } from 'react';
import { FilterType, FilterOption, FilterMode, FilterExpandMode } from '../../types/search';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import ClearButton from '../common/ClearButton';
import { OptionBase } from '../../types/filter';

// 定义FilterTag组件的Props接口
interface FilterTagProps {
  option: { value: string; label: string; id?: string };
  onClick: () => void;
  isActive: boolean;
  filterType: FilterType | string;
}

// FilterTag组件实现
const FilterTag: React.FC<FilterTagProps> = ({ option, onClick, isActive, filterType }) => {
  // 使用React.useState来管理动画状态
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  // 点击标签时添加动画效果
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 阻止事件冒泡但不阻止默认行为
    e.stopPropagation();
    
    // 设置动画状态
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // 调用传入的onClick函数
    onClick();
  };
  
  return (
    <div
      className={`filter-tag ${isActive ? 'selected' : ''} ${isAnimating ? 'filter-animation' : ''}`}
      onClick={handleClick}
      data-value={option.value || option.id}
      data-filter-type={filterType}
      data-active={isActive}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
    >
      {option.label}
    </div>
  );
};

// 重新定义FilterGroupProps接口
export interface FilterGroupProps {
  // 基础数据
  title: string;
  type: FilterType | string;
  options: OptionBase[] | string[] | FilterOption[];
  
  // 布局和UI配置
  mode?: 'option' | 'tag' | 'category' | 'header' | 'section';
  expandMode?: FilterExpandMode;
  maxInitialItems?: number;
  className?: string;
  contentClassName?: string;
  
  // 显示控制
  showActiveCount?: boolean;
  showClearButton?: boolean;
  showBorder?: boolean;
  showTitle?: boolean;
  
  // 交互配置
  onFilterChange?: (type: string, value: string, isActive: boolean) => void;
}

/**
 * 统一的过滤器组件
 * 整合了之前的FilterCategoryGroup、FilterGroup、FilterTagGroup、FilterHeader和FilterSectionUI等组件
 * 通过mode参数控制不同的布局模式
 */
const FilterGroupBox: React.FC<FilterGroupProps> = ({
  // 基础数据
  title,
  type,
  options,
  
  // 布局和UI配置
  mode = 'option',
  expandMode = 'always',
  maxInitialItems = 10,
  className = '',
  contentClassName = '',
  
  // 显示控制
  showActiveCount = true,
  showClearButton = true,
  showBorder = true,
  showTitle = true,
  
  // 交互配置
  onFilterChange
}) => {
  // 展开状态管理
  const [isExpanded, setIsExpanded] = useState(expandMode === 'always');
  const [isHovered, setIsHovered] = useState(false);
  // 添加本地激活状态跟踪
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // 过滤器状态和操作
  const { 
    searchState, 
    toggleFilter, 
    addRequiredIngredient,
    addOptionalIngredient
  } = useUnifiedSearchController();

  // 实现 isFilterActive 函数来检查过滤器是否激活
  const isFilterActive = (type: string, value: string): boolean => {
    switch (type) {
      case FilterType.CUISINE:
      case 'cuisines':
        return searchState.cuisines.includes(value);
      case FilterType.FLAVOR:
      case 'flavors':
        return searchState.flavors.includes(value);
      case FilterType.DIFFICULTY:
      case 'difficulties':
        return searchState.difficulties.includes(value);
      case FilterType.DIETARY:
      case 'dietaryRestrictions':
        return searchState.dietaryRestrictions.includes(value);
      case FilterType.INGREDIENT:
        return searchState.requiredIngredients.some(ing => ing.tag === value) ||
               searchState.optionalIngredients.some(ing => ing.tag === value);
      case FilterType.SEASONING:
        return searchState.requiredIngredients.some(ing => ing.tag === value && ing.type === FilterType.SEASONING) ||
               searchState.optionalIngredients.some(ing => ing.tag === value && ing.type === FilterType.SEASONING);
      default:
        return false;
    }
  };

  // 初始化本地激活状态
  useEffect(() => {
    const initialActiveFilters = normalizedOptions
      .map(opt => opt.value || opt.id || '')
      .filter(val => isFilterActive(type as string, val));
    
    if (initialActiveFilters.length > 0) {
      setActiveFilters(initialActiveFilters);
      console.log('初始化激活的筛选项:', type, initialActiveFilters);
    }
  }, []);  // 仅在组件挂载时运行一次

  // 标准化选项数组，兼容OptionBase、string和FilterOption类型
  const normalizedOptions = options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option, id: option };
    }
    if ('id' in option && !('value' in option)) {
      return { value: option.id, label: option.label || option.id, id: option.id };
    }
    return { 
      value: (option as FilterOption).value || (option as any).id || '', 
      label: (option as FilterOption).label || (option as any).value || (option as any).id || '',
      id: (option as any).id || (option as FilterOption).value || ''
    };
  });

  // 处理展开/折叠切换
  const handleToggleExpand = () => {
    if (expandMode === 'click' || expandMode === 'hover') {
      setIsExpanded(!isExpanded);
    }
  };

  // 处理鼠标悬停展开
  const handleMouseEnter = () => {
    if (expandMode === 'hover') {
      setIsExpanded(true);
    }
    setIsHovered(true);
  };

  // 处理鼠标离开折叠
  const handleMouseLeave = () => {
    if (expandMode === 'hover') {
      setIsExpanded(false);
    }
    setIsHovered(false);
  };

  // 处理切换筛选选项
  const handleToggleFilter = (value: string) => {
    // 在筛选器中切换状态
    console.log(`FilterGroupBox: 切换筛选 ${type}:${value}, 之前状态:`, isFilterActive(type as string, value));
    toggleFilter(type as FilterType, value);
    
    // 添加延迟检查，确认切换是否成功
    setTimeout(() => {
      console.log(`FilterGroupBox: 切换筛选后 ${type}:${value}, 当前状态:`, isFilterActive(type as string, value));
      // 强制验证筛选条件是否正确应用
      console.log('当前筛选器状态:', searchState);
      
      // 重要：记录完整的筛选参数，验证是否传递到搜索函数
      console.log('完整的筛选参数:', {
        searchQuery: searchState.searchQuery,
        requiredIngredients: searchState.requiredIngredients.map(i => i.tag),
        optionalIngredients: searchState.optionalIngredients.map(i => i.tag),
        cuisines: searchState.cuisines,
        flavors: searchState.flavors,
        difficulties: searchState.difficulties,
        dietaryRestrictions: searchState.dietaryRestrictions,
        tagLogic: searchState.tagLogic
      });
    }, 100);
    
    // 更新本地激活状态
    setActiveFilters(prevActiveFilters => {
      const exists = prevActiveFilters.includes(value);
      if (exists) {
        // 如果已经存在，则移除
        return prevActiveFilters.filter(v => v !== value);
      } else {
        // 如果不存在，则添加
        return [...prevActiveFilters, value];
      }
    });
    
    // 添加日志，跟踪当前状态
    console.log('Filter toggled:', type, value);
    console.log('isActive after toggle:', !isFilterActive(type as string, value));
    
    // 检查当前激活状态并强制更新
    setTimeout(() => {
      console.log('Active values:', getActiveValues());
      console.log('hasActiveFilters:', getActiveCount() > 0);
    }, 100);
    
    // 如果是激活操作，可以同时添加到对应的搜索栏
    const isNowActive = !isFilterActive(type as string, value);
    
    if (isNowActive) {
      // 根据筛选类型添加到必选或可选搜索框
      const ingredient = {
        id: `filter-${type}-${value}-${Date.now()}`,
        tag: value,
        type: type as FilterType
      };
      
      // 根据筛选类型决定添加到必选还是可选
      if (type === FilterType.INGREDIENT || type === FilterType.SEASONING) {
        // 必选食材和调料
        addRequiredIngredient(ingredient);
      } else if (type === FilterType.CUISINE || type === FilterType.FLAVOR || 
                type === FilterType.DIFFICULTY || type === FilterType.DIETARY) {
        // 筛选条件如菜系、口味等添加到可选
        addOptionalIngredient(ingredient);
      }
    }
    
    // 如果提供了onFilterChange回调，则调用它
    if (onFilterChange) {
      onFilterChange(type.toString(), value, isNowActive);
    }
  };

  // 清空这一类别的所有筛选
  const handleClearCategory = () => {
    // 清除当前类型的所有筛选条件
    let currentValues: string[] = [];
    switch (type) {
      case FilterType.CUISINE:
      case 'cuisines':
        currentValues = [...searchState.cuisines];
        break;
      case FilterType.FLAVOR:
      case 'flavors':
        currentValues = [...searchState.flavors];
        break;
      case FilterType.DIFFICULTY:
      case 'difficulties':
        currentValues = [...searchState.difficulties];
        break;
      case FilterType.DIETARY:
      case 'dietaryRestrictions':
        currentValues = [...searchState.dietaryRestrictions];
        break;
    }
    
    // 逐个移除筛选条件
    currentValues.forEach(value => {
      toggleFilter(type as FilterType, value);
    });
    
    // 清空本地激活状态
    setActiveFilters([]);
  };

  // 获取当前筛选类型的激活值
  const getActiveValues = (): string[] => {
    switch (type) {
      case FilterType.CUISINE:
      case 'cuisines':
        return searchState.cuisines;
      case FilterType.FLAVOR:
      case 'flavors':
        return searchState.flavors;
      case FilterType.DIFFICULTY:
      case 'difficulties':
        return searchState.difficulties;
      case FilterType.DIETARY:
      case 'dietaryRestrictions':
        return searchState.dietaryRestrictions;
      default:
        return [];
    }
  };

  // 获取已激活的选项数量
  const getActiveCount = () => {
    return getActiveValues().length;
  };

  // 当前有激活的选项
  const hasActiveFilters = getActiveCount() > 0;

  // 是否应该显示展开/折叠按钮
  const shouldShowExpandButton = expandMode === 'click' && normalizedOptions.length > maxInitialItems;

  // 获取显示的选项，如果未展开则限制数量
  const displayOptions = isExpanded 
    ? normalizedOptions 
    : normalizedOptions.slice(0, maxInitialItems);

  // 根据模式选择合适的样式类
  let containerClasses = `${className}`;
  let titleClasses = 'font-medium';
  let optionsContainerClasses = `${contentClassName}`;
  let optionButtonClasses = '';
  let activeOptionClasses = '';
  let inactiveOptionClasses = '';

  // 根据不同模式设置不同的样式
  switch (mode) {
    case 'option':
      containerClasses += ' mb-4';
      titleClasses += ' text-md text-gray-600 mb-2';
      optionsContainerClasses += ' flex flex-wrap -m-1 mt-3';
      optionButtonClasses = 'px-3 py-1 m-1 text-sm font-medium rounded-full border transition-colors';
      activeOptionClasses = 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200';
      inactiveOptionClasses = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100';
      break;
    case 'tag':
      containerClasses += ' mb-4';
      titleClasses += ' text-md text-gray-600 mb-2';
      optionsContainerClasses += ' flex flex-wrap gap-2 mt-3';
      optionButtonClasses = 'px-3 py-1 rounded-full text-sm transition-colors';
      activeOptionClasses = 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      inactiveOptionClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      break;
    case 'category':
      containerClasses += ' mb-3';
      titleClasses += ' text-sm';
      optionsContainerClasses += ' flex flex-wrap gap-1 mt-3';
      optionButtonClasses = 'text-xs px-2 py-1 rounded cursor-pointer';
      activeOptionClasses = 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-medium hover:bg-indigo-200';
      inactiveOptionClasses = 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100';
      break;
    case 'header':
      containerClasses += ' border-b pb-3 mb-4';
      titleClasses += ' text-lg mb-2';
      optionsContainerClasses += ' flex flex-wrap gap-2 mt-3';
      optionButtonClasses = 'px-3 py-1 text-sm rounded-full transition-colors';
      activeOptionClasses = 'bg-indigo-100 text-indigo-800 border border-indigo-300 hover:bg-indigo-200';
      inactiveOptionClasses = 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100';
      break;
    case 'section':
      if (showBorder) {
        containerClasses += ' border rounded-lg p-3 mb-4';
      } else {
        containerClasses += ' mb-4';
      }
      titleClasses += ' text-md font-semibold mb-2';
      optionsContainerClasses += ' flex flex-wrap gap-1 mt-3';
      optionButtonClasses = 'text-xs px-2 py-1 rounded-md cursor-pointer';
      activeOptionClasses = 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-medium hover:bg-indigo-200';
      inactiveOptionClasses = 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100';
      break;
  }

  // 渲染标题和操作按钮部分
  const renderHeaderSection = () => {
    // 计算是否有激活的筛选项，使用本地状态
    const hasActiveLocalFilters = activeFilters.length > 0;
    // 作为备份，再次检查全局状态
    const activeCount = getActiveCount();
    const hasActiveGlobalFilters = activeCount > 0;
    
    // 只要任一状态表明有激活的筛选项，就显示清除按钮
    const shouldShowClearBtn = showClearButton && (hasActiveLocalFilters || hasActiveGlobalFilters);
    
    // 检查是否需要显示标题或清除按钮
    const showHeader = showTitle || shouldShowClearBtn || shouldShowExpandButton;
    
    if (!showHeader) return null;
    
    return (
      <div className="flex justify-between items-center mb-2">
        {showTitle ? (
          <h3 className={titleClasses}>{title}{showActiveCount && (hasActiveLocalFilters || hasActiveGlobalFilters) && ` (${activeFilters.length || activeCount})`}</h3>
        ) : (
          <div className="flex-1"></div> // 占位元素，确保清除按钮在右侧
        )}
        <div className={`flex items-center gap-1 ${!showTitle ? 'ml-auto' : ''}`}>
          {shouldShowClearBtn && (
            <ClearButton 
              onClick={handleClearCategory}
              label="清除"
              showLabel={true}
              className="clear-filter-button text-xs text-gray-500 hover:text-gray-700"
            />
          )}
          {shouldShowExpandButton && (
            <button 
              onClick={handleToggleExpand}
              className="text-xs text-gray-500 hover:text-gray-700"
              aria-label={isExpanded ? "折叠选项" : "展开选项"}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={containerClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderHeaderSection()}
      
      <div className={optionsContainerClasses}>
        {displayOptions.map((option) => {
          const optionValue = option.value || option.id || '';
          // 使用本地状态和全局状态共同判断
          const isActive = activeFilters.includes(optionValue) || isFilterActive(type as string, optionValue);
          
          // 使用新的FilterTag组件
          if (mode === 'tag') {
            return (
              <FilterTag 
                key={optionValue}
                option={option}
                onClick={() => handleToggleFilter(optionValue)}
                isActive={isActive}
                filterType={type}
              />
            );
          }
          
          // 原有按钮样式的实现
          const buttonClass = `${optionButtonClasses} ${isActive ? activeOptionClasses : inactiveOptionClasses}`;
          
          return (
            <button
              key={optionValue}
              onClick={() => handleToggleFilter(optionValue)}
              className={buttonClass}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      
      {!isExpanded && normalizedOptions.length > maxInitialItems && (
        <button
          key="view-more-button"
          onClick={handleToggleExpand}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center"
        >
          <ChevronDown size={14} className="mr-1" />
          查看更多 ({normalizedOptions.length - maxInitialItems})
        </button>
      )}
    </div>
  );
};

export default FilterGroupBox;