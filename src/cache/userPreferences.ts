/**
 * 用户偏好管理模块
 * 处理用户的语言、主题等偏好设置
 */

import { cacheManager } from '../core/cache/cacheManager';

// 缓存键
const PREFERENCES_CACHE_KEY = 'user-preferences';

// 用户偏好接口
export interface UserPreferences {
  // 界面语言
  language: string;
  // 主题
  theme: string;
  // 字体大小
  fontSize: 'small' | 'medium' | 'large';
  // 列表视图偏好
  listView: 'grid' | 'list';
  // 通知设置
  notifications: {
    enabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
  };
  // 自定义设置
  custom: Record<string, any>;
}

// 默认用户偏好
const defaultPreferences: UserPreferences = {
  language: 'zh-CN',
  theme: 'light',
  fontSize: 'medium',
  listView: 'grid',
  notifications: {
    enabled: true,
    pushEnabled: false,
    emailEnabled: true
  },
  custom: {}
};

/**
 * 加载用户偏好设置
 * @returns 用户偏好设置
 */
export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    // 尝试从缓存加载设置或使用默认值
    const cachedPreferences = await cacheManager.getOrSet<UserPreferences>(
      PREFERENCES_CACHE_KEY,
      () => defaultPreferences,
      { ttl: 0 } // 永不过期
    );
    
    // 应用加载的设置
    await applyPreferences(cachedPreferences);
    return cachedPreferences;
  } catch (error) {
    console.error('加载用户偏好失败:', error);
    return defaultPreferences;
  }
}

/**
 * 保存用户偏好设置
 * @param preferences 用户偏好
 */
export async function saveUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
  try {
    // 获取当前设置
    const currentPreferences = await cacheManager.get<UserPreferences>(PREFERENCES_CACHE_KEY) || defaultPreferences;
    
    // 合并新设置
    const newPreferences = {
      ...currentPreferences,
      ...preferences,
      // 特殊处理深层对象
      notifications: {
        ...currentPreferences.notifications,
        ...(preferences.notifications || {})
      },
      custom: {
        ...currentPreferences.custom,
        ...(preferences.custom || {})
      }
    };
    
    // 保存到缓存
    cacheManager.set(PREFERENCES_CACHE_KEY, newPreferences, { ttl: 0 });
    
    // 发布设置变更事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('preferences-changed', {
        detail: newPreferences
      }));
    }
    
    return;
  } catch (error) {
    console.error('保存用户偏好失败:', error);
    throw error;
  }
}

/**
 * 应用用户偏好设置
 * @param preferences 用户偏好
 */
export async function applyPreferences(preferences: UserPreferences): Promise<void> {
  try {
    if (typeof document !== 'undefined') {
      // 应用语言
      document.documentElement.lang = preferences.language;
      
      // 应用主题
      document.documentElement.dataset.theme = preferences.theme;
      
      // 应用字体大小
      document.documentElement.dataset.fontSize = preferences.fontSize;
      
      // 发布应用设置事件
      window.dispatchEvent(new CustomEvent('preferences-applied', {
        detail: preferences
      }));
    }
    
    return;
  } catch (error) {
    console.error('应用用户偏好失败:', error);
    throw error;
  }
}

/**
 * 设置单个偏好
 * @param key 偏好键
 * @param value 偏好值
 */
export async function setPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<void> {
  const update = { [key]: value } as Partial<UserPreferences>;
  await saveUserPreferences(update);
  
  // 获取更新后的完整偏好并应用
  const updatedPreferences = await cacheManager.get<UserPreferences>(PREFERENCES_CACHE_KEY);
  if (updatedPreferences) {
    await applyPreferences(updatedPreferences);
  }
}

/**
 * 重置用户偏好设置为默认值
 */
export async function resetPreferences(): Promise<void> {
  await saveUserPreferences(defaultPreferences);
  await applyPreferences(defaultPreferences);
}

/**
 * 获取当前用户偏好设置
 * @returns 当前用户偏好
 */
export async function getCurrentPreferences(): Promise<UserPreferences> {
  return await cacheManager.get<UserPreferences>(PREFERENCES_CACHE_KEY) || defaultPreferences;
}

/**
 * 同步用户偏好到服务器
 * 在有用户登录功能时使用
 */
export async function syncPreferencesToServer(): Promise<void> {
  try {
    const preferences = await cacheManager.get<UserPreferences>(PREFERENCES_CACHE_KEY);
    if (!preferences) return;
    
    // 这里应该是向服务器API发送用户偏好的代码
    // 例如: await api.post('/user/preferences', preferences);
    
    console.log('用户偏好已同步到服务器');
  } catch (error) {
    console.error('同步用户偏好到服务器失败:', error);
    throw error;
  }
}

/**
 * 从服务器获取用户偏好
 * 在用户登录后使用
 */
export async function syncPreferencesFromServer(): Promise<void> {
  try {
    // 这里应该是从服务器API获取用户偏好的代码
    // 例如: const serverPreferences = await api.get('/user/preferences');
    
    // 由于没有实际的API调用，这里只是模拟
    const serverPreferences = defaultPreferences;
    
    // 保存并应用从服务器获取的偏好
    await saveUserPreferences(serverPreferences);
    await applyPreferences(serverPreferences);
    
    console.log('已从服务器同步用户偏好');
  } catch (error) {
    console.error('从服务器同步用户偏好失败:', error);
    throw error;
  }
} 