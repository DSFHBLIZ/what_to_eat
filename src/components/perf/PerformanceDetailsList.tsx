import React, { useState } from 'react';

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

interface PerformanceDetailsListProps {
  metrics: PerformanceMetric[];
  onSelectMetric: (metric: PerformanceMetric) => void;
  selectedMetricId: string | null;
}

/**
 * 性能详情列表组件
 * 显示所有性能指标的列表
 */
const PerformanceDetailsList: React.FC<PerformanceDetailsListProps> = ({
  metrics,
  onSelectMetric,
  selectedMetricId
}) => {
  const [sortField, setSortField] = useState<keyof PerformanceMetric>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 处理排序
  const handleSort = (field: keyof PerformanceMetric) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // 默认降序
    }
  };
  
  // 过滤和排序后的指标
  const filteredAndSortedMetrics = React.useMemo(() => {
    // 先过滤
    let results = metrics;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(metric => 
        metric.name.toLowerCase().includes(search) ||
        metric.type.toLowerCase().includes(search) ||
        (metric.component && metric.component.toLowerCase().includes(search))
      );
    }
    
    // 再排序
    return [...results].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // 处理不同字段类型
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');
        return sortDirection === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }
    });
  }, [metrics, searchTerm, sortField, sortDirection]);
  
  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-gray-800">性能记录列表</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm w-56"
          />
          <span className="absolute right-3 top-2 text-gray-400">
            {searchTerm ? `${filteredAndSortedMetrics.length}/${metrics.length}` : metrics.length}
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('name')}
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                指标名称
                {sortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                onClick={() => handleSort('type')}
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                类型
                {sortField === 'type' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                onClick={() => handleSort('duration')}
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                耗时
                {sortField === 'duration' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                onClick={() => handleSort('timestamp')}
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                时间戳
                {sortField === 'timestamp' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                onClick={() => handleSort('component')}
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                组件
                {sortField === 'component' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedMetrics.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                  {searchTerm ? '没有匹配的记录' : '暂无性能记录'}
                </td>
              </tr>
            ) : (
              filteredAndSortedMetrics.map((metric) => (
                <tr 
                  key={metric.id}
                  onClick={() => onSelectMetric(metric)}
                  className={`${
                    selectedMetricId === metric.id 
                      ? 'bg-indigo-50' 
                      : 'hover:bg-gray-50'
                  } cursor-pointer transition-colors`}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.name}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      metric.type === 'render' ? 'bg-indigo-100 text-indigo-800' :
                      metric.type === 'api' ? 'bg-green-100 text-green-800' :
                      metric.type === 'interaction' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {metric.type}
                    </span>
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                    metric.duration > 100 ? 'text-red-600' :
                    metric.duration > 50 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {metric.duration.toFixed(2)} ms
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(metric.timestamp)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {metric.component || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceDetailsList; 