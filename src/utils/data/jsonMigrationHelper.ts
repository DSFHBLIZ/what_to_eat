/**
 * JSON迁移助手工具
 * 帮助开发者识别并替换不安全的JSON解析代码
 */

import { enhancedJsonParse } from './enhancedSafeJsonParse';
import { PerformanceMonitor } from '../performance/performanceMonitor';

// 获取性能监控器实例
const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * 不安全模式类型
 */
export enum UnsafePatternType {
  DIRECT_JSON_PARSE = 'DIRECT_JSON_PARSE',
  UNHANDLED_LOCALSTORAGE = 'UNHANDLED_LOCALSTORAGE',
  UNHANDLED_SESSIONSTORAGE = 'UNHANDLED_SESSIONSTORAGE',
  UNSAFE_TYPE_CONVERSION = 'UNSAFE_TYPE_CONVERSION'
}

/**
 * 不安全模式替换建议
 */
export interface UnsafePatternMatch {
  /** 匹配类型 */
  type: UnsafePatternType;
  /** 代码行号 */
  lineNumber?: number;
  /** 匹配的原始代码 */
  originalCode: string;
  /** 建议的替换代码 */
  suggestedReplacement: string;
  /** 风险等级 (0-10) */
  riskLevel: number;
  /** 潜在问题描述 */
  description: string;
}

/**
 * 代码分析结果
 */
export interface CodeAnalysisResult {
  /** 分析的文件路径 */
  filePath: string;
  /** 找到的不安全模式 */
  patterns: UnsafePatternMatch[];
  /** 总体风险评级 (0-10) */
  overallRiskScore: number;
  /** 迁移优先级 (1-5) */
  migrationPriority: number;
  /** 分析时间戳 */
  timestamp: number;
}

/**
 * 迁移助手类
 */
