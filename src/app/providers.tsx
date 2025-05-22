'use client';

import { ReactNode } from 'react';
import { StoreProvider } from '../store/StoreProvider';
import { PreferenceThemeProvider as ThemeProvider } from '../theme/themeStore';
import { useEffect } from 'react';
import { RecipeErrorProvider, LanguageProvider, FavoriteProvider } from '../contexts/AppProvider';
import { UnifiedSearchProvider } from '../contexts/UnifiedSearchProvider';
import { migrateOldFavorites } from '../utils/favorite';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 应用提供者组件
 * 组合所有需要的全局状态提供者
 */
export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // 迁移旧版收藏数据（如果存在）
    if (typeof window !== 'undefined') {
      try {
        console.log('应用初始化: 检查并迁移旧版收藏数据');
        migrateOldFavorites();
      } catch (error) {
        console.error('迁移收藏数据出错:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未处理的Promise拒绝:', event.reason);
      // 可以添加额外的错误处理逻辑
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <StoreProvider>
      <LanguageProvider>
        <ThemeProvider>
          <FavoriteProvider>
            <UnifiedSearchProvider>
              <RecipeErrorProvider>
                {children}
              </RecipeErrorProvider>
            </UnifiedSearchProvider>
          </FavoriteProvider>
        </ThemeProvider>
      </LanguageProvider>
    </StoreProvider>
  );
} 