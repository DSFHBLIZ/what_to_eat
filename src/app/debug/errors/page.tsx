'use client';

import { useState, useEffect } from 'react';
import { getErrorLogs, clearErrorLogs } from '../../../utils/common/errorLogger';
import Link from 'next/link';

export default function ErrorDebugPage() {
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [expandedErrors, setExpandedErrors] = useState<Record<number, boolean>>({});
  
  // 加载错误日志
  useEffect(() => {
    setErrorLogs(getErrorLogs());
  }, []);
  
  // 清除所有日志
  const handleClearLogs = () => {
    clearErrorLogs();
    setErrorLogs([]);
  };
  
  // 切换展开/折叠状态
  const toggleExpand = (index: number) => {
    setExpandedErrors(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">错误日志调试工具</h1>
          <p className="text-gray-600">收集到 {errorLogs.length} 条错误记录</p>
        </div>
        
        <div className="flex space-x-4">
          <Link 
            href="/debug" 
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            返回调试页面
          </Link>
          
          <button
            onClick={handleClearLogs}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            清除所有日志
          </button>
        </div>
      </div>
      
      {errorLogs.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">未收集到错误日志</p>
          <p className="text-sm text-gray-400 mt-2">
            错误信息会在应用运行时自动收集
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {errorLogs.map((log, index) => (
            <div 
              key={index} 
              className="border border-red-200 rounded-lg overflow-hidden bg-white"
            >
              <div
                className="p-4 bg-red-50 cursor-pointer flex justify-between items-center"
                onClick={() => toggleExpand(index)}
              >
                <div>
                  <p className="font-semibold">
                    [{log.componentName}] {log.error.message || '未知错误'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()} · {log.operation}
                  </p>
                </div>
                <span className="text-gray-600">
                  {expandedErrors[index] ? '⬆️' : '⬇️'}
                </span>
              </div>
              
              {expandedErrors[index] && (
                <div className="p-4 border-t border-red-100">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">错误类型</h3>
                    <p className="font-mono bg-gray-100 p-2 rounded">{log.error.name}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">位置</h3>
                    <p className="font-mono bg-gray-100 p-2 rounded">{log.url}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">附加信息</h3>
                    <pre className="font-mono bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                      {JSON.stringify(log.additionalInfo, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">调用堆栈</h3>
                    <pre className="font-mono bg-gray-100 p-2 rounded overflow-x-auto text-xs whitespace-pre-wrap">
                      {log.error.stack || '无堆栈信息'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 