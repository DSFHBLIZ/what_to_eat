/**
 * 统一的性能监控钩子
 * 提供应用级与表单性能监控能力
 */

import { useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor, FormPerformanceMeasure } from './performanceMonitor';

// 定义操作类型，与FormPerformanceMeasure中的operationType一致
type OperationType = 'validation' | 'submission' | 'render' | 'fieldChange' | 'custom';

// 配置类型
export interface PerformanceMonitorOptions {
  // 通用配置
  enabled?: boolean;
  logToConsole?: boolean;
  persistToStorage?: boolean;
  warningThresholds?: {
    general?: number;
    validation?: number;
    submission?: number;
    render?: number;
    fieldChange?: number;
  };
  
  // 应用监控特定配置
  trackMemory?: boolean;
  samplingRate?: number;
  
  // 表单监控特定配置
  formId?: string;
  maxMetrics?: number;
  autoCleanupDays?: number;
}

// 性能数据类型
export interface PerformanceData {
  generalMetrics: any[];
  formMetrics: FormPerformanceMeasure[];
  statistics: {
    general: Record<string, any>;
    form: Record<string, any>;
  };
}

/**
 * 统一性能监控钩子
 * @param options 配置选项
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    generalMetrics: [],
    formMetrics: [],
    statistics: {
      general: {},
      form: {}
    }
  });
  
  // 初始化监控器
  useEffect(() => {
    // 初始化性能监控
    const monitor = PerformanceMonitor.getInstance({
      enabled: options.enabled ?? true,
      logToConsole: options.logToConsole ?? false,
      warningThreshold: options.warningThresholds?.general ?? 50,
      trackMemory: options.trackMemory ?? false,
      samplingRate: options.samplingRate ?? 1.0,
      maxMetrics: options.maxMetrics ?? 1000,
      formWarningThresholds: {
        validation: options.warningThresholds?.validation ?? 200,
        submission: options.warningThresholds?.submission ?? 500,
        render: options.warningThresholds?.render ?? 100,
        fieldChange: options.warningThresholds?.fieldChange ?? 50
      },
      persistToStorage: options.persistToStorage ?? true
    });
    
    // 更新数据
    refreshData();
    
    // 清理函数
    return () => {
      // 不需要清理PerformanceMonitor，它是单例
    };
  }, [options]);
  
  // 刷新性能数据
  const refreshData = useCallback(() => {
    const monitor = PerformanceMonitor.getInstance();
    
    setPerformanceData({
      generalMetrics: monitor.getMeasures(),
      formMetrics: monitor.getFormMeasures(),
      statistics: {
        general: monitor.getStatistics(),
        form: options.formId 
          ? monitor.getFormStatistics(options.formId)
          : {}
      }
    });
  }, [options.formId]);
  
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
    operationType: OperationType,
    fn: () => any,
    options?: {
      operationName?: string;
      fieldName?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    const monitor = PerformanceMonitor.getInstance();
    const measurementId = monitor.startFormMeasurement(
      formId,
      operationType,
      options
    );
    
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
  
  // 获取性能数据
  const getPerformanceData = useCallback(() => {
    refreshData();
    return performanceData;
  }, [performanceData, refreshData]);
  
  // 清除性能数据
  const clearPerformanceData = useCallback((formId?: string) => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.clearMeasures();
    
    if (formId) {
      monitor.clearFormMeasures(formId);
    } else {
      monitor.clearFormMeasures();
    }
    
    refreshData();
  }, [refreshData]);
  
  return {
    // 数据
    performanceData,
    getPerformanceData,
    refreshData,
    
    // 操作
    trackPerformance,
    trackFormPerformance,
    trackPagePerformance,
    clearPerformanceData,
    
    // 直接API访问
    startFormMeasurement: (formId: string, operationType: OperationType, options?: any) => 
      PerformanceMonitor.getInstance().startFormMeasurement(formId, operationType, options),
    
    endFormMeasurement: (measurementId: string, options?: any) => {
      const result = PerformanceMonitor.getInstance().endFormMeasurement(measurementId, options);
      refreshData();
      return result;
    }
  };
}

// 导出单例实例以实现全局性能监控
export default usePerformanceMonitor; 