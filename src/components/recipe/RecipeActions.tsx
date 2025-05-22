'use client';

import { memo, useState } from 'react';
import { ArrowLeft, Share2, Printer, Heart } from 'lucide-react';
import { Recipe } from '../../types/recipe';

interface RecipeActionsProps {
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
  recipe?: Recipe;
  isFavorite?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
}

/**
 * 菜谱操作按钮组 - 包含返回、分享、打印、收藏功能
 */
const RecipeActions = ({
  onBack,
  showBackButton = true,
  className = '',
  recipe,
  isFavorite = false,
  onToggleFavorite
}: RecipeActionsProps) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

  const shareViaNavigator = async () => {
    if (!recipe || !navigator.share) return;
    
    try {
      await navigator.share({
        title: recipe.name || '美味菜谱',
        text: `查看菜谱：${recipe.name}`,
        url: window.location.href
      });
      setShowShareOptions(false);
    } catch (err) {
      console.error('分享失败:', err);
    }
  };

  const copyLinkToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
      setShowShareOptions(false);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const printRecipe = () => {
    window.print();
  };

  const handleToggleFavorite = () => {
    if (recipe && onToggleFavorite) {
      onToggleFavorite(recipe.id);
    }
  };

  if (!recipe) return null;

  return (
    <div className={className}>
      {showBackButton && (
        <button 
          onClick={handleBack}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center print:hidden"
          aria-label="返回"
        >
          <ArrowLeft size={16} className="mr-1" />
          返回
        </button>
      )}
      
      <div className="flex space-x-2 print:hidden">
        {/* 分享按钮 */}
        <div className="relative">
          <button 
            onClick={toggleShareOptions}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
            aria-label="分享"
            title="分享菜谱"
          >
            <Share2 size={20} />
          </button>
          
          {showShareOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <ul className="py-1">
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <li>
                    <button
                      onClick={shareViaNavigator}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      分享到...
                    </button>
                  </li>
                )}
                <li>
                  <button 
                    onClick={copyLinkToClipboard}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    复制链接
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {/* 打印按钮 */}
        <button 
          onClick={printRecipe}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
          aria-label="打印"
          title="打印菜谱"
        >
          <Printer size={20} />
        </button>
        
        {/* 收藏按钮 */}
        <button 
          onClick={handleToggleFavorite}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
          aria-label={isFavorite ? "取消收藏" : "收藏"}
          title={isFavorite ? "取消收藏" : "收藏菜谱"}
        >
          {isFavorite ? (
            <Heart size={20} className="text-red-500 fill-current" />
          ) : (
            <Heart size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default memo(RecipeActions); 