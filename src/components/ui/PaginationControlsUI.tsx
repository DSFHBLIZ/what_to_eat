import React from 'react';
import ButtonUI from './ButtonUI';

interface PaginationControlsUIProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPageNumbers?: boolean;
  maxDisplayedPages?: number;
}

const PaginationControlsUI = React.memo(({
  currentPage,
  totalPages,
  onPageChange,
  size = 'md',
  className = '',
  showPageNumbers = true,
  maxDisplayedPages = 5
}: PaginationControlsUIProps) => {
  // 无需分页时
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 计算需要显示的页码
  const getDisplayedPages = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
    
    // 调整起始页，确保固定显示页数
    if (endPage - startPage + 1 < maxDisplayedPages && startPage > 1) {
      startPage = Math.max(1, endPage - maxDisplayedPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const displayedPages = getDisplayedPages();

  // 按钮尺寸样式映射
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* 上一页按钮 */}
      <ButtonUI
        variant="secondary"
        size={size}
        color="gray"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="上一页"
      >
        上一页
      </ButtonUI>
      
      {/* 页码按钮 */}
      {showPageNumbers && (
        <div className="flex mx-2">
          {/* 第一页按钮 */}
          {displayedPages[0] > 1 && (
            <>
              <ButtonUI
                variant={currentPage === 1 ? 'primary' : 'secondary'}
                size={size}
                color={currentPage === 1 ? 'blue' : 'gray'}
                onClick={() => onPageChange(1)}
                className="mx-0.5"
              >
                1
              </ButtonUI>
              {displayedPages[0] > 2 && (
                <span className={`mx-1 self-center ${sizeClasses[size]} text-gray-500`}>...</span>
              )}
            </>
          )}
          
          {/* 中间页码 */}
          {displayedPages.map(page => (
            <ButtonUI
              key={page}
              variant={currentPage === page ? 'primary' : 'secondary'}
              size={size}
              color={currentPage === page ? 'blue' : 'gray'}
              onClick={() => onPageChange(page)}
              className="mx-0.5"
            >
              {page}
            </ButtonUI>
          ))}
          
          {/* 最后一页按钮 */}
          {displayedPages[displayedPages.length - 1] < totalPages && (
            <>
              {displayedPages[displayedPages.length - 1] < totalPages - 1 && (
                <span className={`mx-1 self-center ${sizeClasses[size]} text-gray-500`}>...</span>
              )}
              <ButtonUI
                variant={currentPage === totalPages ? 'primary' : 'secondary'}
                size={size}
                color={currentPage === totalPages ? 'blue' : 'gray'}
                onClick={() => onPageChange(totalPages)}
                className="mx-0.5"
              >
                {totalPages}
              </ButtonUI>
            </>
          )}
        </div>
      )}
      
      {/* 下一页按钮 */}
      <ButtonUI
        variant="secondary"
        size={size}
        color="gray"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="下一页"
      >
        下一页
      </ButtonUI>
      
      {/* 页码信息 */}
      {!showPageNumbers && (
        <span className={`mx-4 ${sizeClasses[size]} text-gray-700`}>
          第 {currentPage} 页，共 {totalPages} 页
        </span>
      )}
    </div>
  );
});

PaginationControlsUI.displayName = 'PaginationControlsUI';

export default PaginationControlsUI; 