import React from 'react';

/**
 * 高亮文本工具
 * 用于处理搜索结果中的高亮显示文本
 */

/**
 * 高亮文本
 * 将文本中与搜索词匹配的部分用特殊标记包围，用于前端渲染高亮效果
 * 
 * @param text 待处理文本 
 * @param searchTerms 搜索词数组
 * @returns 带有高亮标记的文本
 */
export function highlightText(text: string, searchTerms: string[]): string {
  if (!text || !searchTerms.length) {
    return text;
  }
  
  // 对搜索词按长度排序，先匹配较长的词
  const sortedTerms = [...searchTerms].sort((a, b) => b.length - a.length);
  
  // 特殊标记字符
  const startMark = '##@HIGHLIGHT_START@##';
  const endMark = '##@HIGHLIGHT_END@##';
  
  // 依次处理每个搜索词
  let result = text;
  for (const term of sortedTerms) {
    if (!term.trim()) continue;
    
    // 创建不区分大小写的正则表达式
    const regex = new RegExp(`(${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, `${startMark}$1${endMark}`);
  }
  
  // 处理可能的嵌套标记
  // 如果一个词是另一个词的子串，可能会导致标记嵌套
  const nestedRegex = new RegExp(`${startMark}([^#]*?)${startMark}([^#]*?)${endMark}([^#]*?)${endMark}`, 'g');
  while (nestedRegex.test(result)) {
    result = result.replace(nestedRegex, `${startMark}$1$2$3${endMark}`);
  }
  
  // 返回最终带标记的文本
  return result;
}

/**
 * 将带标记的文本转换为React元素数组
 * 
 * @param markedText 带有高亮标记的文本
 * @returns React元素数组
 */
export function renderHighlightedText(markedText: string): (string | JSX.Element)[] {
  if (!markedText) return [];
  
  const startMark = '##@HIGHLIGHT_START@##';
  const endMark = '##@HIGHLIGHT_END@##';
  
  const parts = markedText.split(new RegExp(`${startMark}|${endMark}`, 'g'));
  const result: (string | JSX.Element)[] = [];
  
  let isHighlighted = false;
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    
    if (isHighlighted) {
      // 高亮部分
      result.push(
        <span key={`highlight-${i}`} className="bg-indigo-200 text-indigo-800 dark:bg-indigo-600 dark:text-white">
          {parts[i]}
        </span>
      );
    } else {
      // 普通文本
      result.push(parts[i]);
    }
    
    isHighlighted = !isHighlighted;
  }
  
  return result;
} 