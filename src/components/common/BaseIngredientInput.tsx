'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCancellableRequests } from '../../utils/state/stateSynchronizer';

export interface BaseIngredientInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddIngredient?: (ingredient: string, isOptional?: boolean) => void;
  onSelect?: (ingredient: string) => void;
  onEnter?: (ingredient: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  fetchSuggestions?: (query: string) => Promise<string[]> | string[];
  minQueryLength?: number;
  onClear?: () => void;
  debounceTime?: number; // 添加防抖延迟时间参数
}

export default function BaseIngredientInput({
  value,
  onChange,
  onAddIngredient,
  onSelect,
  onEnter,
  placeholder = '输入食材名称...',
  label,
  className = '',
  disabled = false,
  fetchSuggestions,
  minQueryLength = 1,
  onClear,
  debounceTime = 300 // 默认300ms延迟
}: BaseIngredientInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [lastQuery, setLastQuery] = useState<string>(''); // 跟踪上一次查询
  const [currentRequestId, setCurrentRequestId] = useState<number>(0); // 添加请求ID跟踪
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { createDebouncedRequest } = useCancellableRequests();

  // 外部点击关闭建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理输入变化，使用防抖版本的fetch
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // 不自动触发搜索，只更新输入值
    // 完全禁用自动搜索逻辑，搜索只在用户明确操作时触发
    
    // 当输入为空时，清除suggestions和loading状态
    if (!inputValue || inputValue.length < minQueryLength) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
    }
    
    // 不再调用fetchSuggestionManually，让用户手动触发搜索
  };

  // 添加函数：只有在明确请求搜索建议时才执行
  const fetchSuggestionManually = () => {
    const inputValue = value;
    if (inputValue.length >= minQueryLength && fetchSuggestions) {
      setLoading(true); // 开始加载
      
      const reqId = `ingredient-input-${inputValue.trim().toLowerCase()}`;
      
      createDebouncedRequest(
        reqId,
        async (signal) => {
          try {
            // 增加重试逻辑，确保能获取到建议结果
            let retryCount = 0;
            const maxRetries = 2;
            let result: string[] = [];
            
            while (retryCount <= maxRetries) {
              try {
                const suggestions = await fetchSuggestions(inputValue);
                if (suggestions && suggestions.length > 0) {
                  result = suggestions;
                  break; // 成功获取结果
                }
                
                // 如果没有结果，但还未达到最大重试次数，继续重试
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 300));
                  retryCount++;
                  console.log(`重试获取"${inputValue}"的建议 (${retryCount}/${maxRetries})`);
                } else {
                  break; // 达到最大重试次数
                }
              } catch (retryError) {
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 300));
                  retryCount++;
                  console.log(`重试获取"${inputValue}"的建议 (${retryCount}/${maxRetries})`);
                } else {
                  throw retryError; // 重试失败，抛出错误
                }
              }
            }
            
            // 即使当前值已改变也要重置loading状态
            setLoading(false);
            
            // 仅当输入值未改变时更新建议列表
            if (inputValue === value) {
              // 显示结果（如果是空结果也显示"无匹配结果"）
              setSuggestions(result);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }
            return result;
          } catch (error) {
            // 确保所有错误情况都重置loading状态
            setLoading(false);
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error('获取建议出错:', error);
            }
            throw error; // 继续传播错误
          }
        },
        300 // 300ms防抖
      ).catch(() => {
        // 额外的保障措施，确保loading状态被重置
        setLoading(false);
      });
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false); // 确保非搜索情况下也重置loading
    }
  };

  const handleSuggestionClick = (s: string) => {
    if (onSelect) onSelect(s);
    else if (onAddIngredient) onAddIngredient(s);
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // 如果下拉框未打开，先打开
        if (!isOpen && value.length >= minQueryLength) {
          fetchSuggestionManually();
        } else {
          setHighlightedIndex(prev => (prev + 1) % suggestions.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        // 如果下拉框未打开，先打开
        if (!isOpen && value.length >= minQueryLength) {
          fetchSuggestionManually();
        } else {
          setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else if (value.trim()) {
          if (onEnter) {
            onEnter(value.trim());
            onChange('');
          } else if (onAddIngredient) {
            onAddIngredient(value.trim());
            onChange('');
          }
        } else if (value.length >= minQueryLength && !isOpen) {
          // 当按Enter且输入框有足够的内容但下拉框未打开时，打开下拉框
          fetchSuggestionManually();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // 添加组件卸载前的清理函数
  useEffect(() => {
    return () => {
      // 确保组件卸载时loading状态被重置
      setLoading(false);
    };
  }, []);

  // 对blur事件也添加loading重置
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setLoading(false); // 关闭下拉框时也重置loading
    }, 200);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      <div className="flex items-center relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          onBlur={handleBlur}
          autoComplete="off" // 禁用浏览器自动完成，避免干扰自定义建议
          onFocus={() => {
            // 不自动获取建议，改为等待用户明确操作
            // 只有在键盘导航或点击按钮时才会触发搜索
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
          >
            ×
          </button>
        )}
        {loading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-2 text-center text-gray-500">正在搜索...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-2 text-center text-gray-500">无匹配结果</div>
          ) : (
            suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  i === highlightedIndex ? 'bg-gray-100' : ''
                }`}
              >
                {s}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
