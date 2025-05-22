/**
 * 数据库索引优化工具
 * 
 * 本文件提供了为Supabase菜谱数据库设置必要索引的函数。
 * 这些索引将提高搜索查询和筛选操作的性能。
 * 
 * 索引优化包括：
 * 1. 为菜谱名称创建全文搜索索引
 * 2. 为食材和调料字段创建GIN索引
 * 3. 为常用筛选字段创建B-tree索引
 */

// 导入语句修改为使用dataService中的getSupabaseClient
import { getSupabaseClient } from './dataService';

// 索引定义接口
export interface IndexDefinition {
  name: string;
  description: string;
  tableName: string;
  sql: string;
  runStatus?: 'pending' | 'running' | 'success' | 'error';
  errorMessage?: string;
}

/**
 * 数据库优化工具，用于创建索引提高搜索性能
 */

// 定义需要创建的索引
export const INDEXES: IndexDefinition[] = [
  {
    name: 'idx_recipe_name',
    description: '菜谱名称文本搜索索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_name ON "CHrecipes" USING gin (to_tsvector('chinese', "name"));`
  },
  {
    name: 'idx_recipe_description',
    description: '菜谱描述文本搜索索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_description ON "CHrecipes" USING gin (to_tsvector('chinese', "description"));`
  },
  {
    name: 'idx_recipe_ingredients',
    description: '食材JSONB索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_ingredients ON "CHrecipes" USING gin ("ingredients");`
  },
  {
    name: 'idx_recipe_seasonings',
    description: '调料JSONB索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_seasonings ON "CHrecipes" USING gin ("seasonings");`
  },
  {
    name: 'idx_recipe_flavors',
    description: '口味特点索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_flavors ON "CHrecipes" USING gin ("flavors");`
  },
  {
    name: 'idx_recipe_cuisine',
    description: '菜系索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_cuisine ON "CHrecipes" ("cuisine");`
  },
  {
    name: 'idx_recipe_difficulty',
    description: '难度索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_difficulty ON "CHrecipes" ("difficulty");`
  },
  {
    name: 'idx_recipe_cookingTime',
    description: '烹饪时间索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_cookingTime ON "CHrecipes" ("cookingTime");`
  },
  {
    name: 'idx_recipe_cookingMethods',
    description: '烹饪方法索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_cookingMethods ON "CHrecipes" USING gin ("cookingMethods");`
  },
  {
    name: 'idx_recipe_dietaryRestrictions',
    description: '饮食限制索引',
    tableName: 'CHrecipes',
    sql: `CREATE INDEX IF NOT EXISTS idx_recipe_dietaryRestrictions ON "CHrecipes" USING gin ("dietaryRestrictions");`
  }
];

/**
 * 创建所有索引
 */
export async function createAllIndexes() {
  console.log('开始创建所有索引...');
  let hasError = false;
  const indexResults: IndexDefinition[] = [];
  
  for (const indexDef of INDEXES) {
    console.log(`创建索引: ${indexDef.name}`);
    
    const updateIndexDef: IndexDefinition = { 
      ...indexDef, 
      runStatus: 'running' 
    };
    indexResults.push(updateIndexDef);
    
    try {
      // 获取客户端实例
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('无法获取Supabase客户端');
      }
      
      // 执行创建索引SQL
      const { error } = await client.rpc('run_sql', { sql_query: indexDef.sql });
      
      if (error) {
        console.error(`创建索引 ${indexDef.name} 失败:`, error.message);
        updateIndexDef.runStatus = 'error';
        updateIndexDef.errorMessage = error.message;
        hasError = true;
      } else {
        console.log(`索引 ${indexDef.name} 创建成功`);
        updateIndexDef.runStatus = 'success';
      }
    } catch (error) {
      console.error(`创建索引 ${indexDef.name} 发生错误:`, error);
      updateIndexDef.runStatus = 'error';
      updateIndexDef.errorMessage = error instanceof Error ? error.message : String(error);
      hasError = true;
    }
  }
  
  return {
    success: !hasError,
    results: indexResults,
    error: hasError ? '部分索引创建失败，请查看详情' : undefined
  };
}

