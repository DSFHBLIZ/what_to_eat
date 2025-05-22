import { Recipe } from '../../types/recipe';
import { getSupabaseClient } from '../data/dataService';

// 搜索结果缓存机制
const searchCache = new Map<string, Recipe[]>();
const MAX_CACHE_SIZE = 100;

// 常见调料关键词
export const SEASONING_KEYWORDS = [
  '盐', '糖', '醋', '酱油', '料酒', '生抽', '老抽', '蚝油', 
  '花椒', '八角', '桂皮', '辣椒', '大蒜', '姜', '葱', '香葱',
  '香菜', '麻油', '植物油', '芝麻油', '胡椒粉', '油'
];

/**
 * 判断一个标签是否为调料
 * @param tag 标签文本
 * @returns 如果是调料返回true，否则返回false
 */
export function isSeasoningTag(tag: string): boolean {
  if (!tag) return false;
  return SEASONING_KEYWORDS.some(keyword => tag.includes(keyword));
}

/**
 * 搜索菜谱接口参数
 */
export interface SearchRecipesParams {
  query?: string;
  requiredIngredients?: string[];
  optionalIngredients?: string[];
  avoidIngredients?: string[];  // 添加忌口食材参数
  flavors?: string[];
  cuisines?: string[];
  difficulties?: string[];
  dietaryRestrictions?: string[];
  tagLogic?: 'AND' | 'OR';
}

// 所有参数都有默认值的完整参数类型
interface CompleteSearchParams {
  query: string;
  requiredIngredients: string[];
  optionalIngredients: string[];
  avoidIngredients: string[];  // 添加忌口食材参数
  flavors: string[];
  cuisines: string[];
  difficulties: string[];
  dietaryRestrictions: string[];
  tagLogic: 'AND' | 'OR';
}

/**
 * 生成缓存键
 * @param params 搜索参数
 * @returns 缓存键字符串
 */
function generateCacheKey(params: CompleteSearchParams): string {
  return `q:${params.query};` +
         `req:[${params.requiredIngredients.join(',')}];` +
         `opt:[${params.optionalIngredients.join(',')}];` +
         `avoid:[${params.avoidIngredients.join(',')}];` +
         `flav:[${params.flavors.join(',')}];` +
         `cuis:[${params.cuisines.join(',')}];` +
         `diff:[${params.difficulties.join(',')}];` +
         `diet:[${params.dietaryRestrictions.join(',')}];` +
         `logic:${params.tagLogic}`;
}

/**
 * 管理缓存大小
 * 当缓存超过最大大小时，删除最早添加的项
 */
function manageCacheSize(): void {
  if (searchCache.size > MAX_CACHE_SIZE) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey !== undefined) {
      searchCache.delete(oldestKey);
    }
  }
}

/**
 * 规范化字符串，用于搜索比较
 * 处理全角半角转换、大小写等问题
 * @param text 输入字符串
 * @returns 规范化后的字符串
 */
function normalizeString(text: string | null | undefined): string {
  if (!text) return '';
  
  let normalized = text.toString();
  
  try {
    // 转为小写
    normalized = normalized.toLowerCase();
    
    // 全角转半角（处理中文全角字符）
    normalized = normalized.replace(/[\uff01-\uff5e]/g, (ch) => {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    });
    
    // 常见中文标点转换为英文标点
    const punctuationMap: Record<string, string> = {
      '\u002C': ',', '\u3002': '.', '\uFF1A': ':', '\uFF1B': ';',
      '\u201C': '"', '\u201D': '"', '\u2018': "'", '\u2019': "'",
      '\uFF01': '!', '\uFF1F': '?', '\uFF08': '(', '\uFF09': ')',
      '\u3010': '[', '\u3011': ']', '\u300A': '<', '\u300B': '>',
      '\u2014': '-', '\uFF5E': '~', '\u2026': '...'
    };
    
    for (const [zhPunc, enPunc] of Object.entries(punctuationMap)) {
      normalized = normalized.replace(new RegExp(zhPunc, 'g'), enPunc);
    }
    
    // 去除多余空白字符
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // 备注：繁简转换需要额外的库支持，如果需要这个功能，可以添加
    // 如：使用 chinese-conv 或 chinese-s2t 库
    // 这里为了保持代码简洁，没有添加该功能

    return normalized;
  } catch (error) {
    console.error('字符串规范化出错:', error);
    // 不使用降级处理，直接返回空字符串
    return '';
  }
}

/**
 * 处理常见食材名称的变体
 * 例如：牛肉/牛腩/牛筋，猪肉/猪排/猪蹄等
 * @param term 搜索词
 * @returns 扩展后的搜索词变体数组
 */
function getIngredientVariants(term: string): string[] {
  const results: string[] = [term]; // 始终包含原始词

  // 肉类变体处理
  const meatVariants: Record<string, string[]> = {
    '猪肉': ['猪', '猪排', '猪蹄', '猪骨', '猪肚', '猪肝', '猪心', '猪腰', '五花肉', '猪皮', '培根'],
    '牛肉': ['牛', '牛排', '牛腩', '牛筋', '牛骨', '牛肚', '牛百叶', '牛尾', '牛肝'],
    '鸡肉': ['鸡', '鸡翅', '鸡腿', '鸡胸', '鸡爪', '鸡骨', '鸡翼', '鸡心', '鸡肝'],
    '鸭肉': ['鸭', '鸭翅', '鸭腿', '鸭胸', '鸭舌', '鸭骨', '鸭翼', '鸭血'],
    '羊肉': ['羊', '羊排', '羊腿', '羊骨', '羊肚', '羊杂', '羊蝎子'],
    '鱼肉': ['鱼', '鱼片', '鱼排', '鱼头', '鱼尾', '鱼骨', '鱼刺', '鱼肚', '鱼丸', '鱼子']
  };

  // 蔬菜变体处理
  const vegetableVariants: Record<string, string[]> = {
    '土豆': ['马铃薯', '洋芋', '山药蛋'],
    '西红柿': ['番茄', '洋柿子'],
    '茄子': ['紫茄', '紫皮茄', '茄瓜'],
    '青椒': ['菜椒', '甜椒', '灯笼椒', '柿子椒'],
    '豆腐': ['豆花', '豆干', '豆皮', '腐竹', '内酯豆腐']
  };

  // 开始处理变体
  const normalizedTerm = normalizeString(term);

  // 检查肉类变体
  for (const [main, variants] of Object.entries(meatVariants)) {
    if (normalizedTerm.includes(main) || variants.some(v => normalizedTerm.includes(v))) {
      // 添加所有相关变体
      variants.forEach(v => {
        if (!results.includes(v)) {
          results.push(v);
        }
      });
      // 也添加主名称
      if (!results.includes(main)) {
        results.push(main);
      }
      break;
    }
  }

  // 检查蔬菜变体
  for (const [main, variants] of Object.entries(vegetableVariants)) {
    if (normalizedTerm.includes(main) || variants.some(v => normalizedTerm.includes(v))) {
      // 添加所有相关变体
      variants.forEach(v => {
        if (!results.includes(v)) {
          results.push(v);
        }
      });
      // 也添加主名称
      if (!results.includes(main)) {
        results.push(main);
      }
      break;
    }
  }

  console.log(`搜索词 "${term}" 扩展为变体: [${results.join(', ')}]`);
  return results;
}

