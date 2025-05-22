import React, { FC, FormHTMLAttributes, ReactNode } from 'react';

// 定义表单上下文类型
interface FormContext {
  form: any;
  isSubmitting: boolean;
}

interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> {
  form: any;
  onSubmit: (values: any) => void;
  onError?: (errors: any) => void;
  children: ReactNode | ((context: FormContext) => ReactNode);
  className?: string;
}

/**
 * 表单容器组件
 * 封装表单验证和提交逻辑
 */
const Form: FC<FormProps> = ({
  form,
  onSubmit,
  onError,
  children,
  className = 'space-y-4',
  ...props
}) => {
  // 表单提交处理
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 使用表单验证库的提交方法
    form.submitForm(
      // 成功回调
      (values: any) => {
        onSubmit(values);
      },
      // 错误回调
      onError
    );
  };
  
  // 创建表单上下文
  const formContext: FormContext = {
    form,
    isSubmitting: form.isSubmitting || false
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className={className} 
      noValidate
      {...props}
    >
      {/* 如果children是函数，传入表单上下文 */}
      {typeof children === 'function' 
        ? (children as (context: FormContext) => ReactNode)(formContext) 
        : children
      }
    </form>
  );
};

export default Form; 