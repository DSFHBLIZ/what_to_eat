import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';

export async function POST(request: NextRequest) {
  try {
    // 环境变量
    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    const openaiProxy = process.env.OPENAI_PROXY || '';

    // 检查API密钥
    if (!openaiApiKey) {
      console.error('[API/embedding/route] 缺少OpenAI API密钥');
      return NextResponse.json({
        success: false,
        error: '缺少OpenAI API密钥，请在环境变量中设置OPENAI_API_KEY'
      }, { status: 500 });
    }

    // 解析请求数据
    const requestData = await request.json();
    const { text } = requestData;

    if (!text || typeof text !== 'string') {
      console.warn('[API/embedding/route] 缺少文本参数或格式不正确');
      return NextResponse.json({
        success: false,
        error: '缺少文本参数或格式不正确'
      }, { status: 400 });
    }

    console.log(`[API/embedding/route] 开始为文本生成嵌入向量，文本长度: ${text.length}`);
    console.log('[API/embedding/route] OpenAI代理状态:', openaiProxy ? `已配置 (${openaiProxy})` : '未配置');

    // 创建OpenAI客户端配置
    const config: any = { apiKey: openaiApiKey }; // 使用 any 类型
    
    // 添加代理配置
    if (openaiProxy) {
      console.log('[API/embedding/route] 使用代理:', openaiProxy);
      const agent = new HttpsProxyAgent(openaiProxy);
      config.httpAgent = agent;
    } else {
      console.log('[API/embedding/route] 不使用代理');
    }

    const openai = new OpenAI(config);

    // 生成嵌入向量
    console.log('[API/embedding/route] 调用OpenAI API生成嵌入向量...');
    const startTime = Date.now();

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim().toLowerCase(),
      encoding_format: 'float',
    });

    const endTime = Date.now();
    console.log(`[API/embedding/route] API调用耗时: ${endTime - startTime}ms`);

    if (!response || !response.data || !response.data[0] || !response.data[0].embedding) {
      console.error('[API/embedding/route] API响应无效:', response);
      return NextResponse.json({
        success: false,
        error: 'OpenAI API响应无效，无法获取嵌入向量'
      }, { status: 500 });
    }

    const embedding = response.data[0].embedding;
    console.log(`[API/embedding/route] 成功获取嵌入向量，维度: ${embedding.length}`);

    return NextResponse.json({
      success: true,
      embedding: embedding,
      dimension: embedding.length
    });
  } catch (error) {
    console.error('[API/embedding/route] 生成嵌入向量失败:', error);
    
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
      if ((error as any).cause) {
        console.error('[API/embedding/route] 错误原因(cause):', (error as any).cause);
        errorMessage += ` (Cause: ${(error as any).cause.code || (error as any).cause.message || 'N/A'})`;
      }
      console.error('[API/embedding/route] 错误堆栈:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: `生成嵌入向量失败: ${errorMessage}`
    }, { status: 500 });
  }
}

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic'; 