/**
 * 安全地比较两个字符串，考虑编码和语言差异
 * @param str1 第一个字符串
 * @param str2 第二个字符串
 * @returns 如果str1包含str2，返回true
 */
function safeStringIncludes(str1: string | null | undefined, str2: string | null | undefined): boolean {
  if (!str1 || !str2) return false;
  
  try {
    // 规范化两个字符串
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);
    
    // 直接检查是否包含
    if (normalized1.includes(normalized2)) {
      return true;
    }
    
    // 获取第二个字符串的变体并检查
    const variants = getIngredientVariants(normalized2);
    return variants.some(variant => normalized1.includes(variant));
  } catch (error) {
    // 防止特殊编码问题导致崩溃
    console.error('字符串比较出错:', error);
    return false;
  }
}

/**
 * 深度搜索函数 - 递归搜索对象或数组中的文本
 * 无论嵌套多深，都能找到匹配的关键词
 * @param obj 要搜索的对象、数组或字符串
 * @param keyword 要搜索的关键词
 * @param path 当前搜索路径，用于调试
 * @returns 如果找到匹配项返回true，否则返回false
 */
function deepSearchInObject(obj: any, keyword: string, path: string = 'root'): boolean {
  if (!obj || !keyword) return false;
  
  // 对关键词进行处理，移除空白并转小写
  const processedKeyword = normalizeString(keyword);
  
  try {
    // 如果是字符串，直接检查包含关系
    if (typeof obj === 'string' || typeof obj === 'number' || obj instanceof String || obj instanceof Number) {
      const stringValue = String(obj);
      const isMatch = safeStringIncludes(stringValue, processedKeyword);
      if (isMatch) {
        console.log(`匹配成功: 在路径 ${path} 找到匹配文本 "${stringValue}" 包含关键词 "${keyword}"`);
      }
      return isMatch;
    }
    
    // 如果是数组，检查任何元素是否匹配
    if (Array.isArray(obj)) {
      return obj.some((item, index) => {
        try {
          return deepSearchInObject(item, processedKeyword, `${path}[${index}]`);
        } catch (error) {
          console.error(`在数组索引 ${index} 处搜索时出错:`, error);
          return false;
        }
      });
    }
    
    // 如果是对象，递归检查所有值
    if (typeof obj === 'object' && obj !== null) {
      // 处理各种可能的名称字段格式 (中英文、大小写变体等)
      const nameFields = ['名称', 'name', 'title', '标题', 'label', '标签', 'text', '文本'];
      
      for (const field of nameFields) {
        if (field in obj && (typeof obj[field] === 'string' || typeof obj[field] === 'number')) {
          const fieldValue = String(obj[field]);
          const isMatch = safeStringIncludes(fieldValue, processedKeyword);
          if (isMatch) {
            console.log(`匹配成功: 在路径 ${path}.${field} 找到匹配 "${fieldValue}" 包含关键词 "${keyword}"`);
            return true;
          }
        }
      }
      
      // 递归检查所有字段
      try {
        return Object.entries(obj).some(([key, value]) => {
          try {
            return deepSearchInObject(value, processedKeyword, `${path}.${key}`);
          } catch (error) {
            console.error(`递归搜索字段 ${key} 时出错:`, error);
            return false;
          }
        });
      } catch (error) {
        console.error(`遍历对象字段时出错:`, error);
        return false;
      }
    }
  } catch (error) {
    console.error(`在路径 ${path} 搜索时发生未知错误:`, error);
  }
  
  return false;
}

/**
 * 搜索菜谱
 * 根据指定的条件过滤菜谱
 */
