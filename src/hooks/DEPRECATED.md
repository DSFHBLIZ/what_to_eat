# 废弃组件与文件

本目录中包含一些被标记为已废弃的组件和文件，将在下一版本中完全移除。

## 废弃文件列表

### ~~useValidation.ts~~ (已删除)

此文件已被删除，请不要在任何代码中使用它。请替换为：

- 菜谱验证：使用 `domain/validation/recipeValidation.ts` 中的 `useRecipeValidator` hook
- 类型定义：使用 `types/validation.ts` 中的类型定义

### 迁移示例

**旧代码** (不再可用):
```tsx
import { useValidation } from '../hooks/useValidation'; // 此文件已删除

function MyComponent() {
  const { validateRecipe } = useValidation();
  const result = validateRecipe(data);
  // ...
}
```

**新代码**:
```tsx
import { useRecipeValidator } from '../domain/validation/recipeValidation';

function MyComponent() {
  const { validateRecipe } = useRecipeValidator();
  const result = validateRecipe(data);
  // ...
}
```

## 废弃类型映射

| 旧类型 | 新类型 |
|--------|--------|
| ~~`ValidationResult<T>`~~ (已删除) | `RecipeValidationResult` |
| ~~`ValidationStats` 旧版~~ (已删除) | `ValidationStats` |

## 更新通知

`useValidation.ts` 已在 2024-Q1 中完全删除，不再提供任何兼容性支持。任何导入此文件的代码都将导致编译错误。

## 预计删除时间

这些废弃文件将在下一个主要版本更新中删除。 