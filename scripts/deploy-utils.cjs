// CommonJS 脚本
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 环境变量未设置。请确保NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY在.env.local中设置正确。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  }
});

async function executeSqlFile(filePath) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`执行文件: ${path.basename(filePath)}`);
    console.log('SQL内容长度:', sqlContent.length, '字节');
    
    // 拆分SQL语句，按照;和$$分隔
    const statements = splitSqlStatements(sqlContent);
    console.log(`拆分为 ${statements.length} 条SQL语句`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      console.log(`执行SQL语句 ${i+1}/${statements.length}...`);
      console.log('语句长度:', stmt.length, '字节');
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          console.error(`执行SQL失败:`, error);
          
          if (error.message.includes('function exec_sql() does not exist')) {
            console.log('创建exec_sql函数...');
            try {
              const createFnResult = await supabase.rpc('pgcrypto', { 
                command: `
                  CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
                  BEGIN
                    EXECUTE sql;
                  END;
                  $$ LANGUAGE plpgsql SECURITY DEFINER;
                `
              });
              
              if (createFnResult.error) {
                console.error('创建exec_sql函数失败:', createFnResult.error);
                console.log('尝试直接执行SQL...');
                const { error: directError } = await supabase.rpc('postgres', { query: stmt });
                if (directError) {
                  console.error('直接执行SQL失败:', directError);
                  process.exit(1);
                }
              } else {
                console.log('重试执行原始SQL...');
                const { error: retryError } = await supabase.rpc('exec_sql', { sql: stmt });
                if (retryError) {
                  console.error('重试执行SQL失败:', retryError);
                  process.exit(1);
                }
              }
            } catch (e) {
              console.error('尝试创建exec_sql函数时出错:', e);
              process.exit(1);
            }
          } else {
            console.warn('继续执行下一条语句...');
          }
        } else {
          console.log('SQL执行成功!');
        }
      } catch (e) {
        console.error(`执行语句时出错:`, e);
        continue;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`读取或执行文件 ${filePath} 时出错:`, error);
    return false;
  }
}

function splitSqlStatements(sql) {
  // 按照分号分隔语句，但忽略函数体内的分号
  const statements = [];
  let current = '';
  let inFunction = false;
  
  // 分割成行
  const lines = sql.split('\n');
  
  for (const line of lines) {
    // 跳过注释行
    if (line.trim().startsWith('--')) {
      current += line + '\n';
      continue;
    }
    
    // 检查函数定义开始或结束
    if (line.includes('$$') && !inFunction) {
      inFunction = true;
      current += line + '\n';
      continue;
    } else if (line.includes('$$') && inFunction) {
      inFunction = false;
      current += line + '\n';
      continue;
    }
    
    // 在函数内部，不分割
    if (inFunction) {
      current += line + '\n';
      continue;
    }
    
    // 检查语句结束
    if (line.includes(';')) {
      const parts = line.split(';');
      for (let i = 0; i < parts.length - 1; i++) {
        current += parts[i] + ';';
        statements.push(current.trim());
        current = '';
      }
      current += parts[parts.length - 1] + '\n';
    } else {
      current += line + '\n';
    }
  }
  
  // 添加最后一个语句(如果有)
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements;
}

async function main() {
  console.log('准备执行SQL文件...');
  
  // 首先尝试创建pgcrypto扩展以及exec_sql函数
  try {
    console.log('尝试创建pgcrypto扩展和vector扩展...');
    await supabase.rpc('postgres', { 
      query: `
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE EXTENSION IF NOT EXISTS vector;
        
        CREATE OR REPLACE FUNCTION pgcrypto(command text) RETURNS void AS $$
        BEGIN
          EXECUTE command;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        CREATE OR REPLACE FUNCTION postgres(query text) RETURNS void AS $$
        BEGIN
          EXECUTE query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
  } catch (error) {
    console.warn('无法创建初始函数，但这可能是预期的:', error.message);
  }
  
  // 执行 search_recipes_utils.sql 文件
  const utilsFile = path.join(__dirname, '../sql/rpc/search_recipes_utils.sql');
  if (fs.existsSync(utilsFile)) {
    console.log(`处理文件: ${path.basename(utilsFile)}`);
    const success = await executeSqlFile(utilsFile);
    if (!success) {
      console.error(`执行 ${path.basename(utilsFile)} 失败，中止操作。`);
      process.exit(1);
    }
  } else {
    console.error(`文件不存在: ${utilsFile}`);
    process.exit(1);
  }
  
  console.log('SQL文件执行完成!');
}

main().catch(error => {
  console.error('执行过程中发生错误:', error);
  process.exit(1);
}); 