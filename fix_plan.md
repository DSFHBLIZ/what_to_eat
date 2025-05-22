# React Hooks 错误修复计划

## 主要问题

1. **React Hooks 规则违反**
   - `useSampleData` 不应该在非组件函数中调用
   - `useVirtualizer` 被条件性调用
   - 其他 Hook 调用不符合规则

2. **依赖项缺失**
   - 多个 `useEffect` 和 `useCallback` 缺少依赖项

3. **匿名默认导出**
   - 多个文件直接导出匿名对象作为默认值

## 修复计划

### 1. 修复 `useSampleData` 问题

- 修改 `src/utils/data/sampleData.ts` - 将 `useSampleData` 改为普通函数
- 更新 `RecipeContainer.tsx` 和 `RecipeDataProvider.tsx` 文件中对 `useSampleData` 的调用

### 2. 修复条件性 Hook 调用

- 修改 `RecipeList.tsx` 中的 `useVirtualizer` 调用，避免条件性使用
- 修复 `LayoutWrapper.tsx` 中的条件性 `useMemo` 调用

### 3. 修复缺失的依赖项

- 为 `useEffect` 和 `useCallback` 添加缺失的依赖项

### 4. 修复匿名默认导出

- 将匿名默认导出改为命名对象导出 