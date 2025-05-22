import { OfflineOperation } from './offlineStorage';

/**
 * 用户偏好设置接口
 */
export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  showRecommendations: boolean;
}

/**
 * 用户状态接口
 */
export interface UserState {
  isAuthenticated: boolean;
  user: {
    id?: string;
    username?: string;
    email?: string;
    avatar?: string;
  } | null;
  preferences: Preferences;
}

/**
 * 应用全局状态接口
 */
export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  notifications: Notification[];
  lastError: string | null;
  networkStatus: 'online' | 'offline';
  offlineQueue: OfflineOperation[];
}

/**
 * 搜索状态接口
 */
export interface SearchState {
  searchHistory: string[];
  recentSearches: string[];
  savedSearches: string[];
  filters: Record<string, any>;
  results: any[];
  isSearching: boolean;
}

/**
 * 通知接口
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

/**
 * 食谱状态接口
 */
export interface RecipesState {
  favorites: string[];
  history: string[];
  recommendations: any[];
}

/**
 * 所有状态接口
 */
export interface StoreState {
  // 状态数据
  user: UserState;
  app: AppState;
  search: SearchState;
  recipes: RecipesState;
  
  // 用户状态管理方法
  login: (userData: Partial<UserState['user']>) => void;
  logout: () => void;
  updateUser: (userData: Partial<UserState['user']>) => void;
  updatePreferences: (preferences: Partial<Preferences>) => void;
  
  // 应用状态管理方法
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  setError: (error: string | null) => void;
  
  // 搜索状态管理方法
  setSearchHistory: (history: string[]) => void;
  addSearchTerm: (term: string) => void;
  clearSearchHistory: () => void;
  saveSearch: (term: string) => void;
  removeSavedSearch: (term: string) => void;
  setSearchResults: (results: any[]) => void;
  setSearching: (isSearching: boolean) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  
  // 食谱状态管理方法
  addFavorite: (recipeId: string) => void;
  removeFavorite: (recipeId: string) => void;
  addToHistory: (recipeId: string) => void;
  clearHistory: () => void;
  setRecommendations: (recommendations: any[]) => void;
  
  // 网络状态管理
  setNetworkStatus: (status: 'online' | 'offline') => void;
  
  // 离线队列方法 (由offlineStorage中间件提供)
  addToOfflineQueue: (operation: any) => string;
  removeFromOfflineQueue: (operationId: string) => void;
  processOfflineQueue: () => Promise<void>;
} 