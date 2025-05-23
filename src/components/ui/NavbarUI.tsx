import React from 'react';
import { usePreferenceTheme } from '../../theme/themeStore';
import { useResponsive } from '../../hooks/useResponsive';
import LayoutWrapper from './LayoutWrapper';
import Link from 'next/link';

interface NavbarUIProps {
  className?: string;
  isMenuOpen: boolean;
  navItems: { name: string; href: string }[];
  toggleMenu: () => void;
  handleNavClick: (destination: string) => void;
  rightElement?: React.ReactNode;
  logoContent?: React.ReactNode;
}

const NavbarUI = ({ 
  className = '',
  isMenuOpen,
  navItems,
  toggleMenu,
  handleNavClick,
  rightElement,
  logoContent
}: NavbarUIProps) => {
  // 使用通用的主题和响应式钩子
  const { isDarkMode } = usePreferenceTheme();
  const { isMobile } = useResponsive();

  return (
    <div className={`sticky top-0 left-0 right-0 w-full bg-white dark:bg-gray-900 shadow-sm z-50 ${className}`}>
      <LayoutWrapper
        variant="section"
        className="relative"
        darkMode={isDarkMode}
      >
        <div className="container">
          <div className="flex justify-between h-16 items-center">
            {/* Logo 链接 */}
            <div className="flex items-center">
              <Link
                href="/"
                className="text-3xl font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {logoContent ? (
                  logoContent
                ) : (
                  <span className="text-indigo-600 text-3xl">冰箱里有什么？</span>
                )}
              </Link>
            </div>
            
            {/* 桌面端导航链接 */}
            <div className="hidden sm:flex sm:items-center sm:space-x-8">
              {navItems.map((item) => (
                <a 
                  key={item.name}
                  href={item.href} 
                  className="text-gray-600 hover:text-indigo-600"
                  onClick={() => handleNavClick(item.name)}
                  style={{ position: 'relative', pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  {item.name}
                </a>
              ))}
              
              {/* 右侧元素 */}
              {rightElement && (
                <div className="ml-4">{rightElement}</div>
              )}
            </div>
            
            {/* 移动端菜单按钮和主题切换按钮 */}
            <div className="flex items-center sm:hidden">
              {/* 右侧元素（移动端也显示） */}
              {rightElement && (
                <div className="mr-2">{rightElement}</div>
              )}
              
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700"
                aria-expanded="false"
                onClick={toggleMenu}
              >
                <span className="sr-only">打开主菜单</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* 移动端菜单 */}
        {isMobile && (
          <div className={`${isMenuOpen ? 'block' : 'hidden'}`}>
            <div className="pt-2 pb-3 space-y-1 border-t border-gray-100">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-5 py-3 text-gray-600 hover:bg-background-secondary"
                  onClick={() => {
                    handleNavClick(item.name);
                    toggleMenu();
                  }}
                  style={{ position: 'relative', pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </LayoutWrapper>
    </div>
  );
};

export default NavbarUI; 