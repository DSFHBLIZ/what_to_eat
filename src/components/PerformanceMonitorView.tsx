'use client';

import React, { useState, useEffect } from 'react';
import { PerformanceMonitor, FormPerformanceMeasure } from '../utils/performance/performanceMonitor';
import {
  PerformanceHeader,
  PerformanceFilters,
  PerformanceSummary as SummaryComponent,
  PerformanceDetailsList,
  MetricDetailView
} from './perf';

// 将FormPerformanceMeasure类型适配为组件需要的PerformanceMetric类型
interface PerformanceMetric {
  id: string;
  name: string;
  type: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: number;
  component?: string;
  // 其他字段也可以映射过来
  formId?: string;
  operationType?: string;
  operationName?: string;
  fieldName?: string;
  successful?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

// 操作统计信息
interface OperationStats {
  count: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}

// 性能摘要接口定义
interface PerformanceSummaryData {
  operations: Record<string, OperationStats>;
  averages?: Record<string, number>;
  totals?: Record<string, number>;
  counts?: Record<string, number>;
}

interface PerformanceMonitorViewProps {
  monitorId?: string;
  showSummary?: boolean;
  showDetails?: boolean;
  showOperationFilter?: boolean;
  height?: string;
  refreshInterval?: number; // 刷新间隔（毫秒）
  onViewMetric?: (metric: PerformanceMetric) => void;
  theme?: 'light' | 'dark';
}

const PerformanceMonitorView: React.FC<PerformanceMonitorViewProps> = ({
  monitorId = 'default-monitor',
  showSummary = true,
  showDetails = true,
  showOperationFilter = true,
  height = '400px',
  refreshInterval = 2000,
  onViewMetric,
  theme = 'light'
}) => {
  // 使用性能监控实例
  const [monitor] = useState(() => PerformanceMonitor.getInstance({
    logToConsole: false,
    persistToStorage: true
  }));
  
  // 状态
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = useState<PerformanceSummaryData | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [operations, setOperations] = useState<string[]>([]);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  const [viewingMetric, setViewingMetric] = useState<PerformanceMetric | null>(null);
  
  // 样式配置
  const themeStyles = {
    light: {
      background: '#f8f9fa',
      headerBg: '#e9ecef',
      text: '#212529',
      border: '#dee2e6',
      hover: '#f1f3f5'
    },
    dark: {
      background: '#343a40',
      headerBg: '#212529',
      text: '#f8f9fa', 
      border: '#495057',
      hover: '#495057'
    }
  };
  
  const style = themeStyles[theme];
  
  // 加载性能数据
  const loadData = () => {
    const formMetrics = monitor.getFormMeasuresById(monitorId);
    
    // 将FormPerformanceMeasure映射为组件期望的PerformanceMetric格式
    const mappedMetrics: PerformanceMetric[] = formMetrics.map(metric => ({
      id: String(metric.startTime + Math.random()), // 确保唯一ID
      name: metric.name,
      type: metric.operationType,
      operation: metric.operationType,
      startTime: metric.startTime,
      endTime: metric.endTime,
      duration: metric.duration,
      timestamp: metric.startTime, // 用startTime作为timestamp
      component: metric.formId,
      formId: metric.formId,
      operationType: metric.operationType,
      operationName: metric.operationName,
      fieldName: metric.fieldName,
      successful: metric.successful,
      errorMessage: metric.errorMessage,
      metadata: metric.metadata,
      tags: {
        formId: metric.formId || 'unknown',
        operation: metric.operationType,
        status: metric.successful ? 'success' : 'error'
      }
    }));

    // 获取统计信息
    const stats = monitor.getFormStatistics(monitorId);
    
    // 提取所有操作类型
    const uniqueOperations = Array.from(
      new Set(mappedMetrics.map(metric => metric.operation))
    ).sort();
    
    // 根据筛选条件设置度量数据
    setMetrics(
      selectedOperation === 'all' 
        ? mappedMetrics 
        : mappedMetrics.filter(m => m.operation === selectedOperation)
    );
    
    // 创建每个操作类型的统计数据
    const operationStats: Record<string, OperationStats> = {};
    
    uniqueOperations.forEach(op => {
      const opMetrics = mappedMetrics.filter(m => m.operation === op);
      if (opMetrics.length > 0) {
        const durations = opMetrics.map(m => m.duration);
        
        operationStats[op] = {
          count: opMetrics.length,
          averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations)
        };
      }
    });
    
    // 设置性能摘要
    setSummary({
      operations: operationStats,
      averages: {
        validation: stats.avgValidationTime,
        submission: stats.avgSubmissionTime,
        render: stats.avgRenderTime,
        fieldChange: stats.avgFieldChangeTime
      },
      totals: {
        metrics: stats.totalMetrics
      },
      counts: {
        metrics: stats.totalMetrics
      }
    });
    
    setOperations(uniqueOperations);
  };
  
