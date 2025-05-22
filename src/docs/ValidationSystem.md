# 表单验证系统使用指南

## 1. 简介

表单验证系统是一个灵活、可扩展的解决方案，旨在简化表单处理和验证逻辑。该系统与状态管理工具(Zustand)无缝集成，提供了直观的API和丰富的验证规则，适用于从简单的登录表单到复杂的多步骤表单的各种场景。

### 核心特性

- **Zustand集成**：与Zustand状态管理库完美集成
- **声明式验证规则**：以声明方式定义验证规则
- **高度可组合**：验证器可以组合使用
- **丰富的验证器库**：内置多种常用验证器
- **自定义验证器支持**：轻松创建自定义验证逻辑
- **类型安全**：完全支持TypeScript类型推断
- **嵌套字段支持**：支持验证嵌套对象和数组
- **性能优化**：针对大型复杂表单进行了优化

## 2. 基本使用

### 2.1 创建表单验证存储

```tsx
import { createValidationStore, required, email, minLength } from '../utils/validation';

// 定义表单数据接口
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

// 创建表单验证存储
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

### 2.2 在组件中使用

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
    
    // 验证并提交
    form.submitForm(
      // 成功回调
      (values) => {
        console.log('登录成功:', values);
        // 这里可以添加登录逻辑
      },
      // 错误回调
      (errors) => {
        console.error('表单验证失败:', errors);
      }
    );
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

## 3. 内置验证器

系统提供了多种内置验证器，满足常见的验证需求：

| 验证器 | 描述 | 用例 |
|--------|------|------|
| `required` | 验证字段不为空 | `required('字段不能为空')` |
| `email` | 验证有效的邮箱格式 | `email('请输入有效的邮箱地址')` |
| `minLength` | 验证最小长度 | `minLength(8, '最少需要8个字符')` |
| `maxLength` | 验证最大长度 | `maxLength(100, '最多允许100个字符')` |
| `pattern` | 验证正则表达式 | `pattern(/^\d+$/, '只允许数字')` |
| `range` | 验证数值范围 | `range(1, 100, '值必须在1-100之间')` |
| `url` | 验证有效的URL | `url('请输入有效的网址')` |
| `phone` | 验证电话号码 | `phone('请输入有效的电话号码')` |
| `match` | 验证与特定值匹配 | `match('yes', '必须接受条款')` |
| `sameAs` | 验证与另一字段值相同 | `sameAs('password', '两次输入的密码不一致')` |
| `custom` | 自定义验证逻辑 | `custom(value => value % 2 === 0, '必须是偶数')` |

## 4. 高级功能

### 4.1 嵌套字段验证

支持对嵌套对象和数组进行验证：

```tsx
interface UserForm {
  basicInfo: {
    firstName: string;
    lastName: string;
  };
  contacts: Array<{
    type: string;
    value: string;
  }>;
}

const useUserForm = createValidationStore<UserForm>(
  {
    basicInfo: {
      firstName: '',
      lastName: ''
    },
    contacts: [{ type: 'email', value: '' }]
  },
  {
    'basicInfo.firstName': [required('名不能为空')],
    'basicInfo.lastName': [required('姓不能为空')],
    'contacts.*.value': [required('联系方式不能为空')]
  }
);
```

### 4.2 动态验证规则

根据表单状态动态更改验证规则：

```tsx
const form = useUserForm();

// 更新验证规则
React.useEffect(() => {
  if (form.values.userType === 'business') {
    form.setRules({
      ...form.rules,
      businessName: [required('企业名称不能为空')],
      taxId: [required('税号不能为空')]
    });
  } else {
    // 移除企业相关验证
    const { businessName, taxId, ...restRules } = form.rules;
    form.setRules(restRules);
  }
}, [form.values.userType]);
```

### 4.3 自定义验证器

创建自定义验证器来满足特定的验证需求：

```tsx
import { Validator } from '../utils/validation';

// 创建自定义验证器 - 验证是否为中国身份证号
export const idCard = (message?: string): Validator => {
  return (value) => {
    const valid = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(value);
    return {
      valid,
      message: valid ? undefined : message || '请输入有效的身份证号码'
    };
  };
};

