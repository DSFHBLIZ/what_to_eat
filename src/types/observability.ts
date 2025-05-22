/**
 * 观测性和事件系统公共类型定义
 */

// ============== 基础定义 ==============

// 上下文类型
export interface BaseContext {
  // 追踪相关
  traceId?: string;
  spanId?: string;
  requestId?: string;
  
  // 用户和会话相关
  userId?: string;
  sessionId?: string;
  
  // 环境信息
  origin?: 'client' | 'server' | 'worker';
  environment?: string;
  version?: string;
  
  // 额外信息
  [key: string]: any;
}

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// ============== 事件系统 ==============

// 基础事件接口
export interface BaseEvent {
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * 通用领域事件类型
 * 使用泛型约束统一不同类型的事件结构
 */
export interface DomainEvent<TName extends string, TPayload extends object = {}> extends BaseEvent {
  readonly type: TName;  // 事件类型名称
  readonly payload: TPayload; // 事件载荷
}

// 事件处理器类型
export type EventHandler<T> = (event: T) => void;

// 用户操作事件
export namespace UserEvent {
  // 用户搜索事件
  export type Search = DomainEvent<'user:search', {
    query: string;
    requiredIngredients: string[];
    optionalIngredients: string[];
    filters?: Record<string, any>;
  }>;
  
  // 用户查看食谱事件
  export type ViewRecipe = DomainEvent<'user:view-recipe', {
    recipeId: string;
    recipeName: string;
    source?: string; // 来源：search, recommend, favorite, etc.
  }>;
  
  // 用户收藏食谱事件
  export type FavoriteRecipe = DomainEvent<'user:favorite-recipe', {
    recipeId: string;
    isFavorited: boolean; // true = 收藏，false = 取消收藏
  }>;
  
  // 用户过滤事件
  export type Filter = DomainEvent<'user:filter', {
    filterType: string;
    filterValue: string | number | boolean;
    isActive: boolean;
  }>;
  
  // 用户标签事件
  export type Tag = DomainEvent<'user:tag', {
    action: 'add' | 'remove';
    tagName: string;
    tagType: string;
  }>;
}

// UI事件
export namespace UIEvent {
  // 通知事件
  export type Notification = DomainEvent<'ui:notification', {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    dismissable?: boolean;
  }>;
  
  // 错误事件
  export type Error = DomainEvent<'ui:error', {
    error: any;
    componentStack?: string;
    additionalInfo?: Record<string, any>;
  }>;
  
  // 主题变更事件
  export type ThemeChange = DomainEvent<'ui:theme-change', {
    theme: 'light' | 'dark' | 'system';
    source: 'user' | 'system';
  }>;
  
  // 主题应用完成事件
  export type ThemeApplied = DomainEvent<'ui:theme-applied', {
    theme: 'light' | 'dark';
    duration: number; // 应用主题所需时间(ms)
  }>;
  
  // 模态窗口事件
  export type Modal = DomainEvent<'ui:modal', {
    action: 'open' | 'close';
    modalId: string;
    data?: any;
  }>;
}

// 数据事件
export namespace DataEvent {
  // 数据加载事件
  export type DataLoading = DomainEvent<'data:loading', {
    dataType: string;
    source: string;
    params?: Record<string, any>;
  }>;
  
  // 数据加载完成事件
  export type DataLoaded = DomainEvent<'data:loaded', {
    dataType: string;
    source: string;
    count?: number;
    duration: number;
    params?: Record<string, any>;
  }>;
  
  // 数据加载失败事件
  export type DataLoadError = DomainEvent<'data:load-error', {
    dataType: string;
    source: string;
    error: any;
    params?: Record<string, any>;
  }>;
  
  // 数据更新事件
  export type DataUpdated = DomainEvent<'data:updated', {
    dataType: string;
    changeType: 'create' | 'update' | 'delete' | 'bulk';
    ids: string[];
  }>;
  
  // 缓存事件
  export type Cache = DomainEvent<'data:cache', {
    action: 'set' | 'get' | 'delete' | 'clear';
    key: string;
    namespace: string;
    hit?: boolean; // 缓存命中状态
  }>;
}

// API事件
export namespace APIEvent {
  // API调用开始事件
  export type CallStart = DomainEvent<'api:call-start', {
    endpoint: string;
    method: string;
    params?: Record<string, any>;
    requestId: string;
  }>;
  
