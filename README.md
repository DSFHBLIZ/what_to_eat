# 冰箱里有什么？- 智能菜谱推荐

基于Next.js和Supabase开发的食谱推荐网站，可以根据食材、口味、难度、菜系、烹饪方式和饮食限制等条件筛选菜谱。

## 技术栈

- 前端：Next.js + React + TailwindCSS
- 后端：Supabase (PostgreSQL数据库 + API)
- 部署：Vercel

## 功能特点

- 从Supabase动态加载菜谱数据
- 按照食材、口味、难度等条件筛选菜谱
- 菜谱详情页展示完整的烹饪步骤，支持打印
- 收藏喜欢的菜谱
- 响应式设计，适配各种设备
- 多维度搜索：支持食材、菜系、烹饪方式和饮食限制多维度搜索
- 反向搜索：通过已有食材快速查找可做的菜谱
- SEO优化：支持网站地图、元数据和Open Graph数据

## 本地开发

1. 克隆代码库
```bash
git clone <repository-url>
cd <project-folder>
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
在项目根目录创建`.env.local`文件，添加以下内容：
```
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

4. 启动开发服务器
```bash
npm run dev
```

## Supabase设置

### 数据库表结构

在Supabase中创建`CHrecipes`表，包含以下字段：

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | uuid | 主键 |
| 菜名 | text | 菜谱名称 |
| 菜系 | text | 菜系类别 |
| 口味特点 | jsonb | 口味特点 |
| 烹饪技法 | jsonb | 烹饪方式 |
| 食材 | jsonb | 食材列表 |
| 调料 | jsonb | 调料列表 |
| 步骤 | jsonb | 烹饪步骤 |
| 注意事项 | jsonb | 烹饪小贴士 |
| 烹饪时间 | jsonb | 烹饪时间(分钟) |
| 烹饪难度 | jsonb | 难度等级 |
| 是否无麸质 | boolean | 标记菜谱是否无麸质 |
| 是否清真 | boolean | 标记菜谱是否符合清真要求 |
| 是否纯素 | boolean | 标记菜谱是否适合纯素食者 |
| 调料分类 | jsonb | 调料的分类信息 |
| a食材分类 | jsonb | 食材的分类信息 |

### 示例数据导入

1. 在Supabase控制台中，进入SQL编辑器
2. 使用提供的SQL脚本导入示例数据

## 部署到Vercel

1. 在Vercel上导入GitHub项目
2. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 部署项目

### 解决Vercel与GitHub Webhook问题

如果遇到GitHub Webhook 404错误问题，请按照以下步骤解决：

1. **重新创建Vercel项目**
   - 在Vercel控制台点击"Add New"按钮
   - 选择"Project"
   - 选择GitHub作为代码源
   - 授权并选择已有的GitHub仓库
   - 保持默认设置，点击"Deploy"

2. **更新环境变量**
   - 在项目设置中找到"Environment Variables"
   - 添加以下环境变量：
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://ijwimydlumbolmpnmezt.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqd2lteWRsdW1ib2xtcG5tZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NjExMDUsImV4cCI6MjA1ODAzNzEwNX0.ynhuFYG6dkoxDgEyDwEnWdZ-DRWx3illLZGyYwn_UnA
     ```

3. **重新部署**
   - 触发新的部署或点击"Redeploy"

4. **检查webhook状态**
   - 在GitHub仓库设置中
   - 选择"Settings" > "Webhooks"
   - 确认Vercel webhook状态正常（绿色勾号）
   - 如果状态异常，点击webhook查看详情并检查失败原因

5. **手动设置webhook（如需）**
   - 如自动webhook失效，可在GitHub仓库设置中
   - 选择"Settings" > "Webhooks" > "Add webhook"
   - Payload URL填写: `https://api.vercel.com/v1/integrations/github/webhook`
   - Content type选择: `application/json`
   - 事件选择: `Just the push event`
   - 勾选"Active"并点击"Add webhook"

