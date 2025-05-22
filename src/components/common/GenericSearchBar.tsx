import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import ClearButton from './ClearButton';

export interface GenericSearchBarProps {
  /**
   * 当前搜索查询字符串
   */
  query: string;
  
  /**
   * 查询变更回调
   */
  onQueryChange: (query: string) => void;
  
  /**
   * 搜索提交回调
   */
  onSearch?: (query: string) => void;
  
  /**
   * 清除搜索回调
   */
  onClear?: () => void;
  
  /**
   * 重置所有过滤器回调
   */
  onResetAll?: () => void;
  
  /**
   * 占位文本
   */
  placeholder?: string;
  
  /**
   * 是否显示筛选按钮
   */
  showFilterButton?: boolean;
  
  /**
   * 筛选按钮点击回调
   */
  onFilterClick?: () => void;
  
  /**
   * 是否禁用
   */
  disabled?: boolean;
  
  /**
   * 是否自动聚焦
   */
  autoFocus?: boolean;
  
  /**
   * 样式类名
   */
  className?: string;
  
  /**
   * 是否显示搜索状态指示器
   */
  showSearchStatus?: boolean;
  
  /**
   * 当前应用的过滤器数量
   */
  filterCount?: number;
  
  /**
   * 搜索按钮文本
   */
  searchButtonText?: string;
  
  /**
   * 筛选按钮文本
   */
  filterButtonText?: string;
  
  /**
   * 清除提示文本
   */
  clearText?: string;
}

const GenericSearchBar: React.FC<GenericSearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  onClear,
  onResetAll,
  placeholder = '搜索...',
  showFilterButton = false,
  onFilterClick,
  disabled = false,
  autoFocus = false,
  className = '',
  showSearchStatus = false,
  filterCount = 0,
  searchButtonText = '搜索',
  filterButtonText = '筛选',
  clearText = '清除所有筛选'
}) => {
  // 本地状态，用于输入控制
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 同步外部查询变化
  useEffect(() => {
    setInputValue(query);
  }, [query]);
  
  // 自动聚焦
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onQueryChange(e.target.value);
  };
  
  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (onSearch) {
      onSearch(inputValue);
    }
  };
  
  // 清除搜索
  const handleClear = () => {
    setInputValue('');
    onQueryChange('');
    
    if (onClear) {
      onClear();
    }
    
    inputRef.current?.focus();
  };
  
  // 重置所有过滤器和搜索
  const handleResetAll = () => {
    if (onResetAll) {
      onResetAll();
    }
  };

  return (
    <div className={`search-bar ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-stretch w-full">
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full pl-10 pr-10 py-2 border rounded-l-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-300
              ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'}
            `}
            aria-label="搜索"
          />
          <SearchIcon 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          
          {inputValue && (
            <ClearButton
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              label="清除搜索"
            />
          )}
        </div>
        
        <button
          type="submit"
          className={`
            px-4 py-2 bg-indigo-600 text-white rounded-r-lg
            hover:bg-indigo-700 transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={disabled}
        >
          {searchButtonText}
        </button>
        
        {showFilterButton && (
          <button
            type="button"
            onClick={onFilterClick}
            className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            aria-label="筛选选项"
          >
            {filterButtonText}
          </button>
        )}
      </form>
      
      {/* 搜索状态指示器 */}
      {showSearchStatus && (query || filterCount > 0) && (
        <div className="flex items-center justify-between mt-2 text-sm">
          <div className="text-gray-600">
            {query ? (
              <span>搜索：<span className="font-medium">{query}</span></span>
            ) : (
              <span>已应用 {filterCount} 个筛选条件</span>
            )}
          </div>
          
          <ClearButton 
            onClick={handleResetAll}
            showLabel={true}
            label={clearText}
            className="text-red-600 hover:text-red-800"
          />
        </div>
      )}
    </div>
  );
};

export default GenericSearchBar; 