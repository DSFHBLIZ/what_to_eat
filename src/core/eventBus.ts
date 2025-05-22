'use client';

/**
 * 统一事件总线
 * 为应用程序提供集中式的事件处理机制
 */
import mitt, { Emitter } from 'mitt';
import { IngredientTag } from '../types/search';

// 用户类型（为了与 store.ts 兼容）
export type StoreUser = any; 

// 定义所有事件类型的映射
export type EventMap = {
  // 认证相关事件
  'auth:login': StoreUser;
  'auth:logout': void;
  'auth:register': StoreUser;
  'auth:profile-update': Partial<StoreUser>;
  'auth:stateChanged': StoreUser | null;
  
  // 用户状态切片事件
  'user:login': any;
  'user:logout': void;
  'user:infoUpdated': any;
  'user:preferencesUpdated': any;
  'user:recipeSaved': string;
  'user:recipeUnsaved': string;
  'user:tipSaved': string;
  'user:tipUnsaved': string;
  'user:cookingHistoryAdded': string;
  'user:shoppingListUpdated': string[];
  
  // 搜索相关事件
  'search:execute': { query: string; requiredIngredients?: IngredientTag[]; optionalIngredients?: IngredientTag[] };
  'search:clear': void;
  'search:results': { results: unknown[] };
  'search:error': { error: string };
  'search:new': { term: string };
  'search:saved': { term: string };
  'search:removed': { term: string };
  'search:query': { query: string };
  'search:requiredIngredients': { ingredients: IngredientTag[] };
  'search:optionalIngredients': { ingredients: IngredientTag[] };
  'search:cuisines': { cuisines: string[] };
  'search:flavors': { flavors: string[] };
  'search:difficulties': { difficulties: string[] };
  'search:cookingMethods': { methods: string[] };
  'search:dietaryRestrictions': { restrictions: string[] };
  'search:page': { page: number };
  'search:limit': { limit: number };
  'search:sortField': { field: string };
  'search:sortDirection': { direction: 'asc' | 'desc' };
  'search:reset': {
    autoSearch?: boolean;
  } | undefined;
  'search:clearHistory': undefined;
  'search:filter:change': { 
    type: string; 
    value: string; 
    action: string;
    autoSearch?: boolean;
  };
  'search:filter:clear': { 
    autoSearch?: boolean;
  } | undefined;
  'search:filter:reset': { 
    autoSearch?: boolean;
  } | undefined;
  'search:tagLogic': { 
    logic: 'AND' | 'OR';
  };
  
  // 筛选相关事件
  'filter:change': { 
    type: string;
    value: string | string[] | any[]; 
    active?: boolean;
    autoSearch?: boolean;
  };
  'filter:reset': { 
    autoSearch?: boolean;
  } | undefined;
  'filter:clear': { 
    autoSearch?: boolean;
  } | undefined;
  'filter:search': { 
    query: string;
    autoSearch?: boolean;
  };
  'filter:changed': { type: string; action: string; tag?: string; value?: any };
  
  // 标签相关事件
  'tag:add': { tag: string; type: string };
  'tag:remove': { tag: string; type: string };
  
  // 主题相关事件
  'preferences:theme:changed': { preference: string; isDarkMode: boolean; timestamp?: number };
  'preferences:theme:applied': { name: string; fontSize: string; themeColor: string; enableAnimations: boolean; highContrast: boolean; isDarkMode: boolean; timestamp: number };
  'preferences:fontSize:changed': { fontSize: string; timestamp?: number };
  'preferences:color:changed': { themeColor: string; timestamp?: number };
  'preferences:animations:changed': { enableAnimations: boolean; timestamp?: number };
  'preferences:contrast:changed': { highContrast: boolean; timestamp?: number };
  'preferences:language:changed': { language: string; timestamp?: number };
  
  // 食材相关事件
  'ingredient:suggest': { query: string; field: 'required' | 'optional' };
  
  // 菜谱相关事件
  'recipe:view': { recipeId: string; name: string };
  'recipe:favorite': { recipeId: string; isFavorite: boolean };
  'recipe:favorited': { recipeId: string };
  'recipe:unfavorited': { recipeId: string };
  'recipe:rate': { recipeId: string; rating: number };
  'recipe:added': { recipe: any };
  'recipe:updated': { recipeId: string; updates: any };
  'recipe:removed': { recipeId: string };
  'recipe:history': { recipeId?: string; action: string };
  'recipe:collection': { action: string; collectionId?: string; recipeId?: string; name?: string };
  
  // UI相关事件
  'ui:notification': { message: string; type: 'success' | 'error' | 'info' | 'warning' };
  'ui:modal:open': { id: string; data?: any };
  'ui:modal:close': { id: string };
  'notification': { type: string; message: string };
  
  // 语言相关事件
  'language:change': { language: string };
  'language:changed': { language: string };
  
  // 国际化相关事件
  'i18n:initialized': { language: string };
  'i18n:initialization:failed': { error: any };
  'i18n:resource:added': { lang: string; namespace: string; key: string; value: string };
  'i18n:resource-bundle:added': { lang: string; bundle: Record<string, any> };
  
  // 验证相关事件
  'validation:error': { field: string; message: string };
  'validation:success': { field: string };
  'validation:form:submit': { formId: string; data: any };
  
  // 用户相关事件
  'user:update': { user: any };
  'user:preferences:change': { preferences: any; timestamp?: number };
  
  // 应用相关事件
  'app:initialized': { timestamp: number };
  'app:ready': { timestamp: number };
  'app:init:failed': { error: Error };
  'app:init:progress': { phase: string; progress: number; error?: Error };
  'notification:new': { notification: any };
  'error:occurred': { message: string };
  'app:error': { message: string; code?: string; details?: any };
  'app:notification': { message: string; type: 'success' | 'info' | 'warning' | 'error' };
  'app:themeChanged': { theme: 'light' | 'dark' | 'system' };
  'app:languageChanged': { locale: string };
  
  // 测试用事件
  'api:call:start': { name: string; params: any; timestamp: number };
  'api:call:success': { name: string; params: any; response: any; timestamp: number };
  'api:call:error': { name: string; params: any; error: any; timestamp: number };
  'cache:set': { key: string; namespace: string; timestamp: number };
  'cache:delete': { key: string; namespace: string; timestamp: number };
  'error': { type: string; message: string; timestamp: number };
  'store:stateChanged': { timestamp: number };
  
  // 网络相关事件
  'network:online': void;
  'network:offline': void;
  'network:statusChange': any;
  
  // 离线队列相关事件
  'offlineQueue:processing': { started: number };
  'offlineQueue:operationFailed': { operation: any; error: any };
  'offlineQueue:processed': { finished: number };
  
  // 存储相关事件
  'store:initialized': { timestamp: number };
  'store:error': { error: string; timestamp: number };
  
  // 状态缓存相关事件
  'state:cache:saved': { key: string; state: any };
  'state:cache:restored': { key: string; state: any };
  'state:cache:error': { action: string; error: any };
  'state:cache:miss': { key: string };
  'state:cache:version-mismatch': { key: string; savedVersion: number; currentVersion: number };
  
  // API相关事件
  'api:call:init': { request: any };
  'api:refreshed': { entity: string; timestamp: number };
  
  // API错误事件
  'error:api': { code: string; message: string; context?: any };
  
  // 离线队列详细事件
  'offlineQueue:item-added': { item: any }; 
  'offlineQueue:item-status-changed': { id: string; oldStatus: string; newStatus: string; item: any };
  'offlineQueue:item-removed': { id: string; item: any };
  'offlineQueue:processing-started': any;
  'offlineQueue:processing-completed': { processed: number; succeeded: number; failed: number };
  'offlineQueue:network-status-changed': { isOnline: boolean };
};

