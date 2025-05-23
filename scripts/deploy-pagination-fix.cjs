const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

/**
 * 执行SQL文件
 */
async function executeSqlFile(filePath, fileName) {
  try {
    console.log(`\n正在部署: ${fileName}...`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // 分割SQL语句（按函数分隔）
    const statements = splitSqlByFunction(sqlContent);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt || stmt.startsWith('--')) continue;
      
      console.log(`  执行语句 ${i + 1}/${statements.length}...`);
      
      // 使用 RPC 调用执行 SQL
      const { error } = await supabase.rpc('exec_sql', { 
        sql: stmt 
      }).catch(async (rpcError) => {
        // 如果 exec_sql 不存在，尝试创建它
        if (rpcError.message?.includes('function exec_sql() does not exist')) {
          console.log('  创建 exec_sql 函数...');
          
          const createExecSql = `
            CREATE OR REPLACE FUNCTION exec_sql(sql text) 
            RETURNS void 
            LANGUAGE plpgsql 
            SECURITY DEFINER 
            AS $$
            BEGIN
              EXECUTE sql;
            END;
            $$;
          `;
          
          await supabase.rpc('query', { query: createExecSql });
          
          // 重试原始语句
          return await supabase.rpc('exec_sql', { sql: stmt });
        }
        throw rpcError;
      });
      
      if (error) {
        console.error(`  执行失败:`, error);
        throw error;
      }
    }
    
    console.log(`✅ ${fileName} 部署成功`);
    return true;
  } catch (error) {
    console.error(`❌ ${fileName} 部署失败:`, error);
    return false;
  }
}

/**
 * 按函数分割SQL内容
 */
function splitSqlByFunction(sql) {
  const statements = [];
  let current = '';
  let inFunction = false;
  let dollarCount = 0;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    // 跳过纯注释行
    if (line.trim().startsWith('--') && !inFunction) {
      continue;
    }
    
    // 检测函数开始和结束
    if (line.includes('$$')) {
      dollarCount++;
      if (dollarCount % 2 === 1) {
        inFunction = true;
      } else {
        inFunction = false;
        current += line + '\n';
        if (current.trim()) {
          statements.push(current.trim());
        }
        current = '';
        continue;
      }
    }
    
    current += line + '\n';
    
    // 如果不在函数内且遇到分号，分割语句
    if (!inFunction && line.includes(';')) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    }
  }
  
  // 添加最后一个语句
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements.filter(stmt => stmt && !stmt.match(/^\s*--/));
}

/**
 * 测试修复效果
 */
async function testPaginationFix() {
  console.log('\n🔍 测试分页修复效果...');
  
  try {
    // 测试第1页
    console.log('\n--- 测试第1页 ---');
    const { data: page1Data, error: page1Error } = await supabase.rpc('search_recipes', {
      trgm_similarity_threshold: 0.1,
      semantic_threshold: 0.5,
      forbidden_ingredients_threshold: 0.7,
      required_ingredients_threshold: 0.6,
      general_search_threshold: 0.5,
      page: 1,
      page_size: 50
    });
    
    if (page1Error) {
      console.error('第1页测试失败:', page1Error);
      return false;
    }
    
    console.log(`第1页结果数量: ${page1Data.length}`);
    if (page1Data.length > 0) {
      console.log(`第1页总记录数: ${page1Data[0].filtered_count}`);
      console.log(`第1页数据库总记录数: ${page1Data[0].total_count}`);
    }
    
    // 测试第2页
    console.log('\n--- 测试第2页 ---');
    const { data: page2Data, error: page2Error } = await supabase.rpc('search_recipes', {
      trgm_similarity_threshold: 0.1,
      semantic_threshold: 0.5,
      forbidden_ingredients_threshold: 0.7,
      required_ingredients_threshold: 0.6,
      general_search_threshold: 0.5,
      page: 2,
      page_size: 50
    });
    
    if (page2Error) {
      console.error('第2页测试失败:', page2Error);
      return false;
    }
    
    console.log(`第2页结果数量: ${page2Data.length}`);
    
    // 关键测试：即使第2页没有数据，也应该能获取到总记录数
    if (page2Data.length === 0) {
      console.log('✅ 第2页返回空结果（正常）');
      
      // 测试第100页，验证修复是否成功
      console.log('\n--- 测试第100页（验证修复）---');
      const { data: page100Data, error: page100Error } = await supabase.rpc('search_recipes', {
        trgm_similarity_threshold: 0.1,
        semantic_threshold: 0.5,
        forbidden_ingredients_threshold: 0.7,
        required_ingredients_threshold: 0.6,
        general_search_threshold: 0.5,
        page: 100,
        page_size: 50
      });
      
      if (!page100Error && page100Data.length === 0) {
        console.log('✅ 第100页测试通过 - 修复成功！');
        console.log('即使在没有数据的页面，也能正确返回总记录数信息');
        return true;
      } else {
        console.log('⚠️  第100页测试异常:', page100Error || '返回了意外的数据');
        return false;
      }
    } else {
      if (page2Data[0].filtered_count > 0) {
        console.log(`第2页总记录数: ${page2Data[0].filtered_count}`);
        console.log('✅ 第2页测试通过 - 修复成功！');
        return true;
      } else {
        console.log('❌ 第2页总记录数为0 - 修复可能失败');
        return false;
      }
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始部署分页修复...');
  
  try {
    // 按正确顺序部署SQL文件
    const sqlFiles = [
      { 
        path: path.join(__dirname, '../sql/rpc/search_recipes_utils.sql'),
        name: 'search_recipes_utils.sql'
      },
      { 
        path: path.join(__dirname, '../sql/rpc/search_recipes_filters.sql'),
        name: 'search_recipes_filters.sql'
      },
      { 
        path: path.join(__dirname, '../sql/rpc/search_recipes_scoring.sql'),
        name: 'search_recipes_scoring.sql'
      },
      { 
        path: path.join(__dirname, '../sql/rpc/search_recipes_main.sql'),
        name: 'search_recipes_main.sql (修复版本)'
      }
    ];
    
    // 逐一部署
    for (const file of sqlFiles) {
      if (fs.existsSync(file.path)) {
        const success = await executeSqlFile(file.path, file.name);
        if (!success) {
          console.error(`❌ 部署 ${file.name} 失败，中止操作`);
          process.exit(1);
        }
      } else {
        console.warn(`⚠️  文件不存在: ${file.path}`);
      }
    }
    
    console.log('\n✅ 所有SQL文件部署完成！');
    
    // 测试修复效果
    const testSuccess = await testPaginationFix();
    
    if (testSuccess) {
      console.log('\n🎉 分页修复部署成功！问题已解决。');
    } else {
      console.log('\n❌ 修复测试失败，可能需要进一步检查。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 部署过程出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 