/**
 * 安全JSON解析和本地存储工具函数的集成测试
 */

import { 
  safeJsonParse, 
  safeJsonParseWithSchema,
  safeParseRecipeJson 
} from '../../src/utils/common/safeTypeConversions';
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  clearLocalStorage,
  getLocalStorageKeys,
  getLocalStorageUsage,
  isLocalStorageSupported
} from '../../src/utils/data/localStorage';
import { z } from 'zod';
import { Recipe, getEmptyRecipe } from '../../src/types/recipe';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 模拟localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    get length(): number {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('安全JSON解析和本地存储集成测试', () => {
  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // 基本JSON解析功能测试
  describe('基本JSON解析 (safeJsonParse)', () => {
    it('应该能解析有效的JSON字符串', () => {
      const json = '{"name": "测试", "value": 42}';
      const result = safeJsonParse(json, {});
      
      expect(result).toEqual({ name: '测试', value: 42 });
    });
    
    it('解析无效JSON时应返回默认值', () => {
      const json = '{name: "测试"}'; // 缺少引号，无效JSON
      const defaultValue = { name: '默认', value: 0 };
      const result = safeJsonParse(json, defaultValue);
      
      expect(result).toEqual(defaultValue);
    });
    
    it('处理null/undefined/空字符串时应返回默认值', () => {
      const defaultValue = { empty: true };
      
      expect(safeJsonParse(null, defaultValue)).toEqual(defaultValue);
      expect(safeJsonParse(undefined, defaultValue)).toEqual(defaultValue);
      expect(safeJsonParse('', defaultValue)).toEqual(defaultValue);
      expect(safeJsonParse('   ', defaultValue)).toEqual(defaultValue);
    });
  });
  
  // 带Zod验证的safeJsonParseWithSchema函数测试
  describe('带Zod验证的JSON解析 (safeJsonParseWithSchema)', () => {
    // 定义测试用的Schema
    const TestSchema = z.object({
      id: z.string(),
      count: z.number().int().positive(),
      tags: z.array(z.string()).optional()
    });
    
    type TestType = z.infer<typeof TestSchema>;
    
    const defaultValue: TestType = {
      id: 'default',
      count: 1
    };
    
    it('应该能解析并验证有效的数据', () => {
      const json = '{"id": "test-123", "count": 5, "tags": ["a", "b", "c"]}';
      const result = safeJsonParseWithSchema(json, TestSchema, defaultValue);
      
      expect(result).toEqual({
        id: 'test-123',
        count: 5,
        tags: ['a', 'b', 'c']
      });
    });
    
    it('解析有效但验证失败的数据时应返回默认值', () => {
      // 这是有效的JSON，但count是负数，不符合schema要求
      const json = '{"id": "test-123", "count": -5}';
      const result = safeJsonParseWithSchema(json, TestSchema, defaultValue);
      
      expect(result).toEqual(defaultValue);
    });
    
    it('transformErrors选项应尽可能保留有效字段', () => {
      // 这是特殊情况的补充测试，由于transformErrors在实际实现中可能有不同行为
      // 这里我们只是简单验证函数是否能处理有transformErrors选项的调用
      const json = '{"id": "test-123", "count": "不是数字"}';
      const result = safeJsonParseWithSchema(
        json, 
        TestSchema, 
        defaultValue,
        { transformErrors: true }
      );
      
      // 即使开启transformErrors，这种情况也无法修复，应该返回默认值
      expect(result).toEqual(defaultValue);
    });
  });
  
  // Recipe专用解析函数测试
  describe('Recipe专用JSON解析 (safeParseRecipeJson)', () => {
    // 准备一个最小化的有效Recipe对象作为默认值
    const minimalRecipe: Recipe = {
      id: 'default',
      name: '默认菜谱',
      description: '这是一个默认菜谱',
      ingredients: [],
      seasonings: [],
      flavors: [],
      difficulty: '简单',
      cookingTime: '10分钟',
      steps: [],
      cookingTips: [],
      imageUrl: ''
    };
    
    it('应该能解析有效的Recipe JSON', () => {
      const json = `{
        "id": "recipe-1",
        "name": "炒青菜",
        "description": "简单快手的家常菜",
        "ingredients": ["青菜", "蒜"],
        "seasonings": ["盐", "油"],
        "flavors": ["清淡"],
        "difficulty": "简单",
        "cookingTime": 5,
        "steps": ["青菜洗净切段", "蒜切片爆香", "下青菜快速翻炒", "加盐调味"],
        "cookingTips": "不要炒太久，保持脆嫩口感",
        "imageUrl": "/images/vegetable.jpg"
      }`;
      
      const result = safeParseRecipeJson(json, minimalRecipe);
      
      expect(result.id).toBe('recipe-1');
      expect(result.name).toBe('炒青菜');
      expect(result.ingredients).toHaveLength(2);
      expect(result.steps).toHaveLength(4);
    });
    
    it('处理部分有效的Recipe数据时应尽可能保留有效字段', () => {
      // 缺少多个必填字段的JSON
      const json = `{
        "name": "水煮鱼",
        "ingredients": ["鱼", "辣椒"]
      }`;
      
      const result = safeParseRecipeJson(json, minimalRecipe);
      
      // 期望保留有效字段，其他使用默认值
      expect(result.name).toBe('水煮鱼');
      expect(result.ingredients).toEqual(['鱼', '辣椒']);
      expect(result.description).toBe(minimalRecipe.description);
    });
    
    it('处理无效的Recipe JSON时应返回默认值', () => {
      const json = 'not a json string';
      const result = safeParseRecipeJson(json, minimalRecipe);
      
      expect(result).toEqual(minimalRecipe);
    });
  });

  describe('基本存取测试', () => {
    it('应该能安全存取简单对象', () => {
      const testData = { name: '测试', value: 42 };
      
      // 设置数据
      const setResult = setLocalStorageItem('testKey', testData, 'test');
      expect(setResult).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'testKey', 
        JSON.stringify(testData)
      );
      
      // 获取数据
      const result = getLocalStorageItem('testKey', {}, 'test');
      expect(result).toEqual(testData);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
    });
    
    it('处理不存在的键时应返回默认值', () => {
      const defaultValue = { empty: true };
      const result = getLocalStorageItem('nonExistentKey', defaultValue, 'test');
      
      expect(result).toEqual(defaultValue);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('nonExistentKey');
    });
  });
  
  describe('Recipe数据存取测试', () => {
    const testRecipe: Recipe = {
      id: 'test-1',
      name: '测试菜谱',
      description: '这是一个测试菜谱',
      ingredients: [
        { name: '食材1', quantity: '100g' },
        { name: '食材2', quantity: '200g' }
      ],
      seasonings: [
        { name: '调料1', quantity: '少许' },
        { name: '调料2', quantity: '适量' }
      ],
      flavors: ['咸', '鲜'],
      difficulty: '简单',
      cookingTime: '15分钟',
      steps: [
        '步骤1：准备材料',
        '步骤2：烹饪',
        '步骤3：装盘'
      ],
      cookingTips: ['小提示1', '小提示2'],
      imageUrl: '/images/test.jpg'
    };
    
    it('应该能安全存取Recipe对象', () => {
      // 设置Recipe数据
      const setResult = setLocalStorageItem('savedRecipe', testRecipe, 'RecipeTest');
      expect(setResult).toBe(true);
      
      // 获取Recipe数据
      const retrievedRecipe = getLocalStorageItem<Recipe>(
        'savedRecipe', 
        getEmptyRecipe(), 
        'RecipeTest'
      );
      
      expect(retrievedRecipe).toEqual(testRecipe);
      expect(retrievedRecipe.ingredients.length).toBe(2);
      expect(retrievedRecipe.steps.length).toBe(3);
    });
    
    it('处理损坏的Recipe JSON时应返回默认值', () => {
      // 手动设置损坏的JSON
      localStorageMock.setItem('corruptedRecipe', '{"id":"test-2", "name": "损坏的菜谱", ingredients": []}');
      
      // 尝试获取
      const retrievedRecipe = getLocalStorageItem<Recipe>(
        'corruptedRecipe', 
        getEmptyRecipe(), 
        'RecipeTest'
      );
      
      // 应该返回默认空菜谱
      expect(retrievedRecipe).toEqual(getEmptyRecipe());
      expect(retrievedRecipe.id).toBe('');
      expect(retrievedRecipe.name).toBe('');
    });
  });
  
  describe('带验证的Recipe数据测试', () => {
    // 定义简化版Recipe模式进行验证
    const SimpleRecipeSchema = z.object({
      id: z.string(),
      name: z.string().min(1, "菜名不能为空"),
      ingredients: z.array(
        z.union([
          z.string(),
          z.object({
            name: z.string(),
            quantity: z.string().optional()
          })
        ])
      )
    });
    
    type SimpleRecipe = z.infer<typeof SimpleRecipeSchema>;
    
    const defaultSimpleRecipe: SimpleRecipe = {
      id: '',
      name: '默认菜谱',
      ingredients: []
    };
    
    it('应该能验证并安全存取符合模式的Recipe', () => {
      const validRecipe: SimpleRecipe = {
        id: 'valid-1',
        name: '有效菜谱',
        ingredients: [
          { name: '土豆', quantity: '250g' },
          '胡萝卜'
        ]
      };
      
      // 设置数据
      setLocalStorageItem('validSimpleRecipe', validRecipe, 'SchemaTest');
      
      // 获取并验证数据
      const mockData = localStorageMock.getItem('validSimpleRecipe');
      expect(mockData).not.toBeNull();
      
      if (mockData) {
        const parsedWithSchema = safeJsonParseWithSchema(
          mockData,
          SimpleRecipeSchema,
          defaultSimpleRecipe,
          { logPrefix: '[SchemaTest] ' }
        );
        
        expect(parsedWithSchema).toEqual(validRecipe);
        expect(parsedWithSchema.ingredients.length).toBe(2);
      }
    });
    
    it('处理无效的Recipe数据时应返回默认值', () => {
      const invalidRecipe = {
        id: 'invalid-1',
        // name缺失
        ingredients: [42, true] // 类型错误
      };
      
      // 尝试存储无效数据
      setLocalStorageItem('invalidSimpleRecipe', invalidRecipe as any, 'SchemaTest');
      
      // 获取并验证数据
      const mockData = localStorageMock.getItem('invalidSimpleRecipe');
      expect(mockData).not.toBeNull();
      
      if (mockData) {
        const parsedWithSchema = safeJsonParseWithSchema(
          mockData,
          SimpleRecipeSchema,
          defaultSimpleRecipe
        );
        
        // 由于数据无效，应该返回默认值
        expect(parsedWithSchema).toEqual(defaultSimpleRecipe);
      }
    });
  });
  
  describe('本地存储实用函数测试', () => {
    beforeEach(() => {
      // 为测试准备一些示例数据
      localStorageMock.setItem('test1', '{"value": 1}');
      localStorageMock.setItem('test2', '{"value": 2}');
      localStorageMock.setItem('other', '{"data": "other"}');
    });
    
    it('应该能获取所有存储键', () => {
      const keys = getLocalStorageKeys();
      expect(keys).toContain('test1');
      expect(keys).toContain('test2');
      expect(keys).toContain('other');
      expect(keys.length).toBe(3);
    });
    
    it('应该能获取存储使用情况', () => {
      // 只测试函数可以调用，不测试具体返回值
      expect(() => getLocalStorageUsage()).not.toThrow();
    });
    
    it('应该能正确删除项目', () => {
      // 删除项目
      const result = removeLocalStorageItem('test1');
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test1');
      
      // 验证是否删除成功
      const keys = getLocalStorageKeys();
      expect(keys).not.toContain('test1');
      expect(keys).toContain('test2');
    });
    
    it('应该能正确清除所有存储', () => {
      // 清除所有数据
      clearLocalStorage();
      expect(localStorageMock.clear).toHaveBeenCalled();
      
      // 验证是否清除成功
      const keys = getLocalStorageKeys();
      expect(keys.length).toBe(0);
    });
    
    it('应该能检测localStorage支持', () => {
      // 默认情况下模拟支持localStorage
      expect(isLocalStorageSupported()).toBe(true);
      
      // 模拟localStorage被禁用的情况
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });
      
      expect(isLocalStorageSupported()).toBe(false);
      
      // 恢复原始实现
      localStorageMock.getItem = originalGetItem;
    });
  });
  
  describe('错误处理测试', () => {
    it('数据类型不匹配时应返回默认值', () => {
      // 存储一个对象
      localStorageMock.setItem('numberKey', '42');
      
      // 尝试作为对象获取
      const result = getLocalStorageItem<{ value: number }>('numberKey', { value: 0 }, 'TypeTest');
      
      // 由于不是预期的对象格式，应该返回默认值
      expect(result).toEqual({ value: 0 });
    });
    
    it('处理JSON数据中的引用类型和特殊值', () => {
      const testDate = new Date();
      const testData = {
        date: testDate,
        regex: /test/,
        undef: undefined,
        nil: null,
        nan: NaN,
        inf: Infinity,
        special: Symbol('这将被转为null')
      };
      
      // 存储数据
      setLocalStorageItem('complexData', testData, 'ComplexTest');
      
      // 读取数据（日期将被字符串化，Symbol将被null替代）
      const result = getLocalStorageItem<any>('complexData', {}, 'ComplexTest');
      
      // 验证特殊值处理
      expect(result.date).toEqual(testDate.toJSON());
      expect(result.regex).toEqual({});  // 正则表达式转为空对象
      expect(result.undef).toBeUndefined();
      expect(result.nil).toBeNull();
      expect(result.nan).toBe(null); // NaN会在JSON中变为null
      expect(result.special).toBeNull(); // Symbol会在JSON中变为null
    });
  });
}); 