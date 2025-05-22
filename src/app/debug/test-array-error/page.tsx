'use client';

import { useState } from 'react';
import Link from 'next/link';
import { logError, logAppState } from '../../../utils';

// 模拟菜谱数据结构
interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  steps: string[];
}

// 模拟一些不同类型的错误情况
const simulateArrayErrors = (errorType: string) => {
  // 记录测试开始
  logAppState('测试数组错误页面', `开始测试: ${errorType}`, { errorType });
  
  try {
    switch (errorType) {
      case 'undefined-array':
        // 尝试访问未定义的数组
        const undefinedArray: any = undefined;
        const firstItem = undefinedArray[0];
        return `获取了第一个元素: ${firstItem}`;
      
      case 'null-array':
        // 尝试访问null数组
        const nullArray: any = null;
        const length = nullArray.length;
        return `获取了数组长度: ${length}`;
      
      case 'missing-property':
        // 尝试访问对象中不存在的数组属性
        const recipe: any = { name: '宫保鸡丁' };
        const firstIngredient = recipe.ingredients[0].name;
        return `第一个食材: ${firstIngredient}`;
      
      case 'array-method':
        // 尝试在非数组上调用数组方法
        const notArray: any = '这不是数组';
        const mapped = notArray.map((item: any) => item);
        return `映射结果: ${mapped}`;
      
      case 'out-of-bounds':
        // 数组越界
        const smallArray = [1, 2, 3];
        const tenthItem = smallArray[9];
        return `第十个元素: ${tenthItem}`;
      
      case 'nested-array':
        // 嵌套数组错误
        const nestedArrays: any[] = [
          [1, 2], 
          { items: [3, 4] }, 
          null
        ];
        const nestedItem = nestedArrays[2][1];
        return `嵌套元素: ${nestedItem}`;
      
      case 'array-reduce':
        // reduce方法错误(空数组无初始值)
        const emptyArray: number[] = [];
        const sum = emptyArray.reduce((acc, val) => acc + val);
        return `总和: ${sum}`;
      
      case 'array-type':
        // 类型不匹配
        const stringArray: string[] = ['a', 'b', 'c'];
        const numberValue: number = stringArray[0] as any;
        return `数值: ${numberValue * 2}`;
      
      case 'promise-array':
        // 异步数组错误
        const promises = [Promise.resolve(1), Promise.resolve(2), 'not-a-promise'];
        Promise.all(promises).then(results => {
          console.log(results);
        }).catch(err => {
          console.error('Promise数组错误:', err);
        });
        return '异步数组类型错误 - Promise.all无法处理非Promise元素';
      
      case 'complex-case':
        // 模拟真实世界的复杂错误情况
        const recipes: Recipe[] = [
          {
            id: '1',
            name: '红烧肉',
            ingredients: [
              { name: '猪肉', amount: '500g' }
            ],
            steps: ['准备食材', '开始烹饪']
          }
        ];
        
        const badRecipes: any[] = [
          { id: '2', name: '糖醋里脊', ingredients: null },
          { id: '3', name: '鱼香肉丝' }, // 缺少ingredients
          null // 完全无效
        ];
        
        // 尝试合并并处理
        const allRecipes = [...recipes, ...badRecipes];
        
        // 尝试处理每个菜谱的配料
        const allIngredients = allRecipes.flatMap(recipe => {
          if (!recipe) return [];
          return recipe.ingredients.map((ing: Ingredient) => ing.name);
        });
        
        return `所有食材: ${allIngredients.join(', ')}`;
      
      default:
        return '请选择一个错误类型进行测试';
    }
  } catch (error: any) {
    // 记录错误
    logError('测试数组错误页面', `测试错误: ${errorType}`, error instanceof Error ? error.message : String(error), {
      errorType,
      timestamp: new Date().toISOString()
    });
    
    return `捕获到错误: ${error.message}`;
  }
};

export default function TestArrayErrorPage() {
  const [result, setResult] = useState<string>('点击按钮测试不同类型的数组错误');
  const [selectedError, setSelectedError] = useState<string>('');
  
  const handleTest = (errorType: string) => {
    setSelectedError(errorType);
    const resultMessage = simulateArrayErrors(errorType);
    setResult(resultMessage);
  };
  
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">数组错误测试</h1>
        <p className="text-gray-600">此页面用于测试各种可能发生的数组相关错误并记录它们</p>
      </div>
      
      <div className="mb-4">
        <Link href="/debug" className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
          返回调试面板
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold mb-4">选择错误类型</h2>
          
          <div className="space-y-2">
            <button 
              onClick={() => handleTest('undefined-array')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'undefined-array' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              未定义数组访问
            </button>
            
              <button
              onClick={() => handleTest('null-array')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'null-array' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Null数组属性
              </button>
            
              <button
              onClick={() => handleTest('missing-property')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'missing-property' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              缺失属性访问
              </button>
            
              <button
              onClick={() => handleTest('array-method')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'array-method' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              非数组调用数组方法
              </button>
            
              <button
              onClick={() => handleTest('out-of-bounds')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'out-of-bounds' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              数组越界
              </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold mb-4">更复杂的错误类型</h2>
          
          <div className="space-y-2">
          <button
              onClick={() => handleTest('nested-array')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'nested-array' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              嵌套数组错误
          </button>
          
            <button 
              onClick={() => handleTest('array-reduce')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'array-reduce' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Reduce方法错误
            </button>
            
          <button
              onClick={() => handleTest('array-type')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'array-type' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              数组类型不匹配
          </button>
          
          <button
              onClick={() => handleTest('promise-array')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'promise-array' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Promise数组错误
          </button>
            
            <button 
              onClick={() => handleTest('complex-case')}
              className={`w-full px-4 py-2 rounded text-left ${
                selectedError === 'complex-case' 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              复杂场景模拟
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">测试结果</h2>
        <div className={`p-4 rounded ${
          result.includes('错误') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {result}
        </div>
      </div>
      
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">如何使用这个工具</h2>
        <ul className="list-disc pl-5 space-y-2 text-yellow-800">
          <li>点击任意错误类型按钮触发特定的错误场景</li>
          <li>触发的错误会被记录到错误日志系统中</li>
          <li>您可以在<Link href="/debug" className="underline">调试面板</Link>中查看完整的错误细节</li>
          <li>这有助于识别和修复菜谱应用中的类似错误</li>
        </ul>
      </div>
    </div>
  );
} 