import React, { FC, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import ValidatedFieldBase, { ValidatedFieldBaseProps } from './ValidatedFieldBase';

export type FieldType = 'input' | 'textarea' | 'select' | 'checkbox' | 'radio';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'form' | 'type'>;
type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onBlur' | 'form'>;
type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'onBlur' | 'form'>;

// 结合所有可能的HTML属性
type AllFieldProps = InputProps & TextareaProps & SelectProps & {
  inputType?: string; // 针对input元素的type属性
};

export type ValidatedFieldProps = Omit<ValidatedFieldBaseProps, 'children'> & 
  AllFieldProps & {
    type: FieldType;
    fieldClassName?: string;
    options?: Array<{
      value: string;
      label: string;
    }>;
  };

/**
 * 通用验证字段组件
 * 根据type属性渲染不同类型的表单控件，统一表单验证逻辑
 */
const ValidatedField: FC<ValidatedFieldProps> = ({
  // 字段类型配置
  type = 'input',
  inputType = 'text',
  options = [],
  
  // 表单和字段属性
  form,
  name,
  label,
  
  // 样式配置
  className,
  labelClassName,
  errorClassName,
  fieldClassName = 'w-full px-3 py-2 border rounded-md',
  hint,
  showErrorMessage,
  
  // 其他HTML属性
  ...props
}) => {
  return (
    <ValidatedFieldBase
      form={form}
      name={name}
      label={label}
      className={className}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      hint={hint}
      showErrorMessage={showErrorMessage}
    >
      {({ id, value, onChange, onBlur, hasError, describedBy }) => {
        const commonProps = {
          id,
          name,
          onBlur,
          'aria-invalid': hasError,
          'aria-describedby': describedBy,
          ...props
        };
        
        const errorClass = hasError ? 'border-red-500' : '';
        
        switch (type) {
          case 'input':
            return (
              <input
                {...commonProps}
                type={inputType}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={`${fieldClassName} ${errorClass}`}
              />
            );
            
          case 'textarea':
            return (
              <textarea
                {...commonProps}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={`${fieldClassName} ${errorClass}`}
              />
            );
            
          case 'select':
            return (
              <select
                {...commonProps}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={`${fieldClassName} ${errorClass}`}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            );
            
          case 'checkbox':
            return (
              <div className="flex items-center">
                <input
                  {...commonProps}
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(e.target.checked)}
                  className={`h-4 w-4 mr-2 ${errorClass}`}
                />
                {props.placeholder && (
                  <span className="text-sm text-gray-600">{props.placeholder}</span>
                )}
              </div>
            );
            
          case 'radio':
            return (
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      {...commonProps}
                      id={`${id}-${option.value}`}
                      type="radio"
                      value={option.value}
                      checked={value === option.value}
                      onChange={() => onChange(option.value)}
                      className={`h-4 w-4 mr-2 ${errorClass}`}
                    />
                    <label htmlFor={`${id}-${option.value}`} className="text-sm text-gray-600">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            );
            
          default:
            return (
              <input
                {...commonProps}
                type="text"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={`${fieldClassName} ${errorClass}`}
              />
            );
        }
      }}
    </ValidatedFieldBase>
  );
};

export default ValidatedField; 