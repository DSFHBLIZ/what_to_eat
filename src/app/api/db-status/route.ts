import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端（使用硬编码的值）
const supabaseUrl = 'https://ijwimydlumbolmpnmezt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqd2lteWRsdW1ib2xtcG5tZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NjExMDUsImV4cCI6MjA1ODAzNzEwNX0.ynhuFYG6dkoxDgEyDwEnWdZ-DRWx3illLZGyYwn_UnA';
const supabase = createClient(supabaseUrl, supabaseKey);

// 简化的日志函数
function logError(source: string, action: string, message: string) {
  console.error(`[${source}] [${action}] Error: ${message}`);
}

function logInfo(source: string, action: string, message: string, data?: any) {
  console.log(`[${source}] [${action}] Info: ${message}`, data || '');
}

/**
 * 处理GET请求，检查数据库连接状态
 */
export async function GET() {
  try {
    console.log('API路由: 开始检查Supabase连接状态...');
    logInfo('API', '数据库状态检查', '开始检查Supabase连接');
    
    const checkResults = {
      connectionTest: false,
      tablesFound: [] as string[],
      error: null as string | null,
      info: '使用硬编码的Supabase配置'
    };
    
    // 测试连接
    try {
      const { data, error } = await supabase.from('CHrecipes').select('id').limit(1);
      
      if (error) {
        console.error('Supabase连接测试失败:', error);
        logError('API', '数据库状态检查', error.message);
        checkResults.error = error.message;
      } else {
        checkResults.connectionTest = true;
        console.log('Supabase连接测试成功');
        
        // 检查表是否存在
        const tables = ['CHrecipes', 'users', 'collections'];
        for (const table of tables) {
          try {
            const { data: tableData, error: tableError } = await supabase.from(table).select('id').limit(1);
            if (!tableError) {
              checkResults.tablesFound.push(table);
            }
          } catch (tableCheckError) {
            console.warn(`检查表 ${table} 失败:`, tableCheckError);
          }
        }
      }
    } catch (testError) {
      console.error('Supabase连接测试过程中出错:', testError);
      logError('API', '数据库状态检查', testError instanceof Error ? testError.message : String(testError));
      checkResults.error = testError instanceof Error ? testError.message : String(testError);
    }
    
    // 返回状态信息
    return new NextResponse(JSON.stringify(checkResults), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('API路由: 检查数据库状态失败:', error);
    logError('API', '数据库状态检查', error instanceof Error ? error.message : String(error));
    
    return new NextResponse(JSON.stringify({ 
      error: '检查数据库状态失败', 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

/**
 * 处理OPTIONS请求，用于CORS预检
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 