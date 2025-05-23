'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TagsDisplay from './TagsDisplay';
import { FilterType, IngredientTag } from '../../types/search';
import { isSeasoningTag, searchIngredientsAndSeasonings } from '../../utils/recipe/searchService';
import { useUnifiedSearchController } from '../../controllers/useUnifiedSearchController';
import BaseIngredientInput from '../common/BaseIngredientInput';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { requestManager } from '../../utils/requests/requestManager';
import { useCancellableRequests } from '../../utils/state/stateSynchronizer';
import BanquetModeButton from './BanquetModeButton';
import { BanquetConfig } from '../../types/banquet';

// 热门搜索关键词
const POPULAR_SEARCHES = ['意大利面', '蛋炒饭', '麻婆豆腐', '红烧肉', '水煮鱼'];

export type FilterOption = { value: string; label: string };

interface SearchCoordinatorProps {
  className?: string;
  mode?: 'simple' | 'full';
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  disabled?: boolean;
  showSearchHistory?: boolean;
  showPopularSearches?: boolean;
  showIngredientsInput?: boolean;
  preserveHistory?: boolean;
  placeholder?: string;
  controller?: ReturnType<typeof useUnifiedSearchController>;
  filterButton?: React.ReactNode;
}

const tagButtonClass = (isActive: boolean) => `
  text-xs px-2 py-1 rounded-full border 
  ${isActive 
    ? 'bg-indigo-100 text-indigo-800 border-indigo-300' 
    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
  }
`;

/**
 * 搜索协调器组件
 * 整合各类搜索功能，支持简单和完整两种模式
 * 统一替代原有的SearchAndFilterBar组件
 * 
 * 重要说明：
 * 1. 搜索只在用户点击搜索按钮时执行，不会自动触发
 * 2. 筛选条件变更不会自动触发搜索，确保用户体验一致
 */
