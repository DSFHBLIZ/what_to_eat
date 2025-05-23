#!/usr/bin/env node

/**
 * 配置同步验证脚本
 * 检查TypeScript配置文件和SQL配置文件中的硬编码值是否一致
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const TS_CONFIG_PATH = path.join(__dirname, '../src/utils/data/searchConfig.ts');
const SQL_CONFIG_PATH = path.join(__dirname, '../sql/rpc/search_thresholds.sql');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractTSValues() {
  try {
    const content = fs.readFileSync(TS_CONFIG_PATH, 'utf8');
    const values = {};
    
    // 匹配各种配置值
    const patterns = {
      // 语义搜索阈值
      'SEMANTIC_DEFAULT': /DEFAULT:\s*([0-9.]+)/,
      'SEMANTIC_STRICT': /STRICT:\s*([0-9.]+)/,
      'SEMANTIC_RELAXED': /RELAXED:\s*([0-9.]+)/,
      'FORBIDDEN_INGREDIENTS': /FORBIDDEN_INGREDIENTS:\s*([0-9.]+)/,
      'REQUIRED_INGREDIENTS': /REQUIRED_INGREDIENTS:\s*([0-9.]+)/,
      'GENERAL_SEARCH': /GENERAL_SEARCH:\s*([0-9.]+)/,
      
      // SQL阈值
      'CHINESE_STRING_MATCH': /CHINESE_STRING_MATCH:\s*([0-9.]+)/,
      'CATEGORY_MATCH': /CATEGORY_MATCH:\s*([0-9.]+)/,
      'DISH_NAME_ADJUST_FACTOR': /DISH_NAME_ADJUST_FACTOR:\s*([0-9.]+)/,
      
      // TRGM阈值
      'TRGM_SIMILARITY_THRESHOLD': /TRGM_SIMILARITY_THRESHOLD\s*=\s*([0-9.]+)/,
      
      // 权重值
      'DISH_NAME_EXACT': /DISH_NAME:\s*\{[^}]*EXACT:\s*([0-9.]+)/,
      'DISH_NAME_FUZZY': /DISH_NAME:\s*\{[^}]*FUZZY:\s*([0-9.]+)/,
      'DISH_NAME_SIMILAR': /DISH_NAME:\s*\{[^}]*SIMILAR:\s*([0-9.]+)/,
      
      // 关键词权重
      'EXACT_MATCH': /EXACT_MATCH:\s*([0-9.]+)/,
      'PREFIX_MATCH': /PREFIX_MATCH:\s*([0-9.]+)/,
      'CONTAINS_MATCH': /CONTAINS_MATCH:\s*([0-9.]+)/,
      'MINIMAL_MATCH': /MINIMAL_MATCH:\s*([0-9.]+)/,
      
      // 评分参数
      'MAX_SCORE': /MAX_SCORE:\s*([0-9.]+)/,
      'PENALTY_FACTOR': /PENALTY_FACTOR:\s*([0-9.]+)/,
      'MATCHING_THRESHOLD': /MATCHING_THRESHOLD:\s*([0-9.]+)/,
      'KEYWORD_DECAY_FACTOR': /KEYWORD_DECAY_FACTOR:\s*([0-9.]+)/,
      'REQUIRED_PENALTY_FACTOR': /REQUIRED_PENALTY_FACTOR:\s*([0-9.]+)/,
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        values[key] = parseFloat(match[1]);
      }
    }
    
    return values;
  } catch (error) {
    log('red', `读取TypeScript配置失败: ${error.message}`);
    return {};
  }
}

function extractSQLValues() {
  try {
    const content = fs.readFileSync(SQL_CONFIG_PATH, 'utf8');
    const values = {};
    
    // 匹配SQL函数中的返回值
    const patterns = {
      'SEMANTIC_DEFAULT': /get_semantic_default_threshold.*?RETURN\s*([0-9.]+)/s,
      'SEMANTIC_STRICT': /get_semantic_strict_threshold.*?RETURN\s*([0-9.]+)/s,
      'SEMANTIC_RELAXED': /get_semantic_relaxed_threshold.*?RETURN\s*([0-9.]+)/s,
      'FORBIDDEN_INGREDIENTS': /get_forbidden_ingredients_threshold.*?RETURN\s*([0-9.]+)/s,
      'REQUIRED_INGREDIENTS': /get_required_ingredients_threshold.*?RETURN\s*([0-9.]+)/s,
      'GENERAL_SEARCH': /get_general_search_threshold.*?RETURN\s*([0-9.]+)/s,
      
      'CHINESE_STRING_MATCH': /get_chinese_string_match_threshold.*?RETURN\s*([0-9.]+)/s,
      'CATEGORY_MATCH': /get_category_match_threshold.*?RETURN\s*([0-9.]+)/s,
      'DISH_NAME_ADJUST_FACTOR': /get_dish_name_adjust_factor.*?RETURN\s*([0-9.]+)/s,
      'TRGM_SIMILARITY_THRESHOLD': /get_trgm_similarity_threshold.*?RETURN\s*([0-9.]+)/s,
      
      'DISH_NAME_EXACT': /get_score_weight_dish_name_exact.*?RETURN\s*([0-9.]+)/s,
      'DISH_NAME_FUZZY': /get_score_weight_dish_name_fuzzy.*?RETURN\s*([0-9.]+)/s,
      'DISH_NAME_SIMILAR': /get_score_weight_dish_name_similar.*?RETURN\s*([0-9.]+)/s,
      
      'EXACT_MATCH': /get_keyword_weight_exact_match.*?RETURN\s*([0-9.]+)/s,
      'PREFIX_MATCH': /get_keyword_weight_prefix_match.*?RETURN\s*([0-9.]+)/s,
      'CONTAINS_MATCH': /get_keyword_weight_contains_match.*?RETURN\s*([0-9.]+)/s,
      'MINIMAL_MATCH': /get_keyword_weight_minimal_match.*?RETURN\s*([0-9.]+)/s,
      
      'MAX_SCORE': /get_scoring_max_score.*?RETURN\s*([0-9.]+)/s,
      'PENALTY_FACTOR': /get_scoring_penalty_factor.*?RETURN\s*([0-9.]+)/s,
      'MATCHING_THRESHOLD': /get_scoring_matching_threshold.*?RETURN\s*([0-9.]+)/s,
      'KEYWORD_DECAY_FACTOR': /get_scoring_keyword_decay_factor.*?RETURN\s*([0-9.]+)/s,
      'REQUIRED_PENALTY_FACTOR': /get_scoring_required_penalty_factor.*?RETURN\s*([0-9.]+)/s,
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        values[key] = parseFloat(match[1]);
      }
    }
    
    return values;
  } catch (error) {
    log('red', `读取SQL配置失败: ${error.message}`);
    return {};
  }
}

function compareConfigs() {
  log('blue', '🔍 开始验证配置同步...\n');
  
  const tsValues = extractTSValues();
  const sqlValues = extractSQLValues();
  
  log('yellow', `📝 TypeScript配置项: ${Object.keys(tsValues).length}`);
  log('yellow', `🗄️  SQL配置项: ${Object.keys(sqlValues).length}\n`);
  
  let errors = 0;
  let warnings = 0;
  
  // 检查值是否匹配
  const allKeys = new Set([...Object.keys(tsValues), ...Object.keys(sqlValues)]);
  
  for (const key of allKeys) {
    const tsValue = tsValues[key];
    const sqlValue = sqlValues[key];
    
    if (tsValue === undefined && sqlValue !== undefined) {
      log('red', `❌ 缺失TypeScript配置: ${key} (SQL值: ${sqlValue})`);
      errors++;
    } else if (sqlValue === undefined && tsValue !== undefined) {
      log('red', `❌ 缺失SQL配置: ${key} (TS值: ${tsValue})`);
      errors++;
    } else if (tsValue !== sqlValue) {
      log('red', `❌ 配置不匹配: ${key}`);
      log('red', `   TypeScript: ${tsValue}`);
      log('red', `   SQL: ${sqlValue}`);
      errors++;
    } else {
      log('green', `✅ 配置同步: ${key} = ${tsValue}`);
    }
  }
  
  // 输出总结
  console.log('\n' + '='.repeat(50));
  if (errors === 0) {
    log('green', `🎉 配置验证通过！所有 ${allKeys.size} 个配置项都已同步`);
  } else {
    log('red', `💥 发现 ${errors} 个配置同步问题`);
    if (warnings > 0) {
      log('yellow', `⚠️  发现 ${warnings} 个警告`);
    }
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('🔧 搜索配置同步验证工具\n');
  
  // 检查文件是否存在
  if (!fs.existsSync(TS_CONFIG_PATH)) {
    log('red', `TypeScript配置文件不存在: ${TS_CONFIG_PATH}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(SQL_CONFIG_PATH)) {
    log('red', `SQL配置文件不存在: ${SQL_CONFIG_PATH}`);
    process.exit(1);
  }
  
  compareConfigs();
}

if (require.main === module) {
  main();
}

module.exports = {
  extractTSValues,
  extractSQLValues,
  compareConfigs
}; 