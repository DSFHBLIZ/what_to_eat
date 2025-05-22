# 表单验证系统使用指南

## 1. 系统概述

表单验证系统是一个基于Zustand的轻量级、类型安全的表单验证解决方案，专为React应用程序设计。它提供了一种简单而强大的方式来处理表单验证，无需大量模板代码。

### 核心特性

- **类型安全**: 完整的TypeScript支持
- **Zustand集成**: 基于状态管理库Zustand构建
- **丰富的内置验证器**: 包含最常用的验证规则
- **表单状态管理**: 自动处理表单状态（触摸、脏、有效性等）
- **灵活可扩展**: 支持自定义验证规则和表单组件
- **性能优化**: 针对复杂表单优化

## 2. 验证器

系统提供以下内置验证器:

### 基础验证器

| 验证器 | 描述 | 示例 |
|--------|------|------|
| `required` | 确保字段不为空 | `required('此字段不能为空')` |
| `minLength` | 验证最小长度 | `minLength(8, '密码至少需要8个字符')` |
| `maxLength` | 验证最大长度 | `maxLength(50, '评论最多50个字符')` |
| `pattern` | 正则表达式验证 | `pattern(/^\d+$/, '只能输入数字')` |
| `email` | 电子邮箱格式 | `email('请输入有效的邮箱地址')` |
| `phone` | 手机号码格式 | `phone('请输入有效的手机号码')` |
| `range` | 数值范围验证 | `range(18, 100, '年龄必须在18-100之间')` |
| `url` | URL格式验证 | `url('请输入有效的网址')` |
| `match` | 与另一个字段匹配 | `match('email', '两个邮箱必须一致')` |
| `sameAs` | 与另一个字段值相同 | `sameAs('password', '两次密码输入不一致')` |
| `custom` | 自定义验证规则 | `custom(v => v % 2 === 0, '必须是偶数')` |

## 3. 基本使用

### 3.1 创建表单验证存储

```typescript
import { createValidationStore, required, email, minLength } from '../utils/validation';

// 定义表单类型
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

// 创建验证存储
const useLoginForm = createValidationStore<LoginForm>(
  // 初始值
  {
    email: '',
    password: '',
    rememberMe: false
  },
  // 验证规则
  {
    email: [required('邮箱不能为空'), email('请输入有效的邮箱地址')],
    password: [required('密码不能为空'), minLength(6, '密码长度至少为6个字符')]
  }
);
```

### 3.2 在React组件中使用

```tsx
import React from 'react';
import { useField } from '../utils/validation';

const LoginForm: React.FC = () => {
  // 使用表单存储
  const form = useLoginForm();
  
  // 获取字段属性
  const emailField = useField(form, 'email');
  const passwordField = useField(form, 'password');
  const rememberMeField = useField(form, 'rememberMe');
  
  // 表单提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    const isValid = await form.validateForm();
    if (isValid) {
      console.log('表单提交:', form.values);
      // 处理表单提交...
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>邮箱:</label>
        <input
          type="email"
          value={emailField.value}
          onChange={(e) => emailField.onChange(e.target.value)}
          onBlur={emailField.onBlur}
        />
        {emailField.touched && emailField.error && (
          <div className="error">{emailField.error}</div>
        )}
      </div>
      
      <div>
        <label>密码:</label>
        <input
          type="password"
          value={passwordField.value}
          onChange={(e) => passwordField.onChange(e.target.value)}
          onBlur={passwordField.onBlur}
        />
        {passwordField.touched && passwordField.error && (
          <div className="error">{passwordField.error}</div>
        )}
      </div>
      
      <div>
        <label>
          <input
            type="checkbox"
            checked={rememberMeField.value}
            onChange={(e) => rememberMeField.onChange(e.target.checked)}
          />
          记住我
        </label>
      </div>
      
      <button type="submit">登录</button>
    </form>
  );
};
```

## 4. 高级用法

### 4.1 密码确认验证示例

使用`sameAs`验证器确保两次密码输入一致:

```tsx
import { createValidationStore, required, minLength, sameAs } from '../utils/validation';

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
}

const useRegisterForm = createValidationStore<RegisterForm>(
  {
    username: '',
    password: '',
    confirmPassword: ''
  },
  {
    username: [required('用户名不能为空')],
    password: [required('密码不能为空'), minLength(8, '密码至少需要8个字符')],
    confirmPassword: [
      required('请确认密码'), 
      sameAs<RegisterForm>('password', '两次输入的密码不一致')
    ]
  }
);
```

### 4.2 动态表单示例

处理动态字段和数组:

