import { useState, useEffect, useCallback } from 'react';
import { useUnifiedSearchController } from '../controllers/useUnifiedSearchController';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface ListConfiguration<T> {
  // 初始设置
  initialItems?: T[];
  initialPage?: number;
  initialPageSize?: number;
  
  // 数据加载和处理函数
  fetchItems?: () => Promise<T[]> | T[];
  filterFunction?: (items: T[], filters: any) => T[];
  
  // 筛选相关
  shouldApplyFilters?: boolean;
  filterDependencies?: any[];
  autoExecuteSearch?: boolean; // 这个参数现在将被忽略，始终为false
  
  // 钩子回调
  onLoadStart?: () => void;
  onLoadSuccess?: (items: T[]) => void;
  onLoadError?: (error: Error) => void;
  onFilterApplied?: (filteredItems: T[]) => void;
}

/**
 * 通用分页列表管理Hook
 * 处理数据加载、分页、过滤等通用逻辑
 * 注意：按照PRD要求，筛选器改变不会自动执行搜索，需要用户点击搜索按钮
 */
export function usePaginatedListManager<T>(config: ListConfiguration<T>) {
  // 解构配置
  const {
    initialItems = [],
    initialPage = 1,
    initialPageSize = 10,
    fetchItems,
    filterFunction,
    shouldApplyFilters = true,
    filterDependencies = [],
    // autoExecuteSearch参数现在被忽略，搜索始终为手动执行
    onLoadStart,
    onLoadSuccess,
    onLoadError,
    onFilterApplied
  } = config;

  // 状态管理
  const [allItems, setAllItems] = useState<T[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<T[]>(initialItems);
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(initialItems.length === 0);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [filterApplied, setFilterApplied] = useState<boolean>(false);

  // 分页状态
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalItems: initialItems.length,
    totalPages: Math.ceil(initialItems.length / initialPageSize)
  });

  // 获取过滤上下文
  const { searchState, executeSearch } = useUnifiedSearchController();

  // 加载数据
  const loadItems = useCallback(async () => {
    if (!fetchItems) return;
    
    setLoading(true);
    setError(null);
    
    if (onLoadStart) onLoadStart();
    
    try {
      const items = await fetchItems();
      setAllItems(items);
      
      if (onLoadSuccess) onLoadSuccess(items);
      
      // 更新总项目数和总页数
      setPagination(prev => ({
        ...prev,
        totalItems: items.length,
        totalPages: Math.ceil(items.length / prev.pageSize)
      }));
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载数据失败');
      setError(error);
      if (onLoadError) onLoadError(error);
    } finally {
      // 稍微延迟以避免UI闪烁
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  }, [fetchItems, onLoadStart, onLoadSuccess, onLoadError]);

  // 重试加载
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  // 初始加载数据
  useEffect(() => {
    if (fetchItems && allItems.length === 0) {
      loadItems();
    }
  }, [fetchItems, allItems.length, loadItems, retryCount]);

  // 应用过滤器 - 现在只在初始加载时执行一次，不再响应筛选条件变化
  // 而是需要通过executeSearch触发
  useEffect(() => {
    if (!shouldApplyFilters) return;
    
    // 只在初始加载时执行一次过滤
    if (filterApplied && filterDependencies.length > 0) {
      return;
    }

    let result = allItems;
    
    // 如果提供了过滤函数，则应用过滤
    if (filterFunction) {
      try {
        result = filterFunction(allItems, searchState);
        
        if (onFilterApplied) onFilterApplied(result);
      } catch (err) {
        console.error('应用过滤器时出错:', err);
        // 出错时仍然使用所有项目
      }
    }
    
    setFilteredItems(result);
    setFilterApplied(true);
    
    // 更新分页信息
    setPagination(prev => ({
      ...prev,
      totalItems: result.length,
      totalPages: Math.ceil(result.length / prev.pageSize),
      // 如果当前页超出新的总页数，则重置为第一页
      currentPage: prev.currentPage > Math.ceil(result.length / prev.pageSize) 
        ? 1 
        : prev.currentPage
    }));
  }, [allItems]); // 只依赖allItems，不再依赖searchState或filterDependencies

  // 手动应用过滤器的函数
  const applyFilters = useCallback(() => {
    if (!shouldApplyFilters || !filterFunction) return;
    
    let result = allItems;
    
    try {
      result = filterFunction(allItems, searchState);
      
      if (onFilterApplied) onFilterApplied(result);
    } catch (err) {
      console.error('应用过滤器时出错:', err);
      // 出错时仍然使用所有项目
    }
    
    setFilteredItems(result);
    
    // 更新分页信息
    setPagination(prev => ({
      ...prev,
      totalItems: result.length,
      totalPages: Math.ceil(result.length / prev.pageSize),
      // 如果当前页超出新的总页数，则重置为第一页
      currentPage: prev.currentPage > Math.ceil(result.length / prev.pageSize) 
        ? 1 
        : prev.currentPage
    }));
  }, [allItems, searchState, filterFunction, shouldApplyFilters, onFilterApplied]);

  /**
   * 监听搜索执行事件
   * 
   * 重要说明：
   * 1. 搜索只在用户点击搜索按钮时触发，不会自动执行
   * 2. 使用全局事件'execute-search'来协调搜索行为，确保统一的用户体验
   * 3. 筛选条件变更不会触发搜索，直到用户明确要求搜索
   */
  useEffect(() => {
    // 设置监听事件
    const handleSearch = () => {
      applyFilters();
    };
    
    // 使用事件总线监听搜索执行
    window.addEventListener('execute-search', handleSearch);
    
    return () => {
      window.removeEventListener('execute-search', handleSearch);
    };
  }, [applyFilters]);

  // 计算当前页显示的项目
  useEffect(() => {
    const { currentPage, pageSize } = pagination;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    setDisplayedItems(filteredItems.slice(startIndex, endIndex));
  }, [filteredItems, pagination]);

  // 更改页码
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  }, [pagination.totalPages]);

  // 更改每页数量
  const setPageSize = useCallback((size: number) => {
    if (size < 1) return;
    
    setPagination(prev => {
      const newTotalPages = Math.ceil(prev.totalItems / size);
      const newCurrentPage = prev.currentPage > newTotalPages ? newTotalPages : prev.currentPage;
      
      return {
        ...prev,
        pageSize: size,
        totalPages: newTotalPages,
        currentPage: newCurrentPage || 1 // 确保至少是第1页
      };
    });
  }, []);

  // 页面导航函数
  const nextPage = useCallback(() => goToPage(pagination.currentPage + 1), [goToPage, pagination.currentPage]);
  const prevPage = useCallback(() => goToPage(pagination.currentPage - 1), [goToPage, pagination.currentPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(pagination.totalPages), [goToPage, pagination.totalPages]);

  return {
    // 数据状态
    allItems,
    filteredItems,
    displayedItems,
    loading,
    error,
    isEmpty: filteredItems.length === 0,
    
    // 分页状态和操作
    pagination,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    
    // 其他功能
    handleRetry,
    reload: loadItems,
    applyFilters // 导出手动应用过滤器的函数
  };
} 