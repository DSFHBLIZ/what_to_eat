/**
 * 这个脚本从原始的中国菜谱JSON文件中处理数据，
 * 并创建一个干净的版本用于本地存储
 * 
 * 使用方法: node scripts/prepareJsonData.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输入和输出文件路径
const INPUT_FILE = path.join(__dirname, '../中国structured_recipes.json');
const OUTPUT_FILE = path.join(__dirname, '../public/recipes.json');

// 处理每个菜谱，添加必要的字段并清理数据
function processRecipe(recipe, index) {
  // 提取关键信息并重新格式化
  return {
    id: String(recipe.id || index + 1),
    name: recipe.name || '未命名菜谱',
    description: recipe.description || recipe.intro || '暂无描述',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    seasonings: Array.isArray(recipe.seasonings) ? recipe.seasonings : [],
    flavors: Array.isArray(recipe.flavors) ? recipe.flavors : [],
    difficulty: recipe.difficulty || '中等',
    cookingTime: recipe.cookingTime || recipe.time || 30,
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    cookingTips: recipe.cookingTips || recipe.tips || [],
    imageUrl: recipe.imageUrl || recipe.image || 'https://via.placeholder.com/300x200',
  };
}

// 主函数
async function main() {
  console.log('开始处理菜谱数据...');
  
  try {
    // 读取原始JSON文件
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const recipes = JSON.parse(rawData);
    
    console.log(`读取了 ${recipes.length} 个菜谱`);
    
    // 处理每个菜谱
    const processedRecipes = recipes.map(processRecipe);
    
    // 确保输出目录存在
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存处理后的JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedRecipes, null, 2));
    
    console.log(`成功处理 ${processedRecipes.length} 个菜谱`);
    console.log(`输出文件: ${OUTPUT_FILE}`);
    console.log('数据已保存到public目录，将在项目构建时自动包含');
  } catch (error) {
    console.error('处理数据时出错:', error);
  }
}

// 运行主函数
main(); 