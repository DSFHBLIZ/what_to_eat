'use client';

import React, { useState } from 'react';
import { trackUserAction } from '../utils/common/analytics';
import { usePathname } from 'next/navigation';
import NavbarUI from './ui/NavbarUI';
import LanguageSelector from './layout/LanguageSelector';
import { useLanguage } from '../contexts/AppProvider';

interface NavbarProps {
  className?: string;
}

const Navbar = ({ className = '' }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language } = useLanguage();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (destination: string) => {
    trackUserAction({
      type: 'other',
      label: `导航到${destination}`,
      value: destination,
    });
  };

  // 根据当前语言选择导航项
  const getNavItems = () => {
    if (language.startsWith('en')) {
      return [
        { name: 'Home', href: '/' },
        { name: 'Random Recipe', href: '/today' },
        { name: 'Recipe List', href: '/recipes' },
        { name: 'Collections', href: '/collections' },
        { name: 'About', href: '/about' },
      ];
    }
    
    return [
      { name: '首页', href: '/' },
      { name: '随机菜谱', href: '/today' },
      { name: '菜谱列表', href: '/recipes' },
      { name: '收藏夹', href: '/collections' },
      { name: '关于', href: '/about' },
    ];
  };

  const navItems = getNavItems();

  return (
    <NavbarUI
      className={className}
      isMenuOpen={isMenuOpen}
      navItems={navItems}
      toggleMenu={toggleMenu}
      handleNavClick={handleNavClick}
      rightElement={<LanguageSelector showLabel={false} />}
    />
  );
};

export default Navbar; 