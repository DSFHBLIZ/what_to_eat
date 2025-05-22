import { useCallback } from 'react';
import { useRecipe } from '../contexts/AppProvider';

// 使用正确的 ShareData 类型，而不是自定义接口扩展
// Web Share API 定义: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

/**
 * 封装菜谱相关操作的自定义Hook
 * 提供统一的菜谱操作接口，如收藏、打印、分享等
 */
export function useRecipeActions() {
  const {
    toggleFavorite,
    isFavorite
  } = useRecipe();

  // 收藏菜谱
  const handleFavorite = useCallback((recipeId: string) => {
    toggleFavorite(recipeId);
  }, [toggleFavorite]);

  // 打印菜谱
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // 分享菜谱
  const handleShare = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: document.title,
          url: window.location.href
        }).catch((err: Error) => console.error('分享失败:', err));
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => alert('链接已复制到剪贴板'))
          .catch((err: Error) => console.error('复制失败:', err));
      }
    }
  }, []);

  // 复制菜谱链接
  const handleCopyLink = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('链接已复制到剪贴板'))
        .catch((err: Error) => console.error('复制失败:', err));
    }
  }, []);

  return {
    handleFavorite,
    handlePrint,
    handleShare,
    handleCopyLink,
    isFavorite
  };
} 