  // API调用成功事件
  export type CallSuccess = DomainEvent<'api:call-success', {
    endpoint: string;
    method: string;
    requestId: string;
    duration: number;
    status: number;
  }>;
  
  // API调用失败事件
  export type CallError = DomainEvent<'api:call-error', {
    endpoint: string;
    method: string;
    requestId: string;
    duration: number;
    status?: number;
    error: any;
    retryCount?: number;
  }>;
}

// 系统事件
export namespace SystemEvent {
  // 性能事件
  export type Performance = DomainEvent<'system:performance', {
    metricName: string;
    value: number;
    unit: 'ms' | 'bytes' | 'percent' | 'count';
  }>;
  
  // 生命周期事件
  export type Lifecycle = DomainEvent<'system:lifecycle', {
    action: 'init' | 'mount' | 'update' | 'unmount' | 'error';
    componentName: string;
    duration?: number;
  }>;
  
  // 路由事件
  export type Route = DomainEvent<'system:route', {
    from: string;
    to: string;
    duration?: number;
  }>;
}

// 存储事件
export namespace StoreEvent {
  // 存储数据变更事件
  export type DataChanged = DomainEvent<'store:data:changed', {
    type: string;
    id: string;
    requestId: string;
    result?: any;
    args?: any[];
    source?: string;
  }>;
  
  // 存储错误事件
  export type ErrorOccurred = DomainEvent<'store:error:occurred', {
    type: string;
    id: string;
    requestId: string;
    error: any;
    args?: any[];
    source: string;
  }>;
  
  // 存储操作开始事件
  export type ActionStarted = DomainEvent<'store:action:started', {
    id: string;
    requestId: string;
    args?: any[];
    prefix?: string;
  }>;
  
  // 存储操作成功事件
  export type ActionSuccess = DomainEvent<'store:action:success', {
    id: string;
    requestId: string;
    result?: any;
    args?: any[];
    prefix?: string;
  }>;
  
  // 存储操作完成事件
  export type ActionCompleted = DomainEvent<'store:action:completed', {
    id: string;
    requestId: string;
    args?: any[];
    prefix?: string;
  }>;
  
  // 存储操作错误事件
  export type ActionError = DomainEvent<'store:action:error', {
    id: string;
    requestId: string;
    error: any;
    args?: any[];
    prefix?: string;
    source: string;
  }>;
}

// 所有领域事件类型映射
export interface DomainEventMap {
  // 用户事件
  'user:search': UserEvent.Search;
  'user:view-recipe': UserEvent.ViewRecipe;
  'user:favorite-recipe': UserEvent.FavoriteRecipe;
  'user:filter': UserEvent.Filter;
  'user:tag': UserEvent.Tag;
  
  // UI事件
  'ui:notification': UIEvent.Notification;
  'ui:error': UIEvent.Error;
  'ui:theme-change': UIEvent.ThemeChange;
  'ui:theme-applied': UIEvent.ThemeApplied;
  'ui:modal': UIEvent.Modal;
  
  // 数据事件
  'data:loading': DataEvent.DataLoading;
  'data:loaded': DataEvent.DataLoaded;
  'data:load-error': DataEvent.DataLoadError;
  'data:updated': DataEvent.DataUpdated;
  'data:cache': DataEvent.Cache;
  
  // API事件
  'api:call-start': APIEvent.CallStart;
  'api:call-success': APIEvent.CallSuccess;
  'api:call-error': APIEvent.CallError;
  
  // 系统事件
  'system:performance': SystemEvent.Performance;
  'system:lifecycle': SystemEvent.Lifecycle;
  'system:route': SystemEvent.Route;
  
