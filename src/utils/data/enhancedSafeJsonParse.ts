/**
 * 增强版安全JSON解析工具
 * 结合性能监控和完善的错误处理
 */

import { z } from 'zod';
import { safeJsonParse, safeJsonParseWithSchema } from '../common/safeTypeConversions';
import { PerformanceMonitor } from '../performance/performanceMonitor';

// 获取性能监控器实例
const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * JSON解析错误类型
 */
export enum JsonErrorType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EMPTY_INPUT = 'EMPTY_INPUT',
  TYPE_ERROR = 'TYPE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * JSON解析错误
 */
export class JsonParseError extends Error {
  readonly type: JsonErrorType;
  readonly path?: string;
  readonly value?: unknown;
  readonly originalError?: Error;
  
  constructor(
    message: string, 
    type: JsonErrorType = JsonErrorType.UNKNOWN_ERROR,
    options?: {
      path?: string;
      value?: unknown;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'JsonParseError';
    this.type = type;
    this.path = options?.path;
    this.value = options?.value;
    this.originalError = options?.originalError;
    
    // 确保正确的原型链接
    Object.setPrototypeOf(this, JsonParseError.prototype);
  }
  
  /**
   * 获取格式化的错误消息
   */
  getFormattedMessage(): string {
    let message = `[${this.type}] ${this.message}`;
    
    if (this.path) {
      message += `\n路径: ${this.path}`;
    }
    
    if (this.value !== undefined) {
      message += `\n值: ${
        typeof this.value === 'object' 
          ? JSON.stringify(this.value, null, 2).substring(0, 100) 
          : String(this.value)
      }`;
    }
    
    return message;
  }
  
  /**
   * 创建语法错误
   */
  static syntax(originalError: Error, value?: string): JsonParseError {
    return new JsonParseError(
      `JSON解析语法错误: ${originalError.message}`,
      JsonErrorType.SYNTAX_ERROR,
      { originalError, value }
    );
  }
  
  /**
   * 创建验证错误
   */
  static validation(
    message: string,
    path?: string,
    value?: unknown,
    originalError?: Error
  ): JsonParseError {
    return new JsonParseError(
      `JSON验证错误: ${message}`,
      JsonErrorType.VALIDATION_ERROR,
      { path, value, originalError }
    );
  }
  
  /**
   * 创建空输入错误
   */
  static emptyInput(): JsonParseError {
    return new JsonParseError(
      'JSON输入为空',
      JsonErrorType.EMPTY_INPUT
    );
  }
  
  /**
   * 创建类型错误
   */
  static typeError(
    expectedType: string,
    actualValue?: unknown
  ): JsonParseError {
    return new JsonParseError(
      `类型错误: 期望 ${expectedType}`,
      JsonErrorType.TYPE_ERROR,
      { value: actualValue }
    );
  }
}

/**
 * 用于增强版JSON解析的选项
 */
export interface EnhancedJsonParseOptions<T> {
  /** 解析失败时返回的默认值 */
  defaultValue: T;
  /** 组件名称，用于日志 */
  componentName?: string;
  /** 是否记录性能 */
  measurePerformance?: boolean;
  /** 是否记录详细错误 */
  logErrors?: boolean;
  /** 自定义错误处理程序 */
  onError?: (error: JsonParseError) => void;
  /** 是否尝试修复常见问题 */
  attemptFix?: boolean;
}

/**
 * JSON解析的后续处理选项
 */
export interface ParseProcessOptions {
  /** 是否移除空值 */
  removeEmptyValues?: boolean;
  /** 是否将带引号的数字转换为数字类型 */
  convertNumericStrings?: boolean;
  /** 是否修剪字符串字段值 */
  trimStringValues?: boolean;
}

/**
 * 配置了Zod模式的增强JSON解析选项
 */
export interface EnhancedJsonParseWithSchemaOptions<T> extends EnhancedJsonParseOptions<T> {
  /** Zod验证模式 */
  schema: z.ZodSchema<T>;
  /** 是否使用宽松验证 */
  lenientMode?: boolean;
  /** 是否将部分有效数据与默认值合并 */
  mergeWithDefault?: boolean;
  /** 解析过程选项 */
  processOptions?: ParseProcessOptions;
}

/**
 * 增强版安全JSON解析，包含详细错误处理和性能监控
 * @param json JSON字符串
 * @param options 解析选项
 * @returns 解析后的值或默认值
 */
export function enhancedJsonParse<T>(
  json: string | null | undefined,
  options: EnhancedJsonParseOptions<T>
): T {
  const { 
    defaultValue, 
    componentName = 'JSON', 
    measurePerformance = true,
    logErrors = true,
    onError,
    attemptFix = false
  } = options;
  
  // 包装解析逻辑为可测量的函数
  const parseWithMeasure = (): T => {
    // 处理空值
    if (json === null || json === undefined || json.trim() === '') {
      const error = JsonParseError.emptyInput();
      if (logErrors) {
        console.warn(`[${componentName}] ${error.message}`);
      }
      if (onError) {
        onError(error);
      }
      return defaultValue;
    }
    
    try {
      // 尝试修复常见问题
      let jsonToProcess = json;
      
      if (attemptFix) {
        // 修复常见的不带引号的键
        jsonToProcess = jsonToProcess.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
        
        // 修复使用单引号代替双引号的问题
        if (jsonToProcess.includes("'") && !jsonToProcess.includes('"')) {
          jsonToProcess = jsonToProcess.replace(/'/g, '"');
        }
        
        // 修复缺少后大括号的问题
        const openBraces = (jsonToProcess.match(/{/g) || []).length;
        const closeBraces = (jsonToProcess.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          jsonToProcess += '}'.repeat(openBraces - closeBraces);
        }
      }
      
      // 执行解析
      const result = JSON.parse(jsonToProcess) as T;
      return result;
    } catch (error) {
      const jsonError = JsonParseError.syntax(
        error instanceof Error ? error : new Error(String(error)),
        typeof json === 'string' ? json : undefined
      );
      
      if (logErrors) {
        console.error(`[${componentName}] ${jsonError.getFormattedMessage()}`);
      }
      
      if (onError) {
        onError(jsonError);
      }
      
      return defaultValue;
    }
  };
  
  // 根据配置决定是否进行性能测量
  if (measurePerformance) {
    return performanceMonitor.measure(
      `jsonParse:${componentName}`,
      parseWithMeasure,
      { inputLength: typeof json === 'string' ? json.length : 0 }
    );
  }
  
  return parseWithMeasure();
}

/**
 * 处理对象按照指定选项
 * @param obj 要处理的对象
 * @param options 处理选项
 * @returns 处理后的对象
 */
function processObject<T>(obj: T, options: ParseProcessOptions): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // 创建新对象以避免修改原始对象
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      let value = (result as any)[key];
      
      // 递归处理嵌套对象
      if (value && typeof value === 'object') {
        (result as any)[key] = processObject(value, options);
      } else {
        // 处理字符串值
        if (typeof value === 'string') {
          // 修剪字符串
          if (options.trimStringValues) {
            value = value.trim();
          }
          
          // 转换数字字符串
          if (options.convertNumericStrings && /^-?\d+(\.\d+)?$/.test(value)) {
            value = Number(value);
          }
          
          (result as any)[key] = value;
        }
      }
      
      // 移除空值
      if (options.removeEmptyValues && 
          (value === null || value === undefined || value === '')) {
        if (Array.isArray(result)) {
          // 不从数组中删除元素，这会改变索引
        } else {
          delete (result as any)[key];
        }
      }
    }
  }
  
