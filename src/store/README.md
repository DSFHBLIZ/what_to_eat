# Store重构总结

## 重构内容

1. 合并了filterSlice、searchSlice和ingredientSlice为一个统一的searchSlice
2. 创建了通用的createSlice工厂函数，简化状态切片创建
3. 引入了Controller层概念，分离业务逻辑和状态管理
4. 统一了状态管理接口，使用更少的代码实现相同功能

## 重构后的结构

- **sliceFactory.ts**: 提供统一的状态切片创建工厂
- **slices/**: 包含各种状态切片
  - **searchSlice.ts**: 集成了搜索、过滤和食材管理功能
- **controllers/**: 包含业务逻辑控制器
  - **searchController.ts**: 处理搜索相关的业务逻辑
- **index.ts**: 统一导出状态管理模块

---

# 状态管理系统

本项目使用增强版的Zustand作为状态管理方案，支持状态持久化、跨页面同步和离线操作等功能。

## 设计目标

- **简单易用**：API简洁，使用直观
- **高性能**：最小化重渲染，高效的状态更新
- **类型安全**：完整的TypeScript支持
- **可扩展**：通过中间件机制支持各种高级功能
- **开发友好**：支持Redux DevTools，便于调试
- **离线优先**：支持在没有网络连接时正常工作

## 文件结构

- `store.ts`：核心状态存储和API
- `storeTypes.ts`：所有类型定义
- `syncMiddleware.ts`：多标签页状态同步中间件
- `offlineStorage.ts`：离线操作支持中间件
- `StoreProvider.tsx`：状态提供组件
- `README.md`：文档

## 状态组织

状态被组织为以下几个主要部分：

1. **用户状态 (user)**：
   - 用户信息
   - 认证状态
   - 用户偏好设置

2. **应用状态 (app)**：
   - 加载状态
   - 初始化状态
   - 通知
   - 错误信息
   - 网络状态
   - 离线操作队列

3. **搜索状态 (search)**：
   - 搜索历史
   - 最近搜索
   - 保存的搜索
   - 搜索筛选条件
   - 搜索结果
   - 搜索状态

4. **食谱状态 (recipes)**：
   - 收藏的食谱
   - 浏览历史
   - 推荐食谱

## 自定义 Hooks

为了简化状态的使用，提供了以下自定义Hooks：

- `useUserState()`: 访问用户状态
- `useAppState()`: 访问应用状态
- `useSearchState()`: 访问搜索状态
- `useRecipesState()`: 访问食谱状态
- `useAuthentication()`: 用户认证相关操作
- `usePreferences()`: 用户偏好设置操作
- `useNotifications()`: 通知相关操作
- `useSearchFunctions()`: 搜索相关操作
- `useFavorites()`: 收藏食谱相关操作
- `useOfflineSync()`: 离线同步相关操作

## 使用示例

### 访问状态

```tsx
import { useUserState } from '@/store/store';

function ProfileComponent() {
  const { user, preferences } = useUserState();
  
  return (
    <div>
      <h1>{user?.username || '未登录'}</h1>
      <p>当前主题: {preferences.theme}</p>
    </div>
  );
}
```

### 修改状态

```tsx
import { useAuthentication } from '@/store/store';

function LoginForm() {
  const { login } = useAuthentication();
  
  const handleSubmit = async (data) => {
    await login({
      id: 'user-123',
      username: 'example',
      email: 'user@example.com'
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

### 离线操作

```tsx
import { useFavorites, useOfflineSync } from '@/store/store';

function RecipeCard({ recipe }) {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { isOnline } = useOfflineSync();
  
  const isFavorited = favorites.includes(recipe.id);
  
  const toggleFavorite = () => {
    if (isFavorited) {
      removeFavorite(recipe.id);
    } else {
      addFavorite(recipe.id);
    }
  };
  
  return (
    <div>
      <h2>{recipe.title}</h2>
      <button onClick={toggleFavorite}>
        {isFavorited ? '取消收藏' : '收藏'}
        {!isOnline && ' (离线模式)'}
      </button>
    </div>
  );
}
```

## 持久化配置

应用在本地存储中持久化以下状态：

- 用户身份验证信息和偏好设置
- 应用初始化状态和离线队列
- 搜索历史和保存的搜索
- 收藏的食谱和浏览历史

这确保了在页面刷新或重新打开浏览器后，应用可以恢复到之前的状态。

## 跨标签页同步

使用`BroadcastChannel` API和localStorage事件系统，支持以下状态在多个标签页之间同步：

- 用户偏好设置
- 收藏的食谱
- 保存的搜索

## 离线支持

离线状态管理机制支持：

- 检测网络状态变化
- 在离线状态下将操作添加到队列
- 在网络恢复时自动执行队列中的操作
- 操作失败时使用指数退避重试
- 队列持久化，确保应用关闭后操作不丢失

## 与事件总线集成

状态变更会通过eventBus触发相应的事件，便于应用中的其他部分响应这些变更。

```tsx
import { eventBus } from '@/utils/eventBus';

// 监听用户偏好设置变化
eventBus.on('user:preferences:change', ({ preferences }) => {
  console.log('用户偏好设置已更新:', preferences);
});
```

## 调试

使用Redux DevTools可以查看状态变化历史和当前状态树。在开发环境中，打开浏览器的Redux DevTools扩展即可。

# 状态管理模块说明

本项目使用 Zustand 进行状态管理，将原来分散在多个地方的状态逻辑集中管理，提高代码可维护性和复用性。

## 状态管理模块

### 1. 收藏夹管理 (`favoriteSlice.ts`)

集中管理所有与收藏相关的状态和逻辑，替代原来分散在 RecipeContext, recipeSlice 和 recipeUtils 中的收藏功能。

```tsx
import { useFavorites } from '../store/slices/favoriteSlice';

// 在组件中使用
function RecipeCard({ recipe }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const handleToggleFavorite = () => {
    toggleFavorite(recipe.id, recipe);
  };
  
  return (
    <div>
      <h3>{recipe.name}</h3>
      <button onClick={handleToggleFavorite}>
        {isFavorite(recipe.id) ? '取消收藏' : '收藏'}
      </button>
    </div>
  );
}
```

### 2. 食材选择管理 (`ingredientSlice.ts`)

统一管理食材选择状态，替代原来分散在 IngredientSelector, IngredientTagList, UnifiedSearchProvider, UrlSyncProvider 中的食材选择逻辑。

```tsx
import { useIngredients } from '../store/slices/ingredientSlice';

// 在组件中使用
function IngredientSelector() {
  const { 
    requiredIngredients, 
    addRequiredIngredient,
    removeRequiredIngredient,
    optionalIngredients,
    addOptionalIngredient,
    removeOptionalIngredient 
  } = useIngredients();
  
  return (
    <div>
      {/* UI 实现 */}
    </div>
  );
}
```

### 3. 搜索状态管理 (`searchSlice.ts`)

统一管理搜索状态，替代原来分散在 SearchContainer, SearchBar, SearchContext 中的搜索逻辑。

```tsx
import { useSearch } from '../store/slices/searchSlice';

