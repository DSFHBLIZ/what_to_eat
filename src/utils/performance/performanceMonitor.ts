/**
 * 统一性能监控工具
 * 用于追踪类型验证、表单处理和数据处理性能
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * 性能度量类型
 */
export interface PerformanceMeasure {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * 表单性能度量类型
 */
export interface FormPerformanceMeasure extends PerformanceMeasure {
  id: string;
  formId: string;
  operationType: 'validation' | 'submission' | 'render' | 'fieldChange' | 'custom';
  operationName?: string;
  fieldName?: string;
  successful: boolean;
  errorMessage?: string;
  fieldsCount?: number;
  formDataSize?: number;
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  /** 是否启用性能追踪 */
  enabled: boolean;
  /** 是否记录到控制台 */
  logToConsole: boolean;
  /** 性能阈值（毫秒），超过此值会警告 */
  warningThreshold: number;
  /** 是否收集内存使用信息（如果浏览器支持） */
  trackMemory: boolean;
  /** 采样率 (0-1)，决定捕获哪些性能数据 */
  samplingRate: number;
  /** 持久化存储 */
  persistToStorage?: boolean;
  /** 表单性能阈值 */
  formWarningThresholds?: {
    validation: number;
    submission: number;
    render: number;
    fieldChange: number;
  };
  /** 最大存储的度量数量 */
  maxMetrics?: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private measures: PerformanceMeasure[] = [];
  private formMeasures: FormPerformanceMeasure[] = [];
  private activeMarks: Map<string, { startTime: number, metadata?: Record<string, any> }> = new Map();
  private activeFormMeasurements: Map<string, { 
    id: string;
    formId: string;
    operationType: FormPerformanceMeasure['operationType'];
    operationName?: string;
    fieldName?: string;
    startTime: number;
    metadata?: Record<string, any>;
  }> = new Map();
  private config: PerformanceMonitorConfig;
  
  /**
   * 构造函数
   */
  private constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = {
      enabled: true,
      logToConsole: false,
      warningThreshold: 50,
      trackMemory: false,
      samplingRate: 1.0,
      persistToStorage: false,
      maxMetrics: 1000,
      formWarningThresholds: {
        validation: 200,
        submission: 500,
        render: 100,
        fieldChange: 50
      },
      ...config
    };
    
    // 从存储加载之前的度量数据
    this.loadFromStorage();
  }
  
