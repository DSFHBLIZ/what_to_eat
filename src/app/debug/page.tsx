'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErrorLog, AppState, getErrorLogs, getAppStateHistory, clearErrorLogs, clearAppStateHistory } from '../../utils/common/errorLogger';
import { getSupabaseClient } from '../../utils/data/dataService';
import { dbRecipesToFrontendModels, DbRecipe } from '../../utils/data/dataMapper';
import type { Recipe } from '../../types/recipe';
import { useRouter } from 'next/navigation';

// 接口定义
interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface JsonViewProps {
  data: any;
}

interface SystemInfo {
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  memory?: string;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  platform?: string;
  language?: string;
  cookiesEnabled?: boolean;
  timestamp?: string;
}

interface EnvVars {
  NODE_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

interface SupabaseStats {
  totalRecords?: number | null;
  queryTime?: string;
  sampleRecord?: any;
}

interface ApiStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: any;
  error?: string;
  lastChecked?: string;
}

// 自定义组件：可折叠面板
function CollapsiblePanel({ title, children, defaultOpen = false }: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
      <button
        className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <svg 
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// 自定义组件：JSON展示
function JsonView({ data }: JsonViewProps) {
  if (!data) return <p className="text-gray-500">无数据</p>;
  
  return (
    <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [recipeExample, setRecipeExample] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const router = useRouter();
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  useEffect(() => {
    async function runTests() {
      try {
        setLoading(true);
        addLog('开始诊断程序...');
        
        // 1. 检查环境变量
        addLog('检查环境变量...');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        setSupabaseStatus({
          url: supabaseUrl ? supabaseUrl : '未设置',
          keyConfigured: !!supabaseKey,
          keyLength: supabaseKey ? supabaseKey.length : 0
        });
        
        addLog(`Supabase URL: ${supabaseUrl ? supabaseUrl : '未设置'}`);
        addLog(`Supabase Key 已配置: ${!!supabaseKey}`);
        addLog(`Supabase Key 长度: ${supabaseKey ? supabaseKey.length : 0}`);
        
        // 2. 测试Supabase客户端
        addLog('测试Supabase客户端初始化...');
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) {
          throw new Error('Supabase客户端未初始化，请确保环境变量正确配置');
        }
        addLog('Supabase客户端已初始化');
        
        // 3. 尝试获取单个菜谱数据
        addLog('尝试获取单个菜谱数据...');
        const { data: singleRecipe, error: singleRecipeError } = await supabaseClient
          .from('CHrecipes')
          .select('*')
          .limit(1);
          
        if (singleRecipeError) {
          throw new Error(`获取单个菜谱失败: ${singleRecipeError.message}`);
        }
        
        if (!singleRecipe || singleRecipe.length === 0) {
          addLog('警告: 未获取到任何菜谱数据');
        } else {
          addLog(`成功获取单个菜谱数据`);
          setRecipeExample(singleRecipe[0]);
          
          // 4. 测试烹饪难度字段
          if (singleRecipe[0]) {
            addLog('检查烹饪难度字段...');
            const cookingDiffField = singleRecipe[0]['烹饪难度'];
            addLog(`烹饪难度字段值: ${JSON.stringify(cookingDiffField)}`);
            addLog(`烹饪难度字段类型: ${typeof cookingDiffField}`);
          }
        }
        
        // 5. 获取菜谱总数
        addLog('获取菜谱总数...');
        const { count, error: countError } = await supabaseClient
          .from('CHrecipes')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          throw new Error(`获取菜谱总数失败: ${countError.message}`);
        }
        
        setRecipeCount(count || 0);
        addLog(`菜谱总数: ${count}`);
        
        // 6. 尝试按烹饪难度筛选
        addLog('尝试按烹饪难度筛选...');
        const { data: filteredRecipes, error: filterError } = await supabaseClient
          .from('CHrecipes')
          .select('*')
          .eq('烹饪难度', '10分钟')
          .limit(5);
          
        if (filterError) {
          addLog(`烹饪难度筛选失败: ${filterError.message}`);
          addLog(`错误详情: ${JSON.stringify(filterError, null, 2)}`);
          
          // 尝试其他可能的查询方法
          addLog('尝试其它查询方法...');
          const { data: diffData, error: diffError } = await supabaseClient
            .from('CHrecipes')
            .select('*')
            .filter('烹饪难度', 'eq', '10分钟')
            .limit(5);
            
          if (diffError) {
            addLog(`烹饪难度筛选也失败: ${diffError.message}`);
          } else {
            addLog(`烹饪难度筛选成功，获取到 ${diffData?.length || 0} 条记录`);
          }
        } else {
          addLog(`烹饪难度筛选成功，获取到 ${filteredRecipes?.length || 0} 条记录`);
        }
        
        // 7. 测试菜系筛选 (一个已知可以工作的筛选条件)
        addLog('测试菜系筛选...');
        const { data: cuisineRecipes, error: cuisineError } = await supabaseClient
          .from('CHrecipes')
          .select('*')
          .eq('菜系', '中餐-家常菜')
          .limit(5);
          
        if (cuisineError) {
          addLog(`菜系筛选失败: ${cuisineError.message}`);
        } else {
          addLog(`菜系筛选成功，获取到 ${cuisineRecipes?.length || 0} 条记录`);
        }
        
        // 8. 检查可用的烹饪难度值 (查询所有不同的值)
        addLog('检查可用的烹饪难度值...');
        const { data: diffValues, error: diffValuesError } = await supabaseClient
          .from('CHrecipes')
          .select('烹饪难度')
          .limit(100);
          
        if (diffValuesError) {
          addLog(`获取烹饪难度值失败: ${diffValuesError.message}`);
        } else if (diffValues) {
          // 提取所有不同的值
          const uniqueValues = new Set<string>();
          
          // 直接使用any类型处理数据
          diffValues.forEach((item: any) => {
            if (item && item['烹饪难度'] !== undefined && item['烹饪难度'] !== null) {
              uniqueValues.add(String(item['烹饪难度']));
            }
          });
          
          addLog(`可用的烹饪难度值: ${Array.from(uniqueValues).join(', ')}`);
        }
        
        // 9. 测试API端点
        addLog('测试API端点...');
        try {
          const response = await fetch('/api/test');
          const apiData = await response.json();
          setTestResult(apiData);
          addLog(`API测试结果: ${JSON.stringify(apiData)}`);
        } catch (apiError) {
          addLog(`API测试失败: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        }
        
        // 添加测试代码验证烹饪难度查询
        addLog('测试烹饪难度 使用不同的查询方法...');
        try {
          const { data: recipeData, error: recipeError } = await supabaseClient
            .from('CHrecipes')
            .select('*')
            .eq('烹饪难度', '10分钟')
            .limit(5);
            
          if (recipeError) {
            addLog(`查询失败: ${recipeError.message}`);
          } else {
            addLog(`查询成功，获取到 ${recipeData?.length || 0} 条记录`);
          }
        } catch (testError) {
          addLog(`JSONB测试查询失败: ${testError instanceof Error ? testError.message : String(testError)}`);
        }
        
        addLog('诊断完成');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        addLog(`错误: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
    
    runTests();
  }, []);
  
  const runDirectRecipeQuery = async () => {
    try {
      addLog('执行直接菜谱查询...');
      setLoading(true);
      
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        throw new Error('Supabase客户端未初始化');
      }
      
      const { data, error } = await supabaseClient
        .from('CHrecipes')
        .select('*')
        .limit(10);
        
      if (error) {
        throw new Error(`直接查询失败: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('查询返回的数据为空');
      }
      
      addLog(`成功获取 ${data.length} 条菜谱数据`);
      
      // 尝试转换数据
      addLog('尝试转换数据...');
      
      // 简化起见，将数据直接转换为any类型
      const dbRecipes = data.map((item: any): any => ({
        id: item.id?.toString() || '',
        菜名: item.菜名?.toString() || '',
        描述: item.描述?.toString() || '',
        食材: typeof item.食材 === 'string' ? item.食材 : JSON.stringify(item.食材 || []),
        调料: typeof item.调料 === 'string' ? item.调料 : JSON.stringify(item.调料 || []),
        步骤: typeof item.步骤 === 'string' ? item.步骤 : JSON.stringify(item.步骤 || []),
        image_url: item.图片链接?.toString() || '',
        菜系: item.菜系?.toString() || '',
        烹饪难度: typeof item.烹饪难度 === 'string' ? item.烹饪难度 : JSON.stringify([item.烹饪难度 || '普通']),
        口味特点: typeof item.口味特点 === 'string' ? item.口味特点 : JSON.stringify(item.口味特点 || []),
        tags: typeof item.标签 === 'string' ? item.标签 : JSON.stringify(item.标签 || []),
        dietary_restrictions: [
          item.是否纯素 ? '纯素' : '', 
          item.是否清真 ? '清真' : '', 
          item.是否无麸质 ? '无麸质' : ''
        ].filter(Boolean).join(','),
        nutrition_info: typeof item.营养信息 === 'string' ? item.营养信息 : JSON.stringify(item.营养信息 || {}),
        created_at: item.创建时间?.toString() || '',
        updated_at: item.更新时间?.toString() || ''
      }));
      
      const transformed = dbRecipesToFrontendModels(dbRecipes);
      addLog(`成功转换 ${transformed.length} 条菜谱数据`);
      
      // 展示第一条数据
      if (transformed.length > 0) {
        setRecipeExample(transformed[0]);
        addLog(`转换后的数据示例: ${JSON.stringify({
          id: transformed[0].id,
          name: transformed[0].name,
          difficulty: transformed[0].difficulty,
          cuisine: transformed[0].cuisine
        })}`);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
      addLog(`直接查询错误: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-6">调试工具</h1>
      
      {/* 主题调试链接，添加在其他调试工具前 */}
      <div className="bg-background-paper rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">主题调试</h2>
        <div className="space-y-2">
          <a 
            href="/debug/theme-test" 
            className="block p-3 bg-primary text-white rounded hover:bg-opacity-90 transition-all text-center"
          >
            主题调试面板
          </a>
          <p className="text-text-secondary text-sm mt-1">
            查看和测试主题系统，包括主题切换、CSS变量、性能指标等
          </p>
        </div>
      </div>
      
      <div className="flex justify-between mb-4">
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          返回首页
        </button>
        
        <button 
          onClick={runDirectRecipeQuery}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded"
          disabled={loading}
        >
          执行直接菜谱查询
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          <h3 className="font-bold">错误:</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">环境信息</h2>
          {supabaseStatus && (
            <div>
              <p>Supabase URL: {supabaseStatus.url}</p>
              <p>Supabase Key 配置: {supabaseStatus.keyConfigured ? '已配置' : '未配置'}</p>
              <p>Supabase Key 长度: {supabaseStatus.keyLength}</p>
            </div>
          )}
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">数据库状态</h2>
          {loading ? (
            <p>加载中...</p>
          ) : (
            <div>
              <p>菜谱总数: {recipeCount}</p>
              <p>Supabase 客户端状态: {getSupabaseClient() ? '已初始化' : '未初始化'}</p>
              <p>API 测试: {testResult ? '成功' : '失败'}</p>
            </div>
          )}
        </div>
        
        <div className="border rounded p-4 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold mb-2">菜谱数据示例</h2>
          {recipeExample ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-xs">
              {JSON.stringify(recipeExample, null, 2)}
            </pre>
          ) : (
            <p>无数据</p>
          )}
        </div>
        
        <div className="border rounded p-4 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold mb-2">执行日志</h2>
          <div className="bg-black text-green-400 p-4 rounded overflow-auto max-h-96 font-mono text-xs">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            {loading && <div className="animate-pulse">正在执行测试...</div>}
          </div>
        </div>
        
        <Link href="/debug/difficulty-test" className="block p-4 bg-blue-100 hover:bg-blue-200 rounded mb-4">
          烹饪难度查询测试工具
        </Link>
        
        <Link href="/debug/fix-difficulty" className="block p-4 bg-green-100 hover:bg-green-200 rounded mb-4">
          烹饪难度数据修复工具
        </Link>
      </div>
    </div>
  );
} 