  return result;
}

/**
 * 使用Zod模式验证的增强安全JSON解析
 * @param json JSON字符串
 * @param options 解析选项，包含Zod模式
 * @returns 解析并验证后的对象
 */
export function enhancedJsonParseWithSchema<T>(
  json: string | null | undefined,
  options: EnhancedJsonParseWithSchemaOptions<T>
): T {
  const { 
    defaultValue,
    schema, 
    componentName = 'JSON', 
    measurePerformance = true,
    logErrors = true,
    onError,
    lenientMode = false,
    mergeWithDefault = false,
    processOptions,
    attemptFix = false
  } = options;
  
  // 包装解析和验证逻辑为可测量的函数
  const parseValidateWithMeasure = (): T => {
    // 首先解析JSON
    let parsedData: unknown;
    
    try {
      // 处理空值
      if (json === null || json === undefined || json.trim() === '') {
        const error = JsonParseError.emptyInput();
        if (logErrors) {
          console.warn(`[${componentName}] ${error.message}`);
        }
        if (onError) {
          onError(error);
        }
        return defaultValue;
      }
      
      // 尝试修复常见问题
      let jsonToProcess = json;
      
      if (attemptFix) {
        // 修复常见的不带引号的键
        jsonToProcess = jsonToProcess.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
        
        // 修复使用单引号代替双引号的问题
        if (jsonToProcess.includes("'") && !jsonToProcess.includes('"')) {
          jsonToProcess = jsonToProcess.replace(/'/g, '"');
        }
        
        // 修复缺少后大括号的问题
        const openBraces = (jsonToProcess.match(/{/g) || []).length;
        const closeBraces = (jsonToProcess.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          jsonToProcess += '}'.repeat(openBraces - closeBraces);
        }
      }
      
      // 执行解析
      parsedData = JSON.parse(jsonToProcess);
    } catch (error) {
      const jsonError = JsonParseError.syntax(
        error instanceof Error ? error : new Error(String(error)),
        typeof json === 'string' ? json : undefined
      );
      
      if (logErrors) {
        console.error(`[${componentName}] ${jsonError.getFormattedMessage()}`);
      }
      
      if (onError) {
        onError(jsonError);
      }
      
      return defaultValue;
    }
    
    // 应用处理选项
    if (processOptions && typeof parsedData === 'object' && parsedData !== null) {
      parsedData = processObject(parsedData, processOptions);
    }
    
    // 然后进行Zod验证
    try {
      // 使用模式验证
      const validationResult = schema.safeParse(parsedData);
      
      if (validationResult.success) {
        return validationResult.data;
      } else {
        // 验证失败
        // 如果是在宽松模式下，尝试提取部分有效数据
        if (lenientMode) {
          // 记录验证错误，但仍然返回已解析的数据，尽可能接近模式定义
          const validationErrors = validationResult.error.errors;
          
          if (logErrors) {
            console.warn(`[${componentName}] 部分验证失败:`, validationErrors);
          }
          
          if (mergeWithDefault && typeof parsedData === 'object' && parsedData !== null) {
            // 合并部分有效数据与默认值
            if (Array.isArray(defaultValue) && Array.isArray(parsedData)) {
              return [...parsedData] as unknown as T;
            } else if (typeof defaultValue === 'object' && defaultValue !== null) {
              return { ...defaultValue, ...(parsedData as object) } as unknown as T;
            }
          }
          
          return parsedData as unknown as T;
        } else {
          // 严格模式下，抛出验证错误
          throw validationResult.error;
        }
      }
    } catch (validationError) {
      // 构建验证错误对象
      let errorMessage = '验证失败';
      let errorPath = '';
      
      if (validationError instanceof z.ZodError) {
        const firstError = validationError.errors[0];
        errorMessage = firstError.message;
        errorPath = firstError.path.join('.');
      }
      
      const jsonError = JsonParseError.validation(
        errorMessage,
        errorPath,
        parsedData,
        validationError instanceof Error ? validationError : undefined
      );
      
      if (logErrors) {
        console.error(`[${componentName}] ${jsonError.getFormattedMessage()}`);
      }
      
      if (onError) {
        onError(jsonError);
      }
      
      return defaultValue;
    }
  };
  
  // 根据配置决定是否进行性能测量
  if (measurePerformance) {
    return performanceMonitor.measure(
      `jsonParseWithSchema:${componentName}`,
      parseValidateWithMeasure,
      { 
        inputLength: typeof json === 'string' ? json.length : 0,
        schemaName: typeof schema._def === 'object' ? (schema._def as any).typeName || 'unknown' : 'unknown'
      }
    );
  }
  
  return parseValidateWithMeasure();
}

export default {
  enhancedJsonParse,
  enhancedJsonParseWithSchema,
  JsonParseError,
  JsonErrorType
}; 