  // 存储事件
  'store:data:changed': StoreEvent.DataChanged;
  'store:error:occurred': StoreEvent.ErrorOccurred;
  'store:action:started': StoreEvent.ActionStarted;
  'store:action:success': StoreEvent.ActionSuccess;
  'store:action:completed': StoreEvent.ActionCompleted;
  'store:action:error': StoreEvent.ActionError;
}

// 所有事件键的联合类型
export type DomainEventKey = keyof DomainEventMap;

// 事件常量，用于避免字符串硬编码
export const EventTypes = {
  // 用户事件
  USER_SEARCH: 'user:search' as const,
  USER_VIEW_RECIPE: 'user:view-recipe' as const,
  USER_FAVORITE_RECIPE: 'user:favorite-recipe' as const,
  USER_FILTER: 'user:filter' as const,
  USER_TAG: 'user:tag' as const,
  
  // UI事件
  UI_NOTIFICATION: 'ui:notification' as const,
  UI_ERROR: 'ui:error' as const,
  UI_THEME_CHANGE: 'ui:theme-change' as const,
  UI_THEME_APPLIED: 'ui:theme-applied' as const,
  UI_MODAL: 'ui:modal' as const,
  
  // 数据事件
  DATA_LOADING: 'data:loading' as const,
  DATA_LOADED: 'data:loaded' as const,
  DATA_LOAD_ERROR: 'data:load-error' as const,
  DATA_UPDATED: 'data:updated' as const,
  DATA_CACHE: 'data:cache' as const,
  DATA_CHANGED: 'data:changed' as const,
  
  // API事件
  API_CALL_START: 'api:call-start' as const,
  API_CALL_SUCCESS: 'api:call-success' as const,
  API_CALL_ERROR: 'api:call-error' as const,
  
  // 系统事件
  SYSTEM_PERFORMANCE: 'system:performance' as const,
  SYSTEM_LIFECYCLE: 'system:lifecycle' as const,
  SYSTEM_ROUTE: 'system:route' as const,
  
  // 认证相关
  AUTH_LOGIN: 'auth:login' as const,
  AUTH_LOGOUT: 'auth:logout' as const,
  AUTH_REGISTER: 'auth:register' as const,
  AUTH_CHANGE: 'auth:change' as const,
  
  // 其他常用事件
  USER_UPDATE: 'user:update' as const,
  USER_PREFERENCES_CHANGE: 'user:preferences:change' as const,
  NETWORK_STATUS_CHANGE: 'network:status:change' as const,
  APP_INITIALIZED: 'app:initialized' as const,
  ERROR_OCCURRED: 'error:occurred' as const,
  ERROR_RESOLVED: 'error:resolved' as const,
  RECIPE_SAVED: 'recipe:saved' as const,
  RECIPE_REMOVED: 'recipe:removed' as const,
  THEME_CHANGED: 'theme:changed' as const,
  LANGUAGE_CHANGED: 'language:changed' as const,
  NOTIFICATION_NEW: 'notification:new' as const,
  MODAL_OPEN: 'modal:open' as const,
  MODAL_CLOSE: 'modal:close' as const,
  
  // 存储事件
  STORE_DATA_CHANGED: 'store:data:changed' as const,
  STORE_ERROR_OCCURRED: 'store:error:occurred' as const,
  STORE_ACTION_STARTED: 'store:action:started' as const,
  STORE_ACTION_SUCCESS: 'store:action:success' as const,
  STORE_ACTION_COMPLETED: 'store:action:completed' as const,
  STORE_ACTION_ERROR: 'store:action:error' as const,
};

// 创建事件助手函数
export function createEvent<K extends DomainEventKey>(
  type: K, 
  payload: Omit<DomainEventMap[K]['payload'], 'timestamp' | 'metadata'>, 
  metadata?: Record<string, any>
): DomainEventMap[K] {
  return {
    type,
    timestamp: Date.now(),
    metadata,
    payload: payload as any,
  } as DomainEventMap[K];
}

// ============== 观测性系统 ==============

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  component: string;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

// 指标类型
export enum MetricType {
  COUNTER = 'counter',   // 只增不减的计数器
  GAUGE = 'gauge',       // 可增可减的仪表盘
  HISTOGRAM = 'histogram', // 统计分布
  TIMER = 'timer'        // 时间测量
}

// 指标值类型
export type MetricValue = number | { min?: number; max?: number; avg?: number; p95?: number; p99?: number; count?: number };

// 指标条目
export interface MetricEntry {
  id: string;
  name: string;
  timestamp: number;
  type: MetricType;
  value: MetricValue;
  tags?: Record<string, string | number | boolean>;
  component?: string;
}

// 跟踪跨度类型
export enum SpanType {
  HTTP_REQUEST = 'http_request',
  DB_QUERY = 'db_query',
  RENDER = 'render',
  STATE_UPDATE = 'state_update',
  EVENT = 'event',
  OPERATION = 'operation'
}

// 跟踪跨度状态
export enum SpanStatus {
  ACTIVE = 'active',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled'
}

// 跟踪跨度
export interface Span {
  id: string;
  name: string;
  type: SpanType;
  traceId: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: SpanStatus;
  component?: string;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

// 观测点 - 包含所有类型的观测数据
export interface ObservabilityPoint {
  type: 'log' | 'metric' | 'span';
  data: LogEntry | MetricEntry | Span;
}

// 可观测性配置项
export interface ObservabilityConfig {
  // 基本配置
  enabled: boolean;
  logLevel: LogLevel;
  sampleRate: number;
  
