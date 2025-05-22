/**
 * 可观测性系统
 * 统一的日志、指标和追踪管理
 */

// 导出类型
export * from '../types/observability';

// 导出核心实现
export { observability } from './core';

// 导入核心实现
import { observability } from './core';
import { 
  LogLevel, 
  SpanType, 
  SpanStatus,
  MetricType,
  ObservabilityConfig,
  DomainEventKey
} from '../types/observability';

// 更简短的别名
export const log = observability;

/**
 * 初始化可观测性系统
 * @param config 配置选项
 */
export function initObservability(config?: Partial<ObservabilityConfig>): void {
  if (config) {
    observability.configure(config);
  }
  
  // 在开发模式下添加全局错误处理
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    setupGlobalHandlers();
  }
  
  // 记录初始化信息
  observability.info('可观测性系统初始化完成', {
    component: 'observability',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 设置全局错误和性能处理
 */
function setupGlobalHandlers(): void {
  // 捕获未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    observability.error(event.reason || '未知 Promise 拒绝', {
      component: 'global',
      type: 'unhandledrejection',
    });
  });
  
  // 捕获全局错误
  window.addEventListener('error', (event) => {
    observability.error(event.error || event.message, {
      component: 'global',
      type: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  // 捕获网络错误
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    // 获取URL和方法
    let url: string;
    let method: string;
    
    if (typeof input === 'string') {
      url = input;
      method = init?.method || 'GET';
    } else if (input instanceof Request) {
      url = input.url;
      method = input.method;
    } else {
      // 处理URL对象
      url = input.toString();
      method = init?.method || 'GET';
    }
    
    const spanId = observability.startSpan(`fetch ${method}`, SpanType.HTTP_REQUEST, {
      component: 'network',
      url,
      method,
    });
    
    try {
      const response = await originalFetch(input, init);
      
      observability.endSpan(
        spanId, 
        response.ok ? SpanStatus.SUCCESS : SpanStatus.ERROR, 
        {
          status: response.status,
          statusText: response.statusText,
        }
      );
      
      return response;
    } catch (error) {
      observability.endSpan(
        spanId, 
        SpanStatus.ERROR, 
        {
          error: String(error),
        }
      );
      
      throw error;
    }
  };
  
  // 捕获性能指标
  if ('performance' in window && 'PerformanceObserver' in window) {
    try {
      // 监控长任务
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const duration = entry.duration;
          if (duration > 50) { // 超过50ms的任务
            observability.recordMetric('longtask.duration', duration, MetricType.TIMER, {
              component: 'performance',
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      
      // 监控布局偏移
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          // 累积布局偏移分数
          if (entry.hadRecentInput === false) {
            observability.recordMetric('layout.shift', entry.value, MetricType.GAUGE, {
              component: 'performance',
            });
          }
        });
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      
      // 监控首次内容绘制
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const metricName = entry.name === 'first-paint' ? 'paint.fp' : 'paint.fcp';
          observability.recordMetric(metricName, entry.startTime, MetricType.TIMER, {
            component: 'performance',
          });
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      observability.warn('性能观察器初始化失败', {
        component: 'observability',
        error: String(e),
      });
    }
  }
}

// 导出标准化的日志级别函数
export const logger = {
  debug: (message: string, context?: Record<string, any>) => observability.debug(message, context),
  log: (message: string, context?: Record<string, any>) => observability.info(message, context),
  info: (message: string, context?: Record<string, any>) => observability.info(message, context),
  warn: (message: string, context?: Record<string, any>) => observability.warn(message, context),
  error: (message: string | Error, context?: Record<string, any>) => observability.error(message, context),
};

// 导出性能跟踪函数
export const metrics = {
  increment: (name: string, value: number = 1, tags?: Record<string, any>) => 
    observability.incrementCounter(name, value, tags),
  gauge: (name: string, value: number, tags?: Record<string, any>) => 
    observability.recordMetric(name, value, MetricType.GAUGE, tags),
  timer: (name: string, timeMs: number, tags?: Record<string, any>) => 
    observability.recordTimer(name, timeMs, tags),
  startTimer: (name: string, tags?: Record<string, any>) => 
    observability.startTimer(name, tags),
};

/**
 * 事件分析相关功能
 */

// 事件统计状态
const eventAnalyticsState = {
  // 事件计数器
  eventCounts: {} as Record<string, number>,
  // 事件序列（最近的n个事件）
  recentEvents: [] as Array<{ name: string; timestamp: number }>,
  maxRecentEvents: 100
};

/**
 * 更新事件统计信息
 * @param eventName 事件名称
 * @param event 事件数据
 */
function updateEventAnalytics(eventName: string, event: any): void {
  // 更新计数
  eventAnalyticsState.eventCounts[eventName] = (eventAnalyticsState.eventCounts[eventName] || 0) + 1;
  
  // 添加到最近事件
  eventAnalyticsState.recentEvents.unshift({ 
    name: eventName, 
    timestamp: event.timestamp || Date.now() 
  });
  
  // 限制历史记录大小
  if (eventAnalyticsState.recentEvents.length > eventAnalyticsState.maxRecentEvents) {
    eventAnalyticsState.recentEvents.pop();
  }
}

/**
 * 获取事件统计信息
 */
export function getEventAnalytics(): {
  counts: Record<string, number>;
  recentEvents: Array<{ name: string; timestamp: number }>;
} {
  return {
    counts: { ...eventAnalyticsState.eventCounts },
    recentEvents: [...eventAnalyticsState.recentEvents]
  };
}

/**
 * 事件过滤功能
 */
let enabledEventFilter: Set<DomainEventKey> | null = null;

/**
 * 设置事件过滤器
 * @param events 要显示的事件列表，如果为空则禁用过滤
 */
export function setEventFilter(events: DomainEventKey[] | null): void {
  enabledEventFilter = events ? new Set(events) : null;
}

/**
 * 检查事件是否被过滤
 * @param eventName 事件名称
 */
export function isEventFiltered(eventName: DomainEventKey): boolean {
  // 只在非生产环境中启用过滤
  if (process.env.NODE_ENV === 'production') return false;
  
  // 如果没有设置过滤，则不过滤任何事件
  if (enabledEventFilter === null) return false;
  
  // 如果事件在启用列表中，则不过滤
  return !enabledEventFilter.has(eventName);
}

// 监听事件并更新统计信息
// 替代之前使用 observability.setContext({handleEvent}) 的隐式处理方式
observability.addEventHandler(updateEventAnalytics); 