# 类型安全工具使用指南

本文档详细介绍了项目中实现的类型安全工具及其最佳使用实践，帮助开发者有效地防止类型相关的运行时错误。

## 目录

1. [工具概述](#工具概述)
2. [JSON安全解析](#JSON安全解析)
3. [安全存储工具](#安全存储工具)
4. [类型检查工具](#类型检查工具)
5. [性能监控](#性能监控)
6. [最佳实践](#最佳实践)
7. [故障排除](#故障排除)

## 工具概述

本项目实现了以下主要类型安全工具：

- **安全JSON解析**：替代原生`JSON.parse`，提供错误处理和类型验证
- **存储工具**：类型安全的本地存储和会话存储操作
- **IndexedDB工具**：安全的IndexedDB数据库操作
- **类型检查工具**：类型守卫和类型验证函数
- **性能监控**：追踪类型验证和转换操作的性能

## JSON安全解析

### 基本用法

```typescript
import { safeJsonParse } from '@/utils/common/safeTypeConversions';

// 基本用法
const data = safeJsonParse<MyType>(jsonString, defaultValue);

// 带组件名的用法（用于日志）
const data = safeJsonParse<MyType>(jsonString, defaultValue, 'MyComponent');
```

### 带模式验证的用法

```typescript
import { safeJsonParseWithSchema } from '@/utils/common/safeTypeConversions';
import { z } from 'zod';

// 定义验证模式
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

type User = z.infer<typeof UserSchema>;

// 使用模式解析
const user = safeJsonParseWithSchema<User>(
  jsonString,
  UserSchema,
  defaultUser,
  { logPrefix: 'UserComponent', logErrors: true }
);
```

### 增强版安全解析

```typescript
import { enhancedJsonParse, enhancedJsonParseWithSchema } from '@/utils/data/enhancedSafeJsonParse';
import { z } from 'zod';

// 基本用法
const data = enhancedJsonParse<MyType>(jsonString, {
  defaultValue: defaultData,
  componentName: 'MyComponent',
  attemptFix: true // 尝试修复常见JSON错误
});

// 带模式验证的用法
const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.string().optional()
  }))
});

type Recipe = z.infer<typeof RecipeSchema>;

const recipe = enhancedJsonParseWithSchema<Recipe>(jsonString, {
  defaultValue: defaultRecipe,
  schema: RecipeSchema,
  componentName: 'RecipeComponent',
  lenientMode: true, // 宽松验证模式
  processOptions: {
    trimStringValues: true,
    removeEmptyValues: true
  }
});
```

### 错误处理

```typescript
import { enhancedJsonParse, JsonParseError } from '@/utils/data/enhancedSafeJsonParse';

const data = enhancedJsonParse<MyType>(jsonString, {
  defaultValue: defaultData,
  onError: (error: JsonParseError) => {
    // 自定义错误处理
    if (error.type === 'SYNTAX_ERROR') {
      // 处理语法错误
    } else if (error.type === 'VALIDATION_ERROR') {
      // 处理验证错误
    }
    
    // 记录详细错误信息
    console.error(error.getFormattedMessage());
  }
});
```

## 安全存储工具

### 本地存储工具

```typescript
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/data/localStorage';

// 获取数据
const settings = getLocalStorageItem<AppSettings>(
  'app-settings', 
  defaultSettings,
  'SettingsComponent'
);

// 设置数据
setLocalStorageItem<AppSettings>(
  'app-settings',
  newSettings,
  'SettingsComponent'
);
```

### 会话存储工具

```typescript
import { getSessionStorageItem, setSessionStorageItem } from '@/utils/data/sessionStorage';

// 获取数据
const userSession = getSessionStorageItem<UserSession>(
  'user-session',
  defaultSession,
  'AuthComponent'
);

// 设置数据
setSessionStorageItem<UserSession>(
  'user-session',
  newSession,
  'AuthComponent'
);
```

### IndexedDB工具

```typescript
import { SafeIndexedDB, createRecipeDB } from '@/utils/data/indexedDB';

// 创建菜谱数据库实例
const recipeDB = createRecipeDB();

// 使用数据库
async function saveRecipe(recipe: Recipe) {
  try {
    await recipeDB.connect();
    const id = await recipeDB.add('recipes', recipe);
    return id;
  } catch (error) {
    console.error('保存菜谱失败:', error);
    return null;
  }
}

// 查询数据
async function getRecipesByDifficulty(difficulty: string) {
  try {
    const recipes = await recipeDB.queryByIndex<Recipe>('recipes', {
      indexName: 'difficulty',
      range: IDBKeyRange.only(difficulty),
      limit: 10
    });
    return recipes;
  } catch (error) {
    console.error('查询菜谱失败:', error);
    return [];
  }
}
```

## 类型检查工具

### 类型守卫函数

```typescript
import { 
  isArray, isObject, isString, isNumber, isBoolean,
  isDate, isFunction, isNil, isValidJson,
  isIngredient, isIngredientArray 
} from '@/utils/common/typeChecks';

// 类型检查
if (isArray(value)) {
  // 值是数组
}

if (isObject(value)) {
  // 值是对象
}

if (isString(value) && value.length > 0) {
  // 值是非空字符串
}

// 复杂类型检查
if (isIngredient(item)) {
  // 对象符合食材结构
  console.log(item.name, item.quantity);
}

if (isIngredientArray(items)) {
  // 数组中的所有项都符合食材结构
}
```

### 类型安全转换函数

```typescript
import { 
  ensureExists, ensureArray 
} from '@/utils/common/typeChecks';

// 确保存在值
const name = ensureExists(user.name, 'Unknown');

// 确保是数组
const ingredients = ensureArray(recipe.ingredients);
ingredients.forEach(ingredient => {
  // 安全地处理...
});
```

### 数值类型转换

```typescript
import { 
  safeParseInt, safeParseFloat, safeToNumber, safeToBoolean 
} from '@/utils/common/safeTypeConversions';

// 安全转换
const id = safeParseInt(idString, 0);
const price = safeParseFloat(priceString, 0.0);
const count = safeToNumber(countValue, 1);
const isActive = safeToBoolean(activeValue, false);
```

## 性能监控

### 基本用法

```typescript
import { performanceMonitor } from '@/utils/performanceMonitor';

// 开始计时
performanceMonitor.startMark('loadRecipes');

// 执行操作...

// 结束计时
const measure = performanceMonitor.endMark('loadRecipes');
console.log(`加载菜谱用时: ${measure?.duration}ms`);

// 测量函数执行时间
const result = performanceMonitor.measure('calculateScore', () => {
  // 执行计算...
  return score;
});

// 打印性能报告
performanceMonitor.printReport();
```

### 装饰器用法

```typescript
import { measure } from '@/utils/performanceMonitor';

class RecipeService {
  @measure('fetchRecipes')
  async fetchRecipes() {
    // 实现...
  }
}
```

### 包装函数

```typescript
import { measureFunction } from '@/utils/performanceMonitor';

// 原始函数
function calculateRelevanceScore(recipe, query) {
  // 实现...
}

// 包装为可测量函数
const measuredCalculateScore = measureFunction(
  'calculateRelevanceScore',
  calculateRelevanceScore
);

// 使用包装后的函数
const score = measuredCalculateScore(recipe, query);
```

## 最佳实践

### 代码迁移

从不安全到安全代码的迁移策略：

1. **逐步替换**：
   - 识别高风险区域（如数据解析和用户输入处理）
   - 首先替换这些区域的不安全代码

2. **替换优先级**：
   - 直接`JSON.parse`调用
   - 直接`localStorage`/`sessionStorage`访问
   - 不安全的类型转换

3. **代码模式**：

   ❌ 不安全方式：
   ```typescript
   const data = JSON.parse(localStorage.getItem('userData') || '{}');
   ```

   ✅ 安全方式：
   ```typescript
   const data = getLocalStorageItem<UserData>('userData', {}, 'UserProfile');
   ```

### 错误处理

- 始终为所有操作提供有意义的默认值
- 使用组件名称参数，确保日志清晰可追踪
- 考虑自定义错误处理程序处理特定场景

### 性能考虑

- 使用增强型方法时启用性能监控
- 对大型JSON数据处理，监控解析和验证性能
- 考虑在生产环境中禁用详细日志记录

## 故障排除

### 常见问题

1. **默认值被频繁使用**
   - 检查输入数据格式
   - 验证存储键名是否正确
   - 确保验证模式与预期数据结构匹配

2. **类型错误通过验证但运行时仍然出错**
   - 检查模式定义是否过于宽松
   - 使用更严格的Zod验证规则
   - 在关键对象属性上添加额外的类型守卫

3. **性能下降明显**
   - 减少不必要的验证
   - 考虑缓存验证结果
   - 优化大型数据结构的验证

### 诊断工具

- 使用`enhancedJsonParse`的`logErrors`选项启用详细日志
- 利用`performanceMonitor.printReport()`识别瓶颈
- 启用开发工具中的性能分析

## 总结

正确使用这些类型安全工具将显著提高应用程序的稳定性和可靠性。建议在所有处理外部数据、用户输入和持久化存储的场景中使用这些工具，以防止类型相关的运行时错误。

如有其他问题，请参考每个工具模块中的详细注释，或联系开发团队获取帮助。 