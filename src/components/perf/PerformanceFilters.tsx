import React from 'react';

interface PerformanceFiltersProps {
  selectedOperation: string;
  operations: string[];
  metricsCount: number;
  onOperationChange: (operation: string) => void;
  theme: 'light' | 'dark';
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  selectedOperation,
  operations,
  metricsCount,
  onOperationChange,
  theme
}) => {
  const style = {
    background: theme === 'light' ? '#f8f9fa' : '#343a40',
    text: theme === 'light' ? '#212529' : '#f8f9fa',
    border: theme === 'light' ? '#dee2e6' : '#495057'
  };
  
  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${style.border}`,
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}
    >
      <label>操作筛选:</label>
      <select
        value={selectedOperation}
        onChange={e => onOperationChange(e.target.value)}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: `1px solid ${style.border}`,
          background: style.background,
          color: style.text
        }}
      >
        <option value="all">全部操作</option>
        {operations.map(op => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
      <div style={{ marginLeft: 'auto' }}>
        总记录: {metricsCount}
      </div>
    </div>
  );
};

export default PerformanceFilters; 