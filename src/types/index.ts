/**
 * 类型系统入口文件
 * 统一导出所有应用类型
 */

// 导出菜谱相关类型
export * from './recipe';

// 导出搜索相关类型
export * from './search';

// 导出观测性和事件相关类型
export * from './observability';

// 导出通用类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ValueOf<T> = T[keyof T];

/**
 * 统一的分页结果类型
 * 用于所有需要分页数据的地方
 */
export interface PaginatedResult<T> {
  // 当前页数据项
  items: T[];
  // 总数据条数
  total: number;
  // 当前页码
  page: number;
  // 每页大小
  pageSize: number;
  // 是否有更多页
  hasMore: boolean;
  // 可选属性
  // 总页数
  totalPages?: number;
  // 是否为第一页
  isFirstPage?: boolean;
  // 是否为最后一页
  isLastPage?: boolean;
}

/**
 * 分页参数类型
 * 用于所有需要分页请求的地方
 */
export interface PaginationParams {
  // 页码 (从1开始)
  page?: number;
  // 每页数量
  pageSize?: number;
  // 排序字段
  sortBy?: string;
  // 排序方向
  sortOrder?: 'asc' | 'desc';
}

/**
 * 创建默认分页结果
 * @param items 数据项
 * @param total 总数
 * @param page 当前页
 * @param pageSize 每页大小
 * @returns 分页结果对象
 */
export function createPaginatedResult<T>(
  items: T[] = [],
  total: number = 0,
  page: number = 1,
  pageSize: number = 10
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page < totalPages,
    totalPages,
    isFirstPage: page <= 1,
    isLastPage: page >= totalPages
  };
}

/**
 * 异步操作状态
 */
export interface AsyncState<T = any> {
  // 数据
  data: T | null;
  // 是否正在加载
  isLoading: boolean;
  // 错误信息
  error: Error | null;
  // 最后更新时间
  lastUpdated: number | null;
  // 是否已初始化
  initialized: boolean;
}

/**
 * 创建默认异步状态
 * @param initialData 初始数据
 * @returns 异步状态对象
 */
export function createAsyncState<T = any>(initialData: T | null = null): AsyncState<T> {
  return {
    data: initialData,
    isLoading: false,
    error: null,
    lastUpdated: null,
    initialized: false
  };
}

/**
 * 创建列表状态
 * 用于创建统一的列表状态结构
 */
export function createListState<T>(
  initialItems: T[] = [],
  initialLoading: boolean = false
): AsyncState<T[]> & PaginatedResult<T> {
  return {
    // AsyncState属性
    data: initialItems,
    isLoading: initialLoading,
    error: null,
    lastUpdated: null,
    initialized: false,
    
    // PaginatedResult属性
    items: initialItems,
    total: initialItems.length,
    page: 1,
    pageSize: 10,
    hasMore: false,
    totalPages: 1,
    isFirstPage: true,
    isLastPage: true
  };
}

/**
 * 过滤条件项类型
 * 注意：不要与search.ts中的FilterType枚举混淆
 */
export interface FilterCondition {
  type: string;
  value: string | number | boolean;
  active: boolean;
  label?: string;
}

/**
 * 食材项类型 - 用于菜谱中的食材表示
 * 注意：与search.ts中的IngredientTag不同，后者用于搜索过滤
 * 此类型用于展示菜谱中的具体食材及其用量信息
 * 在一些旧组件中可能使用了name属性，如IngredientSelectorUI.tsx
 */
export interface IngredientItem {
  id?: string;
  name?: string;
  // 支持中文字段名，用于Supabase的数据
  名称?: string;  
  用量?: string;
  category?: string;
  icon?: string; // 图标URL或名称
  isCommon?: boolean; // 是否常见食材
  type?: string; // 食材类型
  quantity?: string;
  isRequired?: boolean;
  [key: string]: any; // 允许其他额外字段
}

// 不再重复定义IngredientTag，直接从search.ts导入

// 继续添加其他通用类型... 