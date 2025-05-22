import { useState, useCallback, useMemo } from 'react';

interface PaginationOptions {
  // 初始页码
  initialPage?: number;
  // 每页数量
  pageSize?: number;
  // 总数据量
  totalItems?: number;
  // 是否使用无限滚动
  useInfiniteScroll?: boolean;
  // 外部页码变化回调
  onPageChange?: (page: number) => void;
}

interface PaginationResult<T> {
  // 当前页码
  currentPage: number;
  // 总页数
  totalPages: number;
  // 是否还有更多数据
  hasMore: boolean;
  // 设置当前页码
  setPage: (page: number) => void;
  // 下一页
  nextPage: () => void;
  // 上一页
  prevPage: () => void;
  // 跳转到第一页
  firstPage: () => void;
  // 跳转到最后一页
  lastPage: () => void;
  // 加载更多数据
  loadMore: () => void;
  // 是否正在加载
  isLoading: boolean;
  // 设置加载状态
  setIsLoading: (loading: boolean) => void;
  // 获取当前页的数据
  paginatedItems: (items: T[]) => T[];
  // 页码数组
  pageNumbers: number[];
  // 是否显示分页
  showPagination: boolean;
}

/**
 * 通用分页逻辑Hook
 * 处理分页、无限滚动等通用逻辑
 */
export function usePagination<T>({
  initialPage = 1,
  pageSize = 10,
  totalItems = 0,
  useInfiniteScroll = false,
  onPageChange
}: PaginationOptions): PaginationResult<T> {
  // 状态
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);

  // 计算总页数
  const totalPages = useMemo(() => {
    return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
  }, [totalItems, pageSize]);

  // 是否还有更多数据
  const hasMore = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  // 显示分页控件条件
  const showPagination = useMemo(() => {
    return !useInfiniteScroll && totalPages > 1;
  }, [useInfiniteScroll, totalPages]);

  // 生成页码数组
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5; // 最多显示5个页码
    
    if (totalPages <= maxVisiblePages) {
      // 所有页码都显示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
      // 当前页靠近开始
      for (let i = 1; i <= maxVisiblePages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
      // 当前页靠近结束
      for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 当前页在中间
      const start = currentPage - Math.floor(maxVisiblePages / 2);
      for (let i = 0; i < maxVisiblePages; i++) {
        pages.push(start + i);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // 设置页码
  const setPage = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  }, [currentPage, totalPages, onPageChange]);

  // 下一页
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  }, [currentPage, totalPages, setPage]);

  // 上一页
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  }, [currentPage, setPage]);

  // 第一页
  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  // 最后一页
  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages, setPage]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setIsLoading(true);
      // 延迟执行，模拟异步加载
      setTimeout(() => {
        setPage(currentPage + 1);
        setIsLoading(false);
      }, 300);
    }
  }, [hasMore, isLoading, currentPage, setPage]);

  // 获取分页后的数据
  const paginatedItems = useCallback((items: T[]): T[] => {
    if (useInfiniteScroll) {
      // 无限滚动模式，返回所有已加载的数据
      return items.slice(0, currentPage * pageSize);
    } else {
      // 传统分页模式，只返回当前页的数据
      const startIndex = (currentPage - 1) * pageSize;
      return items.slice(startIndex, startIndex + pageSize);
    }
  }, [currentPage, pageSize, useInfiniteScroll]);

  return {
    currentPage,
    totalPages,
    hasMore,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    loadMore,
    isLoading,
    setIsLoading,
    paginatedItems,
    pageNumbers,
    showPagination
  };
} 