import { filterRecipes } from '../../src/utils/recipe/searchUtils';
import { Recipe } from '../../src/types/recipe';
import { describe, it, expect } from 'vitest';

// 测试样本数据
const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: '宫保鸡丁',
    description: '四川传统名菜，选用鸡丁、干辣椒、花生米等炒制而成。',
    ingredients: ['鸡胸肉', '花生', '干辣椒', '葱', '姜', '蒜'],
    seasonings: ['料酒', '酱油', '醋', '白糖', '盐', '淀粉'],
    flavors: ['辣', '咸鲜'],
    difficulty: '中等',
    cookingTime: '30分钟',
    steps: ['切鸡丁', '腌制鸡丁', '准备配料', '热锅爆香', '炒制鸡丁', '勾芡出锅'],
    cookingTips: ['鸡肉不要煸炒过久，以免老柴', '花生可以先炸一下，更香脆'],
    imageUrl: '/images/kungpao-chicken.jpg',
    cuisine: '川菜',
    cookingMethod: ['炒'],
    dietaryRestrictions: [],
    tags: ['热菜', '家常菜', '鸡肉']
  },
  {
    id: '2',
    name: '番茄炒蛋',
    description: '家常菜，制作简单，营养丰富。',
    ingredients: ['西红柿', '鸡蛋', '葱'],
    seasonings: ['盐', '白糖', '香油'],
    flavors: ['酸甜'],
    difficulty: '简单',
    cookingTime: '15分钟',
    steps: ['洗切西红柿', '打散鸡蛋', '炒鸡蛋', '炒西红柿', '合炒', '出锅'],
    cookingTips: ['鸡蛋不要炒太老', '可以加一点水淀粉勾芡'],
    imageUrl: '/images/tomato-egg.jpg',
    cuisine: '家常菜',
    cookingMethod: ['炒'],
    dietaryRestrictions: ['纯素'],
    tags: ['家常菜', '快手菜']
  },
  {
    id: '3',
    name: '水煮鱼',
    description: '四川传统名菜，麻辣鲜香。',
    ingredients: ['鱼片', '豆芽', '木耳', '辣椒', '花椒', '葱', '姜', '蒜'],
    seasonings: ['豆瓣酱', '料酒', '盐', '淀粉'],
    flavors: ['麻辣', '鲜香'],
    difficulty: '高级',
    cookingTime: '45分钟',
    steps: ['准备鱼片', '焯水', '煸炒调料', '煮制', '淋热油', '出锅'],
    cookingTips: ['鱼片要用开水焯过', '最后淋热油能激发香味'],
    imageUrl: '/images/boiled-fish.jpg',
    cuisine: '川菜',
    cookingMethod: ['煮'],
    dietaryRestrictions: [],
    tags: ['热菜', '鱼类']
  }
];

describe('筛选菜谱测试', () => {
  it('根据关键词筛选菜谱', () => {
    const results = filterRecipes(sampleRecipes, { query: '鸡' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('宫保鸡丁');
  });
  
  it('根据食材筛选菜谱', () => {
    const results = filterRecipes(sampleRecipes, { ingredients: ['西红柿'] });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('番茄炒蛋');
  });
  
  it('根据菜系筛选菜谱', () => {
    const results = filterRecipes(sampleRecipes, { cuisines: ['川菜'] });
    expect(results).toHaveLength(2);
    expect(results.map((r: Recipe) => r.name)).toContain('宫保鸡丁');
    expect(results.map((r: Recipe) => r.name)).toContain('水煮鱼');
  });
  
  it('根据口味筛选菜谱', () => {
    const results = filterRecipes(sampleRecipes, { flavors: ['麻辣'] });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('水煮鱼');
  });
  
  it('根据烹饪方式筛选菜谱', () => {
    const results = filterRecipes(sampleRecipes, { cookingMethods: ['煮'] });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('水煮鱼');
  });
  
  it('组合多个条件筛选菜谱', () => {
    const results = filterRecipes(sampleRecipes, { 
      cuisines: ['川菜'],
      flavors: ['辣']
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('宫保鸡丁');
  });
  
  it('当没有匹配结果时返回空数组', () => {
    const results = filterRecipes(sampleRecipes, { 
      query: '牛肉',
      cuisines: ['粤菜']
    });
    expect(results).toHaveLength(0);
  });
}); 