export function searchRecipes(recipes: Recipe[], params: SearchRecipesParams): Recipe[] {
  // 添加详细日志，验证参数传递
  console.log('=== 开始搜索菜谱 ===');
  console.log('参数类型检查:', {
    queryType: typeof params.query,
    requiredIngredientsType: Array.isArray(params.requiredIngredients) ? 'array' : typeof params.requiredIngredients,
    optionalIngredientsType: Array.isArray(params.optionalIngredients) ? 'array' : typeof params.optionalIngredients,
    requiredIngredientsLength: params.requiredIngredients?.length || 0,
    optionalIngredientsLength: params.optionalIngredients?.length || 0
  });
  
  // 添加调试日志，查看搜索参数
  console.log('搜索参数:', params);
  
  // *** 新增调试代码：详细记录传入的筛选参数 ***
  console.log('======= 搜索服务收到的筛选参数 =======');
  console.log('1. 搜索关键词:', params.query || '(空)');
  console.log('2. 必选食材:', params.requiredIngredients || []);
  console.log('3. 可选食材:', params.optionalIngredients || []);
  console.log('4. 忌口食材:', params.avoidIngredients || []);
  console.log('5. 菜系:', params.cuisines || []);
  console.log('6. 口味:', params.flavors || []);
  console.log('7. 难度:', params.difficulties || []);
  console.log('8. 饮食限制:', params.dietaryRestrictions || []);
  console.log('9. 标签逻辑:', params.tagLogic || 'OR');
  console.log('======= 原始数据统计 =======');
  console.log('总菜谱数量:', recipes.length);
  console.log('菜谱示例 (前2条):', recipes.slice(0, 2).map(r => ({
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    flavor: r.flavors,
    difficulty: r.difficulty
  })));
  console.log('============================');
  
  // 解构参数
  const { 
    query = '', 
    requiredIngredients = [], 
    optionalIngredients = [], 
    avoidIngredients = [],  // 添加忌口食材参数解构
    cuisines = [], 
    flavors = [], 
    difficulties = [], 
    dietaryRestrictions = [], 
    tagLogic = 'OR' 
  } = params;
  
  // 添加更多日志来追踪筛选过程
  console.log('搜索关键词:', query);
  console.log('必选食材:', requiredIngredients);
  console.log('可选食材:', optionalIngredients);
  console.log('忌口食材:', avoidIngredients);  // 添加忌口食材日志
  console.log('菜系:', cuisines);
  console.log('口味:', flavors);
  console.log('难度:', difficulties);
  console.log('饮食限制:', dietaryRestrictions);
  console.log('标签逻辑:', tagLogic);
  
  // 使用提供的菜谱数据
  let recipeList = [...recipes];
  if (recipeList.length === 0) {
    // 没有找到任何菜谱数据，直接返回空数组
    console.log('没有提供菜谱数据，返回空结果');
    return [];
  }
  
  // === 实际的过滤逻辑 ===
  let filteredRecipes = recipeList;

  // 1. 先处理搜索关键词
  if (query) {
    console.log('根据搜索关键词过滤:', query);
    
    let matchCount = 0;
    filteredRecipes = filteredRecipes.filter(recipe => {
      console.log(`检查菜谱 "${recipe.name}" 是否包含搜索关键词 "${query}"`);
      
      // 使用深度搜索函数匹配多个字段
      const nameMatch = recipe.name && recipe.name.includes(query);
      if (nameMatch) {
        console.log(`匹配成功: 菜名 "${recipe.name}" 包含关键词 "${query}"`);
      }
      
      const ingredientsMatch = deepSearchInObject(recipe.ingredients, query, 'ingredients');
      const seasoningsMatch = deepSearchInObject(recipe.seasonings, query, 'seasonings');
      const descMatch = recipe.description && recipe.description.includes(query);
      
      let rawDataMatch = false;
      if (recipe._raw) {
        const rawMatch1 = recipe._raw.食材分类 ? deepSearchInObject(recipe._raw.食材分类, query, '_raw.食材分类') : false;
        const rawMatch2 = recipe._raw.调料分类 ? deepSearchInObject(recipe._raw.调料分类, query, '_raw.调料分类') : false;
        const rawMatch3 = recipe._raw.食材名称文本 ? recipe._raw.食材名称文本.includes(query) : false;
        const rawMatch4 = recipe._raw.调料名称文本 ? recipe._raw.调料名称文本.includes(query) : false;
        
        rawDataMatch = rawMatch1 || rawMatch2 || rawMatch3 || rawMatch4;
      }
      
      const isMatched = nameMatch || ingredientsMatch || seasoningsMatch || descMatch || rawDataMatch;
      
      if (isMatched) {
        matchCount++;
      }
      
      return isMatched;
    });
    
    console.log(`共找到 ${matchCount} 个匹配搜索关键词的菜谱`);
    console.log('关键词过滤后数量:', filteredRecipes.length);
  }

  // 2. 处理必选食材
  if (requiredIngredients.length > 0) {
    console.log('根据必选食材过滤:', requiredIngredients);
    
    let matchCount = 0;
    filteredRecipes = filteredRecipes.filter(recipe => {
      // 所有必选食材都必须匹配
      const isMatch = requiredIngredients.every(reqIng => {
        console.log(`检查菜谱 "${recipe.name}" 是否包含必选食材 "${reqIng}"`);
        
        // 深度搜索食材
        const ingredientsMatch = deepSearchInObject(recipe.ingredients, reqIng, 'ingredients');
        if (ingredientsMatch) {
          console.log(`匹配成功: 食材中找到 "${reqIng}"`);
        }
        
        // 深度搜索调料
        const seasoningsMatch = deepSearchInObject(recipe.seasonings, reqIng, 'seasonings');
        if (seasoningsMatch) {
          console.log(`匹配成功: 调料中找到 "${reqIng}"`);
        }
        
        // 搜索原始数据
        let rawDataMatch = false;
        if (recipe._raw) {
          const rawMatch1 = recipe._raw.食材分类 ? deepSearchInObject(recipe._raw.食材分类, reqIng, '_raw.食材分类') : false;
          const rawMatch2 = recipe._raw.调料分类 ? deepSearchInObject(recipe._raw.调料分类, reqIng, '_raw.调料分类') : false;
          const rawMatch3 = recipe._raw.食材名称文本 ? recipe._raw.食材名称文本.includes(reqIng) : false;
          const rawMatch4 = recipe._raw.调料名称文本 ? recipe._raw.调料名称文本.includes(reqIng) : false;
          
          rawDataMatch = rawMatch1 || rawMatch2 || rawMatch3 || rawMatch4;
        }
        
        return ingredientsMatch || seasoningsMatch || rawDataMatch;
      });
      
      if (isMatch) {
        matchCount++;
      }
      
      return isMatch;
    });
    
    console.log(`共找到 ${matchCount} 个匹配所有必选食材的菜谱`);
    console.log('必选食材过滤后数量:', filteredRecipes.length);
  }

  // 3. 处理可选食材 - 只要匹配任意一个即可
  if (optionalIngredients.length > 0) {
    console.log('根据可选食材过滤:', optionalIngredients);
    console.log('===== 开始详细日志，记录匹配过程 =====');
    
    let matchedCount = 0;
    filteredRecipes = filteredRecipes.filter(recipe => {
      // 任意一个可选食材匹配即可
      const isMatch = optionalIngredients.some(optIng => {
        console.log(`检查菜谱 "${recipe.name}" 是否包含可选食材 "${optIng}"`);
        
        // 使用深度搜索函数匹配多个字段
        const nameMatch = recipe.name && recipe.name.includes(optIng);
        if (nameMatch) {
          console.log(`匹配成功: 菜名 "${recipe.name}" 包含 "${optIng}"`);
        }
        
        const ingredientsMatch = deepSearchInObject(recipe.ingredients, optIng, 'ingredients');
        if (ingredientsMatch) {
          console.log(`匹配成功: 食材中找到 "${optIng}"`);
        }
        
        const seasoningsMatch = deepSearchInObject(recipe.seasonings, optIng, 'seasonings');
        if (seasoningsMatch) {
          console.log(`匹配成功: 调料中找到 "${optIng}"`);
        }
        
        let rawDataMatch = false;
        if (recipe._raw) {
          const rawMatch1 = recipe._raw.食材分类 ? deepSearchInObject(recipe._raw.食材分类, optIng, '_raw.食材分类') : false;
          const rawMatch2 = recipe._raw.调料分类 ? deepSearchInObject(recipe._raw.调料分类, optIng, '_raw.调料分类') : false;
          const rawMatch3 = recipe._raw.食材名称文本 ? recipe._raw.食材名称文本.includes(optIng) : false;
          const rawMatch4 = recipe._raw.调料名称文本 ? recipe._raw.调料名称文本.includes(optIng) : false;
          
          if (rawMatch3) {
            console.log(`匹配成功: 食材名称文本 "${recipe._raw.食材名称文本}" 包含 "${optIng}"`);
          }
          if (rawMatch4) {
            console.log(`匹配成功: 调料名称文本 "${recipe._raw.调料名称文本}" 包含 "${optIng}"`);
          }
          
          rawDataMatch = rawMatch1 || rawMatch2 || rawMatch3 || rawMatch4;
        }
        
        return nameMatch || ingredientsMatch || seasoningsMatch || rawDataMatch;
      });
      
      if (isMatch) {
        matchedCount++;
      }
      
      return isMatch;
    });
    
    console.log(`共有 ${matchedCount} 个菜谱匹配可选食材条件`);
    console.log('===== 结束详细日志 =====');
    console.log('可选食材过滤后数量:', filteredRecipes.length);
  }

  // 4. 处理忌口食材 - 排除包含任意忌口食材的菜谱
  if (avoidIngredients.length > 0) {
    console.log('根据忌口食材过滤:', avoidIngredients);
    console.log('===== 开始忌口食材筛选 =====');
    
    let excludedCount = 0;
    filteredRecipes = filteredRecipes.filter(recipe => {
      // 检查菜谱是否包含任何忌口食材，如果包含则排除
      const containsAvoided = avoidIngredients.some(avoidIng => {
        console.log(`检查菜谱 "${recipe.name}" 是否包含忌口食材 "${avoidIng}"`);
        
        // 使用深度搜索函数匹配多个字段
        const nameMatch = recipe.name && recipe.name.includes(avoidIng);
        if (nameMatch) {
          console.log(`发现忌口食材: 菜名 "${recipe.name}" 包含 "${avoidIng}"`);
          return true;
        }
        
        const ingredientsMatch = deepSearchInObject(recipe.ingredients, avoidIng, 'ingredients');
        if (ingredientsMatch) {
          console.log(`发现忌口食材: 食材中包含 "${avoidIng}"`);
          return true;
        }
        
        const seasoningsMatch = deepSearchInObject(recipe.seasonings, avoidIng, 'seasonings');
        if (seasoningsMatch) {
          console.log(`发现忌口食材: 调料中包含 "${avoidIng}"`);
          return true;
        }
        
        let rawDataMatch = false;
        if (recipe._raw) {
          const rawMatch1 = recipe._raw.食材分类 ? deepSearchInObject(recipe._raw.食材分类, avoidIng, '_raw.食材分类') : false;
          const rawMatch2 = recipe._raw.调料分类 ? deepSearchInObject(recipe._raw.调料分类, avoidIng, '_raw.调料分类') : false;
          const rawMatch3 = recipe._raw.食材名称文本 ? recipe._raw.食材名称文本.includes(avoidIng) : false;
          const rawMatch4 = recipe._raw.调料名称文本 ? recipe._raw.调料名称文本.includes(avoidIng) : false;
          
          if (rawMatch3) {
            console.log(`发现忌口食材: 食材名称文本中包含 "${avoidIng}"`);
          }
          if (rawMatch4) {
            console.log(`发现忌口食材: 调料名称文本中包含 "${avoidIng}"`);
          }
          
          rawDataMatch = rawMatch1 || rawMatch2 || rawMatch3 || rawMatch4;
          return rawDataMatch;
        }
        
        return false;
      });
      
      // 如果包含忌口食材，则排除该菜谱
      if (containsAvoided) {
        excludedCount++;
        return false;
      }
      
      // 不包含任何忌口食材，保留该菜谱
      return true;
    });
    
    console.log(`排除了 ${excludedCount} 个包含忌口食材的菜谱`);
    console.log('===== 结束忌口食材筛选 =====');
    console.log('忌口食材过滤后数量:', filteredRecipes.length);
  }

  // 5. 处理菜系筛选
  if (cuisines.length > 0) {
    console.log('根据菜系过滤:', cuisines);
    
    // 跟踪匹配的菜谱数量
    let matchCount = 0;
    let firstTenNonMatchingRecipes: any[] = [];
    
    // 数据格式问题排查
    console.log('检查不同的菜系格式:');
    const uniqueFormats = new Set<string>();
    recipes.slice(0, 20).forEach(recipe => {
      if (recipe.cuisine) {
        uniqueFormats.add(typeof recipe.cuisine);
      } else if (recipe._raw && recipe._raw.菜系) {
        uniqueFormats.add(typeof recipe._raw.菜系);
      }
    });
    console.log('发现的菜系数据类型:', Array.from(uniqueFormats));
    
    // 检查菜系值示例
    console.log('菜系示例:');
    recipes.slice(0, 5).forEach((recipe, i) => {
      console.log(`菜谱 ${i+1} "${recipe.name}":`, {
        cuisine: recipe.cuisine,
        rawCuisine: recipe._raw?.菜系
      });
    });
    
    // 归一化菜系值的函数
    const normalizeCuisine = (cuisine: any): string[] => {
      if (!cuisine) return [];
      
      // 如果是字符串
      if (typeof cuisine === 'string') {
        return [cuisine.trim()];
      }
      
      // 如果是数组
      if (Array.isArray(cuisine)) {
        return cuisine.map(c => typeof c === 'string' ? c.trim() : String(c)).filter(Boolean);
      }
      
      // 其他情况，尝试转为字符串
      return [String(cuisine).trim()];
    };
    
    // 菜系匹配函数
    const isCuisineMatched = (recipeCuisines: string[], targetCuisines: string[]): boolean => {
      return recipeCuisines.some(rc => 
        targetCuisines.some(tc => 
          rc.includes(tc) || tc.includes(rc)
        )
      );
    };
    
    filteredRecipes = filteredRecipes.filter(recipe => {
      // 为防止日志过多，减少日志输出
      if (firstTenNonMatchingRecipes.length < 10) {
        console.log(`检查菜谱 "${recipe.name}" 的菜系:`, recipe.cuisine);
      }
      
      // 获取所有可能的菜系信息
      const cuisineFromRecipe = normalizeCuisine(recipe.cuisine);
      const cuisineFromRaw = recipe._raw ? normalizeCuisine(recipe._raw.菜系) : [];
      
      // 合并所有菜系信息
      const allCuisines = Array.from(new Set([...cuisineFromRecipe, ...cuisineFromRaw]));
      
      // 如果没有找到任何菜系信息
      if (allCuisines.length === 0) {
        if (firstTenNonMatchingRecipes.length < 10) {
          console.log(`菜谱 "${recipe.name}" 没有菜系数据，不匹配`);
          firstTenNonMatchingRecipes.push({
            name: recipe.name,
            reason: "没有菜系数据"
          });
        }
        return false;
      }
      
      // 检查是否有匹配的菜系
      const isMatched = isCuisineMatched(allCuisines, cuisines);
      
      if (isMatched) {
        if (matchCount < 5) {
          console.log(`匹配成功: 菜谱 "${recipe.name}" 的菜系 "${allCuisines.join(', ')}" 匹配所选菜系之一`);
        }
        matchCount++;
        return true;
      } else {
        if (firstTenNonMatchingRecipes.length < 10) {
          firstTenNonMatchingRecipes.push({
            name: recipe.name,
            cuisines: allCuisines,
            reason: "菜系不匹配所选菜系"
          });
        }
        return false;
      }
    });
    
    console.log(`菜系过滤共匹配 ${matchCount} 个菜谱`);
    console.log('菜系过滤后数量:', filteredRecipes.length);
    
    // 新增：记录一些不匹配的菜谱详情，帮助排查问题
    if (filteredRecipes.length === 0) {
      console.error('警告: 菜系过滤后没有匹配的菜谱！');
      console.log('所选菜系:', cuisines);
      
      // 检查原始数据中前5个菜谱的菜系
      const sampleOriginal = recipes.slice(0, 5).map(r => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        rawCuisine: r._raw && r._raw['菜系'] ? r._raw['菜系'] : '未知'
      }));
      
      console.log('原始数据菜系样本:', sampleOriginal);
      console.log('不匹配菜谱样本:', firstTenNonMatchingRecipes);
    }
  }

  // 6. 处理口味筛选
  if (flavors.length > 0) {
    console.log('根据口味过滤:', flavors);
    
    // 跟踪匹配的菜谱数量
    let matchCount = 0;
    
    filteredRecipes = filteredRecipes.filter(recipe => {
      console.log(`检查菜谱 "${recipe.name}" 的口味:`, recipe.flavors);
      
      // 处理可能的数据缺失情况
      if (!recipe.flavors) {
        console.log(`菜谱 "${recipe.name}" 没有口味数据，不匹配`);
        return false;
      }
      
      // 处理口味可能是数组或字符串的情况
      if (Array.isArray(recipe.flavors)) {
        // 如果是数组，任一口味匹配即可（"或"关系）
        const isMatched = flavors.some(selectedFlavor => 
          recipe.flavors.includes(selectedFlavor)
        );
        
        if (isMatched) {
          console.log(`匹配成功: 菜谱 "${recipe.name}" 的口味包含所选口味之一`);
          matchCount++;
        } else {
          console.log(`不匹配: 菜谱 "${recipe.name}" 的口味不包含任何所选口味`);
        }
        
        return isMatched;
      } else {
        // 如果是字符串，直接检查是否在筛选列表中
        const isMatched = flavors.includes(recipe.flavors);
        
        if (isMatched) {
          console.log(`匹配成功: 菜谱 "${recipe.name}" 的口味为 ${recipe.flavors}`);
          matchCount++;
        } else {
          console.log(`不匹配: 菜谱 "${recipe.name}" 的口味 ${recipe.flavors} 不在所选口味中`);
        }
        
        return isMatched;
      }
    });
    
    console.log(`口味过滤共匹配 ${matchCount} 个菜谱`);
    console.log('口味过滤后数量:', filteredRecipes.length);
  }

  // 7. 处理难度筛选
  if (difficulties.length > 0) {
    console.log('根据难度过滤:', difficulties);
    
    // 跟踪匹配的菜谱数量
    let matchCount = 0;
    
    filteredRecipes = filteredRecipes.filter(recipe => {
      console.log(`检查菜谱 "${recipe.name}" 的难度:`, recipe.difficulty);
      
      // 处理可能的数据缺失情况
      if (!recipe.difficulty) {
        console.log(`菜谱 "${recipe.name}" 没有难度数据，不匹配`);
        return false;
      }
      
      // 对时间格式的难度进行特殊处理
      const timePattern = /(\d+)[\s]*分钟/;
      let isTimeMatch = false;
      
      for (const diffItem of difficulties) {
        // 检查是否有时间范围的难度选项（如"30分钟以内"）
        if (diffItem.includes('分钟')) {
          // 解析用户选择的时间难度
          const userTimeLimitMatch = diffItem.match(/(\d+)[\s]*分钟(以内|以上|内)/);
          if (userTimeLimitMatch) {
            const userTimeLimit = parseInt(userTimeLimitMatch[1], 10);
            const isUpperLimit = !userTimeLimitMatch[2].includes('上');
            
            // 解析菜谱的难度时间
            let recipeTimeValue = 0;
            
            if (typeof recipe.difficulty === 'string' && timePattern.test(recipe.difficulty)) {
              const match = recipe.difficulty.match(timePattern);
              if (match) {
                recipeTimeValue = parseInt(match[1], 10);
              }
            } else if (typeof recipe.cookingTime === 'number') {
              recipeTimeValue = recipe.cookingTime;
            } else if (typeof recipe.cookingTime === 'string' && timePattern.test(recipe.cookingTime)) {
              const match = recipe.cookingTime.match(timePattern);
              if (match) {
                recipeTimeValue = parseInt(match[1], 10);
              }
            }
            
            // 判断是否符合时间限制
            if (recipeTimeValue > 0) {
              if (isUpperLimit && recipeTimeValue <= userTimeLimit) {
                console.log(`时间匹配: 菜谱 "${recipe.name}" 的时间 ${recipeTimeValue}分钟 在限制范围(${userTimeLimit}分钟以内)内`);
                isTimeMatch = true;
                break;
              } else if (!isUpperLimit && recipeTimeValue >= userTimeLimit) {
                console.log(`时间匹配: 菜谱 "${recipe.name}" 的时间 ${recipeTimeValue}分钟 满足最低要求(${userTimeLimit}分钟以上)`);
                isTimeMatch = true;
                break;
              }
            }
          }
        }
      }
      
      // 如果已经匹配到时间条件，则不再检查其他难度
      if (isTimeMatch) {
        matchCount++;
        return true;
      }
      
      // 处理难度可能是数组或字符串的情况
      if (Array.isArray(recipe.difficulty)) {
        // 如果是数组，任一难度匹配即可（"或"关系）
        const isMatched = recipe.difficulty.some(diff => 
          difficulties.includes(diff)
        );
        
        if (isMatched) {
          console.log(`匹配成功: 菜谱 "${recipe.name}" 的难度数组中有匹配项`);
          matchCount++;
        } else {
          console.log(`不匹配: 菜谱 "${recipe.name}" 的难度数组不包含任何所选难度`);
        }
        
        return isMatched;
      } else {
        // 如果是字符串，直接检查是否在筛选列表中
        const isMatched = difficulties.includes(recipe.difficulty);
        
        if (isMatched) {
          console.log(`匹配成功: 菜谱 "${recipe.name}" 的难度为 ${recipe.difficulty}`);
          matchCount++;
        } else {
          console.log(`不匹配: 菜谱 "${recipe.name}" 的难度 ${recipe.difficulty} 不在所选难度中`);
        }
        
        return isMatched;
      }
    });
    
    console.log(`难度过滤共匹配 ${matchCount} 个菜谱`);
    console.log('难度过滤后数量:', filteredRecipes.length);
  }

  // 8. 处理饮食限制
  if (dietaryRestrictions.length > 0) {
    console.log('根据饮食限制过滤:', dietaryRestrictions);
    
    // 跟踪匹配的菜谱数量
    let matchCount = 0;
    
    filteredRecipes = filteredRecipes.filter(recipe => {
      console.log(`检查菜谱 "${recipe.name}" 的饮食限制:`, recipe.dietaryRestrictions);
      
      // 创建一个标志，记录匹配结果
      let isMatched = false;
      
      // 1. 首先检查recipe.dietaryRestrictions
      if (recipe.dietaryRestrictions) {
        // 处理饮食限制可能是数组或字符串的情况
        if (Array.isArray(recipe.dietaryRestrictions)) {
          // 如果是数组，任一饮食限制匹配即可（"或"关系）
          isMatched = dietaryRestrictions.some(diet => 
            recipe.dietaryRestrictions!.includes(diet)
          );
          
          if (isMatched) {
            console.log(`匹配成功: 菜谱 "${recipe.name}" 的饮食限制数组中有匹配项`);
            matchCount++;
          }
        } else {
          // 如果是字符串，直接检查是否在筛选列表中
          isMatched = dietaryRestrictions.includes(recipe.dietaryRestrictions as string);
          
          if (isMatched) {
            console.log(`匹配成功: 菜谱 "${recipe.name}" 的饮食限制为 ${recipe.dietaryRestrictions}`);
            matchCount++;
          }
        }
      }
      
      // 2. 如果常规字段没匹配到，检查原始数据中的布尔标记
      if (!isMatched && recipe._raw) {
        for (const diet of dietaryRestrictions) {
          // 规范化饮食限制名称
          let normalizedDiet = '';
          
          if (diet === '纯素' || diet.toLowerCase() === 'vegan') {
            normalizedDiet = '是否纯素';
          } else if (diet === '清真' || diet.toLowerCase() === 'halal') {
            normalizedDiet = '是否清真';
          } else if (diet === '无麸质' || diet.toLowerCase() === 'gluten-free') {
            normalizedDiet = '是否无麸质';
          }
          
          // 检查对应的布尔字段
          if (normalizedDiet && recipe._raw[normalizedDiet] === true) {
            console.log(`匹配成功: 菜谱 "${recipe.name}" 的原始数据中 ${normalizedDiet} 为 true`);
            isMatched = true;
            matchCount++;
            break;
          }
        }
      }
      
      return isMatched;
    });
    
    console.log(`饮食限制过滤共匹配 ${matchCount} 个菜谱`);
    console.log('饮食限制过滤后数量:', filteredRecipes.length);
  }
  
  // 在处理完所有筛选逻辑后
  console.log('最终搜索结果数量:', filteredRecipes.length);
  
  // 排序：先按匹配分数，再按名称
  filteredRecipes.sort((a, b) => {
    // 计算匹配分数 - 包含忌口食材参数
    const scoreA = calculateMatchScore(a, { query, requiredIngredients, optionalIngredients, avoidIngredients });
    const scoreB = calculateMatchScore(b, { query, requiredIngredients, optionalIngredients, avoidIngredients });
    
    // 优先按匹配分数排序（降序）
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // 分数相同时按名称排序（升序）
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB);
  });
  
  return filteredRecipes;
}

