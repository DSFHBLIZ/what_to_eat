'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../../utils/data/dataService';
import Link from 'next/link';

// 调试类型
interface DifficultyTestResult {
  method: string;
  query: string;
  count: number;
  error?: string;
  sampleData?: any;
}

export default function DifficultyTestPage() {
  const [results, setResults] = useState<DifficultyTestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState<string>('10分钟');

  // 获取烹饪难度所有不同的值
  useEffect(() => {
    async function fetchDifficultyValues() {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          console.error("获取Supabase客户端失败");
          return;
        }
        
        const { data, error } = await supabase
          .from('CHrecipes')
          .select('烹饪难度')
          .limit(100);
          
        if (error) throw error;
        
        const values = new Set<string>();
        data.forEach((item: any) => {
          if (item && item['烹饪难度'] !== undefined && item['烹饪难度'] !== null) {
            values.add(String(item['烹饪难度']));
          }
        });
        
        setUniqueValues(Array.from(values));
      } catch (error) {
        console.error("获取烹饪难度值失败:", error);
      }
    }
    
    fetchDifficultyValues();
  }, []);

  async function runTests() {
    setLoading(true);
    setResults([]);
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("获取Supabase客户端失败");
      }
      
      const difficultyValue = customValue.trim();
      const testMethods = [
        // 测试方法1: 直接eq查询原始值
        {
          method: "原始值等于查询",
          query: `eq('烹饪难度', '${difficultyValue}')`,
          run: async () => {
            try {
              const { data, count, error } = await supabase
                .from('CHrecipes')
                .select('*', { count: 'exact' })
                .eq('烹饪难度', difficultyValue)
                .limit(5);
                
              return { data, count, error };
            } catch (e) {
              return { data: null, count: 0, error: e };
            }
          }
        },
        // 测试方法2: 使用JSON字符串
        {
          method: "不再使用JSON字符串，改为字符串直接查询",
          query: `eq('烹饪难度', '${difficultyValue}')`,
          run: async () => {
            try {
              const { data, count, error } = await supabase
                .from('CHrecipes')
                .select('*', { count: 'exact' })
                .eq('烹饪难度', difficultyValue)
                .limit(5);
                
              return { data, count, error };
            } catch (e) {
              return { data: null, count: 0, error: e };
            }
          }
        },
        // 测试方法3: 不再使用数组JSON字符串，改为直接使用字符串
        {
          method: "直接使用字符串查询",
          query: `eq('烹饪难度', '${difficultyValue}')`,
          run: async () => {
            try {
              const { data, count, error } = await supabase
                .from('CHrecipes')
                .select('*', { count: 'exact' })
                .eq('烹饪难度', difficultyValue)
                .limit(5);
                
              return { data, count, error };
            } catch (e) {
              return { data: null, count: 0, error: e };
            }
          }
        },
        // 测试方法4: 使用包含查询
        {
          method: "包含查询",
          query: `contains('烹饪难度', '${difficultyValue}')`,
          run: async () => {
            try {
              const { data, count, error } = await supabase
                .from('CHrecipes')
                .select('*', { count: 'exact' })
                .contains('烹饪难度', difficultyValue)
                .limit(5);
                
              return { data, count, error };
            } catch (e) {
              return { data: null, count: 0, error: e };
            }
          }
        },
        // 测试方法5: 使用ilike查询
        {
          method: "ILIKE查询",
          query: `ilike('烹饪难度', '%${difficultyValue}%')`,
          run: async () => {
            try {
              const { data, count, error } = await supabase
                .from('CHrecipes')
                .select('*', { count: 'exact' })
                .ilike('烹饪难度', `%${difficultyValue}%`)
                .limit(5);
                
              return { data, count, error };
            } catch (e) {
              return { data: null, count: 0, error: e };
            }
          }
        }
      ];
      
      const newResults = [];
      
      for (const test of testMethods) {
        console.log(`执行测试: ${test.method} - ${test.query}`);
        const { data, count, error } = await test.run();
        
        newResults.push({
          method: test.method,
          query: test.query,
          count: count || 0,
          error: error ? String(error) : undefined,
          sampleData: data && data.length > 0 ? {
            id: data[0].id,
            name: data[0].菜名,
            difficulty: data[0].烹饪难度
          } : undefined
        });
      }
      
      setResults(newResults);
    } catch (error) {
      console.error("测试执行失败:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">烹饪难度查询测试工具</h1>
      <p className="mb-4">此页面专门用于测试和诊断烹饪难度字段的查询问题</p>
      
      <div className="mb-6 bg-gray-50 p-4 rounded border">
        <h2 className="text-lg font-bold mb-2">烹饪难度值列表</h2>
        <p className="text-sm text-gray-600 mb-2">数据库中发现的不同烹饪难度值:</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {uniqueValues.length === 0 ? (
            <div className="text-gray-500">加载中...</div>
          ) : (
            uniqueValues.map((value, index) => (
              <div key={index} 
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                onClick={() => setCustomValue(value)}
              >
                {value}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">自定义测试</h2>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="px-3 py-2 border rounded"
            placeholder="输入烹饪难度值"
          />
          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '运行测试'}
          </button>
        </div>
      </div>
      
      {results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">测试结果</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border text-left">查询方法</th>
                  <th className="py-2 px-4 border text-left">查询语句</th>
                  <th className="py-2 px-4 border text-right">匹配数量</th>
                  <th className="py-2 px-4 border text-left">示例数据</th>
                  <th className="py-2 px-4 border text-left">错误</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className={result.count > 0 ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="py-2 px-4 border">{result.method}</td>
                    <td className="py-2 px-4 border"><code>{result.query}</code></td>
                    <td className="py-2 px-4 border text-right">{result.count}</td>
                    <td className="py-2 px-4 border">
                      {result.sampleData ? (
                        <details>
                          <summary className="cursor-pointer">查看数据</summary>
                          <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                            {JSON.stringify(result.sampleData, null, 2)}
                          </pre>
                        </details>
                      ) : '无数据'}
                    </td>
                    <td className="py-2 px-4 border text-red-500">{result.error || '无错误'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/debug" className="text-blue-500 hover:underline">
          返回调试主页
        </Link>
      </div>
    </div>
  );
} 