如果问题仍未解决，可以删除旧项目并重新创建一个新的Vercel项目，重新连接GitHub仓库。

## 调试页面

- `/debug/supabase-test` - 测试Supabase连接
- `/debug` - 监控数据加载过程

## 性能优化

本项目包含多项性能优化措施：

1. **图像优化**：使用next/image进行图像优化，支持WebP和AVIF格式
2. **代码分割**：自动的代码分割和懒加载
3. **性能监控**：内置性能指标收集

### 运行性能检查和优化

```bash
# 在Windows上
node scripts/performance-check.js

# 在Linux/Mac上
chmod +x scripts/performance-check.js
./scripts/performance-check.js
```

## 类型安全系统

为了增强应用的稳定性和性能，本项目实现了全面的类型安全系统：

### 1. 验证缓存系统

通过`validationCache`工具优化大型数据结构的验证性能：

- **结构指纹计算**：使用对象结构进行智能缓存匹配，而不只是简单的字符串比较
- **验证性能监控**：记录验证时间和缓存命中率等统计数据
- **自适应缓存策略**：小数据结构直接验证，大数据结构使用缓存
- **默认值处理**：自动为无效数据提供安全的默认值

示例用法：
```typescript
// 使用验证缓存验证数据
const safeData = validationCache.validate(
  rawData,           // 原始数据
  MySchema,          // Zod验证模式
  defaultValue,      // 默认值
  'ComponentName'    // 组件名称（用于日志）
);
```

### 2. 领域特定验证组件

专为菜谱应用设计的验证组件：

- **RecipeValidator**：提供专门用于菜谱数据的验证逻辑
- **RecipeDetailWithValidation**：安全显示菜谱详情，带有验证和容错处理
- **SearchResultsValidator**：优化搜索结果验证性能，安全处理大量数据

示例用法：
```tsx
// 使用RecipeValidator组件
<RecipeValidator>
  {(validate, validateRecipe) => {
    const result = validateRecipe(data);
    
    if (!result.isValid) {
      return <div>验证错误: {result.errors[0]?.message}</div>;
    }
    
    return <RecipeDisplay recipe={result.fixedData} />;
  }}
</RecipeValidator>
```

### 3. 验证演示页面

可以通过访问`/examples/safe-type-demo`查看类型安全系统的实际效果：

- 查看验证缓存的性能统计
- 测试对有效和无效数据的处理
- 观察缓存命中对性能的影响

### 4. 使用类型安全工具的好处

- **提高应用稳定性**：防止因数据格式问题导致的运行时错误
- **改善用户体验**：即使面对无效数据也能提供有意义的回退方案
- **提升开发效率**：在编码阶段及早发现类型问题
- **优化性能**：减少重复验证的开销，尤其是对大型数据结构

## 浏览器支持

- Chrome (最新的2个版本)
- Firefox (最新的2个版本)
- Safari (最新的2个版本)
- Edge (最新的2个版本)

## 前后端数据映射

前端代码与数据库表结构存在字段名称差异，使用数据映射层进行转换，主要映射关系：

- 前端`Recipe.name` ↔ 数据库`菜名`
- 前端`Recipe.cuisine` ↔ 数据库`菜系`
- 前端`Recipe.flavors` ↔ 数据库`口味特点`
- 前端`Recipe.cookingMethod` ↔ 数据库`烹饪技法`
- 前端`Recipe.difficulty` ↔ 数据库`烹饪难度`
- 前端`Recipe.dietaryRestrictions` ↔ 数据库`是否纯素|是否清真|是否无麸质`

## 许可证

[MIT](LICENSE)

## 数据库配置

### 创建搜索建议SQL函数

为了启用智能搜索建议功能，需要在Supabase中创建一个SQL函数。请按照以下步骤操作：

1. 登录到Supabase控制台
2. 转到SQL编辑器
3. 创建一个新的查询
4. 复制以下SQL代码并执行：

