import React from 'react';

interface PerformanceHeaderProps {
  monitorId: string;
  onRefresh: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  theme: 'light' | 'dark';
}

const PerformanceHeader: React.FC<PerformanceHeaderProps> = ({
  monitorId,
  onRefresh,
  onClear,
  onExport,
  onImport,
  theme
}) => {
  const style = {
    background: theme === 'light' ? '#e9ecef' : '#212529',
    text: theme === 'light' ? '#212529' : '#f8f9fa',
    border: theme === 'light' ? '#dee2e6' : '#495057'
  };
  
  return (
    <div
      style={{
        background: style.background,
        padding: '8px 12px',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${style.border}`
      }}
    >
      <div>性能监控 ({monitorId})</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onRefresh}
          style={{
            background: 'transparent',
            border: `1px solid ${style.border}`,
            color: style.text,
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          刷新
        </button>
        <button
          onClick={onClear}
          style={{
            background: 'transparent',
            border: `1px solid ${style.border}`,
            color: style.text,
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          清除
        </button>
        <button
          onClick={onExport}
          style={{
            background: 'transparent',
            border: `1px solid ${style.border}`,
            color: style.text,
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          导出
        </button>
        <label
          style={{
            background: 'transparent',
            border: `1px solid ${style.border}`,
            color: style.text,
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          导入
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={onImport}
          />
        </label>
      </div>
    </div>
  );
};

export default PerformanceHeader; 