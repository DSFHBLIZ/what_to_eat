/**
 * 可观测性系统核心实现
 */

import {
  LogLevel,
  LogEntry,
  MetricType,
  MetricEntry,
  SpanType,
  SpanStatus,
  Span,
  ObservabilityPoint,
  ObservabilityConfig,
  ObservabilityContext,
  ObservabilityAPI,
  BaseEvent,
  EventHandler
} from '../types/observability';
import { createSpanId, createTraceId } from '../utils/identifiers';

// 默认配置
const DEFAULT_CONFIG: ObservabilityConfig = {
  enabled: true,
  logLevel: LogLevel.INFO,
  sampleRate: 1.0, // 100% 采样率
  
  outputs: {
    console: true,
    localStorage: process.env.NODE_ENV !== 'production',
  },
  
  features: {
    logs: true,
    metrics: true,
    traces: true,
    events: true,
  },
  
  system: {
    captureErrors: true,
    captureRejections: true,
    captureConsole: process.env.NODE_ENV !== 'production',
    tracingEnabled: true,
    metricsInterval: 60000, // 60秒采集间隔
  },
};

// 可观测性系统核心实现
export class ObservabilityCore implements ObservabilityAPI {
  private static instance: ObservabilityCore;
  
  private config: ObservabilityConfig;
  private context: ObservabilityContext;
  private logs: LogEntry[] = [];
  private metrics: MetricEntry[] = [];
  private spans: Map<string, Span> = new Map();
  private activeTraces: Map<string, Set<string>> = new Map();
  private periodicTaskId: NodeJS.Timeout | null = null;
  private eventHandlers: Set<(eventName: string, event: any) => void> = new Set();
  
