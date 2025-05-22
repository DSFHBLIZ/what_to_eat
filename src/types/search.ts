/**
 * 搜索和过滤相关的类型定义
 */

// 单个食材或配料定义
export interface Ingredient {
  name: string;          // 食材名称
  quantity?: string;     // 用量信息
}

// 过滤器类型枚举
export enum FilterType {
  INGREDIENT = 'ingredient',
  SEASONING = 'seasoning',
  CUISINE = 'cuisine',
  FLAVOR = 'flavor',
  DIFFICULTY = 'difficulty',
  DIETARY = 'dietary',
  TAG = 'tag',
  AVOID = 'avoid'  // 添加忌口类型
}

// 过滤标签项
export interface FilterTag {
  id: string;
  label: string;
  value: string;
  type: FilterType;
}

// 搜索项
export interface SearchItem {
  id: string;
  label: string;
}

// 食材标签
export interface IngredientTag {
  id: string;
  tag: string;
  type: FilterType;
}

// 食材搜索结果
export interface IngredientSearchResult {
  id: string;
  name: string;
  category?: string;
  popularity?: number;
}

// 搜索获取器函数类型
export type SearchFetcherFn = (query: string) => Promise<SearchItem[]>;

// 搜索设置
export interface SearchSettings {
  maxResults?: number;
  minLength?: number;
  placeholder?: string;
  noResultsMessage?: string;
}

// 搜索状态
export interface SearchState {
  query: string;
  isLoading: boolean;
  results: SearchItem[];
  error: string | null;
}

// 过滤对象
export interface Filter {
  type: FilterType;
  value: string;
  label: string;
}

// 过滤状态
export interface FilterState {
  // 必选食材
  requiredIngredients: IngredientTag[];
  // 可选食材
  optionalIngredients: IngredientTag[];
  // 忌口食材（不能包含的食材）
  avoidIngredients: IngredientTag[];
  // 菜系
  cuisines: string[];
  // 口味
  flavors: string[];
  // 难度
  difficulties: string[];
  // 饮食限制
  dietaryRestrictions: string[];
  // 应用的过滤器
  appliedFilters: Record<string, boolean>;
  // 搜索查询
  searchQuery: string;
  // 标签逻辑（AND/OR）
  tagLogic: 'AND' | 'OR';
}

// 搜索结果项
export interface SearchResultItem {
  id: string;                      // 结果唯一标识符
  name: string;                    // 结果名称
  matchScore?: number;             // 匹配分数
  cuisine?: string;                // 菜系
  difficulty?: string;             // 难度
  cookingTime?: number | string;   // 烹饪时间
  flavorProfile?: string[];        // 口味特点
  ingredients?: (Ingredient | string)[]; // 食材列表(支持对象或字符串)
  matchedIngredients?: string[];   // 匹配的食材
  // 兼容原有属性
  title?: string;                  // 标题(兼容原名称字段)
  description?: string;            // 描述
  imageUrl?: string;               // 图片URL
  url?: string;                    // 链接
  type?: string;                   // 类型
  relevanceScore?: number;         // 相关性得分(兼容matchScore)
  highlights?: string[];           // 高亮匹配内容
  category?: string;               // 分类
  tags?: string[];                 // 标签
  timestamp?: number;              // 时间戳
  author?: string;                 // 作者
}

// 搜索结果数组
export type SearchResults = SearchResultItem[];

// 搜索结果集合(用于分页)
export interface SearchResultsPage {
  items: SearchResultItem[];       // 搜索结果项数组
  totalCount?: number;             // 结果总数
  pageSize?: number;               // 每页显示数量
  currentPage?: number;            // 当前页码
  query?: string;                  // 搜索查询
  filters?: Record<string, any>;   // 应用的过滤条件
  sortBy?: string;                 // 排序方式
  timeTaken?: number;              // 搜索耗时（毫秒）
}

// 搜索过滤器
export interface SearchFilter {
  field: string;                   // 过滤字段
  value: any;                      // 过滤值
  operator?: string;               // 操作符（如等于、大于、小于等）
}

// 搜索排序选项
export interface SearchSortOption {
  field: string;                  // 排序字段
  direction: 'asc' | 'desc';      // 排序方向
}

// 获取默认的空搜索结果
export function getEmptySearchResults(): SearchResults {
  return [];
}

// 获取默认的空搜索结果页
export function getEmptySearchResultsPage(): SearchResultsPage {
  return {
    items: [],
    totalCount: 0,
    pageSize: 10,
    currentPage: 1
  };
}

// 过滤器选项类型
export interface FilterOption {
  value: string;
  label?: string;
}

// 过滤器模式
export type FilterMode = 'option' | 'tag' | 'category' | 'header' | 'section';

// 过滤器展开模式
export type FilterExpandMode = 'always' | 'click' | 'hover' | 'none';

// 过滤器组接口
export interface FilterGroupProps {
  // 基础数据
  title: string;
  type: FilterType | string;
  options: FilterOption[] | string[];
  
  // 布局和UI配置
  mode?: FilterMode;
  expandMode?: FilterExpandMode;
  maxInitialItems?: number;
  className?: string;
  contentClassName?: string;
  
  // 显示控制
  showActiveCount?: boolean;
  showClearButton?: boolean;
  showBorder?: boolean;
  showTitle?: boolean;
  
  // 交互配置
  onFilterChange?: (type: string, value: string, isActive: boolean) => void;
} 