```sql
-- 创建一个函数，用于搜索匹配的食材和调料名称
-- 删除已存在的同名函数(如果存在)
DROP FUNCTION IF EXISTS public.search_ingredients_and_seasonings(search_term text);

-- 创建新函数
CREATE OR REPLACE FUNCTION public.search_ingredients_and_seasonings(search_term text)
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ingredient_name text;
    items_found text[];
    unique_items text[];
BEGIN
    -- 初始化一个空数组用于存储搜索结果
    items_found := '{}';
    
    -- 从食材数组中查找匹配的名称
    FOR ingredient_name IN
        WITH ingredients AS (
            SELECT 
                jsonb_array_elements(食材::jsonb) as ingredient 
            FROM 
                "CHrecipes"
            WHERE 
                食材 IS NOT NULL AND 
                食材::text ILIKE '%' || search_term || '%'
        )
        SELECT 
            ingredient->>'名称' as name
        FROM 
            ingredients
        WHERE 
            ingredient->>'名称' IS NOT NULL AND
            ingredient->>'名称' ILIKE '%' || search_term || '%'
        GROUP BY 
            ingredient->>'名称'
        ORDER BY 
            ingredient->>'名称'
        LIMIT 20
    LOOP
        IF ingredient_name IS NOT NULL AND ingredient_name != '' THEN
            -- 添加到结果数组
            items_found := array_append(items_found, ingredient_name);
        END IF;
    END LOOP;
    
    -- 从调料数组中查找匹配的名称
    FOR ingredient_name IN
        WITH seasonings AS (
            SELECT 
                jsonb_array_elements(调料::jsonb) as seasoning 
            FROM 
                "CHrecipes"
            WHERE 
                调料 IS NOT NULL AND 
                调料::text ILIKE '%' || search_term || '%'
        )
        SELECT 
            seasoning->>'名称' as name
        FROM 
            seasonings
        WHERE 
            seasoning->>'名称' IS NOT NULL AND
            seasoning->>'名称' ILIKE '%' || search_term || '%'
        GROUP BY 
            seasoning->>'名称'
        ORDER BY 
            seasoning->>'名称'
        LIMIT 20
    LOOP
        IF ingredient_name IS NOT NULL AND ingredient_name != '' THEN
            -- 添加到结果数组
            items_found := array_append(items_found, ingredient_name);
        END IF;
    END LOOP;
    
    -- 也搜索菜名
    FOR ingredient_name IN
        SELECT 
            菜名
        FROM 
            "CHrecipes"
        WHERE 
            菜名 IS NOT NULL AND
            菜名 ILIKE '%' || search_term || '%'
        GROUP BY 
            菜名
        ORDER BY 
            菜名
        LIMIT 10
    LOOP
        IF ingredient_name IS NOT NULL AND ingredient_name != '' THEN
            -- 添加到结果数组
            items_found := array_append(items_found, ingredient_name);
        END IF;
    END LOOP;
    
    -- 去重并返回结果
    SELECT array_agg(DISTINCT elem) INTO unique_items FROM unnest(items_found) elem WHERE elem IS NOT NULL;
    
    -- 返回最终结果集
    RETURN QUERY SELECT unnest(unique_items);
END;
$$;

-- 为函数添加注释
COMMENT ON FUNCTION public.search_ingredients_and_seasonings(text) IS '搜索匹配的食材和调料名称，用于关键词搜索建议';

-- 授予匿名用户执行权限
GRANT EXECUTE ON FUNCTION public.search_ingredients_and_seasonings(text) TO anon;
```

5. 确保执行成功，没有错误信息
6. 现在智能搜索建议功能已经启用，当用户在搜索框中输入时将会显示相关的食材和调料建议

# 核心架构融合方案

本文档概述了系统的核心架构，包含状态管理、API层、表单验证和国际化四个核心部分的设计和实现细节。