  // 定期刷新数据
  useEffect(() => {
    loadData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, selectedOperation]);
  
  // 清除所有性能数据
  const handleClearData = () => {
    if (window.confirm('确定要清除所有性能数据吗？')) {
      monitor.clearFormMeasures(monitorId);
      loadData();
    }
  };
  
  // 导出性能数据
  const handleExportData = () => {
    const formMetrics = monitor.getFormMeasuresById(monitorId);
    const stats = monitor.getFormStatistics(monitorId);
    
    const exportData = {
      formId: monitorId,
      metrics: formMetrics.map(m => ({
        ...m,
        operation: m.operationType,
        timestamp: m.startTime
      })),
      summary: {
        averages: {
          validation: stats.avgValidationTime,
          submission: stats.avgSubmissionTime,
          render: stats.avgRenderTime,
          fieldChange: stats.avgFieldChangeTime,
        },
        counts: {
          metrics: stats.totalMetrics
        }
      }
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${monitorId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 导入性能数据
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          monitor.importData(content);
          loadData();
        } catch (error) {
          console.error('导入性能数据失败:', error);
        }
      }
    };
    reader.readAsText(file);
  };
  
  // 处理查看指标详情
  const handleViewMetric = (metric: PerformanceMetric) => {
    if (onViewMetric) {
      onViewMetric(metric);
    } else {
      setViewingMetric(metric);
      setSelectedMetricId(metric.id);
    }
  };
  
  // 关闭指标详情视图
  const handleCloseMetricView = () => {
    setViewingMetric(null);
    setSelectedMetricId(null);
  };
  
  return (
    <div
      style={{
        border: `1px solid ${style.border}`,
        borderRadius: '4px',
        background: style.background,
        color: style.text,
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* 标题栏 */}
      <PerformanceHeader
        monitorId={monitorId}
        onRefresh={loadData}
        onClear={handleClearData}
        onExport={handleExportData}
        onImport={handleImportData}
        theme={theme}
      />
      
      {/* 筛选器 */}
      {showOperationFilter && (
        <PerformanceFilters
          selectedOperation={selectedOperation}
          operations={operations}
          metricsCount={metrics.length}
          onOperationChange={setSelectedOperation}
          theme={theme}
        />
      )}
      
      {/* 性能摘要 */}
      {showSummary && summary && (
        <SummaryComponent summary={summary} theme={theme} />
      )}
      
      {/* 详细性能指标 */}
      {showDetails && (
        <PerformanceDetailsList
          metrics={metrics}
          onSelectMetric={handleViewMetric}
          selectedMetricId={selectedMetricId}
        />
      )}
      
      {/* 指标详情弹窗 */}
      {viewingMetric && (
        <MetricDetailView
          metric={viewingMetric}
          onClose={handleCloseMetricView}
        />
      )}
    </div>
  );
};

export default PerformanceMonitorView; 