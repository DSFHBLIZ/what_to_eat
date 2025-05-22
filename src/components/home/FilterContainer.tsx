'use client';

import React from 'react';
import FilterGroupBox from './FilterGroupBox';
import { FilterType } from '../../types/search';
import { getFilterOptions } from '../../config/filterSchema';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import TagsDisplay from '../search/TagsDisplay';

/**
 * 筛选容器组件
 * 使用filter-group和filter-label类名，符合全局CSS规范
 */
export default function FilterContainer() {
  // 获取过滤器状态
  const { searchState, toggleFilter } = useUnifiedSearchController();
  const { cuisines, flavors, difficulties, dietaryRestrictions } = searchState;
  
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
  
  // 检查是否有任何选定的筛选器
  const hasSelectedFilters = 
    cuisines.length > 0 || 
    flavors.length > 0 || 
    difficulties.length > 0 || 
    dietaryRestrictions.length > 0;
  
  return (
    <div className="w-full">
      <div className="filter-section">
        <div className="filter-group relative">
          <span className="filter-label">菜系</span>
          <FilterGroupBox
            title=""
            type={FilterType.CUISINE}
            options={getFilterOptions('cuisine')}
            mode="tag"
            showTitle={false}
            showClearButton={true}
            className="filter-group-box"
          />
        </div>
        
        <div className="filter-group relative">
          <span className="filter-label">口味</span>
          <FilterGroupBox
            title=""
            type={FilterType.FLAVOR}
            options={getFilterOptions('flavor')}
            mode="tag"
            showTitle={false}
            showClearButton={true}
            className="filter-group-box"
          />
        </div>
        
        <div className="filter-group relative">
          <span className="filter-label">时间</span>
          <FilterGroupBox
            title=""
            type={FilterType.DIFFICULTY}
            options={getFilterOptions('difficulty')}
            mode="tag"
            showTitle={false}
            showClearButton={true}
            className="filter-group-box"
          />
        </div>
        
        <div className="filter-group relative">
          <span className="filter-label">饮食限制</span>
          <FilterGroupBox
            title=""
            type={FilterType.DIETARY}
            options={getFilterOptions('dietaryRestrictions')}
            mode="tag"
            showTitle={false}
            showClearButton={true}
            className="filter-group-box"
          />
        </div>
      </div>
      
      {/* 已选筛选标签展示区 */}
      {hasSelectedFilters && (
        <div className="selected-filters bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">已选筛选条件</h3>
          
          {selectedCuisines.length > 0 && (
            <div className="filter-row mb-2">
              <span className="text-xs text-gray-500 mr-2">菜系:</span>
              <TagsDisplay 
                tags={selectedCuisines}
                onRemove={(id) => toggleFilter(FilterType.CUISINE, id)}
                color="blue"
                tagType="filter-selected"
              />
            </div>
          )}
          
          {selectedFlavors.length > 0 && (
            <div className="filter-row mb-2">
              <span className="text-xs text-gray-500 mr-2">口味:</span>
              <TagsDisplay 
                tags={selectedFlavors}
                onRemove={(id) => toggleFilter(FilterType.FLAVOR, id)}
                color="orange"
                tagType="filter-selected"
              />
            </div>
          )}
          
          {selectedDifficulties.length > 0 && (
            <div className="filter-row mb-2">
              <span className="text-xs text-gray-500 mr-2">时间:</span>
              <TagsDisplay 
                tags={selectedDifficulties}
                onRemove={(id) => toggleFilter(FilterType.DIFFICULTY, id)}
                color="green"
                tagType="filter-selected"
              />
            </div>
          )}
          
          {selectedDietary.length > 0 && (
            <div className="filter-row mb-2">
              <span className="text-xs text-gray-500 mr-2">饮食限制:</span>
              <TagsDisplay 
                tags={selectedDietary}
                onRemove={(id) => toggleFilter(FilterType.DIETARY, id)}
                color="purple"
                tagType="filter-selected"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 