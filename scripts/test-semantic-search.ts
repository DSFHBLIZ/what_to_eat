/**
 * 语义搜索测试脚本
 * 用法: npm run test:semantic-search
 * 
 * 此脚本直接调用embeddingService中的searchRecipesByEmbedding函数，
 * 测试语义搜索功能是否正常工作。
 */
import * as dotenv from 'dotenv';
import { searchRecipesByEmbedding, generateEmbedding } from '../lib/services/embeddingService';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 简单的测试查询
const TEST_QUERIES = [
  '家常简单的蔬菜料理',
  '适合孩子的甜点',
  '健康低脂的晚餐',
  '快速早餐',
  '无麸质的料理'
];

// 带筛选条件的测试
const FILTER_TESTS = [
  { query: '川菜', options: { cuisines: ['川菜'], matchCount: 3 } },
  { query: '清淡料理', options: { difficulties: ['简单'], matchCount: 3 } },
  { query: '健康食品', options: { dietary: ['无麸质'], matchCount: 3 } },
  { query: '家常菜', options: { avoidIngredients: ['香菜'], matchCount: 3 } }
];

// 生成embedding向量的测试
async function testGenerateEmbedding() {
  console.log('测试生成嵌入向量...');
  try {
    const embedding = await generateEmbedding('西红柿炒鸡蛋');
    console.log('嵌入向量生成成功，维度:', embedding.length);
    console.log('向量预览:', embedding.slice(0, 5), '...');
  } catch (error) {
    console.error('嵌入向量生成失败:', error);
  }
}

// 基本语义搜索测试
async function testBasicSemanticSearch() {
  console.log('\n测试基本语义搜索...');
  
  for (const query of TEST_QUERIES) {
    console.log(`\n查询: "${query}"`);
    try {
      const results = await searchRecipesByEmbedding(query, { matchCount: 3 });
      
      if (results.length === 0) {
        console.log('未找到匹配的结果。');
        continue;
      }
      
      console.log(`找到 ${results.length} 个结果:`);
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title} (相似度: ${result.similarity.toFixed(4)})`);
      });
    } catch (error) {
      console.error(`查询 "${query}" 失败:`, error);
    }
  }
}

// 带筛选条件的语义搜索测试
async function testFilteredSemanticSearch() {
  console.log('\n测试带筛选条件的语义搜索...');
  
  for (const test of FILTER_TESTS) {
    console.log(`\n查询: "${test.query}" 筛选条件:`, test.options);
    try {
      const results = await searchRecipesByEmbedding(test.query, test.options);
      
      if (results.length === 0) {
        console.log('未找到匹配的结果。');
        continue;
      }
      
      console.log(`找到 ${results.length} 个结果:`);
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title} (相似度: ${result.similarity.toFixed(4)})`);
        
        // 如果有筛选菜系，显示菜系信息
        if (test.options.cuisines) {
          console.log(`   菜系: ${result.cuisine}`);
        }
        
        // 如果有难度筛选，显示难度信息
        if (test.options.difficulties) {
          console.log(`   难度: ${result.difficulty}`);
        }
      });
    } catch (error) {
      console.error(`查询 "${test.query}" 失败:`, error);
    }
  }
}

// 主函数
async function main() {
  console.log('=== 开始语义搜索测试 ===\n');
  
  try {
    // 测试生成嵌入向量
    await testGenerateEmbedding();
    
    // 测试基本语义搜索
    await testBasicSemanticSearch();
    
    // 测试带筛选条件的语义搜索
    await testFilteredSemanticSearch();
    
    console.log('\n=== 语义搜索测试完成 ===');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
main().catch(error => {
  console.error('执行测试失败:', error);
  process.exit(1);
}); 