/**
 * 设置测试环境变量的脚本
 * 用法: node scripts/setup-test-env.js
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// 读取项目根目录的.env.local文件，并为测试创建临时的.env.test文件
function setupTestEnvironment() {
  const envFilePath = path.join(process.cwd(), '.env.local');
  const testEnvFilePath = path.join(process.cwd(), '.env.test');
  
  try {
    if (!fs.existsSync(envFilePath)) {
      console.error('错误: .env.local 文件不存在。请确保你有有效的 .env.local 文件。');
      process.exit(1);
    }
    
    // 读取.env.local文件内容
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const envLines = envContent.split('\n');
    
    // 创建测试环境变量内容
    let testEnvContent = '# 测试环境变量 - 由 setup-test-env.js 自动生成\n';
    
    // 复制必要的环境变量
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY'
    ];
    
    // 从.env.local中提取必要的变量
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key] = trimmedLine.split('=');
        if (key && requiredVars.includes(key.trim())) {
          testEnvContent += `${trimmedLine}\n`;
        }
      }
    }
    
    // 添加测试特定的变量
    testEnvContent += '\n# 测试特定的变量\n';
    testEnvContent += 'NODE_ENV=test\n';
    
    // 写入.env.test文件
    fs.writeFileSync(testEnvFilePath, testEnvContent);
    console.log('测试环境变量设置成功，已创建 .env.test 文件。');
    
    return true;
  } catch (error) {
    console.error('设置测试环境变量时出错:', error);
    return false;
  }
}

// 执行设置
setupTestEnvironment(); 