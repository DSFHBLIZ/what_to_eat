'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// 导入Supabase客户端
import { getSupabaseClient } from '../../../utils/data/dataService';
import { logInfo, logError, logAppState } from '../../../utils';

interface TestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  data?: any;
  error?: any;
}

// 测试Supabase客户端
export default function SupabaseTestPage() {
  const [result, setResult] = useState<TestResult>({
    status: 'idle',
    message: '点击按钮测试Supabase连接'
  });

  // 测试连接状态并获取样本数据
  const testConnection = async () => {
    setResult({
      status: 'loading',
      message: '测试Supabase连接中...'
    });

    try {
      // 记录开始测试
      logInfo('Supabase测试', '开始测试', '开始测试Supabase连接');
      
      // 检查环境变量
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // 验证环境变量
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase环境变量未设置，请检查.env.local文件配置');
      }
      
      // 使用全局单例客户端
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        throw new Error('无法获取Supabase客户端，请确保环境变量配置正确');
      }
      const { data, error } = await supabaseClient
        .from('CHrecipes')
        .select('*')
        .limit(5);
        
      if (error) {
        throw error;
      }
      
      // 记录成功结果
      logInfo('Supabase测试', '连接测试', '连接测试成功', { recordCount: data?.length });
      
      setResult({
        status: 'success',
        message: `连接成功! 获取到 ${data?.length || 0} 条记录`,
        data
      });
    } catch (error) {
      console.error('Supabase连接测试失败:', error);
      
      // 记录错误
      logError('Supabase测试', '连接测试', error instanceof Error ? error.message : String(error));
      
      setResult({
        status: 'error',
        message: `连接失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      });
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">Supabase 连接测试</h1>
      
      <div className="mb-4">
        <p className="mb-2">此页面用于测试与Supabase数据库的连接</p>
        <button
          onClick={testConnection}
          disabled={result.status === 'loading'}
          className={`px-4 py-2 rounded ${
            result.status === 'loading' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          {result.status === 'loading' ? '测试中...' : '测试连接'}
        </button>
      </div>
      
      <div className={`p-4 rounded mb-4 ${
        result.status === 'idle' ? 'bg-gray-100' :
        result.status === 'loading' ? 'bg-yellow-100' :
        result.status === 'success' ? 'bg-green-100' : 'bg-red-100'
      }`}>
        <h2 className="font-bold mb-2">状态: {result.status}</h2>
        <p>{result.message}</p>
      </div>
      
      {result.data && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">数据示例:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
      
      {result.error && (
        <div className="mt-4">
          <h2 className="font-bold mb-2 text-red-600">错误详情:</h2>
          <pre className="bg-red-50 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(result.error, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
        <Link href="/debug" className="text-indigo-500 hover:underline">
          返回调试主页
        </Link>
      </div>
    </div>
  );
} 
