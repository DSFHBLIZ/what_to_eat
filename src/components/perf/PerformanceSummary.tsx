import React from 'react';

// 基于原有代码约定调整类型定义
interface OperationStats {
  count: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}

interface PerformanceSummaryData {
  operations: Record<string, OperationStats>;
  [key: string]: any; // 允许其他属性
}

interface PerformanceSummaryProps {
  summary: PerformanceSummaryData;
  theme: 'light' | 'dark';
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  summary,
  theme
}) => {
  const style = {
    border: theme === 'light' ? '#dee2e6' : '#495057',
    background: theme === 'light' ? '#f8f9fa' : '#343a40',
    cardBg: theme === 'light' ? 'white' : '#2b3035',
    text: theme === 'light' ? '#212529' : '#f8f9fa'
  };
  
  // 格式化持续时间
  const formatDuration = (duration: number | null): string => {
    if (duration === null) return '进行中...';
    if (duration < 1) return '< 1ms';
    return `${duration.toFixed(2)}ms`;
  };
  
  // 获取性能指标的颜色（基于持续时间）
  const getDurationColor = (duration: number | null): string => {
    if (duration === null) return theme === 'light' ? '#6c757d' : '#adb5bd';
    if (duration < 10) return '#28a745'; // 快：绿色
    if (duration < 100) return '#ffc107'; // 中等：黄色
    return '#dc3545'; // 慢：红色
  };
  
  return (
    <div
      style={{
        padding: '12px',
        borderBottom: `1px solid ${style.border}`
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>性能摘要</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '8px'
        }}
      >
        {Object.keys(summary.operations).map(op => {
          const stats = summary.operations[op];
          return (
            <div
              key={op}
              style={{
                padding: '8px',
                border: `1px solid ${style.border}`,
                borderRadius: '4px',
                background: style.cardBg
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{op}</div>
              <div style={{ fontSize: '14px' }}>调用次数: {stats.count}</div>
              <div style={{ fontSize: '14px' }}>
                平均耗时: <span style={{ color: getDurationColor(stats.averageDuration) }}>
                  {formatDuration(stats.averageDuration)}
                </span>
              </div>
              <div style={{ fontSize: '14px' }}>
                最小耗时: <span style={{ color: getDurationColor(stats.minDuration) }}>
                  {formatDuration(stats.minDuration)}
                </span>
              </div>
              <div style={{ fontSize: '14px' }}>
                最大耗时: <span style={{ color: getDurationColor(stats.maxDuration) }}>
                  {formatDuration(stats.maxDuration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceSummary; 