## 1. 架构整体结构

系统采用模块化设计，将功能划分为相互独立但可协同工作的多个子系统：

```
src/
├── api/               # API层
│   ├── cacheManager.ts    # 缓存管理
│   └── unified/           # 统一API实现
│       ├── apiClient.ts   # API客户端
│       └── types.ts       # API相关类型
├── store/             # 状态管理
│   └── createStore.ts     # 创建状态存储
├── validation/        # 表单验证
│   ├── formValidation.ts  # 基础表单验证
│   └── formValidationExtended.ts  # 扩展表单验证
├── i18n/              # 国际化
│   ├── i18nStore.ts       # 国际化状态
│   └── validationMessages.ts  # 验证消息
├── theme/             # 主题管理
│   └── themeStore.ts      # 主题状态
├── utils/             # 工具函数
│   ├── eventBus.ts        # 事件总线
│   └── preferenceManager.ts  # 首选项管理
└── core/              # 核心集成
    └── index.ts           # 统一导出
```

## 2. 核心子系统详解

### 2.1 状态管理系统

状态管理系统基于Zustand构建，特性包括：

- **增强型Store创建**：通过`createStore.ts`提供通用状态管理模式
- **缓存系统集成**：与`CacheManager`集成，支持状态持久化
- **事件通知机制**：使用`eventBus`进行状态更新通知
- **开发工具支持**：集成Redux Devtools调试支持

核心代码示例：

```typescript
// 创建状态存储
const useCounterStore = createStore(
  'counter', // 存储标识
  {
    count: 0,
    increment: () => set(state => ({ count: state.count + 1 })),
    decrement: () => set(state => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 })
  },
  {
    persist: true, // 启用持久化
    eventEnabled: true // 启用事件通知
  }
);
```

### 2.2 API层抽象

API层提供统一的数据交互接口：

- **统一客户端**：`UnifiedApiClient`集成了原有的`enhancedApiClient`和`httpClient`
- **缓存机制**：支持API响应缓存，提高性能
- **重试机制**：自动重试失败请求
- **事件系统**：通知API请求的各种状态变化

使用示例：

```typescript
// 创建自定义API客户端
const apiClient = new UnifiedApiClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: { 'Content-Type': 'application/json' },
  retryConfig: { maxRetries: 3, delayMs: 1000 }
});

// 使用默认客户端
const { data, error } = await api.get('/recipes', {
  params: { cuisine: 'italian' },
  cache: true, // 启用缓存
  cacheKey: 'italian-recipes'
});
```

### 2.3 表单验证系统

表单验证系统提供完整的表单状态管理和验证：

- **集成状态管理**：与Zustand集成管理表单状态
- **国际化支持**：验证错误消息支持多语言
- **丰富验证规则**：内置常用验证规则集
- **防抖处理**：输入验证支持防抖处理

使用示例：

```typescript
// 创建表单存储
const useLoginForm = createFormStore({
  initialValues: { username: '', password: '' },
  validators: {
    username: [validators.required('用户名不能为空')],
    password: [
      validators.required('密码不能为空'),
      validators.minLength(6, '密码至少6位')
    ]
  },
  autoValidate: { onChange: true, debounceMs: 300 },
  formName: 'loginForm',
  onSubmit: async (values) => {
    // 处理表单提交
  }
});

// 在组件中使用
const { getFieldProps, isValid, submitForm } = useLoginForm();
```

### 2.4 国际化与主题

国际化与主题系统提供用户界面定制：

- **语言切换**：支持多语言切换，自动加载语言包
- **主题管理**：支持明暗主题与颜色方案切换
- **首选项持久化**：通过`preferenceManager`保存设置
- **系统事件通知**：通过事件总线通知变更

使用示例：

