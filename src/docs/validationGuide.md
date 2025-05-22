# 表单验证系统使用指南

本文档提供了表单验证系统的详细使用指南，包括所有验证器的用法、最佳实践和示例。

## 目录

1. [系统概述](#系统概述)
2. [基础验证器](#基础验证器)
3. [组合验证器](#组合验证器)
4. [表单状态管理](#表单状态管理)
5. [与React集成](#与React集成)
6. [高级用法](#高级用法)
7. [最佳实践](#最佳实践)
8. [疑难解答](#疑难解答)

## 系统概述

表单验证系统是一个基于Zustand的轻量级、类型安全的表单验证解决方案。它提供了以下功能：

- 丰富的内置验证器（必填、最小/最大长度、邮箱、手机号等）
- 自定义验证规则支持
- 与Zustand状态管理集成
- 字段级和表单级验证
- 支持嵌套字段和动态表单
- React组件友好的集成方式

### 架构

表单验证系统由以下核心部分组成：

1. **验证器函数集合** - 提供各种验证规则（如required、email、pattern等）
2. **验证执行器** - 负责执行验证并返回结果（validateField、validateFields）
3. **状态管理集成** - 使用Zustand管理表单状态（createValidationStore）
4. **React集成工具** - 简化在React组件中使用表单验证（useField等）

## 基础验证器

系统提供了以下基础验证器：

### required - 必填验证

```typescript
import { required } from '../utils/validation';

// 基本用法
const nameRule = required();  // 使用默认错误消息
const emailRule = required('邮箱不能为空');  // 自定义错误消息

// 用例
nameRule('');     // 返回: '此字段不能为空'
nameRule(null);   // 返回: '此字段不能为空'
nameRule('John'); // 返回: null (验证通过)
```

### minLength - 最小长度验证

```typescript
import { minLength } from '../utils/validation';

// 基本用法
const passwordRule = minLength(8, '密码至少需要8个字符');

// 用例
passwordRule('123');     // 返回: '密码至少需要8个字符'
passwordRule('12345678'); // 返回: null (验证通过)
```

### maxLength - 最大长度验证

```typescript
import { maxLength } from '../utils/validation';

// 基本用法
const usernameRule = maxLength(20, '用户名最多20个字符');

// 用例
usernameRule('这是一个非常非常非常长的用户名超过了20个字符'); // 返回错误消息
usernameRule('正常用户名');  // 返回: null (验证通过)
```

### email - 邮箱格式验证

```typescript
import { email } from '../utils/validation';

// 基本用法
const emailRule = email('请输入有效的邮箱地址');

// 用例
emailRule('invalid-email');  // 返回: '请输入有效的邮箱地址'
emailRule('user@example.com'); // 返回: null (验证通过)
```

### pattern - 正则表达式验证

```typescript
import { pattern } from '../utils/validation';

// 基本用法
const numberPattern = /^\d+$/;
const numberRule = pattern(numberPattern, '只能输入数字');

// 用例
numberRule('abc123'); // 返回: '只能输入数字'
numberRule('12345');  // 返回: null (验证通过)
```

### phone - 手机号验证

```typescript
import { phone } from '../utils/validation';

// 基本用法
const mobileRule = phone('请输入有效的手机号码');

// 用例
mobileRule('123');         // 返回: '请输入有效的手机号码'
mobileRule('13812345678'); // 返回: null (验证通过)
```

### range - 数值范围验证

```typescript
import { range } from '../utils/validation';

// 基本用法
const ageRule = range(18, 120, '年龄必须在18到120岁之间');

// 用例
ageRule(15);  // 返回: '年龄必须在18到120岁之间'
ageRule(25);  // 返回: null (验证通过)
```

### url - URL格式验证

```typescript
import { url } from '../utils/validation';

// 基本用法
const websiteRule = url('请输入有效的URL地址');

// 用例
websiteRule('example');  // 返回: '请输入有效的URL地址'
websiteRule('https://example.com'); // 返回: null (验证通过)
```

### match - 字段匹配验证

```typescript
import { match } from '../utils/validation';

// 基本用法
const confirmEmailRule = match('email', '两个邮箱地址必须一致');

// 用例
const allValues = { email: 'user@example.com', confirmEmail: 'different@example.com' };
confirmEmailRule('different@example.com', allValues); // 返回: '两个邮箱地址必须一致'

const matchingValues = { email: 'user@example.com', confirmEmail: 'user@example.com' };
confirmEmailRule('user@example.com', matchingValues); // 返回: null (验证通过)
```

### sameAs - 字段值相同验证

```typescript
import { sameAs } from '../utils/validation';

// 基本用法
const confirmPasswordRule = sameAs('password', '两次输入的密码不一致');

// 用例
const allValues = { password: 'abc123', confirmPassword: 'different' };
confirmPasswordRule('different', allValues); // 返回: '两次输入的密码不一致'

const matchingValues = { password: 'abc123', confirmPassword: 'abc123' };
confirmPasswordRule('abc123', matchingValues); // 返回: null (验证通过)
```

### custom - 自定义验证

```typescript
import { custom } from '../utils/validation';

// 基本用法
const isEvenRule = custom<number>(
  (value) => value % 2 === 0, 
  '请输入偶数'
);

// 用例
isEvenRule(3); // 返回: '请输入偶数'
isEvenRule(4); // 返回: null (验证通过)

// 使用所有表单值进行验证
const sumLessThanRule = custom<number>(
  (value, allValues) => {
    const sum = Object.values(allValues).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    return sum < 100;
  },
  '所有数字总和不能超过100'
);
```

## 组合验证器

可以为单个字段组合多个验证器：

```typescript
// 密码验证规则组合
const passwordRules = [
  required('密码不能为空'),
  minLength(8, '密码至少需要8个字符'),
  pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字')
];

// 验证单个值
import { validateField } from '../utils/validation';
const errors = validateField('abc', passwordRules);
console.log(errors); // 返回错误消息数组
```

## 表单状态管理

### 创建表单验证存储

```typescript
import { createValidationStore } from '../utils/validation';

// 定义表单类型
interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

// 创建初始值
const initialValues: LoginForm = {
  username: '',
  password: '',
  rememberMe: false
};

// 定义验证规则
const validationRules = {
  username: [required('用户名不能为空')],
  password: [
    required('密码不能为空'), 
    minLength(6, '密码至少6个字符')
  ]
};

// 创建表单状态存储
const useLoginForm = createValidationStore<LoginForm>(
  initialValues,
  validationRules
);

// 在组件中使用
function LoginComponent() {
  const form = useLoginForm();
  
  // 获取表单值
  const { username, password, rememberMe } = form.values;
  
  // 检查字段错误
  const usernameError = form.getFieldError('username');
  
  // 检查表单是否有效
  const isValid = form.validation.isValid;
  
  // 设置字段值
  const handleUsernameChange = (e) => {
    form.setFieldValue('username', e.target.value);
  };
  
  // 标记字段为已触摸
  const handleUsernameBlur = () => {
    form.setFieldTouched('username');
  };
  
  // 表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await form.validateForm();
    if (isValid) {
      // 提交表单
      console.log('表单数据:', form.values);
    }
  };
  
  // 重置表单
  const handleReset = () => {
    form.resetForm();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

### 表单状态存储API

表单验证存储提供以下API：

| 属性/方法 | 描述 |
|----------|------|
| `values` | 当前表单值对象 |
| `initialValues` | 初始表单值对象 |
| `validation` | 当前验证状态 |
| `rules` | 验证规则 |
| `isValidating` | 是否正在验证 |
| `lastValidated` | 上次验证时间戳 |
| `setValues(values)` | 设置多个字段值 |
| `setFieldValue(field, value)` | 设置单个字段值 |
| `setFieldTouched(field, touched)` | 设置字段触摸状态 |
| `validateForm()` | 验证整个表单 |
| `validateField(field)` | 验证单个字段 |
| `resetForm(values?)` | 重置表单到初始状态 |
| `setRules(rules)` | 设置验证规则 |
| `getFieldError(field)` | 获取字段错误消息 |

## 与React集成

### 使用useField钩子

useField钩子简化了字段属性的获取：

```typescript
import { useField } from '../utils/validation';

function FormField({ form, name, label }) {
  const field = useField(form, name);
  
  return (
    <div>
      <label>{label}</label>
      <input
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
      />
      {field.touched && field.error && (
        <p className="error">{field.error}</p>
      )}
    </div>
  );
}
```

### 完整表单示例

```typescript
import React from 'react';
import { createValidationStore, useField, required, email, minLength } from '../utils/validation';

// 表单类型定义
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

// 创建表单存储
const useContactForm = createValidationStore<ContactForm>(
  {
    name: '',
    email: '',
    message: ''
  },
  {
    name: [required('请输入您的姓名')],
    email: [required('请输入您的邮箱'), email('请输入有效的邮箱地址')],
    message: [required('请输入留言内容'), minLength(10, '留言内容至少10个字符')]
  }
);

// 表单组件
export function ContactForm() {
  const form = useContactForm();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await form.validateForm();
    if (isValid) {
      // 处理表单提交
      alert('表单提交成功！');
      form.resetForm();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        form={form}
        name="name"
        label="姓名"
        required
      />
      
      <FormField
        form={form}
        name="email"
        label="邮箱"
        type="email"
        required
      />
      
      <FormField
        form={form}
        name="message"
        label="留言内容"
        isTextarea
        required
      />
      
      <button
        type="submit"
        disabled={form.isValidating}
        className="btn btn-primary"
      >
        {form.isValidating ? '提交中...' : '提交'}
      </button>
    </form>
  );
}

// 字段组件
function FormField({ form, name, label, type = 'text', isTextarea = false, required = false }) {
  const field = useField(form, name);
  
  const inputProps = {
    value: field.value,
    onChange: (e) => field.onChange(e.target.value),
    onBlur: field.onBlur,
    className: `form-input ${field.touched && field.error ? 'border-red-500' : 'border-gray-300'}`
  };
  
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {isTextarea ? (
        <textarea {...inputProps} rows={4} />
      ) : (
        <input {...inputProps} type={type} />
      )}
      
      {field.touched && field.error && (
        <p className="text-red-500 text-sm mt-1">{field.error}</p>
      )}
    </div>
  );
}
```

## 高级用法

### 动态表单字段

处理动态数组字段：

```typescript
// 动态表单示例
interface DynamicForm {
  title: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

const useDynamicForm = createValidationStore<DynamicForm>(
  {
    title: '',
    items: [{ name: '', quantity: 1 }]
  },
  {
    title: [required('标题不能为空')],
    'items.*.name': [required('项目名称不能为空')],
    'items.*.quantity': [
      (value) => value > 0 ? null : '数量必须大于0'
    ]
  }
);

// 在组件中使用
function DynamicFormComponent() {
  const form = useDynamicForm();
  
  const addItem = () => {
    form.setFieldValue('items', [
      ...form.values.items,
      { name: '', quantity: 1 }
    ]);
  };
  
  const removeItem = (index: number) => {
    form.setFieldValue('items', 
      form.values.items.filter((_, i) => i !== index)
    );
  };
  
  return (
    <form>
      {/* 表单内容 */}
      {form.values.items.map((item, index) => (
        <div key={index}>
          <input
            value={item.name}
            onChange={(e) => {
              const newItems = [...form.values.items];
              newItems[index].name = e.target.value;
              form.setFieldValue('items', newItems);
            }}
            onBlur={() => form.setFieldTouched(`items.${index}.name` as any)}
          />
          {form.validation.fields[`items.${index}.name` as any]?.errors[0] && (
            <p className="error">{form.validation.fields[`items.${index}.name` as any]?.errors[0]}</p>
          )}
        </div>
      ))}
      <button type="button" onClick={addItem}>添加项目</button>
    </form>
  );
}
```

### 条件验证

根据其他字段值或条件应用验证规则：

```typescript
// 条件验证示例
interface PaymentForm {
  paymentMethod: 'credit' | 'bank';
  creditCardNumber: string;
  bankAccountNumber: string;
}

const usePaymentForm = createValidationStore<PaymentForm>(
  {
    paymentMethod: 'credit',
    creditCardNumber: '',
    bankAccountNumber: ''
  },
  {
    paymentMethod: [required('请选择支付方式')],
    creditCardNumber: [
      (value, allValues) => {
        // 只有当支付方式为信用卡时才验证
        if (allValues && allValues.paymentMethod === 'credit') {
          if (!value) return '请输入信用卡号';
          if (!/^\d{16}$/.test(value)) return '信用卡号必须是16位数字';
        }
        return null;
      }
    ],
    bankAccountNumber: [
      (value, allValues) => {
        // 只有当支付方式为银行转账时才验证
        if (allValues && allValues.paymentMethod === 'bank') {
          if (!value) return '请输入银行账号';
        }
        return null;
      }
    ],
  }
);
```

## 最佳实践

### 1. 组织验证规则

对于复杂表单，将验证规则独立定义：

```typescript
// src/validations/userFormValidation.ts
import { required, email, minLength, ... } from '../utils/validation';

export const userValidationRules = {
  username: [
    required('用户名不能为空'),
    minLength(3, '用户名至少3个字符')
  ],
  email: [
    required('邮箱不能为空'),
    email('请输入有效的邮箱地址')
  ],
  password: [
    required('密码不能为空'),
    minLength(8, '密码至少8个字符'),
    pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字')
  ]
};

// 在组件中引用
import { userValidationRules } from '../validations/userFormValidation';
const useUserForm = createValidationStore(initialValues, userValidationRules);
```

### 2. 创建可重用表单字段组件

抽象常用的表单字段组件：

```typescript
// src/components/form/TextField.tsx
import { ValidationStore, useField } from '../../utils/validation';

interface TextFieldProps<T extends Record<string, any>> {
  form: ValidationStore<T>;
  name: keyof T;
  label: string;
  type?: 'text' | 'password' | 'email' | 'tel';
  placeholder?: string;
  required?: boolean;
}

export function TextField<T extends Record<string, any>>({
  form,
  name,
  label,
  type = 'text',
  placeholder = '',
  required = false
}: TextFieldProps<T>) {
  const field = useField(form, name);
  
  return (
    <div className="form-field">
      <label className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
        placeholder={placeholder}
        className={`form-input ${field.touched && field.error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {field.touched && field.error && (
        <p className="text-red-500 text-sm mt-1">{field.error}</p>
      )}
    </div>
  );
}
```

### 3. 错误处理最佳实践

优雅地处理表单验证错误：

```typescript
function RegistrationForm() {
  const form = useRegistrationForm();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const isValid = await form.validateForm();
      
      if (!isValid) {
        // 自动滚动到第一个错误字段
        const firstErrorField = Object.keys(form.validation.errors)[0];
        const errorElement = document.getElementById(`field-${firstErrorField}`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      
      // 提交表单逻辑
      await submitRegistration(form.values);
      
      // 成功处理
      showSuccessMessage('注册成功！');
      form.resetForm();
      
    } catch (error) {
      // 处理API提交错误
      if (error.fieldErrors) {
        // 服务器返回的字段错误
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          form.setFieldTouched(field as any, true);
          // 可以通过自定义状态存储服务器错误
        });
      } else {
        // 通用错误
        showErrorMessage(error.message || '注册失败，请重试');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
    </form>
  );
}
```

## 疑难解答

### 常见问题

#### 1. 动态字段错误访问问题

**问题**：在处理动态数组字段时，`useField(form, 'items.0.name')` 不起作用。

**解决方案**：使用类型断言和直接访问验证字段：

```typescript
// 错误方法
const field = useField(form, `items.${index}.name`); // 类型错误

// 正确方法
const fieldPath = `items.${index}.name` as any;
const error = form.validation.fields[fieldPath]?.errors[0] || null;
const touched = form.validation.fields[fieldPath]?.touched || false;

// 或者为复杂路径创建辅助函数
function getNestedFieldState(form, path) {
  return {
    error: form.validation.fields[path]?.errors[0] || null,
    touched: form.validation.fields[path]?.touched || false,
    dirty: form.validation.fields[path]?.dirty || false,
    valid: form.validation.fields[path]?.valid || true
  };
}

// 使用辅助函数
const fieldState = getNestedFieldState(form, `items.${index}.name`);
```

#### 2. 异步验证

**问题**：如何实现异步验证（如检查用户名是否已存在）？

**解决方案**：使用自定义验证器并返回Promise：

```typescript
// 创建一个异步验证函数
const usernameExists = async (username) => {
  try {
    const response = await fetch(`/api/check-username?username=${username}`);
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('检查用户名失败:', error);
    return false; // 假设不存在，避免阻止用户注册
  }
};

// 异步验证包装器
const asyncValidator = (validatorFn, errorMessage) => {
  return async (value, allValues) => {
    if (!value) return null; // 空值不验证
    
    const result = await validatorFn(value, allValues);
    return result ? errorMessage : null;
  };
};

// 使用异步验证器
const validationRules = {
  username: [
    required('用户名不能为空'),
    asyncValidator(usernameExists, '该用户名已被使用')
  ]
};
```

注意：异步验证需要对`validateField`和`validateForm`函数进行修改，以支持Promise返回类型。当前实现可能需要扩展。

---

希望本指南能帮助您充分利用表单验证系统的功能。如有任何问题或建议，请查看相关测试用例或联系开发团队。 