  // 输出目标配置
  outputs: {
    console: boolean;
    localStorage: boolean;
    networkLogger?: {
      endpoint?: string;
      batchSize?: number;
      flushInterval?: number;
    };
  };
  
  // 功能开关
  features: {
    logs: boolean;
    metrics: boolean;
    traces: boolean;
    events: boolean;
  };
  
  // 系统级配置
  system: {
    captureErrors: boolean;
    captureRejections: boolean;
    captureConsole: boolean;
    tracingEnabled: boolean;
    metricsInterval: number;
  };
  
  // 组件过滤器
  componentFilter?: {
    include?: string[];
    exclude?: string[];
  };
  
  // 采样配置
  sampling?: {
    logs?: number;
    metrics?: number;
    traces?: number;
  };
}

// 可观测性上下文 - 扩展基础上下文
export interface ObservabilityContext extends BaseContext {
  // 设备信息
  deviceInfo?: {
    userAgent?: string;
    screenSize?: string;
    language?: string;
    platform?: string;
  };
  
  // 页面信息
  pageUrl?: string;
}

// 可观测性API接口
export interface ObservabilityAPI {
  // 日志方法
  log(level: LogLevel, message: string, context?: Record<string, any>): string;
  debug(message: string, context?: Record<string, any>): string;
  info(message: string, context?: Record<string, any>): string;
  warn(message: string, context?: Record<string, any>): string;
  error(message: string | Error, context?: Record<string, any>): string;
  critical(message: string | Error, context?: Record<string, any>): string;
  
  // 事件相关
  emitEvent<T extends BaseEvent>(eventName: string, event: T): void;
  addEventHandler(handler: (eventName: string, event: any) => void): () => void;
  
  // 指标方法
  recordMetric(name: string, value: number, type?: MetricType, tags?: Record<string, any>): void;
  incrementCounter(name: string, value?: number, tags?: Record<string, any>): void;
  recordTimer(name: string, timeMs: number, tags?: Record<string, any>): void;
  startTimer(name: string, tags?: Record<string, any>): () => number;
  
  // 追踪方法
  startSpan(name: string, type: SpanType, attributes?: Record<string, any>): string;
  endSpan(spanId: string, status?: SpanStatus, attributes?: Record<string, any>): void;
  addSpanEvent(spanId: string, name: string, attributes?: Record<string, any>): void;
  withSpan<T>(name: string, type: SpanType, fn: () => T, attributes?: Record<string, any>): T;
  
  // 上下文方法
  setContext(context: Partial<ObservabilityContext>): void;
  getContext(): ObservabilityContext;
  withContext<T>(context: Partial<ObservabilityContext>, fn: () => T): T;
  
  // 配置方法
  configure(config: Partial<ObservabilityConfig>): void;
  getConfiguration(): ObservabilityConfig;
  
  // 清理和导出
  flush(): Promise<void>;
  clearAll(): void;
  export(): ObservabilityPoint[];
}

import { IngredientTag } from './search';

export interface SearchAnalyticsData {
  query: string;
  requiredIngredients: IngredientTag[];
  optionalIngredients: IngredientTag[];
  filters: Record<string, any>;
  resultsCount: number;
  searchTime: number;
} 