```typescript
// 切换语言
const { changeLanguage } = useI18nStore();
await changeLanguage('en-US');

// 切换主题
const { setThemePreference } = usePreferenceTheme();
setThemePreference('dark');

// 保存首选项
await preferenceManager.savePreferences({
  language: 'en-US',
  themePreference: 'dark'
});
```

## 3. 系统协同工作流程

系统各部分通过以下方式协同工作：

1. **事件总线**：组件和服务通过`eventBus`收发事件
2. **状态同步**：状态变更通过事件通知其他组件
3. **缓存共享**：缓存管理器在API层和首选项间共享
4. **统一入口**：通过核心导出提供一致访问方式

## 4. 使用指南

### 4.1 核心功能导入

从统一入口导入所需功能：

```typescript
import {
  createStore,            // 状态管理
  api,                    // API客户端
  createFormStore,        // 表单验证
  validators,             // 验证规则
  useI18nStore,           // 国际化
  usePreferenceTheme,     // 主题
  preferenceManager,      // 首选项
  initializeCore          // 核心初始化
} from '../core';
```

### 4.2 应用初始化

在应用启动时初始化核心功能：

```typescript
async function startApp() {
  // 初始化核心系统
  await initializeCore();
  
  // 渲染应用
  ReactDOM.render(<App />, document.getElementById('root'));
}

startApp();
```

## 5. 扩展指南

### 5.1 添加新的状态存储

```typescript
// 创建新的状态存储
const useProductStore = createStore(
  'products',
  {
    items: [],
    loading: false,
    error: null,
    
    fetchProducts: async () => {
      set({ loading: true, error: null });
      try {
        const response = await api.get('/products');
        set({ items: response.data, loading: false });
      } catch (err) {
        set({ error: err.message, loading: false });
      }
    }
  },
  { persist: true }
);
```

### 5.2 扩展表单验证规则

```typescript
// 添加自定义验证规则
const customValidators = {
  isPhoneNumber: (message: string): Validator<string> => {
    return (value, label) => {
      const valid = /^1[3-9]\d{9}$/.test(value);
      return { valid, message: valid ? '' : message };
    };
  }
};

// 使用自定义验证规则
const useContactForm = createFormStore({
  initialValues: { phone: '' },
  validators: {
    phone: [
      validators.required('手机号不能为空'),
      customValidators.isPhoneNumber('请输入有效的手机号码')
    ]
  }
});
```

## 6. 最佳实践

- **状态隔离**：将全局状态与组件状态清晰分离
- **合理缓存**：仅缓存稳定数据，避免缓存频繁变化数据
- **统一风格**：遵循一致的接口和命名风格
- **错误处理**：在每层加入适当错误处理机制
- **遵循类型安全**：始终提供完整类型定义

## 7. 常见问题解答

**Q: 如何处理API错误？**

A: 使用API客户端的错误处理机制：

```typescript
try {
  const { data, error } = await api.get('/endpoint');
  if (error) {
    // 处理错误
    console.error('API错误:', error);
    showErrorNotification(error);
  } else {
    // 处理数据
    processData(data);
  }
} catch (err) {
  // 处理网络异常等未捕获错误
  handleUnexpectedError(err);
}
```

**Q: 如何清除特定缓存？**

A: 使用缓存管理器的删除方法：

```typescript
// 获取API客户端的缓存管理器
const cacheManager = api.getCacheManager();

// 删除特定缓存
cacheManager.delete('recipes-list');

// 清除所有缓存
cacheManager.clear();
```

**Q: 如何创建依赖其他状态的状态存储？**

A: 在状态存储中访问其他存储：

```typescript
const useCartStore = createStore(
  'cart',
  (set, get) => ({
    items: [],
    
    addToCart: (productId, quantity) => {
      // 从产品存储获取产品信息
      const { getProductById } = useProductStore.getState();
      const product = getProductById(productId);
      
      if (product) {
        set(state => ({
          items: [...state.items, { product, quantity }]
        }));
      }
    }
  })
);
```

## 8. 后续开发路线图

