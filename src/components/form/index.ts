// 导出所有表单验证组件
import { ReactNode } from 'react';

// 基础组件
import FormField, { FormFieldProps, FieldStyleProps } from './FormField';
import Form from './Form';

// 验证字段组件
import ValidatedField, { ValidatedFieldProps, FieldType as ValidatedFieldType } from './ValidatedField';

// 从ValidatedFieldBase导入类型
import ValidatedFieldBase from './ValidatedFieldBase';

// 导出类型
export type {
  FormFieldProps,
  FieldStyleProps,
  ValidatedFieldProps
};

// 统一的字段类型枚举
export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

// 导出组件
export {
  // 基础组件
  FormField,
  Form,
  
  // 验证字段组件
  ValidatedField
};