const SearchCoordinator: React.FC<SearchCoordinatorProps> = ({
  className = '',
  mode = 'full',
  showFilterButton = false,
  onFilterClick,
  disabled = false,
  showSearchHistory = true,
  showPopularSearches = true,
  showIngredientsInput = true,
  preserveHistory = true,
  placeholder = '搜索菜谱、食材或烹饪方法...',
  controller,
  filterButton
}) => {
  const router = useRouter();
  
  // 始终调用Hook，无论是否传入controller
  const internalController = useUnifiedSearchController({
    syncWithUrl: true,
    preserveHistory: preserveHistory,
    autoExecuteSearch: false // 确保不自动执行搜索
  });
  
  // 使用统一的搜索和过滤状态 - 优先使用传入的controller
  const {
    searchState,
    setSearchState,
    addRequiredIngredient,
    removeRequiredIngredient,
    addOptionalIngredient,
    removeOptionalIngredient,
    addAvoidIngredient,
    removeAvoidIngredient,
    toggleFilter,
    searchHistory = [],
    setSearchQuery,
    executeSearch
  } = controller || internalController;

  // 实现 isFilterActive 函数来检查过滤器是否激活
  const isFilterActive = (type: FilterType, value: string): boolean => {
    switch (type) {
      case FilterType.CUISINE:
        return searchState.cuisines.includes(value);
      case FilterType.FLAVOR:
        return searchState.flavors.includes(value);
      case FilterType.DIFFICULTY:
        return searchState.difficulties.includes(value);
      case FilterType.DIETARY:
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

  // 实现重置过滤器函数
  const resetFilters = () => {
    // 直接用setSearchState重置所有搜索状态
    setSearchState(prev => ({
      ...prev,
      searchQuery: '',
      requiredIngredients: [],
      optionalIngredients: [],
      avoidIngredients: [], // 清除忌口食材
      cuisines: [],
      flavors: [],
      difficulties: [],
      dietaryRestrictions: [],
      appliedFilters: []
    }));
    
    // 清空输入框
    setRequiredInput('');
    setOptionalInput('');
    setAvoidInput('');
    setSearchInput('');
  };

  // 实现设置标签逻辑函数
  const setTagLogic = (logic: 'AND' | 'OR') => {
    setSearchState(prev => ({
      ...prev,
      tagLogic: logic
    }));
  };

  // 从searchState中提取所需状态
  const {
    searchQuery,
    requiredIngredients,
    optionalIngredients,
    avoidIngredients,
    tagLogic,
    flavors,
    difficulties,
    dietaryRestrictions,
    appliedFilters
  } = searchState;
  
  // 组件内部状态
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [requiredInput, setRequiredInput] = useState('');
  const [optionalInput, setOptionalInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');  // 添加忌口食材输入状态
  const [expandedSections, setExpandedSections] = useState({
    cuisines: true,
    difficulties: true,
    flavors: true,
    cookingMethods: false,
    dietaryRestrictions: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // 当外部searchQuery变化时，同步内部状态
  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  // 添加对上一次搜索条件的引用
  const lastSearchFiltersRef = useRef<string>('');

  // 处理添加必选食材
  const handleAddRequiredIngredient = useCallback((ingredient: string) => {
    if (ingredient.trim()) {
      const isSeasoning = isSeasoningTag(ingredient);
      
      // 创建新的IngredientTag
      const newTag: IngredientTag = {
        id: `req-${Date.now()}`,
        tag: ingredient.trim(), 
        type: isSeasoning ? FilterType.SEASONING : FilterType.INGREDIENT 
      };
      
      console.log('添加必选食材:', newTag);
      
      // 添加新标签
      addRequiredIngredient(newTag);
      
      // 清空输入框
      setRequiredInput('');
    }
  }, [addRequiredIngredient]);

  // 处理添加可选食材
  const handleAddOptionalIngredient = useCallback((ingredient: string) => {
    if (ingredient.trim()) {
      const isSeasoning = isSeasoningTag(ingredient);
      
      // 创建新的IngredientTag，使用更确定性的ID生成
      const newTag: IngredientTag = {
        id: `opt-${Date.now()}${Math.floor(Math.random() * 10000000000)}`,
        tag: ingredient.trim(), 
        type: isSeasoning ? FilterType.SEASONING : FilterType.INGREDIENT 
      };
      
      console.log('添加可选食材:', newTag);
      
      // 添加新标签
      addOptionalIngredient(newTag);
      
      // 清空输入框
      setOptionalInput('');
    }
  }, [addOptionalIngredient]);

  // 处理添加忌口食材
  const handleAddAvoidIngredient = useCallback((ingredient: string) => {
    if (ingredient.trim()) {
      const isSeasoning = isSeasoningTag(ingredient);
      
      // 创建新的IngredientTag
      const newTag: IngredientTag = {
        id: `avoid-${Date.now()}${Math.floor(Math.random() * 10000000000)}`,
        tag: ingredient.trim(), 
        type: isSeasoning ? FilterType.SEASONING : FilterType.INGREDIENT 
      };
      
      console.log('添加忌口食材:', newTag);
      
      // 添加新标签
      addAvoidIngredient(newTag);
      
      // 清空输入框
      setAvoidInput('');
    }
  }, [addAvoidIngredient]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 处理当前搜索关键词
      const currentSearchKeyword = searchInput.trim();
      
      // 处理必选食材
      let finalRequiredIngredients = [...searchState.requiredIngredients];
      if (requiredInput.trim()) {
        // 创建新食材标签
        const newTag: IngredientTag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          tag: requiredInput.trim(),
          type: isSeasoningTag(requiredInput.trim()) ? FilterType.SEASONING : FilterType.INGREDIENT
        };
        
        // 更新必选食材变量
        finalRequiredIngredients = [...finalRequiredIngredients, newTag];
        
        // 添加到状态中
        addRequiredIngredient(newTag);
        
        // 清空输入框
        setRequiredInput('');
      }
      
      // 处理可选食材
      let finalOptionalIngredients = [...searchState.optionalIngredients];
      if (optionalInput.trim()) {
        // 创建新食材标签
        const newTag: IngredientTag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          tag: optionalInput.trim(),
          type: isSeasoningTag(optionalInput.trim()) ? FilterType.SEASONING : FilterType.INGREDIENT
        };
        
        // 更新可选食材变量
        finalOptionalIngredients = [...finalOptionalIngredients, newTag];
        
        // 添加到状态中
        addOptionalIngredient(newTag);
        
        // 清空输入框
        setOptionalInput('');
      }
      
      // 处理忌口食材
      let finalAvoidIngredients = [...searchState.avoidIngredients];
      if (avoidInput.trim()) {
        // 创建新食材标签
        const newTag: IngredientTag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          tag: avoidInput.trim(),
          type: isSeasoningTag(avoidInput.trim()) ? FilterType.SEASONING : FilterType.INGREDIENT
        };
        
        // 更新忌口食材变量
        finalAvoidIngredients = [...finalAvoidIngredients, newTag];
        
        // 添加到状态中
        addAvoidIngredient(newTag);
        
        // 清空输入框
        setAvoidInput('');
      }
      
      // 先直接更新搜索关键词状态
      if (currentSearchKeyword !== searchQuery) {
        setSearchQuery(currentSearchKeyword);
      }
      
      // 获取当前最新的筛选状态 - 使用我们刚刚更新的食材列表
      const currentFilters = {
        searchQuery: currentSearchKeyword,
        requiredIngredients: finalRequiredIngredients,
        optionalIngredients: finalOptionalIngredients,
        avoidIngredients: finalAvoidIngredients,  // 添加忌口食材到筛选条件
        cuisines: searchState.cuisines || [],
        flavors: searchState.flavors || [],
        difficulties: searchState.difficulties || [],
        dietaryRestrictions: searchState.dietaryRestrictions || []
      };
      
      // 创建自定义事件，触发搜索
      const searchEvent = new CustomEvent('execute-search', {
        detail: {
          filters: currentFilters
        }
      });
      
      // 派发事件，确保能及时获取到完整的搜索条件
      window.dispatchEvent(searchEvent);
      
      // 备用方案：直接尝试调用控制器的executeSearch
      if (controller && controller.executeSearch) {
        controller.executeSearch({
          // 传递一个符合 SearchParams 类型的对象，而不是直接传字符串
          page: 1, // 默认从第一页开始
          limit: 50 // 使用默认的每页数量
        });
      }
      
    } catch (error) {
      console.error("搜索协调器: 执行搜索时出错", error);
    }
  };

  // 处理搜索按键 - 确保只在用户按Enter键时触发搜索
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  // 快速搜索功能 - 只设置搜索词，不自动执行搜索
  const handleQuickSearch = (term: string) => {
    setSearchInput(term);
    setSearchQuery(term);
    // 不再自动执行搜索，等待用户点击搜索按钮
  };
  
  // 切换展开/折叠筛选部分
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 用于追踪当前活跃请求的ID
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  // 替换fetchIngredientSuggestions函数的实现
  const { createDebouncedRequest, cancelRequest } = useCancellableRequests();

  // 添加和管理本地loading状态
  const [isSearching, setIsSearching] = useState(false);

  // 获取食材和调料建议的通用函数
  const fetchIngredientSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.length < 1) return [];
    
    setIsSearching(true); // 开始搜索
    
    try {
      const requestId = `ingredients-search-${query.trim().toLowerCase()}`;
      
      const results = await createDebouncedRequest(
        requestId,
        async (signal) => {
          try {
            return await searchIngredientsAndSeasonings(query, requestId, signal);
          } catch (error) {
            // 确保在错误时也会重置loading状态
            throw error; // 继续传播错误
          }
        },
        300
      );
      
      return results.map(item => item.tag);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('获取食材/调料建议出错:', error);
      }
      return [];
    } finally {
      // 确保始终会执行loading状态重置
      setIsSearching(false);
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 取消可能存在的搜索请求
      cancelRequest('ingredients-search');
    };
  }, []);

  // 简单模式只显示搜索框
  if (mode === 'simple') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center w-full mb-4 relative">
          <input
            type="text"
            placeholder={placeholder}
            className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            disabled={disabled}
          />
          {isSearching && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
            </div>
          )}
          {searchInput && (
            <button
              className="absolute right-16 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.preventDefault();
                setSearchInput('');
              }}
              type="button"
              aria-label="清除搜索内容"
            >
              <span className="text-sm">✕</span>
            </button>
          )}
          <button
            className="search-button ml-2"
            onClick={handleSearch}
            disabled={disabled}
          >
            搜索
          </button>
        </div>
      </div>
    );
  }

  // 完整模式显示所有搜索选项
  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-4">
        {/* 更简洁的搜索区域 */}
        <div className="search-container w-full">
          {/* 必选食材/调料搜索框 */}
          <div className="search-row w-full mb-4">
            <div className="flex w-full items-center gap-2">
              <span className="px-2 py-1 bg-indigo-500 text-white rounded-md whitespace-nowrap text-sm">必选</span>
              <BaseIngredientInput
                placeholder="输入必须包含的食材或调料"
                value={requiredInput}
                onChange={setRequiredInput}
                onSelect={handleAddRequiredIngredient}
                onEnter={handleAddRequiredIngredient}
                fetchSuggestions={fetchIngredientSuggestions}
                disabled={disabled}
                className="w-full"
              />
            </div>
          </div>
          
          {/* 可选食材/调料搜索框 */}
          <div className="search-row w-full mb-4">
            <div className="flex w-full items-center gap-2">
              <span className="px-2 py-1 bg-indigo-500 text-white rounded-md whitespace-nowrap text-sm">可选</span>
              <BaseIngredientInput
                placeholder="输入可选包含的食材或调料"
                value={optionalInput}
                onChange={setOptionalInput}
                onSelect={handleAddOptionalIngredient}
                onEnter={handleAddOptionalIngredient}
                fetchSuggestions={fetchIngredientSuggestions}
                disabled={disabled}
                className="w-full"
              />
            </div>
          </div>
          
          {/* 忌口食材/调料搜索框 */}
          <div className="search-row w-full mb-4">
            <div className="flex w-full items-center gap-2">
              <span className="px-2 py-1 bg-red-500 text-white rounded-md whitespace-nowrap text-sm">忌口</span>
              <BaseIngredientInput
                placeholder="输入需要排除的食材或调料"
                value={avoidInput}
                onChange={setAvoidInput}
                onSelect={handleAddAvoidIngredient}
                onEnter={handleAddAvoidIngredient}
                fetchSuggestions={fetchIngredientSuggestions}
                disabled={disabled}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center w-full gap-2 mb-4">
            {filterButton}
            
            {/* 宴会模式切换按钮 */}
            {controller && (
              <BanquetModeButton 
                banquetConfig={{
                  isEnabled: controller.searchState.banquetMode?.isEnabled || false,
                  guestCount: controller.searchState.banquetMode?.guestCount || 8,
                  allocation: controller.searchState.banquetMode?.allocation || null
                }}
                onConfigChange={(config: BanquetConfig) => {
                  console.log('SearchCoordinator: 宴会模式配置变更', config);
                  console.log('SearchCoordinator: 控制器状态', controller.searchState.banquetMode);
                  controller.setBanquetConfig(config);
                  console.log('SearchCoordinator: 配置更新后状态', controller.searchState.banquetMode);
                }}
              />
            )}
            
            <div className="flex items-center gap-2">
              {/* 统一的添加按钮，确保显示为可点击状态且样式一致 */}
              <button 
                className="add-button px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                onClick={() => {
                  if (requiredInput.trim()) {
                    handleAddRequiredIngredient(requiredInput);
                  } else if (optionalInput.trim()) {
                    handleAddOptionalIngredient(optionalInput);
                  } else if (avoidInput.trim()) {
                    handleAddAvoidIngredient(avoidInput);
                  }
                  // 如果三个都为空时不执行任何操作，但保持按钮可点击的外观
                }}
                style={{ cursor: 'pointer' }} // 确保鼠标悬停时显示为可点击状态
              >
                添加
              </button>
              
              <button
                className="search-button px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                onClick={handleSearch}
                disabled={disabled}
              >
                搜索
              </button>
              
              <button
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100"
                onClick={() => {
                  // 调用resetFilters而不是clearAllFilters，确保所有状态正确重置
                  resetFilters();
                  // 清空输入框
                  setRequiredInput('');
                  setOptionalInput('');
                  setAvoidInput('');
                  setSearchInput('');
                }}
                type="button"
              >
                清除筛选
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchCoordinator; 