  /**
   * 获取实例
   */
  public static getInstance(config?: Partial<PerformanceMonitorConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    } else if (config) {
      // 如果提供了新的配置，就更新现有实例的配置
      PerformanceMonitor.instance.updateConfig(config);
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * 更新配置
   */
  public updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * 开始计时
   * @param name 标记名称
   * @param metadata 附加元数据
   */
  public startMark(name: string, metadata?: Record<string, any>): void {
    if (!this.config.enabled || Math.random() > this.config.samplingRate) {
      return;
    }
    
    const now = performance.now();
    this.activeMarks.set(name, { startTime: now, metadata });
    
    if (this.config.logToConsole) {
      console.log(`[性能] 开始: ${name}`);
    }
  }
  
  /**
   * 结束计时
   * @param name 标记名称
   * @param additionalMetadata 附加元数据
   * @returns 测量结果
   */
  public endMark(name: string, additionalMetadata?: Record<string, any>): PerformanceMeasure | null {
    if (!this.config.enabled) {
      return null;
    }
    
    const mark = this.activeMarks.get(name);
    if (!mark) {
      console.warn(`[性能] 尝试结束未开始的标记: ${name}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - mark.startTime;
    
    // 合并元数据
    const metadata = {
      ...mark.metadata,
      ...additionalMetadata
    };
    
    // 如果启用了内存跟踪并且浏览器支持
    if (this.config.trackMemory && (performance as any).memory) {
      metadata.memory = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      };
    }
    
    const measure: PerformanceMeasure = {
      name,
      startTime: mark.startTime,
      endTime,
      duration,
      metadata
    };
    
    this.measures.push(measure);
    this.activeMarks.delete(name);
    
    // 如果超过最大存储数量，移除最旧的
    if (this.config.maxMetrics && this.measures.length > this.config.maxMetrics) {
      this.measures = this.measures.slice(this.measures.length - this.config.maxMetrics);
    }
    
    if (this.config.logToConsole) {
      console.log(`[性能] ${name}: ${duration.toFixed(2)}ms`);
      
      if (duration > this.config.warningThreshold) {
        console.warn(`[性能警告] ${name} 执行时间超过阈值: ${duration.toFixed(2)}ms`);
      }
    }
    
    // 如果启用了持久化，保存到存储
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
    
    return measure;
  }
  
  /**
   * 测量函数执行时间
   * @param name 测量名称
   * @param fn 要测量的函数
   * @param metadata 附加元数据
   * @returns 函数执行结果
   */
  public measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.config.enabled || Math.random() > this.config.samplingRate) {
      return fn();
    }
    
    this.startMark(name, metadata);
    try {
      const result = fn();
      
      // 如果结果是Promise，等待它完成
      if (result instanceof Promise) {
        return result
          .then(value => {
            this.endMark(name, { success: true });
            return value;
          })
          .catch(error => {
            this.endMark(name, { success: false, error: error.message });
            throw error;
          }) as any;
      }
      
      this.endMark(name, { success: true });
      return result;
    } catch (error) {
      this.endMark(name, { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * 开始表单测量
   * @param formId 表单ID
   * @param operationType 操作类型
   * @param options 选项
   * @returns 测量ID
   */
  public startFormMeasurement(
    formId: string,
    operationType: FormPerformanceMeasure['operationType'],
    options?: {
      operationName?: string;
      fieldName?: string;
      metadata?: Record<string, any>;
    }
  ): string {
    if (!this.config.enabled) return '';
    
    const id = uuidv4();
    const measurement = {
      id,
      formId,
      operationType,
      operationName: options?.operationName,
      fieldName: options?.fieldName,
      startTime: performance.now(),
      metadata: options?.metadata
    };
    
    this.activeFormMeasurements.set(id, measurement);
    
    if (this.config.logToConsole) {
      console.log(`[表单性能] 开始测量 [${formId}] ${operationType}${options?.fieldName ? ` - ${options.fieldName}` : ''}`);
    }
    
    return id;
  }
  
  /**
   * 结束表单测量
   * @param measurementId 测量ID
   * @param options 结束选项
   * @returns 性能指标
   */
  public endFormMeasurement(
    measurementId: string,
    options?: {
      successful?: boolean;
      errorMessage?: string;
      fieldsCount?: number;
      formDataSize?: number;
      additionalMetadata?: Record<string, any>;
    }
  ): FormPerformanceMeasure | null {
    if (!this.config.enabled || !measurementId) return null;
    
    const measurement = this.activeFormMeasurements.get(measurementId);
    if (!measurement) {
      console.warn(`[表单性能] 未找到测量ID: ${measurementId}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - measurement.startTime;
    
    // 创建性能指标
    const metric: FormPerformanceMeasure = {
      id: measurement.id,
      name: `form:${measurement.formId}:${measurement.operationType}`,
      formId: measurement.formId,
      operationType: measurement.operationType,
      operationName: measurement.operationName,
      fieldName: measurement.fieldName,
      startTime: measurement.startTime,
      endTime,
      duration,
      successful: options?.successful !== undefined ? options.successful : true,
      errorMessage: options?.errorMessage,
      fieldsCount: options?.fieldsCount,
      formDataSize: options?.formDataSize,
      metadata: {
        ...measurement.metadata,
        ...options?.additionalMetadata
      }
    };
    
    // 检查性能警告
    this.checkFormPerformanceWarning(metric);
    
    // 存储指标
    this.formMeasures.push(metric);
    this.activeFormMeasurements.delete(measurementId);
    
    // 如果超过最大存储数量，移除最旧的
    if (this.config.maxMetrics && this.formMeasures.length > this.config.maxMetrics) {
      this.formMeasures = this.formMeasures.slice(this.formMeasures.length - this.config.maxMetrics);
    }
    
    // 如果启用了持久化，保存到存储
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
    
    return metric;
  }
  
  /**
   * 表单性能警告检查
   * @param metric 性能指标
   */
  private checkFormPerformanceWarning(metric: FormPerformanceMeasure): void {
    if (!this.config.logToConsole) return;
    
    let threshold = 0;
    switch (metric.operationType) {
      case 'validation':
        threshold = this.config.formWarningThresholds?.validation || 200;
        break;
      case 'submission':
        threshold = this.config.formWarningThresholds?.submission || 500;
        break;
      case 'render':
        threshold = this.config.formWarningThresholds?.render || 100;
        break;
      case 'fieldChange':
        threshold = this.config.formWarningThresholds?.fieldChange || 50;
        break;
      default:
        threshold = this.config.warningThreshold;
    }
    
    if (metric.duration > threshold) {
      const fieldInfo = metric.fieldName ? ` (字段: ${metric.fieldName})` : '';
      console.warn(`[表单性能警告] ${metric.operationType}${fieldInfo} 执行时间超过阈值: ${metric.duration.toFixed(2)}ms`);
    }
  }
  
  /**
   * 获取所有测量结果
   */
  public getMeasures(): PerformanceMeasure[] {
    return [...this.measures];
  }
  
  /**
   * 获取所有表单测量结果
   */
  public getFormMeasures(): FormPerformanceMeasure[] {
    return [...this.formMeasures];
  }
  
  /**
   * 获取特定表单的测量结果
   * @param formId 表单ID
   */
  public getFormMeasuresById(formId: string): FormPerformanceMeasure[] {
    return this.formMeasures.filter(m => m.formId === formId);
  }
  
  /**
   * 按名称获取测量结果
   */
  public getMeasuresByName(name: string): PerformanceMeasure[] {
    return this.measures.filter(m => m.name === name);
  }
  
  /**
   * 计算性能统计信息
   */
  public getStatistics(name?: string): { 
    count: number; 
    totalTime: number; 
    averageTime: number; 
    minTime: number; 
    maxTime: number; 
    p95Time?: number;
  } {
    const measures = name 
      ? this.measures.filter(m => m.name === name)
      : this.measures;
    
    if (measures.length === 0) {
      return { count: 0, totalTime: 0, averageTime: 0, minTime: 0, maxTime: 0 };
    }
    
    const durations = measures.map(m => m.duration);
    const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);
    const averageTime = totalTime / measures.length;
    
    // 计算95百分位数
    let p95Time: number | undefined;
    if (durations.length > 1) {
      const sortedDurations = [...durations].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedDurations.length * 0.95);
      p95Time = sortedDurations[p95Index];
    }
    
    return {
      count: measures.length,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      p95Time
    };
  }
  
  /**
   * 计算表单性能统计信息
   * @param formId 表单ID
   */
  public getFormStatistics(formId: string): {
    totalMetrics: number;
    avgValidationTime: number;
    avgSubmissionTime: number;
    avgRenderTime: number;
    avgFieldChangeTime: number;
    maxValidationTime: number;
    maxSubmissionTime: number;
    slowestFields: Array<{ fieldName: string; avgTime: number }>;
    errorRate: number;
  } {
    const formMetrics = this.getFormMeasuresById(formId);
    
    if (formMetrics.length === 0) {
      return {
        totalMetrics: 0,
        avgValidationTime: 0,
        avgSubmissionTime: 0,
        avgRenderTime: 0,
        avgFieldChangeTime: 0,
        maxValidationTime: 0,
        maxSubmissionTime: 0,
        slowestFields: [],
        errorRate: 0
      };
    }
    
    // 按操作类型分组
    const validationMetrics = formMetrics.filter(m => m.operationType === 'validation');
    const submissionMetrics = formMetrics.filter(m => m.operationType === 'submission');
    const renderMetrics = formMetrics.filter(m => m.operationType === 'render');
    const fieldChangeMetrics = formMetrics.filter(m => m.operationType === 'fieldChange');
    
    // 计算平均时间
    const avgValidationTime = validationMetrics.length > 0 
      ? validationMetrics.reduce((sum, m) => sum + m.duration, 0) / validationMetrics.length 
      : 0;
    
    const avgSubmissionTime = submissionMetrics.length > 0 
      ? submissionMetrics.reduce((sum, m) => sum + m.duration, 0) / submissionMetrics.length 
      : 0;
    
    const avgRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length 
      : 0;
    
    const avgFieldChangeTime = fieldChangeMetrics.length > 0 
      ? fieldChangeMetrics.reduce((sum, m) => sum + m.duration, 0) / fieldChangeMetrics.length 
      : 0;
    
    // 计算最大时间
    const maxValidationTime = validationMetrics.length > 0 
      ? Math.max(...validationMetrics.map(m => m.duration)) 
      : 0;
    
    const maxSubmissionTime = submissionMetrics.length > 0 
      ? Math.max(...submissionMetrics.map(m => m.duration)) 
      : 0;
    
    // 计算最慢的字段
    const fieldTimes = new Map<string, { total: number; count: number }>();
    
    fieldChangeMetrics.forEach(metric => {
      if (!metric.fieldName) return;
      
      const fieldStats = fieldTimes.get(metric.fieldName) || { total: 0, count: 0 };
      fieldStats.total += metric.duration;
      fieldStats.count += 1;
      fieldTimes.set(metric.fieldName, fieldStats);
    });
    
    const slowestFields = Array.from(fieldTimes.entries())
      .map(([fieldName, stats]) => ({
        fieldName,
        avgTime: stats.total / stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
    
    // 计算错误率
    const errorCount = formMetrics.filter(m => !m.successful).length;
    const errorRate = formMetrics.length > 0 ? errorCount / formMetrics.length : 0;
    
    return {
      totalMetrics: formMetrics.length,
      avgValidationTime,
      avgSubmissionTime,
      avgRenderTime,
      avgFieldChangeTime,
      maxValidationTime,
      maxSubmissionTime,
      slowestFields,
      errorRate
    };
  }
  
  /**
   * 从存储加载性能数据
   */
  private loadFromStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const storedMeasures = localStorage.getItem('performance_measures');
      const storedFormMeasures = localStorage.getItem('form_performance_measures');
      
      if (storedMeasures) {
        this.measures = JSON.parse(storedMeasures);
      }
      
      if (storedFormMeasures) {
        this.formMeasures = JSON.parse(storedFormMeasures);
      }
    } catch (error) {
      console.error('从存储加载性能数据失败', error);
    }
  }
  
  /**
   * 保存性能数据到存储
   */
  private saveToStorage(): void {
    if (!this.config.persistToStorage || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem('performance_measures', JSON.stringify(this.measures));
      localStorage.setItem('form_performance_measures', JSON.stringify(this.formMeasures));
    } catch (error) {
      console.error('保存性能数据到存储失败', error);
    }
  }
  
  /**
   * 清除所有测量结果
   */
  public clearMeasures(): void {
    this.measures = [];
    this.formMeasures = [];
    this.activeMarks.clear();
    this.activeFormMeasurements.clear();
    
    if (this.config.persistToStorage && typeof localStorage !== 'undefined') {
      localStorage.removeItem('performance_measures');
      localStorage.removeItem('form_performance_measures');
    }
  }
  
  /**
   * 清除特定表单的性能数据
   * @param formId 表单ID
   */
  public clearFormMeasures(formId?: string): void {
    if (formId) {
      this.formMeasures = this.formMeasures.filter(m => m.formId !== formId);
    } else {
      this.formMeasures = [];
    }
    
    if (this.config.persistToStorage && typeof localStorage !== 'undefined') {
      localStorage.setItem('form_performance_measures', JSON.stringify(this.formMeasures));
    }
  }
  
  /**
   * 打印性能报告
   */
  public printReport(name?: string): void {
    const stats = this.getStatistics(name);
    
    console.group(`性能报告${name ? ` - ${name}` : ''}`);
    console.log(`测量次数: ${stats.count}`);
    console.log(`总耗时: ${stats.totalTime.toFixed(2)}ms`);
    console.log(`平均耗时: ${stats.averageTime.toFixed(2)}ms`);
    console.log(`最小耗时: ${stats.minTime.toFixed(2)}ms`);
    console.log(`最大耗时: ${stats.maxTime.toFixed(2)}ms`);
    
    if (stats.p95Time !== undefined) {
      console.log(`95百分位耗时: ${stats.p95Time.toFixed(2)}ms`);
    }
    
    if (stats.count > 0) {
      console.log(`最近 5 次测量:`);
      this.measures
        .filter(m => !name || m.name === name)
        .slice(-5)
        .forEach(m => {
          console.log(`- ${m.name}: ${m.duration.toFixed(2)}ms`);
        });
    }
    
    console.groupEnd();
  }
  
  /**
   * 导出性能数据为JSON
   */
  public exportData(): string {
    const data = {
      measures: this.measures,
      formMeasures: this.formMeasures,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(data);
  }
  
  /**
   * 导入性能数据
   * @param jsonData JSON数据字符串
   * @param append 是否追加数据
   * @returns 导入的度量数量
   */
  public importData(jsonData: string, append: boolean = false): number {
    try {
      const data = JSON.parse(jsonData);
      
      if (!append) {
        this.measures = [];
        this.formMeasures = [];
      }
      
      if (Array.isArray(data.measures)) {
        this.measures.push(...data.measures);
      }
      
      if (Array.isArray(data.formMeasures)) {
        this.formMeasures.push(...data.formMeasures);
      }
      
      // 如果超过最大存储数量，移除最旧的
      if (this.config.maxMetrics) {
        if (this.measures.length > this.config.maxMetrics) {
          this.measures = this.measures.slice(this.measures.length - this.config.maxMetrics);
        }
        
        if (this.formMeasures.length > this.config.maxMetrics) {
          this.formMeasures = this.formMeasures.slice(this.formMeasures.length - this.config.maxMetrics);
        }
      }
      
      // 保存到存储
      if (this.config.persistToStorage) {
        this.saveToStorage();
      }
      
      return (data.measures?.length || 0) + (data.formMeasures?.length || 0);
    } catch (error) {
      console.error('导入性能数据失败', error);
      return 0;
    }
  }
}

/**
 * 方法装饰器：性能测量
 * @param name 可选的测量名称
 * @param metadata 可选的元数据
 */
export function measure(name?: string, metadata?: Record<string, any>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      const measureName = name || `${target.constructor.name}.${propertyKey}`;
      
      return monitor.measure(
        measureName,
        () => originalMethod.apply(this, args),
        {
          ...metadata,
          args: args.length > 0 ? args : undefined,
          context: this.constructor?.name || typeof this
        }
      );
    };
    
    return descriptor;
  };
}

/**
 * 函数包装器：测量函数执行时间
 * @param name 测量名称
 * @param fn 要测量的函数
 * @param metadata 附加元数据
 * @returns 包装后的函数
 */
export function measureFunction<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  metadata?: Record<string, any>
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const monitor = PerformanceMonitor.getInstance();
    return monitor.measure(
      name,
      () => fn(...args),
      {
        ...metadata,
        args: args.length > 0 ? args : undefined
      }
    ) as ReturnType<T>;
  };
}