- **性能优化**：进一步优化状态更新性能
- **测试覆盖**：增加单元测试和集成测试
- **扩展API抽象**：支持GraphQL和Websocket
- **更多表单特性**：增加复杂表单支持
- **插件系统**：支持模块化扩展

# 简食搜索 (SimpleFoodSearch)

以食材为中心的食谱搜索应用，帮助用户根据家中现有食材快速发现食谱。

## 最新架构整合

为了提升代码质量和可维护性，我们实现了核心架构集成，包括以下主要部分：

### 状态管理

- 实现了基于Zustand的状态管理系统
- 提供了统一的状态存储创建函数
- 支持状态持久化和同步

### API层抽象

- 创建了统一API客户端，提供一致的接口
- 实现了缓存支持，可配置缓存策略
- 提供了错误处理和重试机制

### 表单验证

- 实现了基础表单验证系统
- 创建了增强型表单验证，与状态管理集成
- 支持国际化验证消息

### 国际化

- 实现了多语言支持系统
- 提供了验证消息的国际化
- 支持动态切换语言

### 缓存与持久化

- 实现了通用缓存管理器
- 支持多种存储方式（内存、localStorage、sessionStorage）
- 提供了统一的缓存接口

### 用户偏好管理

- 实现了用户偏好存储和应用
- 支持主题、语言等偏好设置
- 可扩展的偏好管理系统

### 核心统一入口

- 创建了核心功能的统一导出
- 提供初始化函数，集成各个模块
- 简化架构使用方式

## 使用方法

项目模块可以通过核心导出使用：

```typescript
import { initializeCore, createStore, UnifiedApiClient, createFormStore } from 'src/core';

// 初始化核心功能
await initializeCore();

// 使用状态管理
const useRecipeStore = createStore({
  // store配置
});

// 使用API客户端
const api = new UnifiedApiClient({
  baseUrl: '/api'
});

// 使用表单验证
const useLoginForm = createFormStore({
  // 表单配置
});
```

## 项目结构

- `src/api` - API客户端和相关功能
- `src/api/unified` - 统一API抽象层
- `src/cache` - 缓存和持久化
- `src/core` - 核心功能和统一入口
- `src/i18n` - 国际化支持
- `src/store` - 状态管理
- `src/utils` - 工具函数
- `src/validation` - 表单验证

## 代码重构更新

项目已经进行了一次主要的代码重构，专注于以下方面：

1. **统一状态管理**
   - 使用React Context API（UnifiedSearchProvider）统一管理过滤状态
   - 移除了基于DOM事件的通信方式
   - 简化了组件之间的数据流

2. **组件结构优化**
   - 将大型组件拆分为职责单一的小组件
   - 移除了重复功能的组件（如FilterBar）
   - 每个组件负责清晰的、单一的功能

3. **数据流优化**
   - 统一使用Context进行状态管理
   - 持久化层集中处理（localStorage、URL参数）
   - 简化了状态同步逻辑

4. **技术栈更新**
   - 使用更现代的React模式（Hooks, Context）
   - 减少了对第三方库的依赖
   - 提高了代码的类型安全性

这一重构提高了代码的可维护性、可测试性，并为未来功能的扩展提供了更好的基础。

## 状态控制器模式

项目采用了统一的"状态控制器模式"来管理各种组件的异步状态：

### 通用异步资源控制器

通过`useAsyncResourceController`实现了统一的状态管理模式，该Hook可用于：

- 搜索功能 - 处理查询、加载状态和结果管理
- 收藏功能 - 统一收藏状态的添加、删除和同步
- 表单处理 - 管理表单数据、验证和提交状态
- 数据获取 - 统一处理API请求的加载、错误和数据状态

状态控制器的核心特性：

