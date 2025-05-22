import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端（使用硬编码的值）
const supabaseUrl = 'https://ijwimydlumbolmpnmezt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqd2lteWRsdW1ib2xtcG5tZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NjExMDUsImV4cCI6MjA1ODAzNzEwNX0.ynhuFYG6dkoxDgEyDwEnWdZ-DRWx3illLZGyYwn_UnA';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('API测试路由: 测试Supabase连接...');
    
    // 测试简单查询
    console.log('API测试路由: 执行测试查询...');
    const { data, error } = await supabase
      .from('CHrecipes')
      .select('id, 菜名')
      .limit(1);

    if (error) {
      console.error('API测试路由: Supabase查询出错:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      info: '使用硬编码的Supabase配置'
    });
  } catch (error) {
    console.error('API测试路由: 异常:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 