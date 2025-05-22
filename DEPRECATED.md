# 重要！代码库废弃通知

本项目中包含一些已被废弃或删除的组件和API。

## 已删除的组件和API

| 废弃内容 | 替代方案 | 废弃原因 |
|---------|---------|---------|
| ~~`useValidation`~~ (已删除) | `useRecipeValidator` | 验证系统重构为领域特定逻辑 |
| ~~`ValidationResult<T>`~~ (已删除) | `RecipeValidationResult` | 简化API，移除不必要的类型参数和字段 |
| ~~旧验证相关的Schema定义~~ (已删除) | `RecipeValidatorSchema` | 避免重复定义Schema |
| ~~`ValidationContext`~~ (已删除) | 直接使用 `useRecipeValidator` | 移除不必要的抽象层 |
| ~~`SearchResultsTransformer`~~ (已删除) | 直接使用 Zod 验证 | 功能重构到领域层 |

## 已删除的文件

- ~~`src/hooks/useValidation.ts`~~ (已删除)
- ~~`src/components/validation/ValidationContext.tsx`~~ (已删除)
- ~~`src/components/validation/SearchResultsTransformer.tsx`~~ (已删除)

## 迁移指南

### 从 useValidation 迁移到 useRecipeValidator

```diff
- import { useValidation } from '../hooks/useValidation';
+ import { useRecipeValidator } from '../domain/validation/recipeValidation';

function MyComponent() {
-  const { validateRecipe } = useValidation();
+  const { validateRecipe } = useRecipeValidator();
  
  // 处理验证结果
  const result = validateRecipe(recipeData);
  
  // 结果字段差异
- if (result.isValid && result.data) {
+ if (result.isValid && result.fixedData) {
    // 处理有效数据
-   const validRecipe = result.data;
+   const validRecipe = result.fixedData;
  }
}
```

### 更新类型导入

```diff
- import { ValidationResult } from '../hooks/useValidation';
+ import { RecipeValidationResult } from '../types/validation';

- function processResult(result: ValidationResult<Recipe>) {
+ function processResult(result: RecipeValidationResult) {
  // ...
}
```

## 重要提示

**注意：** 所有废弃的组件和API已经被完全删除，没有提供过渡兼容性。任何尝试导入这些组件或API的代码都将导致编译错误。请立即更新您的代码以使用新的API。

## 迁移截止时间

所有废弃的组件和API已于 2024-Q1 完全删除。 