// 创建事件发射器
export const eventBus: Emitter<EventMap> = mitt<EventMap>();

// 导出常用的事件发射助手函数
export const emitEvents = {
  // 认证相关
  login: (user: StoreUser) => eventBus.emit('auth:login', user),
  logout: () => eventBus.emit('auth:logout', undefined),
  register: (user: StoreUser) => eventBus.emit('auth:register', user),
  updateProfile: (userData: Partial<StoreUser>) => eventBus.emit('auth:profile-update', userData),
  
  // 搜索相关
  search: (
    query: string, 
    requiredIngredients: IngredientTag[] = [], 
    optionalIngredients: IngredientTag[] = []
  ) => {
    eventBus.emit('search:execute', { 
      query, 
      requiredIngredients, 
      optionalIngredients 
    });
  },
  clearSearch: () => eventBus.emit('search:clear', undefined),
  searchError: (error: string) => eventBus.emit('search:error', { error }),
  searchResults: (results: any[]) => eventBus.emit('search:results', { results }),
  
  // 统一搜索控制器相关事件
  searchFilterChange: (type: string, value: string, action: string) => 
    eventBus.emit('search:filter:change', { type, value, action, autoSearch: false }),
  clearSearchFilters: () => 
    eventBus.emit('search:filter:clear', { autoSearch: false }),
  resetSearchFilters: () => 
    eventBus.emit('search:filter:reset', { autoSearch: false }),
  setTagLogic: (logic: 'AND' | 'OR') => 
    eventBus.emit('search:tagLogic', { logic }),
  setPage: (page: number) => 
    eventBus.emit('search:page', { page }),
  setLimit: (limit: number) => 
    eventBus.emit('search:limit', { limit }),
  setSortField: (field: string) => 
    eventBus.emit('search:sortField', { field }),
  setSortDirection: (direction: 'asc' | 'desc') => 
    eventBus.emit('search:sortDirection', { direction }),
  resetSearch: (autoSearch: boolean = false) => 
    eventBus.emit('search:reset', { autoSearch }),
  
  // 筛选相关
  changeFilter: (type: string, value: string | string[] | IngredientTag[], active: boolean = true) => 
    eventBus.emit('filter:change', { type, value, active, autoSearch: false }),
  resetFilters: () => eventBus.emit('filter:reset', { autoSearch: false }),
  clearAllFilters: () => eventBus.emit('filter:clear', { autoSearch: false }),
  searchFilter: (query: string) => eventBus.emit('filter:search', { query, autoSearch: false }),
  
  // 标签相关
  addTag: (tag: string, type: string) => eventBus.emit('tag:add', { tag, type }),
  removeTag: (tag: string, type: string) => eventBus.emit('tag:remove', { tag, type }),
  
  // 主题相关
  changeTheme: (preference: string, isDarkMode: boolean) => 
    eventBus.emit('preferences:theme:changed', { preference, isDarkMode, timestamp: Date.now() }),
  
  // 主题偏好设置相关
  changeFontSize: (fontSize: string) => 
    eventBus.emit('preferences:fontSize:changed', { fontSize, timestamp: Date.now() }),
  changeThemeColor: (themeColor: string) => 
    eventBus.emit('preferences:color:changed', { themeColor, timestamp: Date.now() }),
  toggleAnimations: (enableAnimations: boolean) => 
    eventBus.emit('preferences:animations:changed', { enableAnimations, timestamp: Date.now() }),
  toggleHighContrast: (highContrast: boolean) => 
    eventBus.emit('preferences:contrast:changed', { highContrast, timestamp: Date.now() }),
  
  // 食材相关
  suggestIngredient: (query: string, field: 'required' | 'optional') => 
    eventBus.emit('ingredient:suggest', { query, field }),
  
  // 菜谱相关
  viewRecipe: (recipeId: string, name: string) => eventBus.emit('recipe:view', { recipeId, name }),
  
  // UI相关
  notification: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => 
    eventBus.emit('ui:notification', { message, type }),
  
  // 语言相关
  changeLanguage: (language: string) => eventBus.emit('language:change', { language }),
  languageChanged: (language: string) => eventBus.emit('preferences:language:changed', { language, timestamp: Date.now() }),
  
  // 用户相关
  updateUser: (user: any) => eventBus.emit('user:update', { user }),
  updatePreferences: (preferences: any) => eventBus.emit('user:preferences:change', { preferences, timestamp: Date.now() }),
  
  // 应用相关
  appInitialized: (timestamp: number) => eventBus.emit('app:initialized', { timestamp }),
  appInitProgress: (phase: string, progress: number, error?: Error) => 
    eventBus.emit('app:init:progress', { phase, progress, error }),
  newNotification: (notification: any) => eventBus.emit('notification:new', { notification }),
  errorOccurred: (message: string) => eventBus.emit('error:occurred', { message }),
};

export default eventBus; 