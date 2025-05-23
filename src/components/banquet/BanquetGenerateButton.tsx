'use client';

import React from 'react';
import { ChefHat, ExternalLink } from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { BanquetConfig } from '../../types/banquet';

interface BanquetGenerateButtonProps {
  selectedRecipes: Recipe[];
  banquetConfig: BanquetConfig;
  isVisible: boolean;
}

/**
 * 独立的生成宴会菜单按钮组件
 * 任何时候都可以点击，不受条件限制
 */
export default function BanquetGenerateButton({
  selectedRecipes,
  banquetConfig,
  isVisible
}: BanquetGenerateButtonProps) {
  if (!isVisible || !banquetConfig.isEnabled) {
    return null;
  }

  const selectedCount = selectedRecipes.length;
  const targetCount = banquetConfig.allocation?.totalDishes || 10;
  
  const handleGenerateMenu = () => {
    try {
      // 保存状态到sessionStorage
      sessionStorage.setItem('banquet-selected-recipes', JSON.stringify(selectedRecipes));
      sessionStorage.setItem('banquet-config', JSON.stringify(banquetConfig));
      
      // 如果没有选择菜谱，跳转到提示页面
      if (selectedCount === 0) {
        window.open('/banquet-empty', '_blank');
      } else {
        // 在新标签页中打开汇总页面
        window.open('/banquet-summary', '_blank');
      }
    } catch (error) {
      console.error('保存宴会数据失败:', error);
    }
  };

  return null; // 移除独立按钮，将其移动到悬浮规则组件中
} 