/**
 * 创建单个索引
 * @param indexName 索引名称
 */
export async function createSingleIndex(indexName: string) {
  const indexDef = INDEXES.find(idx => idx.name === indexName);
  
  if (!indexDef) {
    return {
      success: false,
      error: `索引 ${indexName} 未找到定义`
    };
  }
  
  console.log(`创建索引: ${indexDef.name}`);
  
  try {
    // 获取客户端实例
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('无法获取Supabase客户端');
    }
    
    // 执行创建索引SQL
    const { error } = await client.rpc('run_sql', { sql_query: indexDef.sql });
    
    if (error) {
      console.error(`创建索引 ${indexDef.name} 失败:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log(`索引 ${indexDef.name} 创建成功`);
    return {
      success: true
    };
  } catch (error) {
    console.error(`创建索引 ${indexDef.name} 发生错误:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 检查索引状态
 */
export async function checkIndexes() {
  console.log('检查索引状态...');
  
  try {
    // 获取客户端实例
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('无法获取Supabase客户端');
    }
    
    // 查询索引存在状态的SQL
    const checkSql = `
      SELECT
        i.indexname AS index_name,
        i.indexdef AS index_definition
      FROM
        pg_indexes i
      WHERE
        i.schemaname = 'public' AND
        i.tablename = 'CHrecipes';
    `;
    
    const { data, error } = await client.rpc('run_sql', { sql_query: checkSql });
    
    if (error) {
      console.error('检查索引状态失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
    
    // 解析查询结果
    interface IndexRow {
      index_name: string;
      index_definition: string;
    }
    // 确保data是数组
    const indexData = Array.isArray(data) ? data : [];
    const existingIndexes = indexData.map((row: IndexRow) => row.index_name);
    
    // 检查每个预定义索引是否存在
    const indexStatus = INDEXES.map(indexDef => ({
      name: indexDef.name,
      exists: existingIndexes.includes(indexDef.name)
    }));
    
    console.log('索引状态检查完成');
    return {
      success: true,
      indexes: indexStatus
    };
  } catch (error) {
    console.error('检查索引状态发生错误:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 优化数据库统计信息
 */
export async function analyzeDatabase() {
  console.log('开始执行ANALYZE命令...');
  
  try {
    // 获取客户端实例
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('无法获取Supabase客户端');
    }
    
    // 执行ANALYZE命令
    const analyzeSql = `ANALYZE "CHrecipes";`;
    const { error } = await client.rpc('run_sql', { sql_query: analyzeSql });
    
    if (error) {
      console.error('执行ANALYZE命令失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('ANALYZE命令执行成功');
    return {
      success: true
    };
  } catch (error) {
    console.error('执行ANALYZE命令发生错误:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// 添加存储过程用于检查索引
export async function createIndexHelperFunctions(): Promise<boolean> {
  try {
    // 获取客户端实例
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('无法获取Supabase客户端');
    }
    
    // 创建检查索引是否存在的函数
    const { error } = await client.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION check_index_exists(index_name text)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          exists_val boolean;
        BEGIN
          SELECT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE indexname = index_name
          ) INTO exists_val;
          
          RETURN exists_val;
        END;
        $$;
        
        -- 授予匿名用户执行权限
        GRANT EXECUTE ON FUNCTION check_index_exists TO anon;
        
        -- 创建执行SQL的函数（需要RLS策略限制）
        CREATE OR REPLACE FUNCTION execute_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
        
        -- 授予匿名用户执行权限
        GRANT EXECUTE ON FUNCTION execute_sql TO anon;
      `
    });
    
    if (error) {
      console.error('创建索引帮助函数失败:', error);
      return false;
    }
    
    console.log('成功创建索引帮助函数');
    return true;
  } catch (error) {
    console.error('创建索引帮助函数时发生异常:', error);
    return false;
  }
} 