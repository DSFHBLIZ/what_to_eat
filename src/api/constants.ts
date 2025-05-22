/**
 * API常量文件
 * 定义所有API相关的常量、枚举和默认配置
 */

/**
 * 缓存策略枚举
 */
export enum CacheStrategy {
  /** 不使用缓存 */
  NO_CACHE = 'NO_CACHE',
  /** 缓存优先 - 先检查缓存，缓存不存在或过期时才发送网络请求 */
  CACHE_FIRST = 'CACHE_FIRST',
  /** 网络优先 - 先发送网络请求，请求失败时才使用缓存 */
  NETWORK_FIRST = 'NETWORK_FIRST',
  /** 仅缓存 - 只使用缓存，不发送网络请求 */
  CACHE_ONLY = 'CACHE_ONLY',
  /** 仅网络 - 只发送网络请求，不使用缓存 */
  NETWORK_ONLY = 'NETWORK_ONLY',
  /** 后台更新 - 先使用缓存，然后在后台发送网络请求更新缓存 */
  STALE_WHILE_REVALIDATE = 'STALE_WHILE_REVALIDATE'
}

/**
 * 响应类型枚举
 */
export enum ResponseType {
  /** 标准API响应 */
  STANDARD = 'standard',
  /** 原始响应 */
  RAW = 'raw',
  /** 仅返回数据 */
  DATA_ONLY = 'data-only',
  /** 扩展响应(包含元数据) */
  ENHANCED = 'enhanced'
}

/**
 * 离线策略枚举
 */
export enum OfflineStrategy {
  /** 离线不处理 - 直接返回错误 */
  NONE = 'NONE',
  /** 离线队列 - 加入离线队列，等网络恢复时处理 */
  QUEUE = 'QUEUE',
  /** 离线使用缓存 - 离线时使用缓存 */
  USE_CACHE = 'USE_CACHE',
  /** 离线失败回调 - 调用指定的失败处理函数 */
  CUSTOM_FALLBACK = 'CUSTOM_FALLBACK'
}

/**
 * 请求方法枚举
 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

/**
 * API事件类型枚举
 */
export enum ApiEventType {
  REQUEST_START = 'api:request:start',
  REQUEST_SUCCESS = 'api:request:success',
  REQUEST_ERROR = 'api:request:error',
  REQUEST_COMPLETE = 'api:request:complete',
  OFFLINE_QUEUE_ADDED = 'api:offline:queue:added',
  OFFLINE_QUEUE_PROCESSED = 'api:offline:queue:processed',
  CACHE_HIT = 'api:cache:hit',
  CACHE_MISS = 'api:cache:miss',
  CACHE_SET = 'api:cache:set',
  CACHE_CLEARED = 'api:cache:cleared',
  NETWORK_STATUS_CHANGE = 'api:network:status:change',
  REQUEST_FAILURE = 'api:request:failure',
  REQUEST_CANCELED = 'api:request:canceled',
  REQUEST_RETRY = 'api:request:retry',
  CACHE_UPDATE = 'api:cache:update',
  REQUEST_QUEUE = 'api:queue:add',
  QUEUE_PROCESS = 'api:queue:process'
}

/**
 * 标准HTTP状态码
 */
export enum HttpStatusCode {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLY_HINTS = 103,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  MULTI_STATUS = 207,
  ALREADY_REPORTED = 208,
  IM_USED = 226,
  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  USE_PROXY = 305,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  MISDIRECTED_REQUEST = 421,
  UNPROCESSABLE_ENTITY = 422,
  LOCKED = 423,
  FAILED_DEPENDENCY = 424,
  TOO_EARLY = 425,
  UPGRADE_REQUIRED = 426,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  VARIANT_ALSO_NEGOTIATES = 506,
  INSUFFICIENT_STORAGE = 507,
  LOOP_DETECTED = 508,
  NOT_EXTENDED = 510,
  NETWORK_AUTHENTICATION_REQUIRED = 511
}

/**
 * 缓存相关常量
 */
export const CACHE = {
  /** 默认缓存过期时间(毫秒) - 5分钟 */
  DEFAULT_TTL: 5 * 60 * 1000,
  /** 最大缓存条目数 */
  MAX_ENTRIES: 100,
  /** 缓存键前缀 */
  KEY_PREFIX: 'api_cache:',
  /** 缓存存储键 */
  STORAGE_KEY: 'api_cache_store',
  /** 默认缓存策略 */
  DEFAULT_STRATEGY: CacheStrategy.NETWORK_FIRST
}

/**
 * 离线队列相关常量
 */
export const OFFLINE_QUEUE = {
  /** 默认队列最大长度 */
  MAX_LENGTH: 50,
  /** 默认重试最大次数 */
  MAX_RETRIES: 3,
  /** 默认重试延迟(毫秒) */
  RETRY_DELAY: 5000,
  /** 存储键 */
  STORAGE_KEY: 'offline_requests_queue',
  /** 默认离线策略 */
  DEFAULT_STRATEGY: OfflineStrategy.QUEUE,
  /** 默认请求优先级 */
  DEFAULT_PRIORITY: 5
}

/**
 * 请求超时相关常量
 */
export const TIMEOUT = {
  /** 默认请求超时时间(毫秒) */
  DEFAULT: 30000,
  /** 上传请求超时时间(毫秒) */
  UPLOAD: 60000,
  /** 下载请求超时时间(毫秒) */
  DOWNLOAD: 60000
}

/**
 * 网络状态事件
 */
