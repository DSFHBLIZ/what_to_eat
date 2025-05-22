import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { eventBus } from '../core/eventBus';
import { StoreState } from './storeTypes';

// 创建状态存储
const useStore = create<StoreState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 用户相关状态初始值
        user: {
          isAuthenticated: false,
          user: null,
          preferences: {
            theme: 'system',
            language: 'zh-CN',
            fontSize: 16,
            showRecommendations: true,
          },
        },
        
        // 应用全局状态初始值
        app: {
          isLoading: false,
          isInitialized: false,
          notifications: [],
          lastError: null,
          networkStatus: typeof navigator !== 'undefined' ? 
            (navigator.onLine ? 'online' : 'offline') : 'online',
          offlineQueue: [],
        },
        
        // 搜索相关状态初始值
        search: {
          searchHistory: [],
          recentSearches: [],
          savedSearches: [],
          filters: {},
          results: [],
          isSearching: false,
        },
        
        // 食谱状态初始值
        recipes: {
          favorites: [],
          history: [],
          recommendations: [],
        },
        
        // 网络状态管理
        setNetworkStatus: (status: 'online' | 'offline') => 
          set((state) => {
            state.app.networkStatus = status;
            // 如果网络恢复在线状态，尝试处理离线队列
            if (status === 'online' && get().processOfflineQueue) {
              get().processOfflineQueue();
            }
          }),
        
        // 用户状态管理方法
        login: (userData) => 
          set((state) => {
            state.user.isAuthenticated = true;
            state.user.user = { ...userData };
            // 触发登录事件
            eventBus.emit('auth:login', userData);
          }),
          
        logout: () => 
          set((state) => {
            state.user.isAuthenticated = false;
            state.user.user = null;
            // 触发登出事件
            eventBus.emit('auth:logout');
          }),
          
        updateUser: (userData) => 
          set((state) => {
            if (state.user.user) {
              state.user.user = { ...state.user.user, ...userData };
            } else {
              state.user.user = { ...userData };
            }
            // 触发用户更新事件
            eventBus.emit('user:update', { user: state.user.user });
          }),
          
        updatePreferences: (preferences) => 
          set((state) => {
            state.user.preferences = { ...state.user.preferences, ...preferences };
            // 触发偏好更新事件
            eventBus.emit('user:preferences:change', { preferences: state.user.preferences });
          }),
        
        // 应用状态管理方法
        setLoading: (isLoading) => 
          set((state) => {
            state.app.isLoading = isLoading;
          }),
          
        setInitialized: (isInitialized) => 
          set((state) => {
            state.app.isInitialized = isInitialized;
            if (isInitialized) {
              // 触发应用初始化事件
              eventBus.emit('app:initialized', { timestamp: Date.now() });
            }
          }),
          
        addNotification: (notification) => 
          set((state) => {
            const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const newNotification = {
              id,
              ...notification,
              timestamp: Date.now(),
              read: false,
            };
            
            state.app.notifications.push(newNotification);
            
            // 限制通知数量，防止内存泄漏
            if (state.app.notifications.length > 50) {
              state.app.notifications = state.app.notifications.slice(-50);
            }
            
            // 触发通知事件
            eventBus.emit('notification:new', { notification: newNotification });
            
            return state;
          }),
          
        markNotificationAsRead: (id) => 
          set((state) => {
            const notification = state.app.notifications.find((n) => n.id === id);
            if (notification) {
              notification.read = true;
            }
          }),
          
        clearNotifications: () => 
          set((state) => {
            state.app.notifications = [];
          }),
          
        setError: (error) => 
          set((state) => {
            state.app.lastError = error;
            if (error) {
              // 触发错误事件
              eventBus.emit('error:occurred', { message: error });
            }
          }),
        
        // 搜索状态管理方法
        setSearchHistory: (history) => 
          set((state) => {
            state.search.searchHistory = history;
          }),
          
        addSearchTerm: (term) => 
          set((state) => {
            // 添加到搜索历史，确保唯一性并限制数量
            const newHistory = [
              term,
              ...state.search.searchHistory.filter((t) => t !== term),
            ].slice(0, 20);
            
            // 添加到最近搜索
            const newRecent = [
              term,
              ...state.search.recentSearches.filter((t) => t !== term),
            ].slice(0, 5);
            
            state.search.searchHistory = newHistory;
            state.search.recentSearches = newRecent;
            
            // 触发搜索事件
            eventBus.emit('search:new', { term });
          }),
          
        clearSearchHistory: () => 
          set((state) => {
            state.search.searchHistory = [];
            state.search.recentSearches = [];
          }),
          
        saveSearch: (term) => 
          set((state) => {
            // 确保不重复添加
            if (!state.search.savedSearches.includes(term)) {
              state.search.savedSearches = [...state.search.savedSearches, term];
              
              // 触发保存搜索事件
              eventBus.emit('search:saved', { term });
            }
          }),
          
        removeSavedSearch: (term) => 
          set((state) => {
            state.search.savedSearches = state.search.savedSearches.filter((t) => t !== term);
            
            // 触发移除保存搜索事件
            eventBus.emit('search:removed', { term });
          }),
          
        setSearchResults: (results) => 
          set((state) => {
            state.search.results = results;
          }),
          
        setSearching: (isSearching) => 
          set((state) => {
            state.search.isSearching = isSearching;
          }),
          
        setFilters: (filters) => 
          set((state) => {
            state.search.filters = { ...state.search.filters, ...filters };
          }),
          
        clearFilters: () => 
          set((state) => {
            state.search.filters = {};
          }),
        
        // 食谱状态管理方法
        addFavorite: (recipeId) => 
          set((state) => {
            const { networkStatus } = state.app;
            const { favorites } = state.recipes;
            
            // 如果已经在收藏中则不添加
            if (favorites.includes(recipeId)) return;
            
            // 添加到收藏
            state.recipes.favorites = [...favorites, recipeId];
            
            // 如果在线状态下直接调用API
            if (networkStatus === 'online') {
              fetch('/api/recipes/favorite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipeId }),
              }).catch(err => {
                console.error('添加收藏失败', err);
              });
            }
            
            // 触发收藏事件
            eventBus.emit('recipe:favorited', { recipeId });
          }),
          
        removeFavorite: (recipeId) => 
          set((state) => {
            const { networkStatus } = state.app;
            
            // 从收藏中移除
            state.recipes.favorites = state.recipes.favorites.filter((id) => id !== recipeId);
            
            // 在线状态下直接调用API
            if (networkStatus === 'online') {
              fetch(`/api/recipes/favorite/${recipeId}`, {
                method: 'DELETE',
              }).catch(err => {
                console.error('移除收藏失败', err);
              });
            }
            
            // 触发取消收藏事件
            eventBus.emit('recipe:unfavorited', { recipeId });
          }),
          
        addToHistory: (recipeId) => 
          set((state) => {
            // 添加到历史记录，确保唯一性并限制数量
            const newHistory = [
              recipeId,
              ...state.recipes.history.filter((id) => id !== recipeId),
            ].slice(0, 50);
            
            state.recipes.history = newHistory;
          }),
          
        clearHistory: () => 
          set((state) => {
            state.recipes.history = [];
          }),
          
        setRecommendations: (recommendations) => 
          set((state) => {
            state.recipes.recommendations = recommendations;
          }),
        
        // 离线队列方法（占位符实现）
        addToOfflineQueue: (operation) => {
          console.warn('addToOfflineQueue方法尚未实现');
          return '';
        },
        removeFromOfflineQueue: (operationId) => {
          console.warn('removeFromOfflineQueue方法尚未实现');
        },
        processOfflineQueue: async () => {
          console.warn('processOfflineQueue方法尚未实现');
        }
      })),
      {
        name: 'what-to-eat-storage',
        // 只持久化部分状态
        partialize: (state) => ({
          user: {
            isAuthenticated: state.user.isAuthenticated,
            user: state.user.user,
            preferences: state.user.preferences,
          },
          app: {
            isInitialized: state.app.isInitialized,
            // 保存离线队列
            offlineQueue: state.app.offlineQueue,
          },
          search: {
            searchHistory: state.search.searchHistory,
            savedSearches: state.search.savedSearches,
          },
          recipes: {
            favorites: state.recipes.favorites,
            history: state.recipes.history,
          },
        }),
      }
    )
  )
);

