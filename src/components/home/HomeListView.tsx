'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import { Filter, FilterType } from '../../types/search';
import SearchCoordinator from '../search/SearchCoordinator';
import { getFilterOptions } from '../../config/filterSchema';
import { OptionBase } from '../../types/filter';
import TagsDisplay from '../search/TagsDisplay';
import { ChevronDown, ChevronUp } from 'lucide-react';

// 单个筛选标签的Props类型定义
interface FilterTagProps {
  filter: OptionBase;
  type: FilterType;
  isActive: boolean;
  onClick: () => void;
  isAnimating: boolean;
}

/**
 * 单个筛选标签组件
 */
const FilterTag: React.FC<FilterTagProps> = ({ 
  filter, 
  type, 
  isActive, 
  onClick, 
  isAnimating 
}) => {
  return (
    <div
      data-filter-id={filter.id}
      data-filter-type={type}
      data-active={isActive}
      onClick={onClick}
      className={`filter-tag ${isActive ? 'selected' : ''} ${isAnimating ? 'filter-animation' : ''}`}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
    >
      {filter.label}
    </div>
  );
};

/**
 * 首页列表视图组件
 * 整合搜索、筛选功能
 * 根据最新设计要求，应用CSS样式规范
 */
interface HomeListViewProps {
  totalResults?: number;
}

