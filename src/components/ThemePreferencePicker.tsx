import React, { useState, useRef } from 'react';
import { usePreferenceTheme } from '../theme/themeStore';
import { useClickOutside } from '../hooks/useClickOutside';
import type { ThemePreference } from '../types/userPreferences';

/**
 * 主题选择器组件
 * 允许用户选择浅色、深色或跟随系统的主题首选项
 */
interface ThemePreferencePickerProps {
  className?: string;
}

const ThemePreferencePicker: React.FC<ThemePreferencePickerProps> = ({ className = '' }) => {
  const { preference, setThemePreference, isDarkMode } = usePreferenceTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getPreferenceLabel = (pref: ThemePreference): string => {
    switch (pref) {
      case 'light': return '浅色';
      case 'dark': return '深色';
      case 'system': return '跟随系统';
      default: return pref;
    }
  };

  // 切换下拉菜单的开关状态
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 选择主题首选项
  const selectPreference = (prefValue: ThemePreference) => {
    setThemePreference(prefValue);
    setIsOpen(false);
  };

  // 使用钩子处理点击外部关闭下拉菜单
  useClickOutside(menuRef, () => {
    setIsOpen(false);
  });

  // 动态决定图标颜色
  const iconClassName = `w-5 h-5 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center px-3 py-2 rounded-md text-text-primary hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="mr-2">主题：{getPreferenceLabel(preference)}</span>
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background-paper border border-border divide-y divide-border z-10">
          <div className="py-1">
            <button
              onClick={() => selectPreference('light')}
              className={`flex items-center px-4 py-2 text-sm w-full text-left ${
                preference === 'light' ? 'text-primary font-medium' : 'text-text-primary'
              } hover:bg-background-secondary`}
            >
              <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              浅色
            </button>
            <button
              onClick={() => selectPreference('dark')}
              className={`flex items-center px-4 py-2 text-sm w-full text-left ${
                preference === 'dark' ? 'text-primary font-medium' : 'text-text-primary'
              } hover:bg-background-secondary`}
            >
              <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              深色
            </button>
            <button
              onClick={() => selectPreference('system')}
              className={`flex items-center px-4 py-2 text-sm w-full text-left ${
                preference === 'system' ? 'text-primary font-medium' : 'text-text-primary'
              } hover:bg-background-secondary`}
            >
              <svg className={iconClassName} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              跟随系统
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 导出组件供其他文件使用
export default ThemePreferencePicker; 