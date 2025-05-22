/**
 * 设计Token系统
 * 整合所有设计Token相关模块
 */

// 导出原子tokens和语义tokens
export * from './tokens';
export * from './semantic';

// 导入基础Token
import { primitiveTokens } from './tokens';
import { lightSemanticTokens, darkSemanticTokens } from './semantic';

/**
 * 将对象转换为扁平的CSS变量格式
 * @param obj 嵌套对象
 * @param prefix 前缀
 * @returns 扁平的CSS变量键值对
 */
export function flattenObject(
  obj: Record<string, any>, 
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}-${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = String(value);
    }
  });
  
  return result;
}

/**
 * 生成CSS变量
 * @param tokens 设计Token
 * @returns CSS变量键值对
 */
export function getCSSVars(tokens: Record<string, any>): Record<string, string> {
  const flatTokens = flattenObject(tokens);
  const cssVars: Record<string, string> = {};
  
  Object.entries(flatTokens).forEach(([key, value]) => {
    cssVars[`--${key}`] = value;
  });
  
  return cssVars;
}

/**
 * 获取亮色主题CSS变量
 */
export function getLightThemeCssVariables(): Record<string, string> {
  return getCSSVars(lightSemanticTokens);
}

/**
 * 获取暗色主题CSS变量
 */
export function getDarkThemeCssVariables(): Record<string, string> {
  return getCSSVars(darkSemanticTokens);
}

/**
 * 为Tailwind生成配置对象
 */
export function generateTailwindConfig() {
  // 为Tailwind创建颜色配置
  const colors: Record<string, any> = {};
  
  // 添加原始颜色
  Object.entries(primitiveTokens.color).forEach(([colorName, colorValue]) => {
    if (typeof colorValue === 'object') {
      colors[colorName] = colorValue;
    } else {
      colors[colorName] = colorValue;
    }
  });
  
  // 添加语义颜色变量
  // 使用CSS变量，这样在主题切换时会自动变化
  const flatTokens = flattenObject(lightSemanticTokens);
  Object.entries(flatTokens).forEach(([key, _]) => {
    if (key.startsWith('color-')) {
      const shortKey = key.replace('color-', '');
      colors[shortKey.replace(/-/g, '.')] = `var(--${key})`;
    }
  });
  
  // 为Tailwind创建间距配置
  const spacing: Record<string, string> = {};
  Object.entries(primitiveTokens.spacing).forEach(([size, value]) => {
    spacing[size] = value;
  });
  
  // 为Tailwind创建圆角配置
  const borderRadius: Record<string, string> = {};
  Object.entries(primitiveTokens.radius).forEach(([size, value]) => {
    borderRadius[size] = value;
  });
  
  // 为Tailwind创建阴影配置
  const boxShadow: Record<string, string> = {};
  Object.entries(primitiveTokens.shadow).forEach(([size, value]) => {
    boxShadow[size] = value;
  });
  
  // 为Tailwind创建字体大小配置
  const fontSize: Record<string, string> = {};
  Object.entries(primitiveTokens.fontSize).forEach(([size, value]) => {
    fontSize[size] = value;
  });
  
  return {
    colors,
    spacing,
    borderRadius,
    boxShadow,
    fontSize,
  };
}

// 默认导出整合接口
export default {
  // 原始Token
  primitiveTokens,
  
  // 语义Token
  lightSemanticTokens,
  darkSemanticTokens,
  
  // 工具函数
  flattenObject,
  getCSSVars,
  
  // 生成器函数
  generateTailwindConfig,
  getLightThemeCssVariables,
  getDarkThemeCssVariables,
}; 