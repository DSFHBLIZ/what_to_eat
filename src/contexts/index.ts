/**
 * 上下文层索引文件
 * 统一导出所有上下文钩子和提供者
 */

// 导出创建上下文提供者工厂函数
export { createContextProvider } from './createContextProvider';

// 导出统一搜索提供者和钩子
export { 
  UnifiedSearchProvider,
  useUnifiedSearch 
} from './UnifiedSearchProvider';

// 导出主应用提供者和各个上下文
export {
  AppProvider,
  RecipeProvider,
  useRecipe,
  FavoriteProvider,
  useFavorite,
  LanguageProvider,
  useLanguage,
  AuthProvider,
  useAuth,
  RecipeErrorProvider,
  useRecipeError,
  RecipeErrorHelper,
  SUPPORTED_LOCALES
} from './AppProvider'; 