/**
 * 状态管理系统入口文件
 * 集成了所有增强功能，提供统一的状态管理解决方案
 */

// 导出状态切片工厂函数
import sliceFactory from './sliceFactory';
import { useSearchStore, searchStoreActions } from './slices/searchSlice';
import userSlice from './slices/userSlice';
import favoriteSlice from './slices/favoriteSlice';
import { useFavoriteStore, favoriteStoreActions } from './slices/favoriteSlice';

// 导出事件总线
export { eventBus } from '../core/eventBus';

// 提取用户状态和动作
const useUserStore = userSlice.useState;
const userStoreActions = userSlice.actions;

// 统一导出所有Store相关功能
export {
  // Store工厂函数
  sliceFactory,
  
  // Hook导出
  useSearchStore,
  useUserStore,
  useFavoriteStore,
  
  // Action导出
  searchStoreActions,
  userStoreActions,
  favoriteStoreActions
}; 