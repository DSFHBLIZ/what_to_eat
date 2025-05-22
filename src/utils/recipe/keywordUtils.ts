/**
 * 关键词处理工具函数
 */
import { safeJsonParse } from '../common/safeTypeConversions';
import { getSupabaseClient } from '../data/dataService';

/**
 * 关键词处理工具函数
 */

// 模拟关键词建议数据
const KEYWORD_SUGGESTIONS = [
  '火锅', '烧烤', '麻辣香锅', '寿司', '意大利面', 
  '披萨', '汉堡', '炸鸡', '烤鱼', '麻辣烫',
  '冒菜', '煲仔饭', '生煎', '小龙虾', '川菜',
  '粤菜', '湘菜', '东北菜', '西北菜', '徽菜',
  '鸡肉', '牛肉', '猪肉', '羊肉', '鱼肉',
  '虾', '蟹', '贝类', '豆腐', '茄子',
  '土豆', '西红柿', '青椒', '洋葱', '大蒜',
  '姜', '葱', '花椒', '辣椒', '八角',
  '米饭', '面条', '馒头', '包子', '饺子',
  '馄饨', '粥', '油条', '豆浆', '糯米'
];

// 食材分类
const INGREDIENT_CATEGORIES = {
  主食类: ['米饭', '面条', '馒头', '包子', '饺子', '馄饨', '粥', '油条'],
  肉类: ['鸡肉', '牛肉', '猪肉', '羊肉', '鱼肉', '虾', '蟹', '贝类'],
  蔬菜类: ['土豆', '西红柿', '茄子', '青椒', '洋葱', '大蒜', '姜', '葱'],
  豆制品: ['豆腐', '豆皮', '腐竹', '豆干'],
  调味料: ['花椒', '辣椒', '八角', '桂皮', '香叶', '葱', '姜', '蒜']
};

/**
 * 根据食材获取相关的食谱建议
 * @param ingredients 已选择的食材列表
 * @returns 推荐的食谱列表
 */
export function getRecipeSuggestions(ingredients: string[]): string[] {
  // 这里应该是真实的基于食材匹配算法，目前使用简单示例数据
  const recipeMap: Record<string, string[]> = {
    '鸡肉': ['宫保鸡丁', '辣子鸡', '可乐鸡翅', '白斩鸡', '咖喱鸡'],
    '牛肉': ['水煮牛肉', '红烧牛肉', '牛肉面', '铁板牛柳', '糖醋牛肉'],
    '猪肉': ['红烧肉', '回锅肉', '糖醋排骨', '酸菜炖猪肉', '肉末茄子'],
    '豆腐': ['麻婆豆腐', '家常豆腐', '鱼香豆腐', '豆腐脑', '酿豆腐'],
    '土豆': ['土豆烧牛肉', '醋溜土豆丝', '土豆炖排骨', '香辣土豆丝', '土豆泥']
  };

  // 收集所有匹配的食谱
  const suggestions = new Set<string>();
  
  ingredients.forEach(ingredient => {
    const normalizedIngredient = ingredient.toLowerCase();
    
    // 查找匹配的食材
    Object.keys(recipeMap).forEach(key => {
      if (key.toLowerCase().includes(normalizedIngredient)) {
        recipeMap[key].forEach(recipe => suggestions.add(recipe));
      }
    });
  });

  return Array.from(suggestions);
}

/**
 * 将关键词标准化（去除多余空格、转小写等）
 * @param keyword 原始关键词
 * @returns 标准化后的关键词
 */
export function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

/**
 * 根据用户输入生成搜索查询
 * @param term 搜索词
 * @param filters 筛选条件
 * @returns 格式化的搜索查询
 */
export function buildSearchQuery(term: string, filters?: Record<string, string[]>): string {
  let query = term.trim();
  
  if (filters) {
    const filterTerms: string[] = [];
    
    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        filterTerms.push(`${key}:(${values.join(' OR ')})`);
      }
    });
    
    if (filterTerms.length > 0) {
      query += ` ${filterTerms.join(' AND ')}`;
    }
  }
  
  return query;
}

