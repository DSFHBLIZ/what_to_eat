/**
 * 国际化状态管理系统
 * 配合LanguageContext使用
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { eventBus } from '../core/eventBus';

// 导入语言资源
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

// 所有支持的语言
export const SUPPORTED_LOCALES = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

// 默认语言
export const DEFAULT_LANGUAGE = 'zh-CN';

// 当前语言选择的本地存储键
export const LANGUAGE_STORAGE_KEY = 'what_to_eat_lang';

// 语言资源
const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
};

// 从本地存储获取当前语言
export const getCurrentLocale = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLang && Object.keys(SUPPORTED_LOCALES).includes(storedLang)) {
        return storedLang;
      }
    }
  } catch (e) {
    console.warn('Failed to access localStorage:', e);
  }
  
  return DEFAULT_LANGUAGE;
};

// 简化的i18n状态存储接口
interface I18nState {
  initialized: boolean;
  currentLanguage: string;
  error: string | null;
}

// 创建i18n状态存储
export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      initialized: false,
      currentLanguage: DEFAULT_LANGUAGE,
      error: null,
    }),
    { name: 'i18n-storage' }
  )
);

/**
 * i18n初始化函数
 */
export const initI18n = async () => {
  const currentState = useI18nStore.getState();
  
  if (currentState.initialized) {
    return true;
  }
  
  try {
    const currentLang = getCurrentLocale();
    
    // 初始化i18next
    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        lng: currentLang,
        fallbackLng: DEFAULT_LANGUAGE,
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
          escapeValue: false,
        },
        detection: {
          order: ['localStorage', 'navigator'],
          lookupLocalStorage: LANGUAGE_STORAGE_KEY,
          caches: ['localStorage'],
        },
      });
    
    // 更新状态
    useI18nStore.setState({
      initialized: true,
      currentLanguage: currentLang,
      error: null,
    });
    
    // 设置文档属性
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLang;
      document.documentElement.dir = isRTL(currentLang) ? 'rtl' : 'ltr';
    }
    
    // 监听语言变更
    i18n.on('languageChanged', (lang) => {
      useI18nStore.setState({ currentLanguage: lang });
      
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
      }
      
      eventBus.emit('language:change', { language: lang });
    });
    
    // 触发初始化完成事件
    eventBus.emit('i18n:initialized', { language: currentLang });
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '初始化国际化系统失败';
    
    useI18nStore.setState({ 
      error: errorMessage,
      initialized: false,
    });
    
    console.error('Failed to initialize i18n:', error);
    return false;
  }
};

/**
 * 变更当前语言
 */
export const changeLocale = async (lang: string): Promise<void> => {
  if (!i18n.isInitialized) {
    throw new Error('i18n not initialized');
  }
  
  if (!Object.keys(SUPPORTED_LOCALES).includes(lang)) {
    throw new Error(`Unsupported language: ${lang}`);
  }
  
  await i18n.changeLanguage(lang);
  
  // 保存到本地存储
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    console.warn('Failed to save language setting:', e);
  }
};

/**
 * 检查是否为RTL语言
 */
export const isRTL = (lang: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.some(l => lang.startsWith(l));
};

export default useI18nStore; 