'use client';

import React, { ReactNode, useState, useCallback } from 'react';
import { createContextProvider } from './createContextProvider';
import { useRecipeController } from '../controllers';

// 定义支持的语言
export const SUPPORTED_LOCALES = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

// 创建菜谱上下文
export const { 
  Provider: RecipeProvider, 
  useContext: useRecipe 
} = createContextProvider({
  name: 'Recipe',
  useValue: () => useRecipeController(),
});

// 创建收藏夹上下文
export const {
  Provider: FavoriteProvider,
  useContext: useFavorite
} = createContextProvider({
  name: 'Favorite',
  useValue: () => {
    const { favorites, toggleFavorite, isFavorite } = useRecipeController();
    // 扩展接口以匹配组件期望
    return { 
      favorites, 
      toggleFavorite, 
      isFavorite,
      addToFavorites: (recipe: any) => {
        // 假接口实现
        console.log('添加到收藏', recipe);
        return true;
      },
      removeFromFavorites: (recipeId: string) => {
        // 假接口实现
        console.log('从收藏中移除', recipeId);
        return true;
      } 
    };
  },
});

// 创建语言上下文
export const {
  Provider: LanguageProvider,
  useContext: useLanguage
} = createContextProvider({
  name: 'Language',
  useValue: () => {
    const [language, setLanguage] = React.useState('zh-CN');
    
    return { 
      language, 
      locale: language,  // 兼容旧接口
      setLocale: setLanguage,  // 兼容旧接口
      supportedLanguages: SUPPORTED_LOCALES,
      changeLanguage: (lang: string) => {
        setLanguage(lang);
      }
    };
  },
});

// 创建认证上下文
export const {
  Provider: AuthProvider,
  useContext: useAuth
} = createContextProvider({
  name: 'Auth',
  defaultValue: { 
    isAuthenticated: false, 
    user: null,
    login: async () => false,
    logout: () => {},
    register: async () => false
  },
  useValue: () => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [user, setUser] = React.useState(null);
    
    const login = async () => {
      // 实际登录逻辑...
      setIsAuthenticated(true);
      return true;
    };
    
    const logout = () => {
      setIsAuthenticated(false);
      setUser(null);
    };
    
    const register = async () => {
      // 实际注册逻辑...
      return true;
    };
    
    return { isAuthenticated, user, login, logout, register };
  },
});

// 菜谱错误类型
export interface RecipeError {
  message: string;
  code?: string;
  recipeId?: string;
  details?: any;
  timestamp: number;
}

// 创建菜谱错误上下文
export const {
  Provider: RecipeErrorProvider,
  useContext: useRecipeError
} = createContextProvider({
  name: 'RecipeError',
  useValue: () => {
    const [errors, setErrors] = useState<Record<string, RecipeError>>({});
    const [globalError, setGlobalErrorState] = useState<RecipeError | null>(null);
  
    // 添加菜谱特定错误
    const addError = useCallback((recipeId: string, error: Omit<RecipeError, 'timestamp'>) => {
      setErrors(prev => ({
        ...prev,
        [recipeId]: {
          ...error,
          timestamp: Date.now()
        }
      }));
    }, []);
  
    // 设置全局错误
    const setGlobalError = useCallback((error: Omit<RecipeError, 'timestamp'> | null) => {
      if (error === null) {
        setGlobalErrorState(null);
      } else {
        setGlobalErrorState({
          ...error,
          timestamp: Date.now()
        });
      }
    }, []);
  
    // 清除特定菜谱的错误
    const clearError = useCallback((recipeId: string) => {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[recipeId];
        return newErrors;
      });
    }, []);
  
    // 清除所有错误
    const clearAllErrors = useCallback(() => {
      setErrors({});
      setGlobalErrorState(null);
    }, []);
  
    // 检查菜谱是否有错误
    const hasError = useCallback((recipeId: string): boolean => {
      return !!errors[recipeId];
    }, [errors]);
  
    // 获取菜谱错误
    const getError = useCallback((recipeId: string): RecipeError | null => {
      return errors[recipeId] || null;
    }, [errors]);
  
    return {
      errors,
      globalError,
      addError,
      setGlobalError,
      clearError,
      clearAllErrors,
      hasError,
      getError
    };
  }
});

// 错误辅助方法
export const RecipeErrorHelper = {
  // 创建菜谱未找到错误
  createNotFoundError: (recipeId: string): Omit<RecipeError, 'timestamp'> => ({
    message: '菜谱未找到',
    code: 'RECIPE_NOT_FOUND',
    recipeId,
    details: { id: recipeId }
  }),

  // 创建菜谱加载失败错误
  createLoadError: (recipeId: string, details?: any): Omit<RecipeError, 'timestamp'> => ({
    message: '菜谱加载失败',
    code: 'RECIPE_LOAD_ERROR',
    recipeId,
    details
  }),

  // 创建菜谱验证失败错误
  createValidationError: (recipeId: string, validationErrors: any[]): Omit<RecipeError, 'timestamp'> => ({
    message: '菜谱数据验证失败',
    code: 'RECIPE_VALIDATION_ERROR',
    recipeId,
    details: { validationErrors }
  }),

  // 创建网络错误
  createNetworkError: (message?: string): Omit<RecipeError, 'timestamp'> => ({
    message: message || '网络请求失败',
    code: 'NETWORK_ERROR'
  }),

  // 创建通用错误
  createGenericError: (message: string, code?: string): Omit<RecipeError, 'timestamp'> => ({
    message,
    code: code || 'GENERIC_ERROR'
  })
};

/**
 * 应用程序上下文提供者
 * 整合所有上下文提供者
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RecipeErrorProvider>
          <RecipeProvider>
            <FavoriteProvider>
              {children}
            </FavoriteProvider>
          </RecipeProvider>
        </RecipeErrorProvider>
      </AuthProvider>
    </LanguageProvider>
  );
} 
