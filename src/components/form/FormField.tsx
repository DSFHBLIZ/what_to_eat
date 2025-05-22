import React, { ReactNode } from 'react';
import { useField } from '../../utils/data/validation';

// 字段样式配置
export interface FieldStyleProps {
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  hint?: string;
  showErrorMessage?: boolean;
}

// 核心字段属性
export interface FormFieldProps extends FieldStyleProps {
  form: any;
  name: string;
  label?: ReactNode;
  children: (fieldProps: {
    id: string;
    name: string;
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    error: string | null;
    touched: boolean;
    hasError: boolean;
    describedBy: string | undefined;
  }) => ReactNode;
}

/**
 * 通用表单字段组件
 * 处理表单字段的公共逻辑，包括错误显示、标签和提示
 */
const FormField: React.FC<FormFieldProps> = ({
  // 核心属性
  form,
  name,
  label,
  children,
  
  // 样式配置
  className = 'mb-4',
  labelClassName = 'block text-gray-700 mb-2',
  errorClassName = 'text-sm text-red-500 mt-1',
  hint,
  showErrorMessage = true,
}) => {
  // 获取字段属性
  const field = useField(form, name);
  
  // 判断是否有错误
  const hasError = field.touched && !!field.error;
  const describedBy = hasError ? `${name}-error` : undefined;
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className={labelClassName}>
          {label}
        </label>
      )}
      
      {children({
        id: name,
        name,
        value: field.value,
        onChange: field.onChange,
        onBlur: field.onBlur,
        error: field.error,
        touched: field.touched,
        hasError,
        describedBy
      })}
      
      {hint && !field.error && (
        <p className="text-sm text-gray-500 mt-1">{hint}</p>
      )}
      
      {showErrorMessage && hasError && (
        <p id={`${name}-error`} className={errorClassName}>
          {field.error}
        </p>
      )}
    </div>
  );
};

export default FormField; 