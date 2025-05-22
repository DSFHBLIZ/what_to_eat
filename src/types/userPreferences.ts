/**
 * 用户偏好设置统一类型定义
 */

// 主题类型
export type ThemePreference = 'light' | 'dark' | 'system';

// 主题模式（实际应用的主题）
export type ThemeMode = 'light' | 'dark';

// 字体大小
export type FontSize = 'small' | 'medium' | 'large';

// 语言代码
export type LanguageCode = string;

// 列表视图类型
export type ViewMode = 'grid' | 'list' | 'compact';

// 颜色方案
export type ColorScheme = 'default' | 'vibrant' | 'muted' | 'classic' | 'custom';

/**
 * 用户偏好设置接口
 * 包含所有用户可配置的偏好设置
 */
export interface UserPreferences {
  // 显示相关
  theme: ThemePreference;
  fontSize: FontSize;
  colorScheme: ColorScheme;
  enableAnimations: boolean;
  highContrast: boolean;
  
  // 内容相关
  language: LanguageCode;
  viewMode: ViewMode;
  
  // 通知相关
  notifications: {
    enabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
    digestFrequency: 'daily' | 'weekly' | 'never';
  };
  
  // 收藏和关注
  favoriteCategories: string[];
  
  // 其他设置
  enableAutoSave: boolean;
  searchHistory: {
    enabled: boolean;
    maxItems: number;
  };
  
  // 自定义设置（扩展使用）
  custom: Record<string, any>;
}

/**
 * 默认用户偏好设置
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  colorScheme: 'default',
  enableAnimations: true,
  highContrast: false,
  
  language: 'zh-CN',
  viewMode: 'grid',
  
  notifications: {
    enabled: true,
    pushEnabled: false,
    emailEnabled: false,
    digestFrequency: 'weekly',
  },
  
  favoriteCategories: [],
  
  enableAutoSave: true,
  searchHistory: {
    enabled: true,
    maxItems: 20,
  },
  
  custom: {},
};

/**
 * 创建局部用户偏好设置
 * @param preferences 用户偏好设置（部分）
 * @returns 合并后的用户偏好设置
 */
export function createUserPreferences(
  preferences: Partial<UserPreferences> = {}
): UserPreferences {
  return {
    ...DEFAULT_USER_PREFERENCES,
    ...preferences,
    // 确保对象属性的合并是深度的
    notifications: {
      ...DEFAULT_USER_PREFERENCES.notifications,
      ...preferences.notifications,
    },
    searchHistory: {
      ...DEFAULT_USER_PREFERENCES.searchHistory,
      ...preferences.searchHistory,
    },
    custom: {
      ...DEFAULT_USER_PREFERENCES.custom,
      ...preferences.custom,
    },
  };
} 