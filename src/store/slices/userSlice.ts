/**
 * 用户状态切片
 * 使用新的切片工厂模式管理用户数据
 */

import { createSlice } from "../sliceFactory";
import { eventBus } from "../../core/eventBus";

// 定义TipItem接口
export interface TipItem {
  id: string;
  content: string;
  source?: string;
  category?: string;
  tags?: string[];
  createdAt?: string;
  recipeId?: string;
}

// 用户偏好设置接口
export interface UserPreference {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  language: string;
  notifications: boolean;
  cookingDifficulty: string;
  dietaryRestrictions: string[];
  favoriteCuisines: string[];
}

// 用户信息接口
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'chef';
  createdAt: string;
  lastLogin?: string;
}

// 最近活动项接口
export interface RecentActivity {
  id: string;
  type: 'view' | 'save' | 'cook' | 'rate' | 'comment';
  targetId: string;
  targetName: string;
  timestamp: string;
}

// 用户状态接口
export interface UserState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  preferences: UserPreference;
  recentActivity: RecentActivity[];
  savedRecipes: string[];
  savedTips: TipItem[];
  cookingHistory: string[];
  shoppingList: string[];
  loadingState: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

// 默认用户偏好设置
const defaultPreferences: UserPreference = {
  theme: 'system',
  fontSize: 16,
  language: 'zh-CN',
  notifications: true,
  cookingDifficulty: '所有',
  dietaryRestrictions: [],
  favoriteCuisines: [],
};

