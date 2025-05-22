// 执行embedding_cache.sql脚本修复函数冲突问题
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 环境变量不完整');
  console.error('请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  try {
    console.log('开始修复embedding_cache函数...');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'rpc', 'embedding_cache.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log(`成功读取SQL文件: ${sqlFilePath}`);
    console.log('开始执行SQL...');
    
    // 将SQL内容写入临时文件
    const tmpSqlFile = path.join(__dirname, 'temp_fix.sql');
    fs.writeFileSync(tmpSqlFile, sqlContent, 'utf8');
    
    // 获取数据库连接信息
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl) {
      console.error('错误: 缺少DATABASE_URL环境变量');
      console.error('请设置连接到Supabase数据库的DATABASE_URL');
      process.exit(1);
    }
    
    // 使用psql执行SQL
    try {
      console.log('使用psql执行SQL...');
      execSync(`psql "${dbUrl}" -f "${tmpSqlFile}"`, { stdio: 'inherit' });
      console.log('SQL执行成功！函数冲突已修复');
    } catch (execError) {
      console.error('执行psql命令时出错:', execError);
      console.log('注意: 请确保已安装psql客户端工具');
      
      // 备选方案: 使用supabase-js
      console.log('尝试使用supabase-js测试函数...');
    }
    
    // 删除临时文件
    try {
      fs.unlinkSync(tmpSqlFile);
    } catch (e) {
      console.warn('无法删除临时文件:', tmpSqlFile);
    }
    
    // 测试修复是否成功
    console.log('测试函数是否可用...');
    const testQuery = '测试查询';
    const testVector = Array(1536).fill(0.1);
    
    const { error: testError } = await supabase.rpc('cache_query_embedding', {
      query_text: testQuery,
      query_vector: testVector
    });
    
    if (testError) {
      console.error('测试函数时出错:', testError);
      console.error('请手动执行SQL文件:', sqlFilePath);
      console.error('错误详情:', testError.message);
      process.exit(1);
    }
    
    console.log('测试成功！函数现在可以正常工作');
    
  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
}

main(); 