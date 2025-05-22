'use client';

import { useState } from 'react';
import { getSupabaseClient } from '../../../utils/data/dataService';

interface RecordWithDifficulty {
  id: string;
  烹饪难度?: string | any;
}

export default function FixDifficultyPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    found: number;
    fixed: number;
    errors: number;
  }>({ found: 0, fixed: 0, errors: 0 });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  // 清理多余引号
  function cleanDifficultyValue(value: string): string {
    if (!value) return '';
    
    // 尝试JSON解析
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string') {
        return parsed.trim();
      }
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed[0].trim();
      }
    } catch (e) {
      // 非JSON，尝试移除引号
      return value.replace(/^"|"$/g, '').trim();
    }
    
    return value.trim();
  }

  async function scanDifficultyValues() {
    setLoading(true);
    setLogs([]);
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase客户端未初始化');
      }
      
      addLog('正在扫描烹饪难度字段...');
      
      const { data, error } = await supabase
        .from('CHrecipes')
        .select('id, 烹饪难度')
        .limit(1000);
        
      if (error) {
        throw new Error(`获取数据失败: ${error.message}`);
      }
      
      addLog(`获取到 ${data.length} 条记录`);
      
      // 找出需要修复的记录
      const recordsToFix: RecordWithDifficulty[] = [];
      
      data.forEach((record: any) => {
        const value = record.烹饪难度;
        if (!value) return;
        
        // 检查是否需要修复
        if (typeof value === 'string' && 
            (value.startsWith('"') || value.startsWith('['))) {
          
          const originalValue = value;
          const cleanValue = cleanDifficultyValue(value);
          
          if (originalValue !== cleanValue) {
            recordsToFix.push({
              id: record.id,
              烹饪难度: value
            });
            
            addLog(`需要修复: ID ${record.id}, 难度: "${value}" -> "${cleanValue}"`);
          }
        }
      });
      
      setResults({
        found: recordsToFix.length,
        fixed: 0,
        errors: 0
      });
      
      addLog(`找到 ${recordsToFix.length} 条需要修复的记录`);
    } catch (error) {
      addLog(`错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function fixDifficultyValues() {
    setLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase客户端未初始化');
      }
      
      addLog('正在扫描需要修复的烹饪难度...');
      
      const { data, error } = await supabase
        .from('CHrecipes')
        .select('id, 烹饪难度')
        .limit(1000);
        
      if (error) {
        throw new Error(`获取数据失败: ${error.message}`);
      }
      
      // 找出并修复记录
      let fixedCount = 0;
      let errorCount = 0;
      
      for (const record of data as any[]) {
        const value = record.烹饪难度;
        if (!value) continue;
        
        // 检查是否需要修复
        if (typeof value === 'string' && 
            (value.startsWith('"') || value.startsWith('['))) {
          
          const cleanValue = cleanDifficultyValue(value);
          
          if (value !== cleanValue) {
            addLog(`修复记录 ID ${record.id}: "${value}" -> "${cleanValue}"`);
            
            // 更新记录
            const { error: updateError } = await supabase
              .from('CHrecipes')
              .update({ 烹饪难度: cleanValue })
              .eq('id', record.id);
              
            if (updateError) {
              addLog(`更新失败: ID ${record.id}, 错误: ${updateError.message}`);
              errorCount++;
            } else {
              fixedCount++;
            }
          }
        }
      }
      
      setResults({
        found: results.found,
        fixed: fixedCount,
        errors: errorCount
      });
      
      addLog(`修复完成: 成功 ${fixedCount} 条, 失败 ${errorCount} 条`);
    } catch (error) {
      addLog(`错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">烹饪难度数据修复工具</h1>
      <p className="mb-4">此工具用于清理烹饪难度字段中的多余引号，修复数据格式问题</p>
      
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={scanDifficultyValues}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '扫描中...' : '扫描问题数据'}
        </button>
        
        <button
          onClick={fixDifficultyValues}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? '修复中...' : '修复问题数据'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded border p-4">
          <h2 className="text-lg font-bold mb-2">结果统计</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-yellow-100 rounded">
              <div className="text-xl font-bold">{results.found}</div>
              <div className="text-sm">发现问题</div>
            </div>
            <div className="text-center p-3 bg-green-100 rounded">
              <div className="text-xl font-bold">{results.fixed}</div>
              <div className="text-sm">已修复</div>
            </div>
            <div className="text-center p-3 bg-red-100 rounded">
              <div className="text-xl font-bold">{results.errors}</div>
              <div className="text-sm">失败</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded border p-4">
          <h2 className="text-lg font-bold mb-2">操作日志</h2>
          <div className="h-64 overflow-y-auto bg-gray-100 p-2 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 p-2">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 