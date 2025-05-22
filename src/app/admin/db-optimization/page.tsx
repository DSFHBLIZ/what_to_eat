'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Database, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { 
  INDEXES, 
  createAllIndexes, 
  createSingleIndex, 
  checkIndexes, 
  analyzeDatabase 
} from '../../../utils/data/db-optimization';

type RunStatus = 'pending' | 'running' | 'success' | 'error';

// 定义索引任务状态
interface IndexTaskState {
  name: string;
  description: string;
  status: RunStatus;
  error?: string;
}

export default function DatabaseOptimizationPage() {
  // 状态
  const [indexTasks, setIndexTasks] = useState<IndexTaskState[]>(
    INDEXES.map((idx) => ({
      name: idx.name,
      description: idx.description,
      status: 'pending'
    }))
  );
  const [analyzing, setAnalyzing] = useState<RunStatus>('pending');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [checkedStatus, setCheckedStatus] = useState<{name: string; exists: boolean}[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // 添加控制台输出
  const addConsoleLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 检查索引状态
  const handleCheckIndexes = async () => {
    setIsChecking(true);
    addConsoleLog('正在检查数据库索引状态...');

    try {
      const result = await checkIndexes();
      if (result.success && result.indexes) {
        setCheckedStatus(result.indexes);
        addConsoleLog(`索引检查完成，共 ${result.indexes.length} 个索引`);
        
        // 更新索引任务状态
        const updatedTasks = [...indexTasks];
        result.indexes.forEach(({ name, exists }) => {
          const taskIndex = updatedTasks.findIndex(task => task.name === name);
          if (taskIndex !== -1) {
            updatedTasks[taskIndex].status = exists ? 'success' : 'pending';
          }
        });
        setIndexTasks(updatedTasks);
      } else {
        addConsoleLog(`索引检查失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      addConsoleLog(`索引检查发生错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsChecking(false);
    }
  };

  // 创建单个索引
  const handleCreateIndex = async (indexName: string) => {
    // 找到索引在状态数组中的位置
    const taskIndex = indexTasks.findIndex(task => task.name === indexName);
    if (taskIndex === -1) return;

    // 更新任务状态为运行中
    const updatedTasks = [...indexTasks];
    updatedTasks[taskIndex].status = 'running';
    setIndexTasks(updatedTasks);

    addConsoleLog(`开始创建索引: ${indexName}`);

    try {
      const result = await createSingleIndex(indexName);
      
      // 更新任务状态
      const finalTasks = [...updatedTasks];
      if (result.success) {
        finalTasks[taskIndex].status = 'success';
        addConsoleLog(`索引 ${indexName} 创建成功`);
      } else {
        finalTasks[taskIndex].status = 'error';
        finalTasks[taskIndex].error = result.error;
        addConsoleLog(`索引 ${indexName} 创建失败: ${result.error}`);
      }
      setIndexTasks(finalTasks);
    } catch (error) {
      // 更新任务状态为错误
      const finalTasks = [...updatedTasks];
      finalTasks[taskIndex].status = 'error';
      finalTasks[taskIndex].error = error instanceof Error ? error.message : String(error);
      setIndexTasks(finalTasks);
      
      addConsoleLog(`创建索引 ${indexName} 时发生错误: ${finalTasks[taskIndex].error}`);
    }
  };

  // 创建所有索引
  const handleCreateAllIndexes = async () => {
    setIsRunningAll(true);
    
    // 将所有任务状态设为运行中
    const updatedTasks = indexTasks.map(task => ({
      ...task,
      status: 'running' as RunStatus
    }));
    setIndexTasks(updatedTasks);
    
    addConsoleLog('开始创建所有索引...');

    try {
      const result = await createAllIndexes();
      
      // 更新任务状态
      const finalTasks = result.results.map((idx, index) => ({
        name: idx.name,
        description: idx.description,
        status: idx.runStatus || 'pending' as RunStatus,
        error: idx.errorMessage
      }));
      setIndexTasks(finalTasks);
      
      if (result.success) {
        addConsoleLog('所有索引创建成功');
      } else {
        addConsoleLog(`部分索引创建失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      addConsoleLog(`创建索引时发生错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunningAll(false);
    }
  };

  // 执行ANALYZE命令
  const handleAnalyzeDatabase = async () => {
    setAnalyzing('running');
    setAnalysisError(null);
    addConsoleLog('开始执行ANALYZE命令优化数据库统计信息...');

    try {
      const result = await analyzeDatabase();
      
      if (result.success) {
        setAnalyzing('success');
        addConsoleLog('ANALYZE命令执行成功');
      } else {
        setAnalyzing('error');
        setAnalysisError(result.error || null);
        addConsoleLog(`ANALYZE命令执行失败: ${result.error}`);
      }
    } catch (error) {
      setAnalyzing('error');
      const errorMsg = error instanceof Error ? error.message : String(error);
      setAnalysisError(errorMsg);
      addConsoleLog(`执行ANALYZE命令时发生错误: ${errorMsg}`);
    }
  };

  // 获取任务状态图标
  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} className="text-gray-400" />;
      case 'running':
        return <RefreshCw size={18} className="text-indigo-500 animate-spin" />;
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'error':
        return <XCircle size={18} className="text-red-500" />;
      default:
        return <AlertCircle size={18} className="text-gray-400" />;
    }
  };

  // 检查初始状态
  useEffect(() => {
    handleCheckIndexes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <div className="flex items-center mb-6">
        <Link href="/admin" className="flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft size={20} className="mr-1" />
          <span>返回管理面板</span>
        </Link>
      </div>
      
      <div className="flex items-center mb-6">
        <Database size={24} className="mr-2 text-indigo-600" />
        <h1 className="text-2xl font-bold">数据库优化</h1>
      </div>
      
      {/* 主要内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧索引任务列表 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">索引优化任务</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCheckIndexes}
                  disabled={isChecking}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium flex items-center disabled:opacity-50"
                >
                  <RefreshCw size={16} className={`mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                  检查状态
                </button>
                <button
                  onClick={handleCreateAllIndexes}
                  disabled={isRunningAll}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50"
                >
                  <PlayCircle size={16} className="mr-1" />
                  执行全部
                </button>
              </div>
            </div>
            
            {/* 索引任务列表 */}
            <div className="overflow-hidden rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      索引名称
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      描述
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {indexTasks.map((task) => (
                    <tr key={task.name}>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {task.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {task.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(task.status)}
                          <span className="ml-2">
                            {task.status === 'pending' && '待执行'}
                            {task.status === 'running' && '执行中'}
                            {task.status === 'success' && '已完成'}
                            {task.status === 'error' && '失败'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleCreateIndex(task.name)}
                          disabled={task.status === 'running' || isRunningAll}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md text-xs font-medium disabled:opacity-50"
                        >
                          {task.status === 'success' ? '重新创建' : '执行'}
                        </button>
                        {task.error && (
                          <div className="mt-1 text-xs text-red-500 truncate max-w-xs" title={task.error}>
                            {task.error.substring(0, 50)}{task.error.length > 50 ? '...' : ''}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 其他优化选项 */}
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-3">其他优化任务</h3>
              <div className="bg-gray-50 rounded-md p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">更新数据库统计信息 (ANALYZE)</div>
                  <div className="text-sm text-gray-600">优化查询计划，提高查询效率</div>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(analyzing)}
                  <button
                    onClick={handleAnalyzeDatabase}
                    disabled={analyzing === 'running'}
                    className="ml-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    执行
                  </button>
                </div>
              </div>
              {analysisError && (
                <div className="mt-2 text-sm text-red-500">
                  错误: {analysisError}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 右侧控制台输出 */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-lg shadow-md h-full">
            <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-gray-200 font-mono text-sm">执行日志</h3>
              <button
                onClick={() => setConsoleOutput([])}
                className="text-gray-400 hover:text-gray-200 text-xs"
              >
                清空
              </button>
            </div>
            <div className="p-4 font-mono text-xs text-gray-300 h-[600px] overflow-y-auto">
              {consoleOutput.length === 0 ? (
                <div className="text-gray-500 italic">暂无日志输出</div>
              ) : (
                consoleOutput.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 