/**
 * 计算匹配分数
 * 依据PRD要求的复杂权重系统：
 * - 菜名匹配：基础分15分，精确匹配+5分，开头匹配+3分
 * - 食材匹配：基础分12分，精确匹配+3分
 * - 调料匹配：基础分8分，精确匹配+2分
 * - 必选食材：每个10分
 * - 必选调料：每个8分
 * - 可选食材：每个5分
 * - 可选调料：每个3分
 * - 忌口食材：每匹配一个减20分
 * - 忌口调料：每匹配一个减15分
 */
function calculateMatchScore(recipe: Recipe, params: {
  query?: string;
  requiredIngredients?: string[];
  optionalIngredients?: string[];
  avoidIngredients?: string[];
}): number {
  let score = 0;
  const { query, requiredIngredients = [], optionalIngredients = [], avoidIngredients = [] } = params;
  
  // 处理查询文本
  if (query && typeof query === 'string') {
    // 支持多关键词匹配
    const keywords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    
    for (const keyword of keywords) {
      // 1. 菜名关键词匹配评分
      if (recipe.name) {
        const nameLower = recipe.name.toLowerCase();
        if (nameLower.includes(keyword)) {
          score += 15; // 基础分
          
          // 精确匹配加分
          if (nameLower === keyword) {
            score += 5;
          }
          // 开头匹配加分
          else if (nameLower.startsWith(keyword)) {
            score += 3;
          }
        }
      }
      
      // 2. 食材名称关键词匹配
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        for (const ingredient of recipe.ingredients) {
          let ingName = '';
          if (typeof ingredient === 'string') {
            ingName = ingredient.toLowerCase();
          } else if (ingredient && typeof ingredient === 'object' && 'name' in ingredient && ingredient.name &&
                    typeof ingredient.name === 'string') {
            ingName = ingredient.name.toLowerCase();
          }
          
          if (ingName && ingName.includes(keyword)) {
            score += 12; // 基础分
            
            // 精确匹配加分
            if (ingName === keyword) {
              score += 3;
            }
            
            break; // 只计算一次食材匹配分数
          }
        }
      }
      
      // 3. 调料名称关键词匹配
      if (recipe.seasonings && Array.isArray(recipe.seasonings)) {
        for (const seasoning of recipe.seasonings) {
          let seasName = '';
          if (typeof seasoning === 'string') {
            seasName = seasoning.toLowerCase();
          } else if (seasoning && typeof seasoning === 'object' && 'name' in seasoning && 
                    seasoning.name && typeof seasoning.name === 'string') {
            seasName = seasoning.name.toLowerCase();
          }
          
          if (seasName && seasName.includes(keyword)) {
            score += 8; // 基础分
            
            // 精确匹配加分
            if (seasName === keyword) {
              score += 2;
            }
            
            break; // 只计算一次调料匹配分数
          }
        }
      }
      
      // 4. 描述匹配 - 新增
      if (recipe.description && typeof recipe.description === 'string') {
        const descLower = recipe.description.toLowerCase();
        if (descLower.includes(keyword)) {
          score += 5; // 描述匹配分数
        }
      }
      
      // 5. 步骤匹配 - 新增
      // 合并准备步骤和烹饪步骤
      const prepSteps = Array.isArray(recipe.preparationSteps) ? recipe.preparationSteps : [];
      const cookSteps = Array.isArray(recipe.cookingSteps) ? recipe.cookingSteps : [];
      const allSteps = [...prepSteps, ...cookSteps];
      
      let foundInSteps = false;
      for (const step of allSteps) {
        if (typeof step === 'string' && step.toLowerCase().includes(keyword)) {
          score += 3; // 步骤匹配分数
          foundInSteps = true;
          break; // 一个关键词在步骤中只匹配一次
        }
      }
    }
  }
  
  // 性能优化：提前一次性计算所有食材和调料匹配，避免重复计算
  // 计算匹配次数
  const matchCounts = {
    required: {
      ingredients: 0,
      seasonings: 0
    },
    optional: {
      ingredients: 0,
      seasonings: 0
    },
    avoid: {
      ingredients: 0,
      seasonings: 0
    }
  };
  
  // 如果有必选食材，计算必选食材和调料匹配
  if (requiredIngredients.length > 0) {
    matchCounts.required.ingredients = getMatchedIngredientsCount(recipe, requiredIngredients, false);
    matchCounts.required.seasonings = getMatchedIngredientsCount(recipe, requiredIngredients, true);
  }
  
  // 如果有可选食材，计算可选食材和调料匹配
  if (optionalIngredients.length > 0) {
    matchCounts.optional.ingredients = getMatchedIngredientsCount(recipe, optionalIngredients, false);
    matchCounts.optional.seasonings = getMatchedIngredientsCount(recipe, optionalIngredients, true);
  }
  
  // 如果有忌口食材，计算忌口食材和调料匹配
  if (avoidIngredients.length > 0) {
    matchCounts.avoid.ingredients = getMatchedIngredientsCount(recipe, avoidIngredients, false);
    matchCounts.avoid.seasonings = getMatchedIngredientsCount(recipe, avoidIngredients, true);
  }
  
  // 使用缓存的匹配结果计算分数
  // 必选食材匹配得分 - 每个10分
  score += matchCounts.required.ingredients * 10;
  
  // 必选调料匹配得分 - 每个8分
  score += matchCounts.required.seasonings * 8;
  
  // 可选食材匹配得分 - 每个5分
  score += matchCounts.optional.ingredients * 5;
  
  // 可选调料匹配得分 - 每个3分
  score += matchCounts.optional.seasonings * 3;
  
  // 忌口食材匹配扣分 - 每个减20分
  score -= matchCounts.avoid.ingredients * 20;
  
  // 忌口调料匹配扣分 - 每个减15分
  score -= matchCounts.avoid.seasonings * 15;
  
  return score;
}