// 使用自定义验证器
const useProfileForm = createValidationStore<ProfileForm>(
  { idCardNumber: '' },
  { idCardNumber: [required('身份证号不能为空'), idCard()] }
);
```

## 5. 性能优化

### 5.1 大型表单优化策略

对于大型复杂表单，可以采用以下策略优化性能：

1. **分步验证**：仅验证当前显示的字段
2. **懒加载验证规则**：按需加载验证规则
3. **组件分割**：将大型表单拆分为独立组件
4. **使用memo**：防止不必要的重新渲染
5. **验证节流**：限制验证频率

示例：分步表单实现

```tsx
const ComplexForm = () => {
  const form = useComplexForm();
  const [step, setStep] = useState(0);
  
  // 验证当前步骤
  const validateCurrentStep = async () => {
    let fields = [];
    switch (step) {
      case 0:
        fields = ['firstName', 'lastName', 'email'];
        break;
      case 1:
        fields = ['address.street', 'address.city', 'address.country'];
        break;
      // ...其他步骤
    }
    
    // 仅验证当前步骤的字段
    let isValid = true;
    for (const field of fields) {
      const errors = await form.validateField(field);
      if (errors.length > 0) isValid = false;
      form.setFieldTouched(field);
    }
    return isValid;
  };
  
  const nextStep = async () => {
    if (await validateCurrentStep()) {
      setStep(s => s + 1);
    }
  };
  
  // 渲染当前步骤表单
  return (
    <form>
      {/* 步骤指示器 */}
      {/* 根据当前步骤渲染相应表单部分 */}
      {step === 0 && <PersonalInfoSection form={form} />}
      {step === 1 && <AddressSection form={form} />}
      {/* ...其他步骤 */}
      
      <div>
        {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)}>上一步</button>}
        {step < totalSteps - 1 ? (
          <button type="button" onClick={nextStep}>下一步</button>
        ) : (
          <button type="submit">提交</button>
        )}
      </div>
    </form>
  );
};
```

## 6. 与其他功能集成

### 6.1 与API集成

```tsx
const LoginForm = () => {
  const form = useLoginForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    form.submitForm(
      async (values) => {
        try {
          setIsSubmitting(true);
          // 调用API
          const response = await apiClient.post('/auth/login', values);
          // 处理成功登录
        } catch (error) {
          // 处理API错误
          if (error.response?.data?.errors) {
            // 服务器返回的字段错误
            form.setErrors(error.response.data.errors);
          } else {
            // 一般错误
            console.error('登录失败:', error);
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '登录中...' : '登录'}
      </button>
    </form>
  );
};
```

### 6.2 与国际化集成

```tsx
import { useTranslation } from 'react-i18next';

const RegistrationForm = () => {
  const { t } = useTranslation();
  
  // 使用翻译文本创建验证规则
  const validationRules = {
    username: [
      required(t('validation.required', { field: t('fields.username') })),
      minLength(3, t('validation.minLength', { field: t('fields.username'), count: 3 }))
    ],
    email: [
      required(t('validation.required', { field: t('fields.email') })),
      email(t('validation.email'))
    ]
    // ...其他验证规则
  };
  
  const useRegistrationForm = createValidationStore(
    { username: '', email: '', password: '' },
    validationRules
  );
  
  // 使用表单存储
  const form = useRegistrationForm();
  
  // ...表单逻辑和渲染
};
```

## 7. 最佳实践

### 7.1 组织结构

推荐的表单验证代码组织结构：

```
src/
  utils/
    validation.ts          # 核心验证系统
  validation/
    validators.ts          # 常用验证器
    formValidation.ts      # 表单验证工具
    hooks/
      useForm.ts           # 表单Hook
    examples/
      loginForm.tsx        # 表单示例
    tests/
      validationTests.ts   # 验证系统测试
```

### 7.2 验证提示最佳实践

- **即时反馈**：用户离开字段后立即显示错误
- **清晰提示**：错误信息应具体、明确指出问题
- **可恢复性**：提供修复错误的指导
- **一致性**：保持全应用的错误提示风格一致

### 7.3 表单数据处理

```tsx
// 创建表单处理工具
const createFormHandler = <T extends Record<string, any>>(initialValues: T) => {
  const form = createValidationStore<T>(initialValues, {});
  
  return {
    form,
    // 创建API提交函数
    createSubmitHandler: (endpoint: string, options?: {
      onSuccess?: (data: any) => void,
      onError?: (error: any) => void
    }) => {
      return async () => {
        const isValid = await form.validateForm();
        if (!isValid) return;
        
        try {
          // 调用API
          const response = await apiClient.post(endpoint, form.values);
          options?.onSuccess?.(response.data);
          return response.data;
        } catch (error) {
          // 处理API错误
          if (error.response?.data?.errors) {
            form.setErrors(error.response.data.errors);
          }
          options?.onError?.(error);
          throw error;
        }
      };
    }
  };
};
```

### 7.4 复杂表单组合

对于复杂表单，可以组合多个较小的表单存储：

```tsx
// 创建子表单
const usePersonalInfoForm = createValidationStore<PersonalInfo>(
  { firstName: '', lastName: '', email: '' },
  { /* 验证规则 */ }
);

const useAddressForm = createValidationStore<Address>(
  { street: '', city: '', country: '' },
  { /* 验证规则 */ }
);

// 组合为主表单
const ProfileForm = () => {
  const personalForm = usePersonalInfoForm();
  const addressForm = useAddressForm();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证所有子表单
    const isPersonalValid = await personalForm.validateForm();
    const isAddressValid = await addressForm.validateForm();
    
    if (isPersonalValid && isAddressValid) {
      // 组合数据提交
      const profileData = {
        ...personalForm.values,
        address: addressForm.values
      };
      // 提交数据
      console.log('提交数据:', profileData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PersonalInfoSection form={personalForm} />
      <AddressSection form={addressForm} />
      <button type="submit">保存</button>
    </form>
  );
};
```

## 8. 故障排除

### 常见问题与解决方法

1. **验证不触发**
   - 检查`validateOnChange`和`validateOnBlur`选项
   - 确保正确调用了`setFieldTouched`

2. **嵌套字段验证失败**
   - 确保使用正确的路径格式，如`'address.street'`
   - 检查嵌套对象初始值是否正确

3. **动态字段验证**
   - 使用`setRules`动态更新验证规则
   - 对数组字段使用通配符路径，如`'contacts.*.email'`

4. **表单重置**
   - 使用`resetForm()`重置整个表单
   - 使用`setValues(initialValues)`重置为初始值

5. **性能问题**
   - 检查是否有过多的渲染
   - 考虑使用`React.memo`优化组件
   - 实现分段式表单和验证

## 9. API参考

### `createValidationStore`

创建表单验证存储。

参数:
- `initialValues`: 表单初始值
- `validationRules`: 验证规则
- `options`: 配置选项

返回:
- Zustand store hook

### `useField`

创建表单字段属性。

参数:
- `form`: 表单存储
- `name`: 字段名称

返回:
- 字段属性对象，包含`value`, `onChange`, `onBlur`, `error`, `touched`等

### 验证器函数

所有验证器都返回一个验证函数，可接收自定义错误消息参数。

例如:
- `required(message?: string)`
- `email(message?: string)`
- `minLength(length: number, message?: string)`

## 10. 测试表单验证

### 单元测试

```tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { createValidationStore, required, email } from '../utils/validation';

describe('表单验证测试', () => {
  test('创建表单存储', () => {
    const { result } = renderHook(() => createValidationStore(
      { email: '', password: '' },
      {
        email: [required(), email()],
        password: [required()]
      }
    )());
    
    expect(result.current.values).toEqual({ email: '', password: '' });
    expect(result.current.validation.fields.email.errors).toEqual([]);
  });
  
  test('字段值更新', () => {
    const { result } = renderHook(() => createValidationStore(
      { email: '' },
      { email: [required(), email()] }
    )());
    
    act(() => {
      result.current.setFieldValue('email', 'invalid');
    });
    
    expect(result.current.values.email).toBe('invalid');
    expect(result.current.validation.fields.email.errors[0]).toBe('请输入有效的邮箱地址');
    
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
    });
    
    expect(result.current.validation.fields.email.errors).toEqual([]);
  });
});
```

### 集成测试

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from '../components/LoginForm';

describe('登录表单集成测试', () => {
  test('显示错误信息', async () => {
    render(<LoginForm />);
    
    // 获取输入字段
    const emailInput = screen.getByLabelText(/邮箱/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    const submitButton = screen.getByRole('button', { name: /登录/i });
    
    // 先触发验证
    fireEvent.click(submitButton);
    
    // 检查错误信息
    expect(await screen.findByText(/邮箱不能为空/i)).toBeInTheDocument();
    expect(screen.getByText(/密码不能为空/i)).toBeInTheDocument();
    
    // 输入无效邮箱
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);
    
    // 检查邮箱错误
    expect(await screen.findByText(/请输入有效的邮箱地址/i)).toBeInTheDocument();
    
    // 输入有效值
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.blur(emailInput);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.blur(passwordInput);
    
    // 重新提交
    fireEvent.click(submitButton);
    
    // 检查错误信息消失
    expect(screen.queryByText(/邮箱不能为空/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/密码不能为空/i)).not.toBeInTheDocument();
  });
});
```

## 总结

表单验证系统提供了一种灵活、可扩展的方式来处理表单验证逻辑，与Zustand状态管理无缝集成。通过遵循本文档中的指南和最佳实践，您可以轻松创建从简单到复杂的各种表单，同时确保良好的用户体验和代码质量。 