// 导出store
export { useStore };

// 选择器 hooks
export const useUserState = () => useStore((state) => state.user);
export const useAppState = () => useStore((state) => state.app);
export const useSearchState = () => useStore((state) => state.search);
export const useRecipesState = () => useStore((state) => state.recipes);

// 功能性 hooks
export const useAuthentication = () => {
  const { isAuthenticated, user } = useStore((state) => state.user);
  const login = useStore((state) => state.login);
  const logout = useStore((state) => state.logout);
  const updateUser = useStore((state) => state.updateUser);
  
  return { isAuthenticated, user, login, logout, updateUser };
};

export const usePreferences = () => {
  const preferences = useStore((state) => state.user.preferences);
  const updatePreferences = useStore((state) => state.updatePreferences);
  
  return { preferences, updatePreferences };
};

export const useNotifications = () => {
  const notifications = useStore((state) => state.app.notifications);
  const addNotification = useStore((state) => state.addNotification);
  const markNotificationAsRead = useStore((state) => state.markNotificationAsRead);
  const clearNotifications = useStore((state) => state.clearNotifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return { 
    notifications, 
    unreadCount, 
    addNotification, 
    markNotificationAsRead, 
    clearNotifications 
  };
};

export const useSearchFunctions = () => {
  const search = useStore((state) => state.search);
  const addSearchTerm = useStore((state) => state.addSearchTerm);
  const clearSearchHistory = useStore((state) => state.clearSearchHistory);
  const saveSearch = useStore((state) => state.saveSearch);
  const removeSavedSearch = useStore((state) => state.removeSavedSearch);
  const setSearchResults = useStore((state) => state.setSearchResults);
  const setSearching = useStore((state) => state.setSearching);
  const setFilters = useStore((state) => state.setFilters);
  const clearFilters = useStore((state) => state.clearFilters);
  
  return {
    ...search,
    addSearchTerm,
    clearSearchHistory,
    saveSearch,
    removeSavedSearch,
    setSearchResults,
    setSearching,
    setFilters,
    clearFilters,
  };
};

export const useFavorites = () => {
  const favorites = useStore((state) => state.recipes.favorites);
  const addFavorite = useStore((state) => state.addFavorite);
  const removeFavorite = useStore((state) => state.removeFavorite);
  
  const isFavorite = (recipeId: string) => favorites.includes(recipeId);
  
  return { favorites, isFavorite, addFavorite, removeFavorite };
};

export const useOfflineSync = () => {
  const networkStatus = useStore((state) => state.app.networkStatus);
  const offlineQueue = useStore((state) => state.app.offlineQueue);
  const setNetworkStatus = useStore((state) => state.setNetworkStatus);
  const addToOfflineQueue = useStore((state) => state.addToOfflineQueue);
  const removeFromOfflineQueue = useStore((state) => state.removeFromOfflineQueue);
  const processOfflineQueue = useStore((state) => state.processOfflineQueue);
  
  const isOnline = networkStatus === 'online';
  const isPending = offlineQueue.length > 0;
  
  return {
    isOnline,
    isPending,
    offlineQueue,
    setNetworkStatus,
    addToOfflineQueue,
    removeFromOfflineQueue,
    processOfflineQueue,
  };
};

export default useStore; 