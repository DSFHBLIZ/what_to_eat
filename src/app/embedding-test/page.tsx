'use client';

import React, { useState } from 'react';
// import { createClient } from '@supabase/supabase-js'; // 不在客户端直接使用，通过API路由
import { generateEmbedding } from '../../../lib/services/embeddingService';
import { generateAndCacheQueryEmbedding } from '../../../lib/services/dbEmbeddingService';

// 定义缓存数据项的接口
interface CacheDataItem {
  id: string;
  query: string;
  created_at: string;
  embedding: number[] | string | null; // Supabase vector type might come as string in some cases initially
  // embedding_json?: any; // 如果有这个字段
}

// 获取环境变量 (仅限 NEXT_PUBLIC_ 前缀的变量在客户端可用)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // 不应在客户端暴露
const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''; // 一般也不在客户端直接使用，但测试页面有时会引用

export default function EmbeddingTestPage() {
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cacheData, setCacheData] = useState<CacheDataItem[]>([]);
  const [error, setError] = useState('');
  const [proxyState, setProxyState] = useState('未知');

  // 添加日志
  const log = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // 测试代理配置
  const testProxy = async () => {
    setLoading(true);
    try {
      log('测试OpenAI代理配置...');
      const response = await fetch('/api/embedding/test-connection', {
        method: 'POST',
      });
      
      const data = await response.json();
      if (response.ok) {
        log(`OpenAI API连接测试: ${data.success ? '成功' : '失败'}`);
        log(`详情: ${data.message}`);
        setProxyState(data.success ? '可连接OpenAI API' : '无法连接OpenAI API');
      } else {
        log(`OpenAI API连接失败: ${data.message || JSON.stringify(data)}`);
        setProxyState('无法连接OpenAI API');
      }
    } catch (err) {
      log(`测试代理出错: ${err instanceof Error ? err.message : String(err)}`);
      setProxyState('连接错误');
    } finally {
      setLoading(false);
    }
  };

  // 测试环境变量
  const testEnvVars = () => {
    log('检查客户端环境变量...');
    log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '已设置' : '未设置'}`);
    log(`OPENAI_API_KEY (NEXT_PUBLIC_): ${openaiApiKey ? '已设置' : '未设置'}`);
    log('---');
    log('请求服务器端环境变量检查...');
    
    fetch('/api/embedding/env-check')
      .then(res => res.json())
      .then(data => {
        log(`服务器端环境变量检查:`);
        log(`- NEXT_PUBLIC_SUPABASE_URL: ${data.supabaseUrl ? '已设置' : '未设置'}`);
        log(`- SUPABASE_SERVICE_ROLE_KEY: ${data.supabaseKeySet ? '已设置' : '未设置'}`);
        log(`- OPENAI_API_KEY: ${data.openaiKeySet ? '已设置' : '未设置'}`);
        log(`- OPENAI_PROXY: ${data.openaiProxySet ? '已设置' : '未设置'}`);
        if (data.openaiProxySet) {
          log(`- OPENAI_PROXY值: ${data.openaiProxy}`);
        }
      })
      .catch(err => {
        log(`获取服务器端环境变量状态失败: ${err.message}`);
      });
  };

  // 生成嵌入向量 (通过客户端的 embeddingService, 实际会调用 /api/embedding)
  const generateEmbeddingTest = async () => {
    if (!query) {
      setError('请输入查询文本');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      log(`(客户端)开始为查询生成嵌入向量: "${query}"`);
      // generateEmbedding 来源于 lib/services/embeddingService.ts
      // 它内部会 fetch('/api/embedding')
      const embedding = await generateEmbedding(query);
      log(`(客户端)成功生成嵌入向量，维度: ${embedding.length}`);
      log(`(客户端)嵌入向量样本 (前5个元素): ${embedding.slice(0, 5).join(', ')}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log(`(客户端)生成嵌入向量失败: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 缓存嵌入向量 (通过客户端的 dbEmbeddingService, 实际会调用 /api/embedding/cache)
  const cacheEmbeddingTest = async () => {
    if (!query) {
      setError('请输入查询文本');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      log(`(客户端)开始为查询缓存嵌入向量: "${query}"`);
      // generateAndCacheQueryEmbedding 来源于 lib/services/dbEmbeddingService.ts
      // 它内部会 fetch('/api/embedding/cache')
      const success = await generateAndCacheQueryEmbedding(query);
      log(`(客户端)缓存嵌入向量${success ? '成功' : '失败'}`);
      
      if (success) {
        await fetchCacheData();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log(`(客户端)缓存嵌入向量失败: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 获取缓存数据
  const fetchCacheData = async () => {
    setLoading(true);
    try {
      log('获取查询嵌入向量缓存数据...');
      const response = await fetch('/api/embedding/get-cache', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        log(`获取缓存数据失败: ${errorData.error || response.statusText}`);
        setError(errorData.error || response.statusText);
        return;
      }
      
      const { data } = await response.json();
      
      log(`成功获取缓存数据，记录数: ${data.length}`);
      setCacheData(data as CacheDataItem[]);
      
      const emptyEmbeddings = (data as CacheDataItem[]).filter(item => !item.embedding || (Array.isArray(item.embedding) && item.embedding.length === 0));
      if (emptyEmbeddings.length > 0) {
        log(`警告: 有${emptyEmbeddings.length}条记录的嵌入向量为空`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log(`获取缓存数据失败: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 服务端直接缓存向量 (这是直接调用新的API端点)
  const serverCacheEmbedding = async () => {
    if (!query) {
      setError('请输入查询文本');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      log(`开始服务端缓存嵌入向量: "${query}"`);
      
      const response = await fetch('/api/embedding/cache', { // 这个端点会处理生成和缓存
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || response.statusText);
      }
      
      log(`服务端缓存结果: ${data.success ? '成功' : '失败'}. ${data.message || ''}`);
      
      if (data.success) {
        await fetchCacheData();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log(`服务端缓存失败: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">嵌入向量测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">测试功能</h2>
          
          <div className="mb-4">
            <label className="block mb-2">查询文本</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="输入查询文本"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={testEnvVars}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              检查环境变量
            </button>
            
            <button
              onClick={testProxy}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              测试OpenAI连接
            </button>
            
            <button
              onClick={generateEmbeddingTest}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              disabled={loading || !query}
            >
              客户端生成嵌入向量
            </button>
            
            <button
              onClick={cacheEmbeddingTest}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              disabled={loading || !query}
            >
              客户端缓存嵌入向量
            </button>
            
            <button
              onClick={serverCacheEmbedding}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
              disabled={loading || !query}
            >
              服务端生成并缓存向量
            </button>
            
            <button
              onClick={fetchCacheData}
              className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition-colors"
              disabled={loading}
            >
              获取缓存数据
            </button>
            
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              清空日志
            </button>
          </div>
          
          {error && (
            <div className="p-2 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div>
            <p>代理连接状态: <span className={`${proxyState === '可连接OpenAI API' ? 'text-green-600' : 'text-red-600'}`}>{proxyState}</span></p>
          </div>
        </div>
        
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">日志</h2>
          <div style={{height: '300px'}} className="overflow-y-auto bg-gray-100 p-2 rounded text-xs">
            {logs.length > 0 ? (
              logs.map((logMsg, index) => (
                <div key={index} className="whitespace-pre-wrap break-all mb-1 border-b border-gray-200 pb-1">
                  {logMsg}
                </div>
              ))
            ) : (
              <p className="text-gray-500">暂无日志</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="border rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-2">缓存数据 (最近10条)</h2>
        
        {cacheData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border text-left">查询 (Query)</th>
                  <th className="p-2 border text-left">创建时间 (Created At)</th>
                  <th className="p-2 border text-left">向量信息 (Embedding Info)</th>
                </tr>
              </thead>
              <tbody>
                {cacheData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-2 border">{item.query}</td>
                    <td className="p-2 border">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="p-2 border">
                      {item.embedding ? (
                        <>
                          <span>长度: {Array.isArray(item.embedding) ? item.embedding.length : (typeof item.embedding === 'string' ? 'String (raw vector)' : '未知')}</span>
                          <br />
                          <span>样本: {Array.isArray(item.embedding) && item.embedding.length > 0 ? 
                            item.embedding.slice(0, 3).map((n: number) => n.toFixed(4)).join(', ') + '...' : 
                            (typeof item.embedding === 'string' ? item.embedding.slice(0, 30) + '...' : '无数据')}</span>
                        </>
                      ) : (
                        <span className="text-red-500">空</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">暂无缓存数据</p>
        )}
      </div>
    </div>
  );
} 