```typescript
function useAsyncResourceController<T, P = any>(options: {
  fetcher: (params?: P) => Promise<T>,
  transformer?: (data: any) => T,
  autoFetch?: boolean,
  initialParams?: P,
  initialData?: T,
  debounceTime?: number,
  onError?: (error: Error) => void,
  onSuccess?: (data: T) => void
}) {
  // 返回统一的状态和方法
  return {
    // 状态
    data,        // 资源数据
    loading,     // 加载状态
    error,       // 错误信息 
    params,      // 请求参数
    
    // 方法
    fetch,       // 获取数据
    setData,     // 更新数据
    setError,    // 设置错误
    setParams,   // 更新参数
    reset,       // 重置状态
    
    // 计算属性
    isInitialized,
    isLoading,
    isError,
    isEmpty
  };
}
```

### 使用示例

**1. 搜索组件:**
```tsx
// 使用控制器管理搜索
const searchController = useAsyncResourceController({
  fetcher: (params) => fetchRecipes(params),
  debounceTime: 300
});

// 组件中使用状态
return (
  <div>
    {searchController.loading ? (
      <WithSkeleton loading={true} type="spinner">
        <div>搜索中...</div>
      </WithSkeleton>
    ) : searchController.error ? (
      <ErrorMessage error={searchController.error} />
    ) : (
      <RecipeList recipes={searchController.data?.recipes || []} />
    )}
  </div>
);
```

**2. 收藏功能:**
```tsx
// 使用控制器管理收藏状态
const favoriteController = useAsyncResourceController({
  fetcher: () => checkIsFavorite(recipeId),
  autoFetch: !!recipeId
});

// 切换收藏
const toggleFavorite = () => {
  // 乐观更新UI
  favoriteController.setData(prev => !prev);
  
  // 执行API请求
  toggleFavoriteApi(recipeId)
    .catch(() => {
      // 失败时回滚
      favoriteController.setData(!favoriteController.data);
    });
};
```

**3. 表单处理:**
```tsx
// 使用控制器管理表单状态
const formController = useAsyncResourceController({
  fetcher: (formData) => submitForm(formData),
  autoFetch: false
});

// 表单提交
const handleSubmit = async (values) => {
  try {
    await formController.fetch(values);
    showSuccessMessage('提交成功');
  } catch (error) {
    showErrorMessage('提交失败');
  }
};
```

### 架构优势

1. **代码一致性** - 所有状态管理使用统一模式
2. **避免重复** - 消除常见的loading/error/data管理逻辑重复
3. **优化性能** - 内置防抖、缓存和状态优化
4. **类型安全** - 完整的TypeScript支持和类型推断
5. **更简洁的视图层** - 将状态管理从视图层分离

## 最近更新

### 2023-XX-XX: 事件总线统一

为了解决项目中事件驱动逻辑混乱的问题，我们对事件处理机制进行了重构：

- 移除了各模块独立的事件逻辑，统一使用 `mitt` 库实现的集中式事件总线
- 创建了 `src/core/eventBus.ts` 作为统一的事件总线实现
- 更新了认证、搜索、验证、语言切换、主题等模块，使其使用统一的事件总线
- 设计了类型安全的事件定义，便于 TypeScript 类型检查和自动完成

使用示例：

```typescript
// 导入事件总线
import { eventBus, emitEvents } from '../core/eventBus';

// 监听事件
const unsubscribe = eventBus.on('auth:login', (user) => {
  console.log('用户登录:', user.name);
});

// 发出事件
eventBus.emit('search:clear', undefined);

// 使用助手函数发出事件
emitEvents.login(user);
emitEvents.notification('操作成功', 'success');

// 取消订阅
unsubscribe();
```

这一重构为项目带来了以下好处：

1. 模块间解耦 - 各模块不再直接相互依赖，而是通过事件总线通信
2. 便于调试 - 所有事件通过一个中心化的总线流转，便于跟踪和调试
3. 代码组织更清晰 - 统一的事件类型定义和发射助手函数
4. 类型安全 - 完整的 TypeScript 类型支持，避免类型错误