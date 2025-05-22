/**
 * 主题存储
 * 管理应用主题状态
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createContext, useContext, ReactNode, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import { devtools } from 'zustand/middleware';
import { 
  ThemeName,
  getThemeTokens
} from '../styles/theme';
import { 
  SemanticTokens,
  lightSemanticTokens,
  darkSemanticTokens
} from '../design-tokens/semantic';
import type { ThemePreference, FontSize } from '../types/userPreferences';

/**
 * ThemeName为内部主题类型（'light'|'dark'|'system'）
 * ThemePreference为用户首选项类型（'light'|'dark'|'system'）
 * 
 * 区别在于：
 * - ThemeName主要用于内部计算和样式应用
 * - ThemePreference用于用户设置和首选项保存
 * 
 * 在当前实现中，两者值域相同，但概念上分开以支持可能的扩展
 */

// 主题状态接口
interface ThemeState {
  // 基础主题状态
  preference: ThemePreference; // 用户选择的主题首选项
  systemTheme: ThemeName;      // 系统检测到的主题
  settings: Record<ThemeName, SemanticTokens>;
  detectSystemTheme: () => void;
  getEffectiveTheme: () => ThemeName; // 获取实际生效的主题
  getThemeSettings: () => SemanticTokens;
  
  // 首选项相关
  fontSize: FontSize;
  enableAnimations: boolean;
  highContrast: boolean;
  setThemePreference: (theme: ThemePreference) => void;
  setFontSize: (size: FontSize) => void;
  setEnableAnimations: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

// 创建主题状态存储
export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        // 基础主题状态
        preference: 'system',   // 默认跟随系统
        systemTheme: 'light',   // 默认亮色主题
        settings: {
          light: lightSemanticTokens,
          dark: darkSemanticTokens,
          system: lightSemanticTokens, // 系统主题默认为light，但会动态调整
        },
        detectSystemTheme: () => {
          if (typeof window !== 'undefined') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            set({ systemTheme: isDark ? 'dark' : 'light' });
          }
        },
        getEffectiveTheme: () => {
          const { preference, systemTheme } = get();
          return preference === 'system' ? systemTheme : preference;
        },
        getThemeSettings: () => {
          const effectiveTheme = get().getEffectiveTheme();
          return getThemeTokens(effectiveTheme);
        },
        
        // 首选项相关状态与方法
        fontSize: 'medium',
        enableAnimations: true,
        highContrast: false,
        
        // 设置主题首选项
        setThemePreference: (theme) => {
          set({ preference: theme });
        },
        
        setFontSize: (size) => {
          set({ fontSize: size });
          
          // 应用字体大小到文档
          if (typeof document !== 'undefined') {
            const fontSize = size === 'small' ? '0.875rem' : 
                           size === 'large' ? '1.125rem' : 
                           '1rem';
            document.documentElement.style.fontSize = fontSize;
          }
        },
        
        setEnableAnimations: (enabled) => {
          set({ enableAnimations: enabled });
          
          // 应用动画设置到文档
          if (typeof document !== 'undefined') {
            if (!enabled) {
              document.body.classList.add('no-animations');
            } else {
              document.body.classList.remove('no-animations');
            }
          }
        },
        
        setHighContrast: (enabled) => {
          set({ highContrast: enabled });
          
          // 应用高对比度设置到文档
          if (typeof document !== 'undefined') {
            if (enabled) {
              document.body.classList.add('high-contrast');
            } else {
              document.body.classList.remove('high-contrast');
            }
          }
        }
      }),
      {
        name: 'theme-storage',
      }
    )
  )
);

/**
 * 初始化主题系统
 * 用于app启动时调用
 */
export function initTheme() {
  // 检测系统主题
  useThemeStore.getState().detectSystemTheme();
  
  // 应用初始字体大小
  const { fontSize } = useThemeStore.getState();
  if (typeof document !== 'undefined') {
    const fontSizeValue = fontSize === 'small' ? '0.875rem' : 
                         fontSize === 'large' ? '1.125rem' : 
                         '1rem';
    document.documentElement.style.fontSize = fontSizeValue;
  }
  
  // 应用初始动画设置
  const { enableAnimations } = useThemeStore.getState();
  if (typeof document !== 'undefined') {
    if (!enableAnimations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }
  
  // 应用初始高对比度设置
  const { highContrast } = useThemeStore.getState();
  if (typeof document !== 'undefined') {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }
  
  // 返回清理函数
  return () => {
    // 这里可以添加主题相关的清理逻辑
  };
}

// 设置监听系统主题变化（只在客户端执行一次）
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', () => {
    const themeStore = useThemeStore.getState();
    themeStore.detectSystemTheme();
  });
  
  // 初始化时检测系统主题
  useThemeStore.getState().detectSystemTheme();
}