export default function HomeListView({ totalResults = 0 }: HomeListViewProps) {
  // 创建单一控制器实例，避免多个实例造成的干扰
  const controller = useUnifiedSearchController();
  
  // 筛选标签的展开/折叠状态
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  // 动画标签追踪，当点击标签时添加动画效果
  const [animatingTags, setAnimatingTags] = useState<Record<string, boolean>>({});
  
  const { 
    searchState,
    toggleFilter, 
    executeSearch,
    setSearchState 
  } = controller;
  
  const { 
    cuisines, 
    flavors, 
    difficulties, 
    dietaryRestrictions,
    searchQuery 
  } = searchState;
  
  // 监听筛选状态变化 - 使用useMemo减少重复渲染和日志输出
  const filterState = useMemo(() => {
    return {
      searchQuery,
      cuisines,
      flavors,
      difficulties,
      dietaryRestrictions,
      requiredIngredients: searchState.requiredIngredients,
      optionalIngredients: searchState.optionalIngredients
    };
  }, [
    cuisines, 
    flavors, 
    difficulties, 
    dietaryRestrictions, 
    searchQuery,
    searchState.requiredIngredients,
    searchState.optionalIngredients
  ]);

  // 监听筛选状态变化
  useEffect(() => {
    // 移除多余的日志输出
  }, [filterState]);
  
  // 统一处理检查筛选器是否激活的逻辑
  const isFilterActive = (type: FilterType, value: string): boolean => {
    switch (type) {
      case FilterType.CUISINE:
        return cuisines.includes(value);
      case FilterType.FLAVOR:
        return flavors.includes(value);
      case FilterType.DIFFICULTY:
        return difficulties.includes(value);
      case FilterType.DIETARY:
        return dietaryRestrictions.includes(value);
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
  
  // 处理标签点击
  const handleFilterClick = (type: FilterType, filter: OptionBase) => {
    // 设置点击的标签为动画状态
    setAnimatingTags(prev => ({ ...prev, [filter.id]: true }));
    
    // 触发过滤器变更
    toggleFilter(type, filter.id);
    
    // 动画结束后重置状态
    setTimeout(() => {
      setAnimatingTags(prev => ({ ...prev, [filter.id]: false }));
    }, 300);
  };
  
  // 增加一个手动搜索函数
  const handleExecuteSearch = () => {
    console.log('HomeListView: 手动执行搜索');
    
    // 确保我们能够获取到最新的筛选状态
    const currentFilters = {
      searchQuery,
      // 使用简单数组形式传递菜系等，方便HomeContainer处理
      cuisines: [...cuisines],  // 创建数组副本，避免引用问题
      flavors: [...flavors],
      difficulties: [...difficulties],
      dietaryRestrictions: [...dietaryRestrictions],
      requiredIngredients: [...searchState.requiredIngredients],
      optionalIngredients: [...searchState.optionalIngredients]
    };
    
    // 创建自定义事件，触发搜索
    const searchEvent = new CustomEvent('execute-search', {
      detail: {
        filters: currentFilters
      }
    });
    
    // 派发事件，直接执行搜索
    window.dispatchEvent(searchEvent);
  };
  
  // 获取选定的过滤器项
  const getSelectedFilters = (type: FilterType, values: string[]) => {
    const options = getFilterOptions(
      type === FilterType.CUISINE ? 'cuisine' : 
      type === FilterType.FLAVOR ? 'flavor' : 
      type === FilterType.DIFFICULTY ? 'difficulty' : 
      'dietaryRestrictions'
    );
    
    return values.map(value => {
      const option = options.find(opt => opt.id === value);
      return {
        id: value,
        tag: option?.label || value,
        type
      };
    });
  };
  
  // 创建选定的筛选标签数组
  const selectedCuisines = getSelectedFilters(FilterType.CUISINE, cuisines);
  const selectedFlavors = getSelectedFilters(FilterType.FLAVOR, flavors);
  const selectedDifficulties = getSelectedFilters(FilterType.DIFFICULTY, difficulties);
  const selectedDietary = getSelectedFilters(FilterType.DIETARY, dietaryRestrictions);
  
  // 检查是否有任何选定的筛选器或食材
  const hasSelectedFilters = 
    cuisines.length > 0 || 
    flavors.length > 0 || 
    difficulties.length > 0 || 
    dietaryRestrictions.length > 0 ||
    searchState.requiredIngredients.length > 0 ||
    searchState.optionalIngredients.length > 0 ||
    searchState.avoidIngredients.length > 0;
  
  // 切换筛选区域的展开/折叠状态
  const toggleFiltersExpanded = () => {
    setIsFiltersExpanded(!isFiltersExpanded);
  };
  
  // 筛选按钮组件 - 使用与添加按钮相同的结构
  const FilterButton = (
    <button 
      className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
      onClick={toggleFiltersExpanded}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center">
        <span>筛选选项</span>
        <span className="ml-2">
          {isFiltersExpanded ? 
            <ChevronUp size={18} strokeWidth={2.5} /> : 
            <ChevronDown size={18} strokeWidth={2.5} />
          }
        </span>
      </div>
    </button>
  );
  
  return (
    <div className="w-full">
      {/* 搜索区域 - 应用新样式 */}
      <div className="search-area mb-8">
        {/* 使用SearchCoordinator组件，共享同一个控制器 */}
        <SearchCoordinator 
          mode="full"
          showSearchHistory={true}
          showPopularSearches={true}
          showIngredientsInput={true}
          controller={controller}
          filterButton={FilterButton}
        />
      </div>
      
      {/* 折叠的筛选内容区域 - 只移除负margin */}
      {isFiltersExpanded && (
        <div className="filter-content-standalone mb-4" style={{ marginTop: '-1rem' }}>
          <div className="p-5">
            {/* 菜系 */}
            <div className="mb-5">
              <div className="text-sm font-medium mb-3">菜系</div>
              <div className="flex flex-wrap gap-2 ml-1">
                {getFilterOptions('cuisine').map((filter) => (
                  <FilterTag
                    key={filter.id}
                    filter={filter}
                    type={FilterType.CUISINE}
                    isActive={isFilterActive(FilterType.CUISINE, filter.id)}
                    onClick={() => handleFilterClick(FilterType.CUISINE, filter)}
                    isAnimating={animatingTags[filter.id] || false}
                  />
                ))}
              </div>
            </div>
            
            {/* 口味 */}
            <div className="mb-5">
              <div className="text-sm font-medium mb-3">口味</div>
              <div className="flex flex-wrap gap-2 ml-1">
                {getFilterOptions('flavor').map((filter) => (
                  <FilterTag
                    key={filter.id}
                    filter={filter}
                    type={FilterType.FLAVOR}
                    isActive={isFilterActive(FilterType.FLAVOR, filter.id)}
                    onClick={() => handleFilterClick(FilterType.FLAVOR, filter)}
                    isAnimating={animatingTags[filter.id] || false}
                  />
                ))}
              </div>
            </div>
            
            {/* 时间 */}
            <div className="mb-5">
              <div className="text-sm font-medium mb-3">时间</div>
              <div className="flex flex-wrap gap-2 ml-1">
                {getFilterOptions('difficulty').map((filter) => (
                  <FilterTag
                    key={filter.id}
                    filter={filter}
                    type={FilterType.DIFFICULTY}
                    isActive={isFilterActive(FilterType.DIFFICULTY, filter.id)}
                    onClick={() => handleFilterClick(FilterType.DIFFICULTY, filter)}
                    isAnimating={animatingTags[filter.id] || false}
                  />
                ))}
              </div>
            </div>
            
            {/* 饮食限制 */}
            <div>
              <div className="text-sm font-medium mb-3">饮食限制</div>
              <div className="flex flex-wrap gap-2 ml-1">
                {getFilterOptions('dietaryRestrictions').map((filter) => (
                  <FilterTag
                    key={filter.id}
                    filter={filter}
                    type={FilterType.DIETARY}
                    isActive={isFilterActive(FilterType.DIETARY, filter.id)}
                    onClick={() => handleFilterClick(FilterType.DIETARY, filter)}
                    isAnimating={animatingTags[filter.id] || false}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 保留已选中的筛选标签显示 - 同时包含食材标签和筛选标签 */}
      {hasSelectedFilters && (
        <div className="selected-filters mb-4">
          <div className="text-sm text-gray-600 mb-2">已选择：</div>
          <div className="flex flex-wrap gap-2">
            {/* 显示必选食材 */}
            {searchState.requiredIngredients.length > 0 && (
              <TagsDisplay
                tags={searchState.requiredIngredients}
                onRemove={controller.removeRequiredIngredient}
                tagClassName="bg-indigo-100 text-indigo-800 border-indigo-300"
                prefix="必选: "
              />
            )}
            
            {/* 显示可选食材 */}
            {searchState.optionalIngredients.length > 0 && (
              <TagsDisplay
                tags={searchState.optionalIngredients}
                onRemove={controller.removeOptionalIngredient}
                tagClassName="bg-indigo-100 text-indigo-800 border-indigo-300"
                prefix="可选: "
              />
            )}
            
            {/* 显示忌口食材 */}
            {searchState.avoidIngredients.length > 0 && (
              <TagsDisplay
                tags={searchState.avoidIngredients}
                onRemove={controller.removeAvoidIngredient}
                tagClassName="bg-indigo-100 text-indigo-800 border-indigo-300"
                prefix="忌口: "
              />
            )}
            
            {/* 使用TagsDisplay显示筛选标签 */}
            {selectedCuisines.length > 0 && (
              <TagsDisplay
                tags={selectedCuisines}
                onRemove={(id) => toggleFilter(FilterType.CUISINE, id)}
                tagClassName="bg-indigo-100 text-indigo-800 border-indigo-300"
              />
            )}
            
            {selectedFlavors.length > 0 && (
              <TagsDisplay
                tags={selectedFlavors}
                onRemove={(id) => toggleFilter(FilterType.FLAVOR, id)}
                tagClassName="bg-indigo-100 text-indigo-800 border-indigo-300"
              />
            )}
            
            {selectedDifficulties.length > 0 && (
              <TagsDisplay
                tags={selectedDifficulties}
                onRemove={(id) => toggleFilter(FilterType.DIFFICULTY, id)}
                tagClassName="bg-indigo-100 text-indigo-800 border-indigo-300"
              />
            )}
            
            {selectedDietary.length > 0 && (
              <TagsDisplay
                tags={selectedDietary}
                onRemove={(id) => toggleFilter(FilterType.DIETARY, id)}
                tagClassName="bg-indigo-100 text-indigo-800 border-indigo-300"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
} 