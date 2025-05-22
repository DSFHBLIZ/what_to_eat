# 开发者指南

本文档为开发者提供详细的使用指南，包括每个核心功能的使用方式、示例代码和最佳实践。

## 目录

1. [核心架构概览](#1-核心架构概览)
2. [状态管理 - Store](#2-状态管理---store)
3. [API层抽象](#3-api层抽象)
4. [表单验证系统](#4-表单验证系统)
5. [国际化与主题](#5-国际化与主题)
6. [性能优化最佳实践](#6-性能优化最佳实践)
7. [故障排除](#7-故障排除)

## 1. 核心架构概览

系统采用模块化设计，主要包含四个核心子系统：

- **状态管理**：基于Zustand，支持持久化和事件通知
- **API层**：统一的API客户端，支持缓存、重试和离线操作
- **表单验证**：集成状态管理的表单系统，支持多语言验证
- **国际化与主题**：用户界面首选项管理，持久化用户设置

所有功能通过`src/core/index.ts`统一导出，提供简洁一致的API。

## 2. 状态管理 - Store

### 基本使用

```typescript
import { createStore } from '../core';

// 创建状态存储
const useCounterStore = createStore(
  'counter', // 存储唯一标识符
  {
    // 初始状态
    count: 0,
    
    // 操作方法
    increment: () => set(state => ({ count: state.count + 1 })),
    decrement: () => set(state => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 })
  },
  {
    // 选项
    persist: true, // 启用持久化
    eventEnabled: true // 启用事件通知
  }
);

// 在组件中使用
function Counter() {
  const { count, increment, decrement } = useCounterStore();
  
  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

### 异步操作

```typescript
const useUserStore = createStore(
  'user',
  {
    user: null,
    loading: false,
    error: null,
    
    // 异步操作
    fetchUser: async (id) => {
      set({ loading: true, error: null });
      try {
        const response = await api.get(`/users/${id}`);
        set({ user: response.data, loading: false });
      } catch (err) {
        set({ error: err.message, loading: false });
      }
    },
    
    logout: () => set({ user: null })
  },
  { persist: true }
);
```

### 监听状态变化

```typescript
// 监听状态变化
const unsubscribe = useUserStore.subscribe(
  state => state.user, // 选择器
  (user) => {
    console.log('用户状态已更改:', user);
  }
);

// 取消监听
unsubscribe();
```

## 3. API层抽象

### 基本请求

```typescript
import { api } from '../core';

// GET请求
async function fetchPosts() {
  try {
    const response = await api.get('/posts');
    return response.data;
  } catch (error) {
    console.error('获取文章失败:', error);
    return [];
  }
}

// POST请求
async function createPost(post) {
  try {
    const response = await api.post('/posts', post);
    return response.data;
  } catch (error) {
    console.error('创建文章失败:', error);
    throw error;
  }
}
```

### 缓存请求

```typescript
// 带缓存的请求
async function fetchCachedCategories() {
  return api.get('/categories', {
    cache: true,
    cacheKey: 'categories-list'
  });
}

// 清除特定缓存
function clearCategoriesCache() {
  api.getCacheManager().delete('categories-list');
}
```

### 注册API配置

```typescript
// 注册API配置
api.registerApi('getRecipes', {
  endpoint: '/recipes',
  method: 'GET',
  cacheStrategy: CacheStrategy.CACHE_FIRST,
  cacheTtl: 10, // 10分钟
  transformResponse: (data) => {
    // 转换响应数据
    return data.map(recipe => ({
      id: recipe.id,
      title: recipe.菜名,
      ingredients: recipe.食材.map(i => i.名称)
    }));
  }
});

// 使用注册的API
async function fetchRecipes(params) {
  const response = await api.callApi('getRecipes', params);
  return response.data;
}
```

## 4. 表单验证系统

### 创建表单

```typescript
import { createFormStore, validators } from '../core';

// 创建登录表单
const useLoginForm = createFormStore({
  // 初始值
  initialValues: {
    username: '',
    password: '',
    rememberMe: false
  },
  
  // 验证规则
  validators: {
    username: [
      validators.required('用户名不能为空'),
      validators.minLength(3, '用户名至少3个字符')
    ],
    password: [
      validators.required('密码不能为空'),
      validators.minLength(6, '密码至少6个字符')
    ]
  },
  
  // 字段标签
  labels: {
    username: '用户名',
    password: '密码',
    rememberMe: '记住我'
  },
  
  // 自动验证
  autoValidate: {
    onChange: true,
    onBlur: true,
    debounceMs: 300
  },
  
  // 表单名称
  formName: 'loginForm',
  
  // 提交处理
  onSubmit: async (values) => {
    // 处理表单提交
    try {
      await api.post('/login', values);
      // 登录成功
    } catch (error) {
      // 登录失败
    }
  }
});
```

### 在组件中使用

```typescript
function LoginForm() {
  const {
    getFieldProps,
    submitForm,
    resetForm,
    isValid,
    isSubmitting,
    getErrors
  } = useLoginForm();
  
  const usernameProps = getFieldProps('username');
  const passwordProps = getFieldProps('password');
  const rememberMeProps = getFieldProps('rememberMe');
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
      <div>
        <label>用户名</label>
        <input
          type="text"
          value={usernameProps.value}
          onChange={(e) => usernameProps.onChange(e.target.value)}
          onBlur={usernameProps.onBlur}
        />
        {usernameProps.error && <div className="error">{usernameProps.error}</div>}
      </div>
      
      <div>
        <label>密码</label>
        <input
          type="password"
          value={passwordProps.value}
          onChange={(e) => passwordProps.onChange(e.target.value)}
          onBlur={passwordProps.onBlur}
        />
        {passwordProps.error && <div className="error">{passwordProps.error}</div>}
      </div>
      
      <div>
        <label>
          <input
            type="checkbox"
            checked={rememberMeProps.value}
            onChange={(e) => rememberMeProps.onChange(e.target.checked)}
          />
          记住我
        </label>
      </div>
      
      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? '登录中...' : '登录'}
      </button>
      <button type="button" onClick={() => resetForm()}>重置</button>
    </form>
  );
}
```

### 自定义验证器

```typescript
// 定义自定义验证器
const customValidators = {
  isPhoneNumber: (message: string = '请输入有效的手机号码'): Validator<string> => {
    return (value) => {
      const valid = /^1[3-9]\d{9}$/.test(value);
      return { valid, message: valid ? '' : message };
    };
  },
  
  isEqual: (compareValue: any, message: string): Validator<any> => {
    return (value) => {
      const valid = value === compareValue;
      return { valid, message: valid ? '' : message };
    };
  }
};

// 使用自定义验证器
const useRegisterForm = createFormStore({
  initialValues: {
    phone: '',
    password: '',
    confirmPassword: ''
  },
  validators: {
    phone: [
      validators.required('手机号不能为空'),
      customValidators.isPhoneNumber()
    ],
    password: [
      validators.required('密码不能为空'),
      validators.minLength(8, '密码至少8个字符')
    ],
    confirmPassword: [
      validators.required('请确认密码'),
      (value, label) => {
        const password = useRegisterForm.getState().fields.password.value;
        return {
          valid: value === password,
          message: value !== password ? '两次输入的密码不一致' : ''
        };
      }
    ]
  }
});
```

## 5. 国际化与主题

### 初始化

```typescript
import { initializeCore } from '../core';

// 在应用启动时初始化
async function initApp() {
  await initializeCore();
  // 渲染应用...
}
```

### 使用国际化

```typescript
import { useI18nStore } from '../core';

function LanguageSwitcher() {
  const { currentLanguage, availableLanguages, changeLanguage, t } = useI18nStore();
  
  return (
    <div>
      <h2>{t('language.select')}</h2>
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
      >
        {availableLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      
      <p>{t('language.current', { language: currentLanguage })}</p>
    </div>
  );
}
```

### 使用主题

```typescript
import { usePreferenceTheme } from '../theme/themeStore';

function ThemeSwitcher() {
  const {
    isDarkMode,
    preference,
    fontSize,
    enableAnimations,
    highContrast,
    setThemePreference,
    setFontSize,
    setEnableAnimations,
    setHighContrast
  } = usePreferenceTheme();
  
  return (
    <div>
      <div>
        <h3>主题模式</h3>
        <div>
          <label>
            <input
              type="radio"
              value="light"
              checked={preference === 'light'}
              onChange={() => setThemePreference('light')}
            />
            浅色
          </label>
          <label>
            <input
              type="radio"
              value="dark"
              checked={preference === 'dark'}
              onChange={() => setThemePreference('dark')}
            />
            深色
          </label>
          <label>
            <input
              type="radio"
              value="system"
              checked={preference === 'system'}
              onChange={() => setThemePreference('system')}
            />
            跟随系统
          </label>
        </div>
      </div>
      
      <div>
        <h3>字体大小</h3>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value as any)}
        >
          <option value="small">小</option>
          <option value="medium">中</option>
          <option value="large">大</option>
        </select>
      </div>
      
      <div>
        <h3>高对比度</h3>
        <label>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
          />
          启用高对比度
        </label>
      </div>
      
      <div>
        <h3>动画效果</h3>
        <label>
          <input
            type="checkbox"
            checked={enableAnimations}
            onChange={(e) => setEnableAnimations(e.target.checked)}
          />
          启用动画效果
        </label>
      </div>
    </div>
  );
}
```

### 用户首选项管理

```typescript
import { preferenceManager } from '../core';

// 保存自定义首选项
async function saveCustomPreferences() {
  await preferenceManager.savePreferences({
    fontSize: 'large',
    themeColor: 'purple',
    enableAnimations: false
  });
}

// 重置所有首选项
async function resetAllPreferences() {
  await preferenceManager.resetPreferences();
}

// 监听首选项变化
const unsubscribe = preferenceManager.subscribeToChanges((preferences) => {
  console.log('首选项已更改:', preferences);
});

// 取消监听
unsubscribe();
```

## 6. 性能优化最佳实践

### 状态管理优化

- **状态分割**：将全局状态拆分为多个独立的store，减少不必要的重渲染
- **选择器优化**：使用精确的选择器订阅状态变化
- **合理使用持久化**：只持久化必要的状态，避免性能开销

```typescript
// 状态分割示例
const useUIStore = createStore('ui', { /* UI相关状态 */ });
const useAuthStore = createStore('auth', { /* 认证相关状态 */ });
const useDataStore = createStore('data', { /* 数据相关状态 */ });

// 精确选择器
useUIStore.subscribe(
  state => state.sidebarOpen, // 只监听侧边栏状态
  (open) => {
    // 处理侧边栏状态变化
  }
);
```

### API层优化

- **合理使用缓存**：对不频繁变化的数据使用缓存
- **批量请求**：使用Promise.all合并多个请求
- **取消重复请求**：避免重复的相同请求

```typescript
// 合并多个请求
async function fetchDashboardData() {
  try {
    const [
      userResponse,
      postsResponse,
      statsResponse
    ] = await Promise.all([
      api.get('/user'),
      api.get('/posts', { cache: true, cacheKey: 'posts-list' }),
      api.get('/stats')
    ]);
    
    return {
      user: userResponse.data,
      posts: postsResponse.data,
      stats: statsResponse.data
    };
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return null;
  }
}
```

### 表单性能优化

- **使用防抖验证**：避免频繁验证导致的性能问题
- **局部表单状态**：对简单表单使用局部状态而非全局状态

```typescript
// 使用防抖验证
const useSearchForm = createFormStore({
  initialValues: { query: '' },
  autoValidate: {
    onChange: true,
    debounceMs: 500 // 500毫秒防抖
  }
});
```

## 7. 故障排除

### 常见错误与解决方案

#### 状态管理问题

**问题**：组件没有响应状态更新
**解决方案**：
- 确保正确订阅了状态：`const { count } = useCounterStore()`
- 检查更新逻辑是否正确：使用`set(state => {...})`而非直接修改状态

#### API请求问题

**问题**：请求失败但没有错误提示
**解决方案**：
- 确保正确处理了错误：使用try/catch捕获错误
- 开启调试模式：`new UnifiedApiClient({ debug: true })`

#### 表单验证问题

**问题**：表单验证没有触发
**解决方案**：
- 确保正确设置了验证规则
- 检查`autoValidate`配置是否启用

#### 国际化问题

**问题**：语言切换后文本没有更新
**解决方案**：
- 确保所有文本都使用了`t('key')`函数
- 检查语言包中是否有对应的翻译项

### 调试技巧

- 使用Redux DevTools查看状态变化
- 检查API请求日志：开启`debug: true`选项
- 查看localStorage中的缓存数据
- 使用浏览器开发者工具查看网络请求

```typescript
// 临时日志调试
createStore(
  'debug',
  {
    data: null,
    setData: (data) => {
      console.log('正在更新数据:', data);
      set({ data });
      console.log('数据已更新');
    }
  }
);
``` 