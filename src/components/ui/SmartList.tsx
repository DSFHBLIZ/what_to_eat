import React, { ReactNode } from 'react';
import { MessageCircleX } from 'lucide-react';
import Skeleton from './SkeletonLoader';
import WithSkeleton from './WithSkeleton';

export type ListLayout = 'grid' | 'list' | 'table' | 'custom';

export interface SmartListProps<T> {
  /**
   * 要渲染的数据项数组
   */
  items: T[];
  
  /**
   * 自定义渲染函数，用于渲染每个数据项
   */
  renderItem: (item: T, index: number) => ReactNode;
  
  /**
   * 列表布局类型
   * @default 'list'
   */
  layout?: ListLayout;
  
  /**
   * 是否正在加载中
   * @default false
   */
  loading?: boolean;
  
  /**
   * 布局栅格列数，针对grid布局
   * @default 2
   */
  columns?: number;
  
  /**
   * 骨架屏变体
   * @default 'list'
   */
  skeletonVariant?: 'grid' | 'list' | 'detail' | 'search';
  
  /**
   * 骨架屏数量
   * @default 6
   */
  skeletonCount?: number;
  
  /**
   * 空状态下的标题
   * @default '没有找到数据'
   */
  emptyTitle?: string;
  
  /**
   * 空状态下的消息
   * @default '请尝试调整筛选条件或搜索关键词'
   */
  emptyMessage?: string;
  
  /**
   * 空状态下的图标
   */
  emptyIcon?: ReactNode;
  
  /**
   * 自定义空状态渲染函数
   */
  renderEmpty?: () => ReactNode;
  
  /**
   * 自定义加载状态渲染函数
   */
  renderLoading?: () => ReactNode;
  
  /**
   * 是否显示分页控件
   * @default false
   */
  showPagination?: boolean;
  
  /**
   * 当前页码
   */
  currentPage?: number;
  
  /**
   * 总页数
   */
  totalPages?: number;
  
  /**
   * 页码变化回调
   */
  onPageChange?: (page: number) => void;
  
  /**
   * 自定义CSS类名
   */
  className?: string;
  
  /**
   * 子元素，会渲染在列表之后
   */
  children?: ReactNode;
}

/**
 * 通用智能列表组件
 * 处理加载状态、空状态、列表渲染和分页
 */
function SmartList<T extends { id?: string | number }>({
  // 数据和渲染
  items,
  renderItem,
  
  // 布局配置
  layout = 'list',
  columns = 2,
  
  // 状态
  loading = false,
  
  // 骨架屏配置
  skeletonVariant = 'list',
  skeletonCount = 6,
  
  // 空状态配置
  emptyTitle = '没有找到数据',
  emptyMessage = '请尝试调整筛选条件或搜索关键词',
  emptyIcon = <MessageCircleX className="text-gray-400" size={36} />,
  renderEmpty,
  
  // 加载状态配置
  renderLoading,
  
  // 分页配置
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  
  // 样式配置
  className = '',
  
  // 其他元素
  children,
}: SmartListProps<T>) {
  // 处理空状态
  if (!items || items.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {emptyIcon}
        <h3 className="text-base font-medium text-gray-700 mb-1 mt-4">{emptyTitle}</h3>
        <p className="text-sm text-gray-500 text-center">{emptyMessage}</p>
      </div>
    );
  }
  
  // 根据布局类型渲染列表容器
  const renderListContainer = () => {
    switch (layout) {
      case 'grid':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4 ${className}`}>
            {items.map((item, index) => (
              <div key={item.id ?? index} className="h-full">
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        );
        
      case 'table':
        return (
          <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full divide-y divide-gray-200">
              {items.map((item, index) => (
                renderItem(item, index)
              ))}
            </table>
          </div>
        );
        
      case 'custom':
        return (
          <div className={className}>
            {items.map((item, index) => renderItem(item, index))}
          </div>
        );
        
      case 'list':
      default:
        return (
          <div className={`space-y-4 ${className}`}>
            {items.map((item, index) => (
              <div key={item.id ?? index}>
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        );
    }
  };
  
  // 渲染分页控件
  const renderPagination = () => {
    if (!showPagination) return null;
    
    return (
      <div className="flex justify-center mt-6">
        <div className="flex space-x-1">
          {/* 上一页按钮 */}
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`px-3 py-1 rounded-md ${
              currentPage <= 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            上一页
          </button>
          
          {/* 页码指示器 */}
          <span className="px-3 py-1 bg-gray-100 rounded-md text-gray-700">
            {currentPage} / {totalPages}
          </span>
          
          {/* 下一页按钮 */}
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage >= totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            下一页
          </button>
        </div>
      </div>
    );
  };
  
  // 自定义加载组件
  const customLoading = renderLoading ? renderLoading() : null;
  
  return (
    <WithSkeleton
      loading={loading}
      variant={skeletonVariant}
      count={skeletonCount}
      customSkeleton={customLoading}
    >
      <>
        {renderListContainer()}
        {renderPagination()}
        {children}
      </>
    </WithSkeleton>
  );
}

export default SmartList; 