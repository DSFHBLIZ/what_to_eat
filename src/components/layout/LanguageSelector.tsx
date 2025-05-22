'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/AppProvider';
import { useClickOutside } from '../../hooks/useClickOutside';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  iconSize?: number;
}

export default function LanguageSelector({
  className = '',
  showLabel = true,
  iconSize = 18,
}: LanguageSelectorProps) {
  const { supportedLanguages, language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 点击外部关闭下拉菜单
  useClickOutside(dropdownRef, () => setIsOpen(false));
  
  // 切换下拉菜单
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // 切换语言
  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };
  
  // 获取当前语言名称
  const getCurrentLanguageName = () => {
    return supportedLanguages[language as keyof typeof supportedLanguages] || supportedLanguages['zh-CN'];
  };
  
  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent, languageCode: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLanguageChange(languageCode);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  
  // 点击其他元素时关闭下拉菜单
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleGlobalClick);
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);
  
  return (
    <div 
      ref={dropdownRef} 
      className={`relative ${className}`}
    >
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center justify-center space-x-1 py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="语言设置"
      >
        <Globe size={iconSize} />
        {showLabel && (
          <>
            <span className="ml-1">{getCurrentLanguageName()}</span>
            <ChevronDown size={16} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 z-50">
          <ul 
            className="py-1" 
            role="listbox" 
            aria-label="语言选择"
          >
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <li 
                key={code}
                role="option"
                aria-selected={code === language}
                tabIndex={0}
                className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  code === language ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : ''
                }`}
                onClick={() => handleLanguageChange(code)}
                onKeyDown={(e) => handleKeyDown(e, code)}
              >
                <span>{name}</span>
                {code === language && <Check size={16} className="text-indigo-600 dark:text-indigo-300" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 