// 主题首选项上下文类型
interface PreferenceThemeContextType {
  preference: ThemePreference; // 用户选择的主题首选项
  systemTheme: ThemeName;     // 系统检测到的主题
  effectiveTheme: ThemeName;  // 当前实际应用的主题
  themeSettings: SemanticTokens;
  isDarkMode: boolean;
  isLightMode: boolean;
  
  // 添加首选项相关字段
  fontSize: FontSize;
  enableAnimations: boolean;
  highContrast: boolean;
  
  // 添加首选项修改方法
  setThemePreference: (theme: ThemePreference) => void;
  setFontSize: (size: FontSize) => void;
  setEnableAnimations: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

export const PreferenceThemeContext = createContext<PreferenceThemeContextType | undefined>(undefined);

// 主题首选项提供器组件
interface PreferenceThemeProviderProps {
  children: ReactNode;
}

export function PreferenceThemeProvider({ children }: PreferenceThemeProviderProps) {
  const { 
    preference, 
    systemTheme, 
    fontSize,
    enableAnimations,
    highContrast,
    setThemePreference,
    setFontSize,
    setEnableAnimations,
    setHighContrast
  } = useThemeStore();
  
  // 使用 useRef 来避免重复计算
  const initialRender = useRef(true);
  
  // 在组件初始渲染时计算一次
  const [initialEffectiveTheme, initialThemeSettings] = useMemo(() => {
    const effectiveTheme = useThemeStore.getState().getEffectiveTheme();
    const themeSettings = getThemeTokens(effectiveTheme);
    return [effectiveTheme, themeSettings];
  }, []);
  
  // 使用状态跟踪当前主题
  const effectiveTheme = useMemo(() => {
    return preference === 'system' ? systemTheme : preference;
  }, [preference, systemTheme]);
  
  const themeSettings = useMemo(() => {
    return getThemeTokens(effectiveTheme);
  }, [effectiveTheme]);
  
  // 计算暗色/亮色模式
  const isDarkMode = useMemo(() => effectiveTheme === 'dark', [effectiveTheme]);
  const isLightMode = useMemo(() => !isDarkMode, [isDarkMode]);
  
  // 当主题改变时应用到DOM
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // 避免与服务器端渲染的初始值不匹配
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    
    const { color } = themeSettings;
    const root = document.documentElement;
    
    // 应用CSS变量
    root.style.setProperty('--color-primary', color.brand.primary);
    root.style.setProperty('--color-background', color.background.page);
    root.style.setProperty('--color-text', color.text.primary);
    root.style.setProperty('--color-surface', color.surface.primary);
    root.style.setProperty('--color-accent', color.brand.accent);
    root.style.setProperty('--color-border', color.border.light);
    
    // 设置主题属性
    root.setAttribute('data-preference-theme', effectiveTheme);
    
    // 更新body类
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [effectiveTheme, themeSettings, isDarkMode]);
  
  // 创建上下文值，使用useMemo优化渲染
  const value = useMemo(() => ({
    preference,
    systemTheme,
    effectiveTheme,
    themeSettings,
    isDarkMode,
    isLightMode,
    fontSize,
    enableAnimations,
    highContrast,
    setThemePreference,
    setFontSize,
    setEnableAnimations,
    setHighContrast
  }), [
    preference, 
    systemTheme, 
    effectiveTheme, 
    themeSettings, 
    isDarkMode,
    isLightMode,
    fontSize,
    enableAnimations,
    highContrast
  ]);
  
  return React.createElement(PreferenceThemeContext.Provider, { value }, children);
}

// 自定义钩子，用于获取和使用主题首选项
export function usePreferenceTheme() {
  const context = useContext(PreferenceThemeContext);
  if (context === undefined) {
    throw new Error('usePreferenceTheme必须在PreferenceThemeProvider内部使用');
  }
  return context;
}

// 主题首选项预加载组件 - 用于防止主题闪烁
export function PreferenceThemePreloader() {
  const effectiveTheme = useThemeStore(state => state.getEffectiveTheme());
  return React.createElement('div', { 
    'data-preference-theme': effectiveTheme,
    style: { display: 'none' }
  });
} 