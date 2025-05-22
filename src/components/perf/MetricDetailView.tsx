import React from 'react';

// 更新为更完整的接口，与父组件中的接口兼容
interface PerformanceMetric {
  id: string;
  name: string;
  type: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: number;
  component?: string;
  tags?: Record<string, string>;
  operation: string; // 添加这个字段使其与父组件中的定义兼容
  formId?: string;
  operationType?: string;
  operationName?: string;
  fieldName?: string;
  successful?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface MetricDetailViewProps {
  metric: PerformanceMetric | null;
  onClose: () => void;
}

/**
 * 单个指标详细信息展示组件
 * 显示性能指标的详细信息
 */
const MetricDetailView: React.FC<MetricDetailViewProps> = ({ metric, onClose }) => {
  if (!metric) return null;
  
  // 格式化时间
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };
  
  // 美化JSON显示
  const formatJSON = (obj: Record<string, any> | undefined) => {
    if (!obj || Object.keys(obj).length === 0) return '无数据';
    return JSON.stringify(obj, null, 2);
  };
  
  // 计算指标健康状态
  const getHealthStatus = () => {
    if (metric.duration < 50) return { status: '良好', className: 'bg-green-100 text-green-800' };
    if (metric.duration < 100) return { status: '中等', className: 'bg-yellow-100 text-yellow-800' };
    return { status: '较慢', className: 'bg-red-100 text-red-800' };
  };
  
  const health = getHealthStatus();

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">指标详情</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          关闭
        </button>
      </div>
      
      <div className="border-b pb-3 mb-3">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-gray-800">{metric.name}</h4>
          <span className={`px-2 py-1 rounded text-xs font-medium ${health.className}`}>
            {health.status}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
            ID: {metric.id}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">基本信息</h5>
          <div className="bg-gray-50 rounded p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600">类型:</div>
              <div className="font-medium">{metric.type}</div>
              
              <div className="text-gray-600">耗时:</div>
              <div className="font-medium">{metric.duration.toFixed(2)} ms</div>
              
              <div className="text-gray-600">组件:</div>
              <div className="font-medium">{metric.component || '未指定'}</div>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">时间数据</h5>
          <div className="bg-gray-50 rounded p-3 text-sm">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className="text-gray-600">开始时间: </span>
                <span className="font-medium">{formatDateTime(metric.startTime)}</span>
              </div>
              
              <div>
                <span className="text-gray-600">结束时间: </span>
                <span className="font-medium">{formatDateTime(metric.endTime)}</span>
              </div>
              
              <div>
                <span className="text-gray-600">记录时间: </span>
                <span className="font-medium">{formatDateTime(metric.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {metric.tags && Object.keys(metric.tags).length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">标签数据</h5>
          <div className="bg-gray-50 rounded p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(metric.tags).map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-600">{key}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">原始JSON</h5>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(metric, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MetricDetailView; 