  /**
   * 私有构造函数 - 单例模式
   */
  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.context = this.createDefaultContext();
    this.setupPeriodicTasks();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): ObservabilityCore {
    if (!ObservabilityCore.instance) {
      ObservabilityCore.instance = new ObservabilityCore();
    }
    return ObservabilityCore.instance;
  }
  
  /**
   * 创建默认上下文
   */
  private createDefaultContext(): ObservabilityContext {
    return {
      traceId: createTraceId(),
      spanId: undefined,
      userId: undefined,
      sessionId: undefined,
      requestId: undefined,
      origin: 'client',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '0.0.0',
    };
  }
  
  /**
   * 设置定时任务
   */
  private setupPeriodicTasks(): void {
    if (this.periodicTaskId) {
      clearInterval(this.periodicTaskId);
    }
    
    if (this.config.enabled && this.config.system.metricsInterval > 0) {
      this.periodicTaskId = setInterval(() => {
        this.collectSystemMetrics();
      }, this.config.system.metricsInterval);
    }
  }
  
  /**
   * 收集系统指标
   */
  private collectSystemMetrics(): void {
    if (!this.config.features.metrics) return;
    
    // 浏览器性能指标
    if (typeof window !== 'undefined' && window.performance) {
      // 内存使用
      const memory = (performance as any).memory;
      if (memory) {
        this.recordMetric('memory.heap_used', memory.usedJSHeapSize, MetricType.GAUGE, { unit: 'bytes' });
        this.recordMetric('memory.heap_total', memory.totalJSHeapSize, MetricType.GAUGE, { unit: 'bytes' });
      }
      
      // 页面性能
      const timing = performance.timing;
      if (timing) {
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        this.recordMetric('page.load_time', pageLoadTime, MetricType.TIMER, { unit: 'ms' });
      }
      
      // 当前应用状态
      this.recordMetric('logs.count', this.logs.length, MetricType.GAUGE);
      this.recordMetric('spans.active', this.spans.size, MetricType.GAUGE);
    }
  }
  
  /**
   * 检查是否需要采样
   */
  private shouldSample(type: 'log' | 'metric' | 'span'): boolean {
    const { sampling, sampleRate } = this.config;
    
    // 如果禁用，则不采样
    if (!this.config.enabled) return false;
    
    // 如果有特定类型的采样率，使用该值
    if (sampling) {
      const typeSampleRate = sampling[`${type}s` as keyof typeof sampling];
      if (typeof typeSampleRate === 'number') {
        return Math.random() < typeSampleRate;
      }
    }
    
    // 否则使用全局采样率
    return Math.random() < sampleRate;
  }
  
  /**
   * 处理组件过滤
   */
  private isComponentAllowed(component: string): boolean {
    const { componentFilter } = this.config;
    if (!componentFilter) return true;
    
    // 优先检查排除列表
    if (componentFilter.exclude && componentFilter.exclude.some(pattern => 
      component === pattern || component.startsWith(`${pattern}.`)
    )) {
      return false;
    }
    
    // 然后检查包含列表
    if (componentFilter.include && componentFilter.include.length > 0) {
      return componentFilter.include.some(pattern => 
        component === pattern || component.startsWith(`${pattern}.`)
      );
    }
    
    // 默认允许
    return true;
  }
  
  /**
   * 格式化错误对象
   */
  private formatError(error: string | Error): { message: string; stack?: string } {
    if (typeof error === 'string') {
      return { message: error };
    }
    
    return {
      message: error.message || String(error),
      stack: error.stack,
    };
  }
  
  // ======== 日志方法 ========
  
  /**
   * 记录日志
   */
  public log(level: LogLevel, message: string, context?: Record<string, any>): string {
    // 检查日志级别和采样
    if (!this.config.features.logs) return '';
    if (this.getLogLevelValue(level) < this.getLogLevelValue(this.config.logLevel)) return '';
    if (!this.shouldSample('log')) return '';
    
    const component = context?.component || 'app';
    if (!this.isComponentAllowed(component)) return '';
    
    // 创建日志条目
    const entry: LogEntry = {
      id: createSpanId(),
      timestamp: Date.now(),
      level,
      message,
      component,
      context,
      userId: this.context.userId,
      sessionId: this.context.sessionId,
    };
    
    // 存储日志
    this.logs.push(entry);
    
    // 输出到控制台
    if (this.config.outputs.console) {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${component}] ${message}`, context || '');
    }
    
    // 存储到本地存储
    if (this.config.outputs.localStorage) {
      this.saveToLocalStorage('logs', entry);
    }
    
    return entry.id;
  }
  
  /**
   * 获取日志级别数值
   */
  private getLogLevelValue(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG: return 0;
      case LogLevel.INFO: return 1;
      case LogLevel.WARNING: return 2;
      case LogLevel.ERROR: return 3;
      case LogLevel.CRITICAL: return 4;
      default: return 0;
    }
  }
  
  /**
   * 获取控制台方法
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG: return console.debug;
      case LogLevel.INFO: return console.info;
      case LogLevel.WARNING: return console.warn;
      case LogLevel.ERROR: 
      case LogLevel.CRITICAL: return console.error;
      default: return console.log;
    }
  }
  
  /**
   * Debug级别日志
   */
  public debug(message: string, context?: Record<string, any>): string {
    return this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Info级别日志
   */
  public info(message: string, context?: Record<string, any>): string {
    return this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Warning级别日志
   */
  public warn(message: string, context?: Record<string, any>): string {
    return this.log(LogLevel.WARNING, message, context);
  }
  
  /**
   * Error级别日志
   */
  public error(message: string | Error, context?: Record<string, any>): string {
    const { message: errMessage, stack } = this.formatError(message);
    return this.log(LogLevel.ERROR, errMessage, { ...context, stack });
  }
  
  /**
   * Critical级别日志
   */
  public critical(message: string | Error, context?: Record<string, any>): string {
    const { message: errMessage, stack } = this.formatError(message);
    return this.log(LogLevel.CRITICAL, errMessage, { ...context, stack });
  }
  
  // ======== 指标方法 ========
  
  /**
   * 记录指标
   */
  public recordMetric(
    name: string,
    value: number,
    type: MetricType = MetricType.GAUGE,
    tags?: Record<string, any>
  ): void {
    if (!this.config.features.metrics) return;
    if (!this.shouldSample('metric')) return;
    
    const component = tags?.component || 'app';
    if (!this.isComponentAllowed(component)) return;
    
    // 创建指标条目
    const entry: MetricEntry = {
      id: createSpanId(),
      name,
      timestamp: Date.now(),
      type,
      value,
      tags,
      component: String(component),
    };
    
    // 存储指标
    this.metrics.push(entry);
    
    // 存储到本地存储
    if (this.config.outputs.localStorage) {
      this.saveToLocalStorage('metrics', entry);
    }
  }
  
  /**
   * 增加计数器
   */
  public incrementCounter(
    name: string,
    value: number = 1,
    tags?: Record<string, any>
  ): void {
    this.recordMetric(name, value, MetricType.COUNTER, tags);
  }
  
  /**
   * 记录定时器
   */
  public recordTimer(
    name: string,
    timeMs: number,
    tags?: Record<string, any>
  ): void {
    this.recordMetric(name, timeMs, MetricType.TIMER, { ...tags, unit: 'ms' });
  }
  
  /**
   * 开始定时器
   */
  public startTimer(name: string, tags?: Record<string, any>): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordTimer(name, duration, tags);
      return duration;
    };
  }
  
  // ======== 追踪方法 ========
  
  /**
   * 开始一个新的跟踪
   */
  public startTrace(name: string, type: SpanType): string {
    const traceId = createTraceId();
    this.context.traceId = traceId;
    const spanId = this.startSpan(name, type);
    
    // 初始化该trace的spans集合
    this.activeTraces.set(traceId, new Set([spanId]));
    
    return traceId;
  }
  
  /**
   * 开始跟踪跨度
   */
  public startSpan(name: string, type: SpanType, attributes?: Record<string, any>): string {
    if (!this.config.features.traces) return '';
    if (!this.shouldSample('span')) return '';
    
    const traceId = this.context.traceId || createTraceId();
    
    const span: Span = {
      id: createSpanId(),
      name,
      type,
      traceId,
      parentId: this.context.spanId,
      startTime: Date.now(),
      component: attributes?.component || 'app',
      attributes: attributes || {},
    };
    
    // 存储跨度
    this.spans.set(span.id, span);
    
    // 添加到活动追踪
    if (!this.activeTraces.has(traceId)) {
      this.activeTraces.set(traceId, new Set());
    }
    this.activeTraces.get(traceId)!.add(span.id);
    
    return span.id;
  }
  
  /**
   * 结束跟踪跨度
   */
  public endSpan(
    spanId: string,
    status: SpanStatus = SpanStatus.SUCCESS,
    attributes?: Record<string, any>
  ): void {
    const span = this.spans.get(spanId);
    if (!span) return;
    
    // 更新跨度
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    
    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes };
    }
    
    // 从活动追踪中移除
    const spanSet = this.activeTraces.get(span.traceId);
    if (spanSet) {
      spanSet.delete(spanId);
      if (spanSet.size === 0) {
        this.activeTraces.delete(span.traceId);
      }
    }
    
    // 存储到本地存储
    if (this.config.outputs.localStorage) {
      this.saveToLocalStorage('spans', span);
    }
  }
  
  /**
   * 添加跨度事件
   */
  public addSpanEvent(
    spanId: string,
    name: string,
    attributes?: Record<string, any>
  ): void {
    const span = this.spans.get(spanId);
    if (!span) return;
    
    const event = {
      name,
      timestamp: Date.now(),
      attributes,
    };
    
    if (!span.events) {
      span.events = [];
    }
    
    span.events.push(event);
  }
  
  /**
   * 包装函数并在执行期间跟踪
   */
  public withSpan<T>(
    name: string,
    type: SpanType,
    fn: () => T,
    attributes?: Record<string, any>
  ): T {
    const spanId = this.startSpan(name, type);
    try {
      const result = fn();
      
      // 如果结果是Promise
      if (result instanceof Promise) {
        return result
          .then((value) => {
            this.endSpan(spanId, SpanStatus.SUCCESS);
            return value;
          })
          .catch((error) => {
            this.endSpan(spanId, SpanStatus.ERROR, { error: String(error) });
            throw error;
          }) as unknown as T;
      }
      
      // 同步结果
      this.endSpan(spanId, SpanStatus.SUCCESS);
      return result;
    } catch (error) {
      this.endSpan(spanId, SpanStatus.ERROR, { error: String(error) });
      throw error;
    }
  }
  
  // ======== 上下文方法 ========
  
  /**
   * 设置上下文
   */
  public setContext(context: Partial<ObservabilityContext>): void {
    this.context = { ...this.context, ...context };
  }
  
  /**
   * 获取上下文
   */
  public getContext(): ObservabilityContext {
    return { ...this.context };
  }
  
  /**
   * 在特定上下文中执行函数
   */
  public withContext<T>(context: Partial<ObservabilityContext>, fn: () => T): T {
    const previousContext = { ...this.context };
    this.setContext(context);
    
    try {
      return fn();
    } finally {
      this.context = previousContext;
    }
  }
  
  // ======== 配置方法 ========
  
  /**
   * 配置系统
   */
  public configure(config: Partial<ObservabilityConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 重新设置任务
    this.setupPeriodicTasks();
  }
  
  /**
   * 获取当前配置
   */
  public getConfiguration(): ObservabilityConfig {
    return { ...this.config };
  }
  
  // ======== 存储和导出 ========
  
  /**
   * 保存到本地存储
   */
  private saveToLocalStorage<T>(
    type: string,
    data: T
  ): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      // 读取现有数据
      const storageKey = `observability_${type}`;
      const existingData = localStorage.getItem(storageKey);
      const dataArray = existingData ? JSON.parse(existingData) : [];
      
      // 添加新数据
      dataArray.unshift(data);
      
      // 限制存储大小 (最多保留100条)
      const maxItems = 100;
      const trimmedData = dataArray.slice(0, maxItems);
      
      // 存储数据
      localStorage.setItem(storageKey, JSON.stringify(trimmedData));
    } catch (error) {
      console.error(`保存到本地存储失败 (${type}):`, error);
    }
  }
  
  /**
   * 发送数据到网络
   */
  private async sendToNetwork(): Promise<void> {
    const { networkLogger } = this.config.outputs;
    if (!networkLogger || !networkLogger.endpoint) return;
    
    // 收集要发送的数据
    const data: ObservabilityPoint[] = [
      ...this.logs.map(log => ({ type: 'log', data: log } as ObservabilityPoint)),
      ...this.metrics.map(metric => ({ type: 'metric', data: metric } as ObservabilityPoint)),
      ...Array.from(this.spans.values())
        .filter(span => span.endTime)
        .map(span => ({ type: 'span', data: span } as ObservabilityPoint)),
    ];
    
    if (data.length === 0) return;
    
    try {
      await fetch(networkLogger.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: this.context,
          points: data,
        }),
      });
      
      // 清除已发送的数据
      this.logs = [];
      this.metrics = [];
      this.spans = new Map();
    } catch (error) {
      console.error('发送遥测数据失败:', error);
    }
  }
  
  /**
   * 刷新数据
   */
  public async flush(): Promise<void> {
    await this.sendToNetwork();
  }
  
  /**
   * 清理所有数据
   */
  public clearAll(): void {
    this.logs = [];
    this.metrics = [];
    this.spans = new Map();
    this.activeTraces = new Map();
  }
  
  /**
   * 导出所有数据
   */
  public export(): ObservabilityPoint[] {
    return [
      ...this.logs.map(log => ({ type: 'log', data: log } as ObservabilityPoint)),
      ...this.metrics.map(metric => ({ type: 'metric', data: metric } as ObservabilityPoint)),
      ...Array.from(this.spans.values()).map(span => ({ type: 'span', data: span } as ObservabilityPoint)),
    ];
  }
  
  /**
   * 添加事件处理器
   * @param handler 事件处理函数
   * @returns 移除处理器的函数
   */
  public addEventHandler(handler: (eventName: string, event: any) => void): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }
  
  /**
   * 处理事件数据并记录到观测系统
   * @param eventName 事件名称
   * @param event 事件数据
   */
  public emitEvent<T extends BaseEvent>(eventName: string, event: T): void {
    if (!this.config.features.events) return;
    
    // 记录事件为日志
    this.log(LogLevel.INFO, `Event: ${eventName}`, { 
      eventName,
      eventData: event,
      source: 'eventBus'
    });
    
    // 创建事件跟踪跨度
    const spanId = this.startSpan(
      `event.${eventName}`, 
      SpanType.EVENT, 
      { eventName, timestamp: event.timestamp }
    );
    
    // 调用所有事件处理器，但不实际传递第二个参数给处理函数
    this.eventHandlers.forEach(handler => {
      try {
        // 传递事件名称作为唯一参数，忽略第二个参数
        handler(eventName, null);
      } catch (error) {
        console.error(`[Observability] Event handler error:`, error);
      }
    });
    
    // 记录事件处理结束
    setTimeout(() => {
      this.endSpan(spanId);
    }, 0);
  }
}

// 导出单例实例
export const observability = ObservabilityCore.getInstance(); 