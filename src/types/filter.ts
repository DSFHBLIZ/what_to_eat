/**
 * 筛选器类型定义文件
 */

// 基础选项类型
export interface OptionBase {
  id: string;
  label: string;
}

// 筛选器类型定义
export interface FilterSchemaType {
  id: string;
  label: string;
  type: 'radio' | 'checkbox' | 'range';
  fieldName: string | string[];
  clearable?: boolean;
  multiSelect?: boolean;
  options: OptionBase[];
  defaultValue: any;
  fieldMapping?: Record<string, string | null>;
} 