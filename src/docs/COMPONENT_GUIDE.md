# 组件使用指南

## 客户端和服务端组件规范

本文档概述了项目中服务端和客户端组件的正确使用方式，以及如何避免常见问题。

### 核心原则

1. **明确职责分离**：
   - 服务端组件主要负责：数据获取、SEO和初始渲染
   - 客户端组件主要负责：交互和动态UI变化

2. **数据流向**：
   - 服务端获取数据 -> 通过props传递给客户端组件 -> 客户端组件使用数据进行渲染和交互
   - 避免在客户端重复获取服务端已经获取的数据

3. **状态管理**：
   - 全局状态使用Context API
   - 本地状态仅用于UI交互

## 组件类型

### 服务端组件 (Server Components)

服务端组件文件顶部**不应该**包含`'use client'`指令。

**适用场景**：
- 数据获取 (尤其是初始数据)
- SEO优化 (元数据生成)
- 不需要用户交互的静态内容
- 访问后端资源 (数据库、服务等)

**示例**：
```tsx
// src/app/recipe/[id]/page.tsx - 服务端组件
import { Metadata } from 'next';
import { getRecipeByIdFromSupabase } from '../../../utils/supabase';
import { RecipeProvider } from '../../../contexts';
import RecipeClient from './recipe-client';

// 服务端获取数据，传递给客户端组件
export default async function RecipePage({ params }) {
  const recipe = await getRecipeByIdFromSupabase(params.id);
  
  return (
    <RecipeProvider initialRecipe={recipe}>
      <RecipeClient />
    </RecipeProvider>
  );
}
```

### 客户端组件 (Client Components)

客户端组件文件顶部**必须**包含`'use client'`指令。

**适用场景**：
- 用户交互 (点击、表单等)
- 使用React Hooks (useState, useEffect等)
- 浏览器API访问 (localStorage, navigator等)
- 动态UI变化

**示例**：
```tsx
// src/app/recipe/[id]/recipe-client.tsx - 客户端组件
'use client';

import { useState } from 'react';
import { useRecipe } from '../../../contexts';
import DifficultyBadge from '../../../components/recipe/DifficultyBadge';

// 客户端组件，处理交互和动态UI
const RecipeClient = () => {
  const { recipe, toggleFavoriteStatus } = useRecipe();
  
  // 用户交互处理
  const handleFavoriteClick = () => {
    toggleFavoriteStatus(recipe.id);
  };
  
  return (
    <div>
      <h1>{recipe.name}</h1>
      <DifficultyBadge difficulty={recipe.difficulty} />
      <button onClick={handleFavoriteClick}>收藏</button>
    </div>
  );
};

export default RecipeClient;
```

## 共享UI组件

共享UI组件可以在服务端和客户端组件中使用。需要注意：

1. 如果组件需要使用客户端功能 (如useState)，必须标记为客户端组件
2. 纯UI组件尽量避免添加`'use client'`，保持灵活性

**良好实践**：
- 拆分出纯UI展示组件，可在服务端和客户端使用
- 交互行为独立到客户端特定组件

### 示例：DifficultyBadge组件

```tsx
// src/components/recipe/DifficultyBadge.tsx
'use client';

import { memo } from 'react';
import { normalizeDifficulty, getDifficultyColor } from '../../styles/theme';

// 纯UI组件，接受props进行渲染
const DifficultyBadge = ({ difficulty, showLabel = true, theme = 'light' }) => {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const colors = getDifficultyColor(difficulty, theme);
  
  return (
    <span className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full`}>
      {showLabel ? '难度：' : ''}{normalizedDifficulty}
    </span>
  );
};

export default memo(DifficultyBadge);
```

## 样式管理

1. **设计Token**：使用`design-tokens`作为唯一设计规范来源
2. **主题系统**：使用`styles/theme.ts`提供逻辑映射函数
3. **CSS Modules**：组件特定样式使用CSS模块，如`DifficultyBadge.module.css`
4. **全局样式**：通用样式定义在`globals.css`

## 状态管理

1. **Context API**：共享状态使用Context
2. **单向数据流**：服务端获取数据 -> Context存储 -> 客户端组件消费
3. **数据验证**：使用类型检查和数据验证

## 常见问题和解决方案

### 1. 服务端组件使用了客户端功能

**问题**：服务端组件内使用了`useState`等客户端特有功能
**解决方案**：
- 拆分组件为服务端和客户端部分
- 服务端组件获取数据，客户端组件处理交互

### 2. 客户端和服务端显示不一致

**问题**：水合过程(hydration)中客户端渲染结果与服务端不匹配
**解决方案**：
- 确保初始状态一致
- 使用`useEffect`确保客户端特定逻辑仅在客户端执行
- 使用`useMemo`优化重复计算

### 3. 样式冲突或不一致

**问题**：组件在不同场景下样式不一致
**解决方案**：
- 使用统一的样式管理系统，如`theme.ts`
- 组件使用CSS Modules隔离样式
- 明确定义变体和修饰符

## 测试与维护

1. **组件测试**：为每个组件编写单元测试和快照测试
2. **代码评审**：每次PR都应检查组件一致性
3. **文档更新**：修改组件时更新本指南 