import { NextResponse } from 'next/server';

export async function GET() {
  // 检查环境变量设置状态
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const openaiApiKey = process.env.OPENAI_API_KEY || '';
  const openaiProxy = process.env.OPENAI_PROXY || '';

  return NextResponse.json({
    supabaseUrl: !!supabaseUrl,
    supabaseKeySet: !!supabaseServiceKey,
    openaiKeySet: !!openaiApiKey,
    openaiProxySet: !!openaiProxy,
    openaiProxy: openaiProxy,
  });
}

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic'; 