/**
 * 计算关键词权重
 * @param keyword 关键词
 * @param query 查询词
 * @param baseWeight 基础权重
 * @returns 计算后的权重
 */
function calculateWeight(keyword: string, query: string, baseWeight: number): number {
  const keywordLower = keyword.toLowerCase();
  
  // 完全匹配得到最高权重
  if (keywordLower === query) {
    return baseWeight;
  }
  
  // 前缀匹配得到较高权重
  if (keywordLower.startsWith(query)) {
    return baseWeight * 0.8;
  }
  
  // 包含关系得到中等权重
  if (keywordLower.includes(query)) {
    return baseWeight * 0.6;
  }
  
  // 最低匹配权重
  return baseWeight * 0.3;
}

/**
 * 解析搜索文本，提取关键词标签
 * 支持空格、逗号、分号分隔的多个关键词
 * @param searchText 搜索文本
 * @returns 关键词标签数组
 */
export function parseSearchTags(searchText: string): string[] {
  if (!searchText) return [];
  
  // 支持多种分隔符: 空格、逗号、分号
  const separators = [' ', ',', '，', ';', '；'];
  let text = searchText.trim();
  
  // 替换所有分隔符为标准分隔符(空格)
  for (const sep of separators) {
    if (sep !== ' ') {
      text = text.split(sep).join(' ');
    }
  }
  
  // 分割并过滤空标签
  return text.split(' ')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * 添加关键词标签
 * 如果标签已存在，不重复添加
 * @param currentSearchText 当前搜索文本
 * @param newTag 要添加的新标签
 * @returns 更新后的搜索文本
 */
export function addSearchTag(currentSearchText: string, newTag: string): string {
  if (!newTag.trim()) return currentSearchText;
  
  const existingTags = parseSearchTags(currentSearchText);
  
  // 检查标签是否已存在 (不区分大小写)
  const newTagLower = newTag.trim().toLowerCase();
  if (existingTags.some(tag => tag.toLowerCase() === newTagLower)) {
    return currentSearchText; // 标签已存在，不添加
  }
  
  // 如果当前搜索文本为空，直接返回新标签
  if (!currentSearchText.trim()) {
    return newTag.trim();
  }
  
  // 添加标签，使用空格作为分隔符
  return `${currentSearchText.trim()} ${newTag.trim()}`;
}

/**
 * 移除关键词标签
 * @param currentSearchText 当前搜索文本
 * @param tagToRemove 要移除的标签
 * @returns 更新后的搜索文本
 */
export function removeSearchTag(currentSearchText: string, tagToRemove: string): string {
  if (!currentSearchText.trim() || !tagToRemove.trim()) {
    return currentSearchText;
  }
  
  const existingTags = parseSearchTags(currentSearchText);
  const tagToRemoveLower = tagToRemove.trim().toLowerCase();
  
  // 过滤掉要移除的标签
  const updatedTags = existingTags.filter(
    tag => tag.toLowerCase() !== tagToRemoveLower
  );
  
  // 重新组合标签
  return updatedTags.join(' ');
}

/**
 * 检查文本是否可能包含食材信息
 * @param text 要检查的文本
 * @returns 是否可能是食材
 */
export function isLikelyIngredient(text: string): boolean {
  if (!text) return false;
  
  // 常见食材关键词
  const ingredientKeywords = [
    '肉', '鱼', '虾', '蟹', '贝', '鸡', '鸭', '鹅', '牛', '羊', '猪',
    '菜', '蔬', '菠菜', '白菜', '萝卜', '土豆', '洋葱', '大蒜', '小葱',
    '豆', '腐', '蛋', '奶', '菇', '菌', '茄', '瓜', '果', '海鲜',
    '粉', '面', '米', '饭', '谷', '麦', '面条', '年糕', '馒头'
  ];
  
  const textLower = text.toLowerCase();
  
  // 检查是否包含食材关键词
  return ingredientKeywords.some(keyword => 
    textLower.includes(keyword) || 
    keyword.includes(textLower)
  );
}

/**
 * 检查文本是否可能包含调料信息
 * @param text 要检查的文本
 * @returns 是否可能是调料
 */
export function isLikelySeasoning(text: string): boolean {
  if (!text) return false;
  
  // 常见调料关键词
  const seasoningKeywords = [
    '盐', '糖', '醋', '酱', '油', '料酒', '味精', '鸡精', '酱油', '醋',
    '蒜', '姜', '葱', '辣椒', '花椒', '八角', '桂皮', '香叶', '茴香',
    '孜然', '胡椒', '芥末', '香料', '调味', '香油', '芝麻', '蚝油',
    '豆瓣', '豆豉', '花生', '芝麻', '辣酱', '甜面酱', '番茄酱', '咖喱'
  ];
  
  const textLower = text.toLowerCase();
  
  // 检查是否包含调料关键词
  return seasoningKeywords.some(keyword => 
    textLower.includes(keyword) || 
    keyword.includes(textLower)
  );
}

/**
 * 关键词和标签管理工具函数
 */

// 获取食材分类
export function getIngredientCategory(ingredient: string): string {
  // 食材分类规则
  const categories: Record<string, string[]> = {
    '肉类': ['肉', '鸡', '鸭', '鹅', '牛', '羊', '猪', '火腿', '腊肉'],
    '海鲜': ['鱼', '虾', '蟹', '贝', '海鲜', '鲍鱼', '墨鱼', '章鱼'],
    '蔬菜': ['菜', '蔬', '茄', '瓜', '芹', '菠菜', '白菜', '青菜', '萝卜', '土豆', '洋葱', '黄瓜'],
    '豆制品': ['豆', '腐', '豆腐', '豆皮', '豆干'],
    '蛋奶': ['蛋', '奶', '鸡蛋', '鸭蛋', '牛奶', '奶酪'],
    '菌菇': ['菇', '菌', '香菇', '蘑菇', '金针菇', '平菇', '木耳'],
    '干货': ['干', '笋', '花', '枸杞', '虫草', '木耳'],
    '主食': ['粉', '面', '米', '饭', '谷', '麦', '面条', '年糕', '馒头']
  };
  
  if (!ingredient) return '其他';
  
  const ingredientLower = ingredient.toLowerCase();
  
  // 遍历分类，寻找匹配
  for (const category in categories) {
    if (categories[category].some(keyword => 
      ingredientLower.includes(keyword) || 
      keyword.includes(ingredientLower)
    )) {
      return category;
    }
  }
  
  return '其他';
}

// 获取调料分类
export function getSeasoningCategory(seasoning: string): string {
  // 调料分类规则
  const categories: Record<string, string[]> = {
    '基础调味': ['盐', '糖', '醋', '酱油', '料酒', '味精', '鸡精'],
    '香辛料': ['蒜', '姜', '葱', '辣椒', '花椒', '八角', '桂皮', '香叶', '孜然', '胡椒', '芥末'],
    '酱料': ['酱', '豆瓣', '豆豉', '辣酱', '甜面酱', '番茄酱', '咖喱', '蚝油'],
    '油脂': ['油', '香油', '猪油', '橄榄油', '芝麻油'],
    '其他': ['芝麻', '花生', '腰果', '核桃']
  };
  
  if (!seasoning) return '其他';
  
  const seasoningLower = seasoning.toLowerCase();
  
  // 遍历分类，寻找匹配
  for (const category in categories) {
    if (categories[category].some(keyword => 
      seasoningLower.includes(keyword) || 
      keyword.includes(seasoningLower)
    )) {
      return category;
    }
  }
  
  return '其他';
}

/**
 * 获取排除项的文本表示
 * @param items 要排除的项数组
 * @returns 文本表示
 */
export function getExcludedItemsText(items: string[]): string {
  if (!items || items.length === 0) return '';
  
  return `不含${items.join('、')}`;
} 