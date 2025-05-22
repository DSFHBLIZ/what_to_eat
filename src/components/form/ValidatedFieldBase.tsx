import React, { FC, ReactElement, ReactNode } from 'react';
import FormField, { FieldStyleProps } from './FormField';

export interface ValidatedFieldBaseProps extends FieldStyleProps {
  form: any;
  name: string;
  label?: ReactNode;
  children: (props: {
    id: string;
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    hasError: boolean;
    describedBy: string | undefined;
    errorClassName: string;
  }) => ReactElement;
}

/**
 * 验证字段基础组件
 * 为所有表单控件提供统一的验证逻辑和错误处理
 */
const ValidatedFieldBase: FC<ValidatedFieldBaseProps> = ({
  // 表单和字段属性
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
  return (
    <FormField
      form={form}
      name={name}
      label={label}
      className={className}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      hint={hint}
      showErrorMessage={showErrorMessage}
    >
      {({ id, value, onChange, onBlur, hasError, describedBy }) => 
        children({
          id,
          value,
          onChange, 
          onBlur,
          hasError,
          describedBy,
          errorClassName
        })
      }
    </FormField>
  );
};

export default ValidatedFieldBase; 