/**
 * React性能监控钩子
 * @param options 性能监控选项
 */
export function usePerformanceMonitor(options?: Partial<PerformanceMonitorConfig>) {
  const [performanceData, setPerformanceData] = useState<{
    measures: PerformanceMeasure[];
    formMeasures: FormPerformanceMeasure[];
    statistics: Record<string, any>;
  }>({
    measures: [],
    formMeasures: [],
    statistics: {}
  });
  
  // 初始化监控器
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance(options);
    
    // 初始刷新数据
    refreshData();
    
    function refreshData() {
      setPerformanceData({
        measures: monitor.getMeasures(),
        formMeasures: monitor.getFormMeasures(),
        statistics: {
          general: monitor.getStatistics()
        }
      });
    }
    
    // 清理函数
    return () => {
      // 不需要做特别的清理，因为监控器是单例的
    };
  }, [options]);
  
  // 刷新性能数据
  const refreshData = useCallback(() => {
    const monitor = PerformanceMonitor.getInstance();
    
    setPerformanceData({
      measures: monitor.getMeasures(),
      formMeasures: monitor.getFormMeasures(),
      statistics: {
        general: monitor.getStatistics()
      }
    });
  }, []);
  
  // 通用性能追踪
  const trackPerformance = useCallback(<T>(name: string, fn: () => T, metadata?: Record<string, any>): T => {
    const monitor = PerformanceMonitor.getInstance();
    const result = monitor.measure(name, fn, metadata);
    refreshData();
    return result;
  }, [refreshData]);
  
  // 表单性能追踪
  const trackFormPerformance = useCallback((
    formId: string,
    operationType: FormPerformanceMeasure['operationType'],
    fn: () => any,
    options?: {
      operationName?: string;
      fieldName?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    const monitor = PerformanceMonitor.getInstance();
    const measurementId = monitor.startFormMeasurement(formId, operationType, options);
    
    try {
      const result = fn();
      
      // 如果结果是Promise，处理异步操作
      if (result instanceof Promise) {
        return result
          .then(value => {
            monitor.endFormMeasurement(measurementId, {
              successful: true,
              additionalMetadata: { asyncResult: true }
            });
            refreshData();
            return value;
          })
          .catch(error => {
            monitor.endFormMeasurement(measurementId, {
              successful: false,
              errorMessage: error.message
            });
            refreshData();
            throw error;
          });
      }
      
      // 同步操作
      monitor.endFormMeasurement(measurementId, { successful: true });
      refreshData();
      return result;
    } catch (error: any) {
      monitor.endFormMeasurement(measurementId, {
        successful: false,
        errorMessage: error.message
      });
      refreshData();
      throw error;
    }
  }, [refreshData]);
  
  // 页面性能追踪（简化版本）
  const trackPagePerformance = useCallback((pageName: string, fn: () => any) => {
    return trackPerformance(`page:${pageName}`, fn, { type: 'page' });
  }, [trackPerformance]);
  
  // 获取表单性能统计信息
  const getFormPerformanceSummary = useCallback((formId: string) => {
    const monitor = PerformanceMonitor.getInstance();
    return monitor.getFormStatistics(formId);
  }, []);
  
  // 清除性能数据
  const clearPerformanceData = useCallback((formId?: string) => {
    const monitor = PerformanceMonitor.getInstance();
    
    if (formId) {
      monitor.clearFormMeasures(formId);
    } else {
      monitor.clearMeasures();
    }
    
    refreshData();
  }, [refreshData]);
  
  return {
    // 性能数据
    performanceData,
    
    // 监控方法
    trackPerformance,
    trackFormPerformance,
    trackPagePerformance,
    
    // 统计方法
    getFormPerformanceSummary,
    
    // 工具方法
    refreshPerformanceData: refreshData,
    clearPerformanceData,
    
    // 原始监控器实例
    monitor: PerformanceMonitor.getInstance()
  };
}

// 导出单例监控器
export default PerformanceMonitor.getInstance(); 