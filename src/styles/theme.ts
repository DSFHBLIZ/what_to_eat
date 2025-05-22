/**
 * 主题配置文件
 * 提供主题相关的逻辑映射函数
 */

import { lightSemanticTokens, darkSemanticTokens, SemanticTokens } from '../design-tokens/semantic';

// 主题名称类型
export type ThemeName = 'light' | 'dark' | 'system';

/**
 * 标准化难度值
 * @param difficulty 难度文本
 * @returns 标准化的难度值: 'easy', 'medium', 或 'hard'
 */
export function normalizeDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
  const lowerDifficulty = difficulty.toLowerCase().trim();
  
  // 处理简单/容易级别
  if (['easy', '简单', '容易', '初级', 'beginner', '10分钟'].includes(lowerDifficulty)) {
    return 'easy';
  } 
  // 处理中等级别
  else if (['medium', '中等', '适中', '中级', 'intermediate', '30分钟'].includes(lowerDifficulty)) {
    return 'medium';
  } 
  // 处理复杂/困难级别
  else {
    return 'hard'; // hard表示复杂/困难
  }
}

/**
 * 获取难度对应的颜色
 * @param difficulty 难度文本
 * @returns 难度对应的颜色类
 */
export function getDifficultyColor(difficulty: string, themeName: ThemeName = 'light'): { bg: string; text: string; printBg: string } {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const tokens = themeName === 'dark' ? darkSemanticTokens : lightSemanticTokens;
  return tokens.color.tag.difficulty[normalizedDifficulty];
}

/**
 * 获取标签对应的颜色
 * @param type 标签类型: 'flavor', 'method', 'cuisine'
 * @returns 标签对应的颜色类
 */
export function getTagColor(type: 'flavor' | 'method' | 'cuisine', themeName: ThemeName = 'light'): {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  printBg: string;
} {
  const tokens = themeName === 'dark' ? darkSemanticTokens : lightSemanticTokens;
  
  switch (type) {
    case 'flavor':
      return tokens.color.tag.flavor;
    case 'method':
      return tokens.color.tag.method;
    case 'cuisine':
      return tokens.color.tag.cuisine;
    default:
      return tokens.color.tag.flavor;
  }
}

/**
 * 获取当前的主题设置
 * @param themeName 主题名称
 * @returns 主题设置
 */
export function getThemeTokens(themeName: ThemeName): SemanticTokens {
  return themeName === 'dark' ? darkSemanticTokens : lightSemanticTokens;
} 