/**
 * API 相关类型定义
 * 包含从 unified/types.ts 合并的通用类型
 */
import { 
  CacheStrategy, 
  OfflineStrategy,
  ResponseType,
  RequestMethod
} from './constants';

// 模拟 axios 类型定义
type AxiosRequestConfig = any;
type AxiosResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: any;
  request?: any;
};
type AxiosError = any;

/**
 * API响应状态枚举
 */
export enum ApiResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  PENDING = 'pending'
}

/**
 * 标准API响应接口
 * 统一的API响应格式
 */
export interface ApiResponse<T = any> {
  status: ApiResponseStatus | number;
  data: T;
  message?: string;
  code?: string;
  errors?: ApiError[];
  pagination?: ApiPagination;
  meta?: Record<string, any>;
  headers?: Record<string, string>;
  statusText?: string;
  ok?: boolean;
}

/**
 * API错误接口
 */
export interface ApiError {
  field?: string;
  message: string;
  code: string;
  status?: number;
  statusText?: string;
  data?: any;
  config?: any;
  request?: Request;
  response?: Response;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
  isAbortError?: boolean;
  isServerError?: boolean;
}

/**
 * API分页信息接口
 */
export interface ApiPagination {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 缓存配置接口
 */
export interface CacheOptions {
  strategy?: CacheStrategy;
  ttl?: number;
  key?: string;
  group?: string;
}

/**
 * 离线配置接口
 */
export interface OfflineOptions {
  strategy?: OfflineStrategy;
  priority?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * 增强型请求配置接口
 */
export interface EnhancedRequestConfig extends AxiosRequestConfig {
  requestId?: string;
  requestStartTime?: number;
  cache?: CacheOptions;
  offline?: OfflineOptions;
  responseType?: string;
  skipErrorHandling?: boolean;
  skipAuthCheck?: boolean;
  skipLoading?: boolean;
  retry?: {
    count: number;
    delay: number;
    statusCodes?: number[];
  };
  abortSignal?: AbortSignal;
  groupKey?: string;
  mockData?: any;
  dependentRequests?: string[];
}

/**
 * 缓存元数据接口
 */
export interface CacheMetadata {
  timestamp: number;
  expires: number;
  key: string;
  url: string;
  group?: string;
}

/**
 * 增强型响应接口
 */
export interface EnhancedResponse<T = any> extends AxiosResponse<T> {
  duration?: number;
  requestId?: string;
  fromCache?: boolean;
  cacheDate?: number;
  isOffline?: boolean;
  _meta?: CacheMetadata;
}

/**
 * 请求拦截器类型
 */
export type RequestInterceptor = (config: EnhancedRequestConfig) => EnhancedRequestConfig | void;

/**
 * 响应拦截器类型
 */
export type ResponseInterceptor = (response: EnhancedResponse) => EnhancedResponse | void;

/**
 * 错误拦截器类型
 */
export type ErrorInterceptor = (error: any) => any | void;

/**
 * 请求事件类型
 */
export interface RequestEvent {
  url?: string;
  method?: string;
  requestId: string;
  duration?: number;
  status?: number;
  error?: any;
}

/**
 * 离线队列项接口
 */
export interface OfflineQueueItem {
  id: string;
  config: EnhancedRequestConfig;
  timestamp: number;
  priority: number;
  retryCount: number;
  retryDelay: number;
  lastRetry?: number;
}

/**
 * 缓存项接口
 */
export interface CacheItem<T = any> {
  key: string;
  data: T;
  metadata: CacheMetadata;
}

/**
 * 缓存管理器接口
 */
export interface CacheManager<T = any> {
  get: <D = any>(config: EnhancedRequestConfig) => Promise<D | null>;
  set: <D = any>(config: EnhancedRequestConfig, data: D) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: (group?: string) => Promise<void>;
  getCacheKey: (config: EnhancedRequestConfig) => string;
  getKeys: () => Promise<string[]>;
  getSize: () => Promise<number>;
  purgeExpired: () => Promise<void>;
}

/**
 * 离线管理器接口
 */
export interface OfflineManager {
  queueRequest: (config: EnhancedRequestConfig) => Promise<void>;
  processQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  getQueueSize: () => Promise<number>;
  getQueueItems: () => Promise<OfflineQueueItem[]>;
  removeQueueItem: (id: string) => Promise<void>;
}

/**
 * API请求结果类型
 */
export type ApiResult<T> = Promise<ApiResponse<T>>;

/**
 * API请求配置 (简化版)
 */
export type ApiRequestConfig = Omit<EnhancedRequestConfig, 'url' | 'method' | 'baseURL'>;

/**
 * 批量请求项
 */
export interface BatchRequestItem<T = any> {
  id: string;
  request: EnhancedRequestConfig;
  response?: ApiResponse<T>;
  error?: any;
}

/**
 * HTTP客户端接口
 */
export interface IHttpClient {
  request<T = any>(config: EnhancedRequestConfig): Promise<T>;
  get<T = any>(url: string, config?: EnhancedRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: EnhancedRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: EnhancedRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: EnhancedRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: EnhancedRequestConfig): Promise<T>;
  cancel(requestId: string): void;
  addRequestInterceptor(interceptor: RequestInterceptor): number;
  removeRequestInterceptor(id: number): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): number;
  removeResponseInterceptor(id: number): void;
  addErrorInterceptor(interceptor: ErrorInterceptor): number;
  removeErrorInterceptor(id: number): void;
}

/**
 * 请求配置
 */
export interface RequestConfig {
  /** 请求URL */
  url: string;
  /** HTTP方法 */
  method: RequestMethod;
  /** 请求头 */
  headers?: Record<string, string>;
  /** URL查询参数 */
  params?: Record<string, any>;
  /** 请求体数据 */
  data?: any;
  /** 请求超时时间(ms) */
  timeout?: number;
  /** 缓存策略 */
  cacheStrategy?: CacheStrategy;
  /** 缓存过期时间(ms) */
  cacheTTL?: number;
  /** 离线处理策略 */
  offlineStrategy?: OfflineStrategy;
  /** 请求标识(用于取消请求等) */
  requestId?: string;
  /** 其他自定义配置 */
  [key: string]: any;
}

/**
 * 响应配置
 */
export interface ResponseConfig {
  /** 响应数据 */
  data: any;
  /** HTTP状态码 */
  status: number;
  /** HTTP状态文本 */
  statusText: string;
  /** 响应头 */
  headers: Record<string, string>;
}

/**
 * HTTP客户端接口
 */
export interface HttpClient {
  /**
   * 添加请求拦截器
   * @param interceptor 请求拦截器函数
   */
  addRequestInterceptor(interceptor: RequestInterceptor): HttpClient;
  
  /**
   * 添加响应拦截器
   * @param interceptor 响应拦截器函数
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): HttpClient;
  
  /**
   * 执行请求
   * @param config 请求配置
   */
  request<T = any>(config: RequestConfig): Promise<T>;
  
  /**
   * GET请求
   * @param url 请求URL
   * @param params 查询参数
   * @param config 其他配置
   */
  get<T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<T>;
  
  /**
   * POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 其他配置
   */
  post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T>;
  
  /**
   * PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 其他配置
   */
  put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T>;
  
  /**
   * DELETE请求
   * @param url 请求URL
   * @param config 其他配置
   */
  delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T>;
  
  /**
   * PATCH请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 其他配置
   */
  patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T>;
} 