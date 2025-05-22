import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';

export async function POST() {
  try {
    // 环境变量
    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    const openaiProxy = process.env.OPENAI_PROXY || '';

    // 检查API密钥
    if (!openaiApiKey) {
      console.error('[API/embedding/test-connection] 缺少OpenAI API密钥');
      return NextResponse.json({
        success: false,
        message: '缺少OpenAI API密钥，请在环境变量中设置OPENAI_API_KEY'
      }, { status: 500 });
    }

    // 日志
    console.log('[API/embedding/test-connection] 开始测试OpenAI API连接');
    console.log('[API/embedding/test-connection] OpenAI代理状态:', openaiProxy ? `已配置 (${openaiProxy})` : '未配置');

    // 创建OpenAI客户端配置
    const config: any = { apiKey: openaiApiKey };
    
    // 添加代理配置
    if (openaiProxy) {
      console.log('[API/embedding/test-connection] 使用代理:', openaiProxy);
      const agent = new HttpsProxyAgent(openaiProxy);
      config.httpAgent = agent;
    } else {
      console.log('[API/embedding/test-connection] 不使用代理');
    }

    const openai = new OpenAI(config);

    // 测试连接
    console.log('[API/embedding/test-connection] 开始请求OpenAI API获取模型列表...');
    const startTime = Date.now();
    
    const response = await openai.models.list();
    
    const endTime = Date.now();
    console.log('[API/embedding/test-connection] API调用耗时:', endTime - startTime, 'ms');
    console.log('[API/embedding/test-connection] 成功获取模型列表，数量:', response.data.length);

    return NextResponse.json({
      success: true,
      message: `成功连接到OpenAI API，耗时${endTime - startTime}ms，获取到${response.data.length}个模型`,
      modelsCount: response.data.length
    });
  } catch (error) {
    console.error('[API/embedding/test-connection] 连接测试失败:', error);
    
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
      // 记录更详细的错误信息，特别是cause
      if ((error as any).cause) {
        console.error('[API/embedding/test-connection] 错误原因(cause):', (error as any).cause);
        errorMessage += ` (Cause: ${(error as any).cause.code || (error as any).cause.message || 'N/A'})`;
      }
      console.error('[API/embedding/test-connection] 错误堆栈:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      message: `连接OpenAI API失败: ${errorMessage}`
    }, { status: 500 });
  }
}

// 强制将路由标记为动态，避免在构建时执行
export const dynamic = 'force-dynamic'; 