export class JsonMigrationHelper {
  // 不安全模式的正则表达式
  private static readonly PATTERNS = {
    [UnsafePatternType.DIRECT_JSON_PARSE]: [
      /JSON\.parse\(\s*([^)]+)\s*\)/g,
      /JSON\.parse\(\s*([^)]+)\s*\)\s*(?:as|<)\s*([^>]+)(?:>)?/g
    ],
    [UnsafePatternType.UNHANDLED_LOCALSTORAGE]: [
      /localStorage\.getItem\(\s*([^)]+)\s*\)/g,
      /JSON\.parse\(\s*localStorage\.getItem\(\s*([^)]+)\s*\)\s*(?:\|\|)?\s*('{}"|"{}"|\{\}|'[]'|"[]"|\[\])\s*\)/g
    ],
    [UnsafePatternType.UNHANDLED_SESSIONSTORAGE]: [
      /sessionStorage\.getItem\(\s*([^)]+)\s*\)/g,
      /JSON\.parse\(\s*sessionStorage\.getItem\(\s*([^)]+)\s*\)\s*(?:\|\|)?\s*('{}"|"{}"|\{\}|'[]'|"[]"|\[\])\s*\)/g
    ],
    [UnsafePatternType.UNSAFE_TYPE_CONVERSION]: [
      /parseInt\(\s*([^),]+)(?:\s*,\s*(\d+))?\s*\)/g,
      /parseFloat\(\s*([^)]+)\s*\)/g,
      /Number\(\s*([^)]+)\s*\)/g
    ]
  };
  
  /**
   * 分析代码中的不安全模式
   * @param code 代码内容
   * @param filePath 文件路径（可选）
   * @returns 分析结果
   */
  public static analyzeCode(code: string, filePath: string = 'unknown'): CodeAnalysisResult {
    return performanceMonitor.measure('analyzeCode', () => {
      const lines = code.split('\n');
      const patterns: UnsafePatternMatch[] = [];
      
      // 遍历每一行代码
      lines.forEach((line, index) => {
        // 检查每一种不安全模式
        for (const [type, regexList] of Object.entries(this.PATTERNS)) {
          const patternType = type as UnsafePatternType;
          
          for (const regex of regexList) {
            let match;
            while ((match = regex.exec(line)) !== null) {
              // 找到匹配项
              const originalCode = match[0];
              
              // 创建替换建议
              const suggestedReplacement = this.createReplacement(
                patternType, 
                originalCode, 
                match
              );
              
              // 计算风险等级
              const riskLevel = this.calculateRiskLevel(patternType, originalCode);
              
              // 添加到结果列表
              patterns.push({
                type: patternType,
                lineNumber: index + 1,
                originalCode,
                suggestedReplacement,
                riskLevel,
                description: this.getPatternDescription(patternType)
              });
            }
          }
        }
      });
      
      // 计算总体风险分数
      const overallRiskScore = this.calculateOverallRisk(patterns);
      
      // 计算迁移优先级
      const migrationPriority = this.calculateMigrationPriority(overallRiskScore, patterns.length);
      
      return {
        filePath,
        patterns,
        overallRiskScore,
        migrationPriority,
        timestamp: Date.now()
      };
    }, { inputLength: code.length, filePath });
  }
  
  /**
   * 获取模式类型的描述
   * @param type 模式类型
   * @returns 描述文本
   */
  private static getPatternDescription(type: UnsafePatternType): string {
    switch (type) {
      case UnsafePatternType.DIRECT_JSON_PARSE:
        return '直接使用 JSON.parse 缺少错误处理，可能导致运行时异常';
        
      case UnsafePatternType.UNHANDLED_LOCALSTORAGE:
        return '使用 localStorage 未处理数据缺失或格式错误的情况';
        
      case UnsafePatternType.UNHANDLED_SESSIONSTORAGE:
        return '使用 sessionStorage 未处理数据缺失或格式错误的情况';
        
      case UnsafePatternType.UNSAFE_TYPE_CONVERSION:
        return '使用不安全的类型转换函数，可能导致NaN或意外类型错误';
    }
  }
  
  /**
   * 创建安全替换代码建议
   * @param type 模式类型
   * @param originalCode 原始代码
   * @param match 正则匹配结果
   * @returns 建议的替换代码
   */
  private static createReplacement(
    type: UnsafePatternType, 
    originalCode: string, 
    match: RegExpExecArray
  ): string {
    // 根据不同类型生成不同的替换建议
    switch (type) {
      case UnsafePatternType.DIRECT_JSON_PARSE: {
        const input = match[1]?.trim();
        const typeInfo = match[2]?.trim() || 'unknown';
        
        // 判断是否有类型注解
        if (match.length > 2 && typeInfo) {
          return `safeJsonParse<${typeInfo}>(${input}, {} as ${typeInfo}, 'Component')`;
        } else {
          return `safeJsonParse(${input}, {}, 'Component')`;
        }
      }
        
      case UnsafePatternType.UNHANDLED_LOCALSTORAGE: {
        const key = match[1]?.trim();
        let defaultValue = match[2]?.trim() || '{}';
        
        // 处理默认值
        if (defaultValue === '{}' || defaultValue === "'{}'") {
          defaultValue = '{}';
        } else if (defaultValue === '[]' || defaultValue === "'[]'") {
          defaultValue = '[]';
        }
        
        if (originalCode.includes('JSON.parse')) {
          return `getLocalStorageItem(${key}, ${defaultValue}, 'Component')`;
        } else {
          return `getLocalStorageItem(${key}, '', 'Component')`;
        }
      }
        
      case UnsafePatternType.UNHANDLED_SESSIONSTORAGE: {
        const key = match[1]?.trim();
        let defaultValue = match[2]?.trim() || '{}';
        
        // 处理默认值
        if (defaultValue === '{}' || defaultValue === "'{}'") {
          defaultValue = '{}';
        } else if (defaultValue === '[]' || defaultValue === "'[]'") {
          defaultValue = '[]';
        }
        
        if (originalCode.includes('JSON.parse')) {
          return `getSessionStorageItem(${key}, ${defaultValue}, 'Component')`;
        } else {
          return `getSessionStorageItem(${key}, '', 'Component')`;
        }
      }
        
      case UnsafePatternType.UNSAFE_TYPE_CONVERSION: {
        const input = match[1]?.trim();
        
        if (originalCode.startsWith('parseInt')) {
          const radix = match[2] || '10';
          return `safeParseInt(${input}, 0, ${radix})`;
        } else if (originalCode.startsWith('parseFloat')) {
          return `safeParseFloat(${input}, 0)`;
        } else if (originalCode.startsWith('Number')) {
          return `safeToNumber(${input}, 0)`;
        }
      }
    }
    
    return originalCode;
  }
  
  /**
   * 计算单个模式的风险等级
   * @param type 模式类型
   * @param code 代码片段
   * @returns 风险等级(0-10)
   */
  private static calculateRiskLevel(type: UnsafePatternType, code: string): number {
    let baseRisk = 0;
    
    // 设置基础风险分数
    switch (type) {
      case UnsafePatternType.DIRECT_JSON_PARSE:
        baseRisk = 8;
        break;
        
      case UnsafePatternType.UNHANDLED_LOCALSTORAGE:
      case UnsafePatternType.UNHANDLED_SESSIONSTORAGE:
        baseRisk = 7;
        break;
        
      case UnsafePatternType.UNSAFE_TYPE_CONVERSION:
        baseRisk = 5;
        break;
    }
    
    // 调整风险分数
    // 如果有尝试使用默认值或处理错误，降低风险
    if (code.includes('||') || code.includes('try') || code.includes('catch')) {
      baseRisk -= 2;
    }
    
    // 如果嵌套了多层不安全调用，增加风险
    const nestedCount = (code.match(/JSON\.parse/g) || []).length - 1;
    if (nestedCount > 0) {
      baseRisk += nestedCount * 1.5;
    }
    
    // 确保风险分数在0-10范围内
    return Math.min(10, Math.max(0, baseRisk));
  }
  
  /**
   * 计算总体风险分数
   * @param patterns 发现的模式列表
   * @returns 总体风险分数(0-10)
   */
  private static calculateOverallRisk(patterns: UnsafePatternMatch[]): number {
    if (patterns.length === 0) {
      return 0;
    }
    
    // 计算风险总和并考虑风险模式的数量
    const sumRisk = patterns.reduce((sum, pattern) => sum + pattern.riskLevel, 0);
    
    // 采用加权平均方法计算总风险
    // 模式越多，风险越高，但会有饱和效应
    const weightedAverage = sumRisk / patterns.length;
    const countFactor = Math.min(1 + (patterns.length / 10), 2); // 最多翻倍
    
    return Math.min(10, weightedAverage * countFactor);
  }
  
  /**
   * 计算迁移优先级
   * @param riskScore 风险分数
   * @param patternCount 模式数量
   * @returns 优先级(1-5)
   */
  private static calculateMigrationPriority(riskScore: number, patternCount: number): number {
    if (patternCount === 0) {
      return 1; // 最低优先级
    }
    
    if (riskScore >= 8) {
      return 5; // 最高优先级
    } else if (riskScore >= 6) {
      return 4;
    } else if (riskScore >= 4) {
      return 3;
    } else if (riskScore >= 2) {
      return 2;
    } else {
      return 1;
    }
  }
  
  /**
   * 生成迁移报告
   * @param result 分析结果
   * @returns 格式化的报告文本
   */
  public static generateReport(result: CodeAnalysisResult): string {
    const { filePath, patterns, overallRiskScore, migrationPriority, timestamp } = result;
    
    const date = new Date(timestamp).toLocaleString();
    let report = `# JSON安全迁移报告\n\n`;
    report += `**文件**: ${filePath}\n`;
    report += `**时间**: ${date}\n`;
    report += `**总体风险评分**: ${overallRiskScore.toFixed(1)}/10\n`;
    report += `**迁移优先级**: ${migrationPriority}/5\n\n`;
    
    if (patterns.length === 0) {
      report += `未发现不安全的JSON操作模式，无需迁移。\n`;
      return report;
    }
    
    report += `## 发现的不安全模式 (${patterns.length})\n\n`;
    
    // 按类型分组
    const groupedPatterns: Record<UnsafePatternType, UnsafePatternMatch[]> = {
      [UnsafePatternType.DIRECT_JSON_PARSE]: [],
      [UnsafePatternType.UNHANDLED_LOCALSTORAGE]: [],
      [UnsafePatternType.UNHANDLED_SESSIONSTORAGE]: [],
      [UnsafePatternType.UNSAFE_TYPE_CONVERSION]: []
    };
    
    patterns.forEach(pattern => {
      groupedPatterns[pattern.type].push(pattern);
    });
    
    // 输出每种类型的模式
    for (const [type, typePatterns] of Object.entries(groupedPatterns)) {
      if (typePatterns.length === 0) continue;
      
      report += `### ${this.getPatternTypeTitle(type as UnsafePatternType)} (${typePatterns.length})\n\n`;
      report += `${this.getPatternDescription(type as UnsafePatternType)}\n\n`;
      
      // 按风险等级排序
      typePatterns.sort((a, b) => b.riskLevel - a.riskLevel);
      
      // 输出每个模式
      typePatterns.forEach((pattern, index) => {
        report += `#### 实例 ${index + 1} (风险: ${pattern.riskLevel}/10)\n\n`;
        report += `- **行号**: ${pattern.lineNumber}\n`;
        report += `- **代码**: \`${pattern.originalCode}\`\n`;
        report += `- **建议替换**: \`${pattern.suggestedReplacement}\`\n\n`;
      });
    }
    
    report += `## 迁移步骤\n\n`;
    report += `1. 导入所需的安全类型工具:\n`;
    report += "```typescript\n";
    
    if (groupedPatterns[UnsafePatternType.DIRECT_JSON_PARSE].length > 0) {
      report += `import { safeJsonParse } from '@/utils/common/safeTypeConversions';\n`;
    }
    
    if (groupedPatterns[UnsafePatternType.UNHANDLED_LOCALSTORAGE].length > 0) {
      report += `import { getLocalStorageItem, setLocalStorageItem } from '@/utils/localStorage';\n`;
    }
    
    if (groupedPatterns[UnsafePatternType.UNHANDLED_SESSIONSTORAGE].length > 0) {
      report += `import { getSessionStorageItem, setSessionStorageItem } from '@/utils/sessionStorage';\n`;
    }
    
    if (groupedPatterns[UnsafePatternType.UNSAFE_TYPE_CONVERSION].length > 0) {
      report += `import { safeParseInt, safeParseFloat, safeToNumber } from '@/utils/common/safeTypeConversions';\n`;
    }
    
    report += "```\n\n";
    report += `2. 逐个替换发现的不安全模式\n`;
    report += `3. 添加适当的类型注解以确保类型安全\n`;
    report += `4. 添加适当的默认值处理边缘情况\n\n`;
    
    report += `## 其他建议\n\n`;
    report += `- 考虑使用更严格的类型定义\n`;
    report += `- 添加数据验证以确保数据符合预期格式\n`;
    report += `- 添加单元测试验证数据处理的正确性\n`;
    
    return report;
  }
  
  /**
   * 获取模式类型的标题
   * @param type 模式类型
   * @returns 友好的标题
   */
  private static getPatternTypeTitle(type: UnsafePatternType): string {
    switch (type) {
      case UnsafePatternType.DIRECT_JSON_PARSE:
        return '直接使用 JSON.parse';
        
      case UnsafePatternType.UNHANDLED_LOCALSTORAGE:
        return '未处理的 localStorage 操作';
        
      case UnsafePatternType.UNHANDLED_SESSIONSTORAGE:
        return '未处理的 sessionStorage 操作';
        
      case UnsafePatternType.UNSAFE_TYPE_CONVERSION:
        return '不安全的类型转换';
    }
  }
  
  /**
   * 分析一个文件并应用建议的修改
   * @param code 源代码
   * @param filePath 文件路径
   * @returns 修改后的代码
   */
  public static applyRecommendedChanges(code: string, filePath: string): string {
    const result = this.analyzeCode(code, filePath);
    
    if (result.patterns.length === 0) {
      // 没有发现需要修改的模式
      return code;
    }
    
    let modifiedCode = code;
    
    // 需要导入的工具
    const imports = new Set<string>();
    
    // 处理每个模式
    result.patterns.forEach(pattern => {
      // 替换代码
      modifiedCode = modifiedCode.replace(
        pattern.originalCode,
        pattern.suggestedReplacement
      );
      
      // 收集需要导入的工具
      switch (pattern.type) {
        case UnsafePatternType.DIRECT_JSON_PARSE:
          imports.add(`import { safeJsonParse } from '@/utils/common/safeTypeConversions';`);
          break;
          
        case UnsafePatternType.UNHANDLED_LOCALSTORAGE:
          imports.add(`import { getLocalStorageItem, setLocalStorageItem } from './utils/localStorage';`);
          break;
          
        case UnsafePatternType.UNHANDLED_SESSIONSTORAGE:
          imports.add(`import { getSessionStorageItem, setSessionStorageItem } from './utils/sessionStorage';`);
          break;
          
        case UnsafePatternType.UNSAFE_TYPE_CONVERSION:
          imports.add(`import { safeParseInt, safeParseFloat, safeToNumber } from '@/utils/common/safeTypeConversions';`);
          break;
      }
    });
    
    // 在文件顶部添加导入语句
    if (imports.size > 0) {
      // 查找现有的导入语句末尾位置
      const importEndRegex = /^import.*?['"].*?['"];?\r?\n(?!import)/m;
      const multiImportRegex = /^import.*?['"].*?['"];?(\r?\n)(?!import)/;
      let importMatch = modifiedCode.match(importEndRegex);
      
      if (!importMatch) {
        // 尝试匹配多行导入
        const lines = modifiedCode.split(/\r?\n/);
        let lastImportLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ') && lines[i].includes('from ')) {
            lastImportLine = i;
          } else if (lastImportLine !== -1 && !lines[i].trim().startsWith('import ')) {
            break;
          }
        }
        
        if (lastImportLine !== -1) {
          const importEndIndex = lines.slice(0, lastImportLine + 1).join('\n').length;
          const importStatements = Array.from(imports).join('\n');
          
          modifiedCode = 
            modifiedCode.substring(0, importEndIndex) + 
            '\n' + importStatements + 
            modifiedCode.substring(importEndIndex);
        } else {
          // 在文件顶部添加
          const importStatements = Array.from(imports).join('\n');
          modifiedCode = importStatements + '\n\n' + modifiedCode;
        }
      } else {
        // 在最后一个导入语句后添加
        const importEndIndex = importMatch.index! + importMatch[0].length;
        const importStatements = Array.from(imports).join('\n');
        
        modifiedCode = 
          modifiedCode.substring(0, importEndIndex) + 
          importStatements + '\n' + 
          modifiedCode.substring(importEndIndex);
      }
    }
    
    return modifiedCode;
  }
}

export default JsonMigrationHelper; 