/**
 * 获取匹配的食材或调料数量
 * 辅助函数，用于计算匹配分数
 */
function getMatchedIngredientsCount(recipe: Recipe, ingredients: string[], isSeasoning: boolean): number {
  if (!recipe || !Array.isArray(ingredients) || ingredients.length === 0) {
    return 0;
  }
  
  let matchCount = 0;
  const sourceList = isSeasoning ? recipe.seasonings : recipe.ingredients;
  
  if (!sourceList || !Array.isArray(sourceList)) {
    return 0;
  }
  
  // 从食材或调料列表提取名称
  const itemNames: string[] = sourceList.map(item => {
    if (typeof item === 'string') {
      return item.toLowerCase();
    } else if (item && typeof item === 'object' && 'name' in item && 
              item.name && typeof item.name === 'string') {
      return item.name.toLowerCase();
    }
    return '';
  }).filter(name => name !== '');
  
  // 检查每个输入的食材/调料是否匹配
  for (const ingredient of ingredients) {
    if (!ingredient || typeof ingredient !== 'string') continue;
    
    // 跳过特殊标签
    if (ingredient.startsWith('菜系:') || 
        ingredient.startsWith('口味:') || 
        ingredient.startsWith('饮食限制:') ||
        ingredient.startsWith('烹饪方式:')) {
      continue;
    }
    
    const ingredientLower = ingredient.toLowerCase();
    
    // 检查是否有匹配
    const hasMatch = itemNames.some(name => 
      name.includes(ingredientLower) || ingredientLower.includes(name)
    );
    
    if (hasMatch) {
      matchCount++;
    }
  }
  
  return matchCount;
}