export const NETWORK_EVENTS = {
  /** 网络状态变更 */
  NETWORK_STATUS_CHANGE: 'network:statusChange',
  /** 网络连接 */
  NETWORK_CONNECTED: 'network:connected',
  /** 网络断开 */
  NETWORK_DISCONNECTED: 'network:disconnected'
}

/**
 * 请求相关事件
 */
export const REQUEST_EVENTS = {
  /** 请求开始 */
  REQUEST_START: 'request:start',
  /** 请求成功 */
  REQUEST_SUCCESS: 'request:success',
  /** 请求失败 */
  REQUEST_FAILURE: 'request:failure',
  /** 请求完成(成功或失败) */
  REQUEST_COMPLETE: 'request:complete'
}

/**
 * 响应相关常量
 */
export const RESPONSE = {
  /** 默认响应类型 */
  DEFAULT_TYPE: ResponseType.STANDARD,
}

/**
 * 请求默认配置
 */
export const DEFAULT_CONFIG = {
  /** 默认请求基础URL */
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  /** 默认请求超时时间(ms) */
  TIMEOUT: 10000,
  /** 默认请求头 */
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  /** 默认缓存策略 */
  CACHE_STRATEGY: CacheStrategy.NO_CACHE,
  /** 默认缓存过期时间(ms) - 5分钟 */
  CACHE_TTL: 5 * 60 * 1000,
  /** 默认离线策略 */
  OFFLINE_STRATEGY: OfflineStrategy.NONE,
};

/**
 * 请求重试配置
 */
export const RETRY_CONFIG = {
  /** 最大重试次数 */
  MAX_RETRY_COUNT: 3,
  /** 重试延迟基数(ms) */
  RETRY_DELAY_BASE: 1000,
  /** 是否使用指数退避算法 */
  USE_EXPONENTIAL_BACKOFF: true,
  /** 指数退避算法因子 */
  BACKOFF_FACTOR: 2,
  /** 重试的状态码 */
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504]
};

/**
 * 可缓存的请求方法
 */
export const CACHEABLE_METHODS = [RequestMethod.GET, RequestMethod.HEAD];

/**
 * 可缓存的状态码
 */
export const CACHEABLE_STATUS_CODES = [200, 201, 304];

/**
 * 请求标识头
 */
export const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * 存储键
 */
export const STORAGE_KEYS = {
  CACHE_STORAGE: 'api-cache',
  OFFLINE_QUEUE: 'api-offline-queue',
  AUTH_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token'
};

/**
 * 批量请求配置
 */
export const BATCH_REQUEST_CONFIG = {
  maxBatchSize: 10,
  batchDelay: 50,
  endpointUrl: '/batch'
};

/**
 * API错误码
 */
export enum ApiErrorCode {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 请求超时 */
  TIMEOUT = 'TIMEOUT',
  /** 请求取消 */
  CANCEL = 'CANCEL',
  /** 请求参数错误 */
  PARAMS_ERROR = 'PARAMS_ERROR',
  /** 服务器错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** 授权失败 */
  AUTH_ERROR = 'AUTH_ERROR',
  /** 业务错误 */
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  /** 请求错误 */
  BAD_REQUEST = 'BAD_REQUEST',
  /** 资源未找到 */
  NOT_FOUND = 'NOT_FOUND'
}

/**
 * HTTP状态码到API错误码的映射
 */
export const HTTP_STATUS_TO_API_ERROR_CODE: Record<number, ApiErrorCode> = {
  [HttpStatusCode.BAD_REQUEST]: ApiErrorCode.BAD_REQUEST,
  [HttpStatusCode.UNAUTHORIZED]: ApiErrorCode.AUTH_ERROR,
  [HttpStatusCode.FORBIDDEN]: ApiErrorCode.AUTH_ERROR,
  [HttpStatusCode.NOT_FOUND]: ApiErrorCode.NOT_FOUND,
  [HttpStatusCode.METHOD_NOT_ALLOWED]: ApiErrorCode.PARAMS_ERROR,
  [HttpStatusCode.NOT_ACCEPTABLE]: ApiErrorCode.PARAMS_ERROR,
  [HttpStatusCode.REQUEST_TIMEOUT]: ApiErrorCode.TIMEOUT,
  [HttpStatusCode.CONFLICT]: ApiErrorCode.BUSINESS_ERROR,
  [HttpStatusCode.GONE]: ApiErrorCode.NOT_FOUND,
  [HttpStatusCode.LENGTH_REQUIRED]: ApiErrorCode.PARAMS_ERROR,
  [HttpStatusCode.PRECONDITION_FAILED]: ApiErrorCode.PARAMS_ERROR,
  [HttpStatusCode.PAYLOAD_TOO_LARGE]: ApiErrorCode.PARAMS_ERROR,
  [HttpStatusCode.URI_TOO_LONG]: ApiErrorCode.PARAMS_ERROR,
  [HttpStatusCode.UNSUPPORTED_MEDIA_TYPE]: ApiErrorCode.PARAMS_ERROR,
  [HttpStatusCode.TOO_MANY_REQUESTS]: ApiErrorCode.BUSINESS_ERROR,
  [HttpStatusCode.INTERNAL_SERVER_ERROR]: ApiErrorCode.SERVER_ERROR,
  [HttpStatusCode.NOT_IMPLEMENTED]: ApiErrorCode.SERVER_ERROR,
  [HttpStatusCode.BAD_GATEWAY]: ApiErrorCode.SERVER_ERROR,
  [HttpStatusCode.SERVICE_UNAVAILABLE]: ApiErrorCode.SERVER_ERROR,
  [HttpStatusCode.GATEWAY_TIMEOUT]: ApiErrorCode.TIMEOUT
}; 