'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import { Filter, FilterType } from '../../types/search';
import SearchCoordinator from '../search/SearchCoordinator';
import { getFilterOptions } from '../../config/filterSchema';
import { OptionBase } from '../../types/filter';
import TagsDisplay from '../search/TagsDisplay';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BanquetConfig } from '../../types/banquet';

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
  controller: ReturnType<typeof useUnifiedSearchController>; // 接收控制器作为必需的 prop
}

export default function HomeListView({ totalResults = 0, controller }: HomeListViewProps) {
  // 筛选标签的展开/折叠状态
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  // 动画标签追踪，当点击标签时添加动画效果
  const [animatingTags, setAnimatingTags] = useState<Record<string, boolean>>({});
  
  const { 
    searchState,
    toggleFilter, 
    executeSearch,
    setSearchState,
    setBanquetConfig
  } = controller;
  
  const { 
    cuisines, 
    flavors, 
    difficulties, 
    dietaryRestrictions,
    searchQuery,
    banquetMode
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
  
  // 添加状态管理
  const [isAddingSeasonings, setIsAddingSeasonings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // 常见调料列表 - 使用更全面的调料清单
  const COMMON_SEASONINGS = [
    '胡椒', '食盐', '酱油', '醋', '味精', '鸡精', '白糖', '冰糖', 
    '料酒', '花椒', '辣椒', '八角', '桂皮', '香叶', '生姜', 
    '大蒜', '葱', '芝麻油', '豆瓣酱', '豆豉', '腐乳', '蚝油', 
    '花生酱', '芝麻酱', '五香粉'
  ];

  // 显示toast的函数
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setTimeout(() => setToastMessage(null), 300);
    }, 2000);
  };

  // 添加/移除常见调料的处理函数
  const handleToggleCommonSeasonings = async () => {
    if (isAddingSeasonings) return; // 防止重复点击
    
    setIsAddingSeasonings(true);
    
    try {
      if (hasSeasonings) {
        // 移除所有常见调料
        let removedCount = 0;
        for (const seasoning of COMMON_SEASONINGS) {
          // 从必选食材中移除
          const reqIngredient = searchState.requiredIngredients.find(ing => ing.tag === seasoning);
          if (reqIngredient) {
            controller.removeRequiredIngredient(reqIngredient.id);
            removedCount++;
          }
          
          // 从可选食材中移除
          const optIngredient = searchState.optionalIngredients.find(ing => ing.tag === seasoning);
          if (optIngredient) {
            controller.removeOptionalIngredient(optIngredient.id);
            removedCount++;
          }
          
          // 从忌口食材中移除
          const avoidIngredient = searchState.avoidIngredients.find(ing => ing.tag === seasoning);
          if (avoidIngredient) {
            controller.removeAvoidIngredient(avoidIngredient.id);
            removedCount++;
          }
        }
        
        showToastMessage(`已移除${removedCount}种常见调料`);
      } else {
        // 添加调料
        let newlyAdded = 0;
        let toAddCount = 0;
        
        // 先统计有多少新调料需要添加
        for (const seasoning of COMMON_SEASONINGS) {
          const isAlreadyAdded = 
            searchState.requiredIngredients.some(ing => ing.tag === seasoning) ||
            searchState.optionalIngredients.some(ing => ing.tag === seasoning) ||
            searchState.avoidIngredients.some(ing => ing.tag === seasoning);
          
          if (!isAlreadyAdded) {
            toAddCount++;
          }
        }
        
        // 如果没有需要添加的调料，直接返回
        if (toAddCount === 0) {
          showToastMessage('所有常见调料都已添加过了！');
          setIsAddingSeasonings(false);
          return;
        }
        
        // 一次性快速添加所有调料
        for (const seasoning of COMMON_SEASONINGS) {
          const isAlreadyAdded = 
            searchState.requiredIngredients.some(ing => ing.tag === seasoning) ||
            searchState.optionalIngredients.some(ing => ing.tag === seasoning) ||
            searchState.avoidIngredients.some(ing => ing.tag === seasoning);
          
          if (!isAlreadyAdded) {
            const seasoningTag = {
              id: `seasoning-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              tag: seasoning,
              type: FilterType.SEASONING as const
            };
            controller.addOptionalIngredient(seasoningTag);
            newlyAdded++;
          }
        }
        
        showToastMessage(`成功添加了${newlyAdded}种常见调料！`);
      }
      
      // 保持开关动画状态一段时间
      setTimeout(() => {
        setIsAddingSeasonings(false);
      }, 800);
      
    } catch (error) {
      setIsAddingSeasonings(false);
      showToastMessage('操作调料时出现错误，请重试');
    }
  };

  // 检查是否已经有调料被添加
  const hasSeasonings = useMemo(() => {
    return COMMON_SEASONINGS.some(seasoning => 
      searchState.requiredIngredients.some(ing => ing.tag === seasoning) ||
      searchState.optionalIngredients.some(ing => ing.tag === seasoning) ||
      searchState.avoidIngredients.some(ing => ing.tag === seasoning)
    );
  }, [searchState.requiredIngredients, searchState.optionalIngredients, searchState.avoidIngredients]);

  return (
    <div className="home-list-view">
      {/* Toast 通知 */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          showToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

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
          {/* 添加常见调料按钮 - 在已选择区域内显示 */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">已选择：</div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">常见调料</span>
              <div 
                className="ios-toggle-switch"
                onClick={handleToggleCommonSeasonings}
              >
                <div className={`ios-toggle-track ${isAddingSeasonings || hasSeasonings ? 'loading' : ''}`}>
                  <div className="ios-toggle-thumb">
                    {isAddingSeasonings ? (
                      <svg className="w-3 h-3 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : hasSeasonings ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                tagClassName="bg-green-100 text-green-800 border-green-300"
                prefix="可选: "
              />
            )}
            
            {/* 显示忌口食材 */}
            {searchState.avoidIngredients.length > 0 && (
              <TagsDisplay
                tags={searchState.avoidIngredients}
                onRemove={controller.removeAvoidIngredient}
                tagClassName="bg-red-100 text-red-800 border-red-300"
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