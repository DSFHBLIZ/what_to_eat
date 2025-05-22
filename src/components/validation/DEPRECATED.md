# 已删除的验证组件

以下组件已从系统中完全删除：

## 删除的组件和文件

| 组件/文件 | 替代方案 | 迁移路径 |
|---------|---------|---------|
| `ValidationContext.tsx` | 直接使用 `useRecipeValidator` | 移除 context 直接使用 hook |
| `useValidationContext` | 直接使用 `useRecipeValidator` | 直接导入并使用 hook |
| `SearchResultsTransformer.tsx` | 直接使用 Zod 验证 | 使用 `z.parse` 或 `z.safeParse` |
| `useValidation.ts` (在hooks目录) | 直接使用 `useRecipeValidator` | 直接导入并使用 hook |

## 迁移示例

```tsx
// 旧代码（不再可用）:
import { useValidationContext } from '../components/validation';

function MyComponent() {
  const { validateRecipe } = useValidationContext();
  
  // 使用方法
  const result = validateRecipe(data);
  // ...
}

// 新代码:
import { useRecipeValidator } from '../domain/validation/recipeValidation';

function MyComponent() {
  const { validateRecipe } = useRecipeValidator();
  
  // 使用方法
  const result = validateRecipe(data);
  // ...
}
```

## 原因

验证系统已被重构为领域特定的实现，移除了不必要的抽象层。为简化系统维护并消除冗余实现，这些组件已被完全删除，而不是标记为废弃。相关详情请参阅项目根目录下的 `DEPRECATED.md` 文件。 