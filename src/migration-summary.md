# UI组件迁移摘要

## 已删除的组件文件

以下组件已被删除并替换为统一的UI组件：

1. **标题组件**:
   - `PageTitle.tsx` → 替换为 `TitleUI.tsx`

2. **加载组件**:
   - `RecipeListSkeleton.tsx` → 替换为 `SkeletonLoader.tsx`
   - `RecipeSkeleton.tsx` → 替换为 `SkeletonLoader.tsx`

3. **标签组件**:
   - `Badge.tsx` → 替换为 `Tag.tsx`或`TagWrapper.tsx`
   - `BadgeUI.tsx` → 删除
   - `TagUI.tsx` → 删除，功能整合到BaseTag和TagWrapper
   - `IngredientTag.tsx` → 替换为 `TagWrapper.tsx`
   - `IngredientTagUI.tsx` → 删除
   - `SelectableTagUI.tsx` → 删除，功能整合到TagWrapper

## 更新的文件

以下文件已经更新以使用新的统一UI组件：

1. `src/app/recipes/recipes-client.tsx` - 使用 TitleUI 替代 PageTitle
2. `src/components/RecipeList.tsx` - 使用 SkeletonLoader 替代 RecipeListSkeleton
3. `src/app/recipe/[id]/recipe-client.tsx` - 使用 SkeletonLoader 替代 RecipeSkeleton
4. `src/components/search/TagsDisplay.tsx` - 使用 TagWrapper 替代 SelectableTagUI
5. `src/components/home/IngredientInput.tsx` - 使用 TagWrapper 替代 IngredientTag
6. `src/components/home/IngredientTagList.tsx` - 使用 TagWrapper 替代 SelectableTagUI 导出的组件
7. `src/components/home/FilterTagGroup.tsx` - 使用 TagWrapper 替代 FilterTag
8. `src/components/home/FilterOptionGroup.tsx` - 使用 TagWrapper 替代 FilterTag

## 新添加的UI组件

1. `src/components/ui/TitleUI.tsx` - 统一的标题组件
2. `src/components/ui/SkeletonLoader.tsx` - 统一的骨架加载器组件
3. `src/components/ui/BaseTag.tsx` - 标签UI基础组件
4. `src/components/ui/Tag.tsx` - 简单标签组件封装
5. `src/components/ui/TagWrapper.tsx` - 功能齐全的标签组件封装

## 标签组件新结构

- **BaseTag.tsx** - 基础标签UI组件，定义所有标签的核心样式和交互逻辑（一般不直接使用）
- **Tag.tsx** - 简单封装BaseTag的轻量级标签组件，只提供基础标签功能（适用于简单场景）
- **TagWrapper.tsx** - 功能齐全的标签组件，提供所有高级功能如类型切换、图标等（推荐使用）

## 组件使用指南

### 标签组件选择原则

1. **优先使用 TagWrapper**：
   - 推荐作为默认选择
   - 提供全部功能，包括图标、交互逻辑、类型等
   - 适用于所有标签场景

2. **简单场景使用 Tag**：
   - 当只需要基本样式而不需要复杂交互时
   - 不支持类型切换、选中状态等高级功能
   - 适用于纯展示或最简单交互场景

3. **避免直接使用 BaseTag**：
   - BaseTag是底层组件，通常不直接使用
   - 只有在需要完全自定义标签行为时才考虑使用

### 示例代码

```tsx
// 推荐方式 - 使用TagWrapper
import TagWrapper from '../components/ui/TagWrapper';

// 筛选标签
<TagWrapper
  label="川菜"
  type="filter"
  color="blue"
  isSelected={selected}
  onClick={handleClick}
/>

// 食材标签
<TagWrapper
  label="土豆"
  type="ingredient-required"
  color="blue"
  onRemove={handleRemove}
/>
```

## 用法示例

查看 `src/components/ui/README.md` 获取详细的组件用法说明和示例。 