```tsx
const DynamicForm: React.FC = () => {
  const form = useDynamicForm();
  
  // 添加联系人
  const addContact = () => {
    const contacts = [...form.values.contacts];
    contacts.push({ type: 'email', value: '' });
    form.setFieldValue('contacts', contacts);
  };
  
  // 删除联系人
  const removeContact = (index: number) => {
    const contacts = [...form.values.contacts];
    contacts.splice(index, 1);
    form.setFieldValue('contacts', contacts);
  };
  
  return (
    <form>
      {/* 基本字段 */}
      <div>
        <label>姓名:</label>
        <input {...useField(form, 'name')} />
      </div>
      
      {/* 动态联系人列表 */}
      <div>
        <h3>联系方式</h3>
        {form.values.contacts.map((_, index) => (
          <div key={index}>
            <select 
              value={form.values.contacts[index].type}
              onChange={(e) => {
                const contacts = [...form.values.contacts];
                contacts[index].type = e.target.value;
                form.setFieldValue('contacts', contacts);
              }}
            >
              <option value="email">邮箱</option>
              <option value="phone">电话</option>
            </select>
            <input 
              value={form.values.contacts[index].value}
              onChange={(e) => {
                const contacts = [...form.values.contacts];
                contacts[index].value = e.target.value;
                form.setFieldValue('contacts', contacts);
              }}
              onBlur={() => form.validateField(`contacts.${index}.value`)}
            />
            <button type="button" onClick={() => removeContact(index)}>删除</button>
          </div>
        ))}
        <button type="button" onClick={addContact}>添加联系方式</button>
      </div>
    </form>
  );
};
```

## 5. 嵌套字段验证

验证系统支持嵌套对象验证:

```typescript
interface ProfileForm {
  personal: {
    firstName: string;
    lastName: string;
  };
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
}

const useProfileForm = createValidationStore<ProfileForm>(
  {
    personal: { firstName: '', lastName: '' },
    address: { street: '', city: '', zipCode: '' }
  },
  {
    'personal.firstName': [required('名不能为空')],
    'personal.lastName': [required('姓不能为空')],
    'address.city': [required('城市不能为空')],
    'address.zipCode': [pattern(/^\d{6}$/, '请输入有效的邮政编码')]
  }
);
```

## 6. API参考

### 6.1 `createValidationStore`

创建表单验证存储。

```typescript
createValidationStore<T>(
  initialValues: T, 
  validationRules: ValidationRules = {}
): ValidationStore<T>
```

### 6.2 `useField`

为表单字段创建属性对象。

```typescript
useField<T, K extends keyof T>(
  store: ValidationStore<T>,
  fieldName: K
): FieldProps<T, K>
```

返回:
```typescript
{
  name: K;
  value: T[K];
  onChange: (value: T[K]) => void;
  onBlur: () => void;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
}
```

### 6.3 验证器函数

所有验证器函数返回`ValidationRule`类型:

```typescript
type ValidationRule<T = any> = (value: T, allValues?: Record<string, any>) => string | null;
```

## 7. 性能优化建议

### 7.1 大型表单优化

- **分段表单**: 将大型表单拆分为多个步骤或部分
- **懒加载验证**: 仅在需要时进行验证
- **避免过度渲染**: 使用`React.memo`来避免不必要的重新渲染
- **限制验证触发**: 使用节流(throttle)或防抖(debounce)限制验证频率

### 7.2 示例: 优化大型表单

```tsx
import React, { useMemo } from 'react';
import { throttle } from 'lodash';

const ComplexForm: React.FC = () => {
  const form = useComplexForm();
  
  // 节流验证函数
  const throttledValidate = useMemo(
    () => throttle((field) => form.validateField(field), 300),
    [form]
  );
  
  // 将复杂表单分为多个部分
  return (
    <form>
      <FormSection1 form={form} validateField={throttledValidate} />
      <FormSection2 form={form} validateField={throttledValidate} />
      <FormSection3 form={form} validateField={throttledValidate} />
    </form>
  );
};

// 使用React.memo优化表单部分组件
const FormSection1 = React.memo(({ form, validateField }) => {
  return (
    <div>
      {/* 表单字段... */}
    </div>
  );
});
```

## 8. 最佳实践

1. **将验证规则与组件分离**: 在组件外定义验证规则以提高可重用性
2. **使用类型**: 充分利用TypeScript类型检查
3. **表单分组**: 将大型表单分解为逻辑组件
4. **错误显示策略**: 仅在字段被触摸后显示错误
5. **使用自定义钩子**: 创建特定领域的表单钩子
6. **测试验证规则**: 单独测试复杂的验证规则

## 9. 故障排除

### 常见问题与解决方案

1. **字段未验证**
   - 确保在`validationRules`中为字段定义了规则
   - 检查`validateForm`方法是否被调用

2. **错误消息不显示**
   - 确保字段已被标记为`touched`
   - 检查错误条件: `field.touched && field.error`

3. **嵌套字段验证不工作**
   - 确保使用正确的点路径语法: `'address.city'`
   - 确保嵌套对象在初始值中存在

4. **表单值不更新**
   - 确保正确调用了`onChange`处理程序
   - 检查是否正确使用了`setFieldValue`

5. **类型错误**
   - 确保表单类型接口正确定义
   - 使用泛型参数: `createValidationStore<MyFormType>`

## 10. 示例项目

查看完整示例项目，了解更多高级用例和实践:

- **基本表单**: `src/utils/validationExamples.tsx`
- **测试**: `src/tests/validationTests.ts`
- **高级用例**: `src/examples/optimizedForm.tsx` 