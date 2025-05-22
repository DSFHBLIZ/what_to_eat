'use client';

import React from 'react';
import AdvancedFilterSectionUI from './ui/AdvancedFilterSectionUI';
import TagWrapper from './ui/TagWrapper';

/**
 * 筛选区块属性
 */
interface AdvancedFilterSectionProps {
  title: string;
  items: Array<{ id: string; label: string }>;
  selectedItems: string[];
  onItemToggle: (id: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  className?: string;
  mode?: 'simple' | 'full';
  collapsible?: boolean;
  startCollapsed?: boolean;
  variant?: 'default' | 'card' | 'outline';
}

/**
 * 统一筛选区块组件
 * 包含标题、筛选选项标签和全选/清除按钮
 * 支持简单和完整两种模式
 */
const AdvancedFilterSection: React.FC<AdvancedFilterSectionProps> = ({
  title,
  items,
  selectedItems,
  onItemToggle,
  onSelectAll,
  onClearAll,
  className = '',
  mode = 'full',
  collapsible = false,
  startCollapsed = false,
  variant = 'default'
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(startCollapsed);
  const hasSelected = selectedItems.length > 0;
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  // 切换折叠状态
  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // 处理标题点击
  const handleTitleClick = () => {
    if (collapsible) {
      toggleCollapse();
    }
  };

  // 如果已折叠，只显示标题
  if (isCollapsed) {
    return (
      <div className={`mb-6 ${className}`}>
        <h3 
          className="text-lg font-medium text-gray-800 cursor-pointer hover:text-gray-600 flex items-center"
          onClick={handleTitleClick}
        >
          {title}
          <span className="ml-2">▶</span>
        </h3>
      </div>
    );
  }

  return (
    <div className={className}>
      <AdvancedFilterSectionUI
        title={title}
        items={items}
        selectedItems={selectedItems}
        onItemToggle={onItemToggle}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
        onTitleClick={collapsible ? handleTitleClick : undefined}
        showCollapseIcon={collapsible}
        isCollapsed={isCollapsed}
        variant={variant}
        className={mode === 'simple' ? 'filter-simple' : 'filter-full'}
        tagComponent={(item, isSelected) => (
          <TagWrapper
            key={item.id}
            label={item.label}
            type={isSelected ? 'filter-selected' : 'filter'}
            color="purple"
            onClick={() => onItemToggle(item.id)}
            rounded={true}
            size="md"
            isClickable={true}
          />
        )}
      />
    </div>
  );
};

export default AdvancedFilterSection; 