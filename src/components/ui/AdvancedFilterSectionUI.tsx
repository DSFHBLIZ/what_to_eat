import React, { useState } from 'react';
import ButtonUI from './ButtonUI';
import { usePreferenceTheme } from '../../theme/themeStore';
import { useResponsive } from '../../hooks/useResponsive';
import LayoutWrapper from './LayoutWrapper';
import TagWrapper from './TagWrapper';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FilterItem {
  id: string;
  label: string;
}

interface AdvancedFilterSectionUIProps {
  title: string;
  items: FilterItem[];
  selectedItems: string[];
  onItemToggle: (id: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  className?: string;
  onTitleClick?: () => void;
  showCollapseIcon?: boolean;
  isCollapsed?: boolean;
  variant?: 'default' | 'card' | 'outline';
  tagComponent?: (item: FilterItem, isSelected: boolean) => React.ReactNode;
  darkMode?: boolean;
}

const AdvancedFilterSectionUI: React.FC<AdvancedFilterSectionUIProps> = ({
  title,
  items,
  selectedItems,
  onItemToggle,
  onSelectAll,
  onClearAll,
  className = '',
  onTitleClick,
  showCollapseIcon = false,
  isCollapsed = false,
  variant = 'default',
  tagComponent,
  darkMode
}) => {
  const { isDarkMode } = usePreferenceTheme();
  const { isMobile } = useResponsive();
  const [localCollapsed, setLocalCollapsed] = useState(isCollapsed);
  
  // 确定当前是否为深色模式
  const isCurrentDarkMode = darkMode !== undefined ? darkMode : isDarkMode;
  
  const hasSelected = selectedItems.length > 0;
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  // 确定布局包装器的变体类型
  const getLayoutVariant = () => {
    switch (variant) {
      case 'card':
        return 'card';
      case 'outline':
        return 'container';
      default:
        return 'section';
    }
  };

  // 处理折叠/展开逻辑
  const handleToggle = () => {
    if (onTitleClick) {
      onTitleClick();
    } else {
      setLocalCollapsed(!localCollapsed);
    }
  };
  
  // 获取当前折叠状态
  const currentCollapsed = onTitleClick ? isCollapsed : localCollapsed;

  return (
    <div className={`mb-4 ${className}`}>
      <div 
        className={`flex justify-between items-center mb-3 ${onTitleClick || showCollapseIcon ? 'cursor-pointer group' : ''}`}
        onClick={showCollapseIcon ? handleToggle : undefined}
      >
        <h3 
          className={`text-lg font-medium ${isCurrentDarkMode ? 'text-gray-200' : 'text-gray-800'} 
            ${onTitleClick || showCollapseIcon ? 'hover:text-gray-600 group-hover:text-gray-500' : ''} 
            flex items-center transition-colors duration-150 ease-in-out`}
          onClick={showCollapseIcon ? undefined : onTitleClick}
        >
          {title}
          {showCollapseIcon && (
            <span className={`ml-2 transition-transform duration-200 ease-in-out ${!currentCollapsed ? 'rotate-180' : ''}`}>
              {currentCollapsed ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronUp className="w-4 h-4" />
              }
            </span>
          )}
        </h3>
        {(onSelectAll || onClearAll) && (
          <div className="flex space-x-2">
            {onSelectAll && !allSelected && (
              <ButtonUI
                size="sm"
                onClick={onSelectAll}
                variant="info"
                color="blue"
                className="text-xs py-1 px-2"
              >
                全选
              </ButtonUI>
            )}
            {onClearAll && hasSelected && (
              <ButtonUI
                size="sm"
                onClick={onClearAll}
                variant="info"
                color="blue"
                className="text-xs py-1 px-2"
              >
                清除
              </ButtonUI>
            )}
          </div>
        )}
      </div>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          currentCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
        }`}
      >
        <LayoutWrapper
          variant={getLayoutVariant()}
          padding={variant !== 'default' ? 'md' : 'none'}
          radius={variant !== 'default' ? 'md' : 'none'}
          darkMode={isCurrentDarkMode}
          className="flex flex-wrap gap-2"
        >
          {items.map(item => (
            tagComponent ? (
              <React.Fragment key={item.id}>
                {tagComponent(item, selectedItems.includes(item.id))}
              </React.Fragment>
            ) : (
              <TagWrapper
                key={item.id}
                label={item.label}
                type={selectedItems.includes(item.id) ? 'filter-selected' : 'filter'}
                color="blue"
                onClick={() => onItemToggle(item.id)}
                rounded={true}
                size="md"
                isClickable={true}
              />
            )
          ))}
          {items.length === 0 && (
            <span className={`text-sm ${isCurrentDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>暂无选项</span>
          )}
        </LayoutWrapper>
      </div>
    </div>
  );
};

AdvancedFilterSectionUI.displayName = 'AdvancedFilterSectionUI';

export default AdvancedFilterSectionUI; 