/**
 * 搜索食材和调料的建议
 * 基于用户输入返回匹配的食材和调料列表
 */
export async function searchIngredientsAndSeasonings(
  query: string, 
  requestId?: string,
  signal?: AbortSignal
): Promise<{id: string; tag: string; type: string}[]> {
  // 安全检查：确保query是有效字符串并且长度大于0
  if (!query || typeof query !== 'string' || query.trim().length < 1) {
    return [];
  }
  
  // 规范化搜索词，在整个函数中使用
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) {
    return []; // 如果处理后的搜索词为空，则提前返回
  }
  
  try {
    // 记录请求ID，用于日志和追踪
    const reqId = requestId || `ingredients-search-${searchTerm}`;
    console.log(`[${reqId}] 开始搜索食材和调料: "${searchTerm}"`);
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error(`[${reqId}] Supabase客户端未初始化`);
      return createFallbackResult(searchTerm);
    }
    
    // 使用查询参数预处理
    const escapedSearchTerm = searchTerm.replace(/'/g, "''");
    
    // 对于非常短的查询词，使用备用结果以避免不必要的数据库查询
    if (searchTerm.length <= 1) {
      return createFallbackResult(searchTerm);
    }
    
    // 使用Set收集所有结果，确保唯一性
    const allResults = new Set<{id: string; tag: string; type: string}>();
    
    // 创建辅助函数，生成唯一ID
    const createUniqueId = (tag: string, type: string) => {
      return `${type}-${Date.now()}-${tag}-${Math.random().toString(36).substring(2, 9)}`;
    };
    
    // 创建一个通用的添加结果函数
    const addToResults = (tag: string, type: string = 'ingredient') => {
      if (tag && tag.trim()) {
        allResults.add({
          id: createUniqueId(tag.trim(), type),
          tag: tag.trim(),
          type: isSeasoningTag(tag) ? 'seasoning' : type
        });
      }
    };
    
    // 添加原始搜索词作为备选
    addToResults(searchTerm, isSeasoningTag(searchTerm) ? 'seasoning' : 'ingredient');
    
    try {
      // 1. 从ingredients_list表搜索
      try {
        const { data: ingredientsList, error: ingredientsError } = await supabase
          .from('ingredients_list')
          .select('name')
          .ilike('name', `%${escapedSearchTerm}%`)
          .limit(50); // 增加搜索结果数量
          
        if (!ingredientsError && ingredientsList && Array.isArray(ingredientsList) && ingredientsList.length > 0) {
          ingredientsList.forEach(item => {
            // 确保名称是字符串类型
            const name = typeof item.name === 'string' ? item.name : 
                         item.name ? String(item.name) : searchTerm;
            addToResults(name, 'ingredient');
          });
          console.log(`[${reqId}] 从ingredients_list找到${ingredientsList.length}条结果`);
        }
      } catch (listError) {
        console.log(`[${reqId}] 从ingredients_list查询失败:`, listError);
      }
      
      // 2. 从CHrecipes表搜索食材
      try {
        const { data: results, error } = await supabase
          .from('CHrecipes')
          .select('id, 食材, 调料, 食材_搜索字段, 调料_搜索字段')
          .limit(50);
        
        if (!error && results && Array.isArray(results) && results.length > 0) {
          // 处理食材
          results.forEach(recipe => {
            // 提取食材
            if (recipe && typeof recipe === 'object') {
              // 使用类型断言处理中文字段名
              const recipeData = recipe as any;
              
              // 处理食材数组
              if (recipeData.食材 && Array.isArray(recipeData.食材)) {
                recipeData.食材.forEach((item: any) => {
                  if (typeof item === 'object' && item.名称) {
                    const name = String(item.名称);
                    if (name.toLowerCase().includes(searchTerm)) {
                      addToResults(name, 'ingredient');
                    }
                  }
                });
              }
              
              // 处理调料数组
              if (recipeData.调料 && Array.isArray(recipeData.调料)) {
                recipeData.调料.forEach((item: any) => {
                  if (typeof item === 'object' && item.名称) {
                    const name = String(item.名称);
                    if (name.toLowerCase().includes(searchTerm)) {
                      addToResults(name, 'seasoning');
                    }
                  }
                });
              }
              
              // 处理搜索字段
              if (recipeData.食材_搜索字段 && typeof recipeData.食材_搜索字段 === 'string') {
                const ingredients = recipeData.食材_搜索字段.split(/[,，、\s]+/);
                ingredients.forEach((ing: string) => {
                  if (ing.toLowerCase().includes(searchTerm)) {
                    addToResults(ing, 'ingredient');
                  }
                });
              }
              
              if (recipeData.调料_搜索字段 && typeof recipeData.调料_搜索字段 === 'string') {
                const seasonings = recipeData.调料_搜索字段.split(/[,，、\s]+/);
                seasonings.forEach((seas: string) => {
                  if (seas.toLowerCase().includes(searchTerm)) {
                    addToResults(seas, 'seasoning');
                  }
                });
              }
            }
          });
          
          console.log(`[${reqId}] 从菜谱中提取匹配的食材和调料，当前有${allResults.size}个结果`);
        }
      } catch (dbError) {
        console.log(`[${reqId}] 从菜谱数据中搜索出错:`, dbError);
      }
      
      // 3. 模糊搜索菜谱名称
      try {
        const { data: recipes, error: recipeError } = await supabase
          .from('CHrecipes')
          .select('菜名')
          .ilike('菜名', `%${escapedSearchTerm}%`)
          .limit(20);
          
        if (!recipeError && recipes && recipes.length > 0) {
          console.log(`[${reqId}] 找到${recipes.length}个菜名匹配的菜谱`);
        }
      } catch (recipeError) {
        console.log(`[${reqId}] 搜索菜名出错:`, recipeError);
      }
      
      // 如果所有方法都没有找到结果，返回备用结果
      if (allResults.size <= 1) { // 只有原始搜索词时
        console.log(`[${reqId}] 搜索结果太少，使用备用结果`);
        const fallbackResults = createFallbackResult(searchTerm);
        fallbackResults.forEach(result => allResults.add(result));
      }
      
      const finalResults = Array.from(allResults);
      console.log(`[${reqId}] 最终返回${finalResults.length}个建议结果`);
      return finalResults;
    } catch (dbError) {
      console.error(`[${reqId}] 搜索食材调料出错:`, dbError);
      return createFallbackResult(searchTerm);
    }
  } catch (error) {
    console.error('搜索食材调料出错:', error);
    // 返回搜索词作为默认选项
    return createFallbackResult(searchTerm); 
  }
}

/**
 * 创建备用的搜索结果
 * 在没有找到匹配结果或出错时使用
 */
function createFallbackResult(term: string): {id: string; tag: string; type: string}[] {
  return [{
    id: `tag-${Math.random().toString(36).substring(2, 9)}`,
    tag: term,
    type: isSeasoningTag(term) ? 'seasoning' : 'ingredient'
  }];
} 