// 初始状态
const initialState: UserState = {
  isLoggedIn: false,
  userInfo: null,
  preferences: defaultPreferences,
  recentActivity: [],
  savedRecipes: [],
  savedTips: [],
  cookingHistory: [],
  shoppingList: [],
  loadingState: 'idle',
  error: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  actions: {
    // 登录操作
    login: (state, payload: { userInfo: UserInfo }) => {
      state.isLoggedIn = true;
      state.userInfo = payload.userInfo;
      state.loadingState = 'success';
      state.error = null;
      
      // 触发登录成功事件
      eventBus.emit('user:login', payload.userInfo);
      return state;
    },
    
    // 登出操作
    logout: (state) => {
      state.isLoggedIn = false;
      state.userInfo = null;
      state.loadingState = 'idle';
      
      // 触发登出事件
      eventBus.emit('user:logout');
      return state;
    },
    
    // 更新用户信息
    updateUserInfo: (state, payload: Partial<UserInfo>) => {
      if (state.userInfo) {
        state.userInfo = { ...state.userInfo, ...payload };
        
        // 触发用户信息更新事件
        eventBus.emit('user:infoUpdated', state.userInfo);
      }
      return state;
    },
    
    // 更新用户偏好设置
    updatePreferences: (state, payload: Partial<UserPreference>) => {
      state.preferences = { ...state.preferences, ...payload };
      
      // 触发偏好设置更新事件
      eventBus.emit('user:preferencesUpdated', state.preferences);
      return state;
    },
    
    // 添加最近活动
    addRecentActivity: (state, payload: RecentActivity) => {
      // 如果已经存在相同ID的活动，则移除它(避免重复)
      const filteredActivity = state.recentActivity.filter(
        activity => activity.id !== payload.id
      );
      
      // 将新活动添加到最前面
      state.recentActivity = [payload, ...filteredActivity].slice(0, 20); // 只保留最近20条活动
      return state;
    },
    
    // 添加保存的食谱
    saveRecipe: (state, recipeId: string) => {
      if (!state.savedRecipes.includes(recipeId)) {
        state.savedRecipes = [...state.savedRecipes, recipeId];
        
        // 触发保存食谱事件
        eventBus.emit('user:recipeSaved', recipeId);
      }
      return state;
    },
    
    // 移除保存的食谱
    removeSavedRecipe: (state, recipeId: string) => {
      state.savedRecipes = state.savedRecipes.filter(id => id !== recipeId);
      
      // 触发移除保存食谱事件
      eventBus.emit('user:recipeUnsaved', recipeId);
      return state;
    },
    
    // 添加保存的烹饪技巧
    saveTip: (state, tip: TipItem) => {
      if (!state.savedTips.some(t => t.id === tip.id)) {
        state.savedTips = [...state.savedTips, tip];
        
        // 触发保存技巧事件
        eventBus.emit('user:tipSaved', tip.id);
      }
      return state;
    },
    
    // 移除保存的烹饪技巧
    removeSavedTip: (state, tipId: string) => {
      state.savedTips = state.savedTips.filter(tip => tip.id !== tipId);
      
      // 触发移除保存技巧事件
      eventBus.emit('user:tipUnsaved', tipId);
      return state;
    },
    
    // 添加烹饪历史记录
    addCookingHistory: (state, recipeId: string) => {
      if (!state.cookingHistory.includes(recipeId)) {
        state.cookingHistory = [recipeId, ...state.cookingHistory];
        
        // 触发添加烹饪历史事件
        eventBus.emit('user:cookingHistoryAdded', recipeId);
      }
      return state;
    },
    
    // 添加购物清单项
    addToShoppingList: (state, item: string) => {
      if (!state.shoppingList.includes(item)) {
        state.shoppingList = [...state.shoppingList, item];
        
        // 触发添加购物清单事件
        eventBus.emit('user:shoppingListUpdated', state.shoppingList);
      }
      return state;
    },
    
    // 从购物清单中移除项
    removeFromShoppingList: (state, item: string) => {
      state.shoppingList = state.shoppingList.filter(i => i !== item);
      
      // 触发购物清单更新事件
      eventBus.emit('user:shoppingListUpdated', state.shoppingList);
      return state;
    },
    
    // 设置加载状态
    setLoadingState: (state, loadingState: UserState['loadingState']) => {
      state.loadingState = loadingState;
      return state;
    },
    
    // 设置错误信息
    setError: (state, error: string | null) => {
      state.error = error;
      state.loadingState = error ? 'error' : state.loadingState;
      return state;
    },
  },
  selectors: {
    // 获取用户是否已登录
    isUserLoggedIn: state => state.isLoggedIn,
    
    // 获取用户信息
    getUserInfo: state => state.userInfo,
    
    // 获取用户偏好设置
    getUserPreferences: state => state.preferences,
    
    // 获取用户主题设置
    getUserTheme: state => state.preferences.theme,
    
    // 获取最近活动
    getRecentActivity: state => state.recentActivity,
    
    // 获取保存的食谱
    getSavedRecipes: state => state.savedRecipes,
    
    // 获取保存的烹饪技巧
    getSavedTips: state => state.savedTips,
    
    // 获取烹饪历史记录
    getCookingHistory: state => state.cookingHistory,
    
    // 获取购物清单
    getShoppingList: state => state.shoppingList,
    
    // 获取加载状态
    getLoadingState: state => state.loadingState,
    
    // 获取错误信息
    getError: state => state.error,
    
    // 检查特定食谱是否已保存
    isRecipeSaved: state => (recipeId: string) => {
      return state.savedRecipes.includes(recipeId);
    },
    
    // 检查特定烹饪技巧是否已保存
    isTipSaved: state => (tipId: string) => {
      return state.savedTips.some(tip => tip.id === tipId);
    },
  },
});

export const {
  login,
  logout,
  updateUserInfo,
  updatePreferences,
  addRecentActivity,
  saveRecipe,
  removeSavedRecipe,
  saveTip,
  removeSavedTip,
  addCookingHistory,
  addToShoppingList,
  removeFromShoppingList,
  setLoadingState,
  setError,
} = userSlice.actions;

export const {
  isUserLoggedIn,
  getUserInfo,
  getUserPreferences,
  getUserTheme,
  getRecentActivity,
  getSavedRecipes,
  getSavedTips,
  getCookingHistory,
  getShoppingList,
  getLoadingState,
  getError,
  isRecipeSaved,
  isTipSaved,
} = userSlice.selectors;

export default userSlice; 