// 在组件中使用
function SearchBar() {
  const { query, setQuery, search, isLoading } = useSearch();
  
  const handleSearch = () => {
    search(query);
  };
  
  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
      />
      <button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? '搜索中...' : '搜索'}
      </button>
    </div>
  );
}
```

## URL 同步

所有状态管理模块都提供 URL 同步功能，可以通过 `getUrlParams` 和 `syncFromUrlParams` 方法进行 URL 参数的同步。

```tsx
import { useSearchParams, useRouter } from 'next/navigation';
import { useIngredients } from '../store/slices/ingredientSlice';
import { useSearch } from '../store/slices/searchSlice';

// URL 同步组件
function UrlSyncProvider({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ingredients = useIngredients();
  const search = useSearch();
  
  // 从 URL 参数加载状态
  useEffect(() => {
    if (!searchParams) return;
    
    // 同步食材状态
    ingredients.syncFromUrlParams(searchParams);
    
    // 同步搜索状态
    search.syncFromUrlParams(searchParams);
  }, [searchParams]);
  
  // 更新 URL 参数
  const updateUrl = () => {
    const ingredientParams = ingredients.getUrlParams();
    const searchParams = search.getUrlParams();
    
    // 合并参数
    const params = new URLSearchParams();
    
    // 添加食材参数
    for (const [key, value] of ingredientParams.entries()) {
      params.set(key, value);
    }
    
    // 添加搜索参数
    for (const [key, value] of searchParams.entries()) {
      params.set(key, value);
    }
    
    // 更新 URL
    const queryString = params.toString();
    router.push(`${window.location.pathname}${queryString ? '?' + queryString : ''}`);
  };
  
  return children;
}
```

## 应用初始化

在应用初始化时，需要设置搜索执行器，提供真正的搜索实现：

```tsx
// app/providers.tsx
import { setSearchExecutor } from '../store/slices/searchSlice';
import { searchRecipes } from '../utils/searchService';

// 设置搜索执行器
setSearchExecutor(async (query) => {
  // 实际的搜索实现
  return searchRecipes(query);
});

export function Providers({ children }) {
  return children;
}
```

## 迁移指南

从旧的状态管理迁移到新的状态管理:

1. 将 `recipeUtils.ts` 中的收藏逻辑迁移到 `favoriteSlice.ts`
2. 将 `UnifiedSearchProvider.tsx` 中的食材选择逻辑迁移到 `ingredientSlice.ts`
3. 将 `SearchContainer.tsx` 和 `SearchBar.tsx` 中的搜索逻辑迁移到 `searchSlice.ts`
4. 更新组件以使用新的 hooks
