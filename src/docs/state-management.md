# 状态管理系统文档

## 概述

简食搜索应用使用了一个增强型的状态管理系统，基于Zustand构建，提供了模块化、可组合和高性能的状态管理能力。系统包含以下核心功能：

- **切片管理**：状态模块化，每个功能模块独立管理自己的状态
- **中间件增强**：提供异步操作、状态组合、持久化等增强能力
- **类型安全**：完整的TypeScript类型定义
- **开发工具集成**：集成Redux DevTools便于调试
- **事件系统**：基于发布-订阅模式的事件总线
- **状态派生**：支持从多个状态源计算派生状态
- **持久化**：可配置的存储引擎和持久化策略

## 主要组件

### 切片管理器 (`sliceManager`)

切片管理器是状态管理系统的核心，提供了创建、组合和管理状态切片的能力。

```typescript
// 创建一个状态切片
const userSlice = sliceManager.createSlice<UserState>({
  name: 'user',
  initialState: { /* 初始状态 */ },
  persist: true,
  devtools: true
});

// 创建动作
const login = userSlice.createAction('login', (state, credentials) => {
  // 更新状态...
});

// 创建选择器
const selectUser = userSlice.createSelector('selectUser', state => state.user);

// 订阅状态变化
userSlice.subscribe('isLoggedIn', (newValue, oldValue) => {
  console.log(`登录状态从 ${oldValue} 变为 ${newValue}`);
});
```

### 中间件

#### 异步动作中间件 (`asyncActionsMiddleware`)

提供对异步操作的支持，包括加载状态和错误处理。

```typescript
// 在切片中创建异步动作
const fetchUserAsync = userSlice.createAsyncAction('fetchUserAsync', 
  async (state, userId) => {
    // 异步操作...
    return userData;
  }
);

// 使用带hook的异步动作
const { execute, loading, error } = useAsyncAction(
  fetchUserAsync, 
  { id: 'fetchUser' }
);

// 执行异步操作
execute(userId);
```

#### 组合状态中间件 (`composableStateMiddleware`)

支持从多个状态源派生复合状态。

```typescript
// 添加派生状态
useStore.getState().addDerivedState({
  key: 'userFavoriteRecipes',
  dependencies: [
    state => state.recipes.favorites,
    state => state.recipes.recipes
  ],
  compute: (favorites, recipes) => {
    return favorites.map(id => recipes[id]).filter(Boolean);
  }
});
```

#### 持久化中间件 (`enhancedPersist`)

提供可配置的持久化能力，支持多存储引擎、压缩和加密。

```typescript
// 配置持久化
enhancedPersist({
  name: 'store-name',
  storage: createLocalStorage(),
  partialize: (state) => ({
    // 只持久化部分状态
    user: {
      preferences: state.user.preferences
    }
  }),
  version: 1,
  migrate: (state, version) => {
    // 状态迁移逻辑
    return migratedState;
  }
})
```

### 统一存储 (`useStore`)

提供了统一的状态访问点，集成了所有切片和中间件功能。

```typescript
// 使用存储
const { user, recipes, app } = useStore();

// 访问状态
const isLoggedIn = useStore(state => state.user.isLoggedIn);

// 使用派生状态
const userFavoriteRecipes = useStore(state => state.userFavoriteRecipes);
```

## 状态组织结构

状态被组织为以下主要切片：

1. **应用状态** (`app`): 存储应用程序级别的状态如初始化状态、主题等
2. **用户状态** (`user`): 管理用户相关信息和身份验证状态
3. **食谱状态** (`recipes`): 管理食谱数据、收藏夹和筛选条件

## 最佳实践

### 状态设计原则

1. **最小可行状态**: 只存储必要的状态，避免冗余数据
2. **规范化数据**: 使用ID作为键存储集合数据
3. **状态隔离**: 每个切片只管理自己的状态
4. **事件驱动**: 使用事件系统进行跨切片通信

### 使用指南

1. **创建动作前思考**: 动作应该是原子的，专注于单一职责
2. **避免过度订阅**: 只订阅必要的状态变化
3. **合理使用派生状态**: 对于可以从现有状态计算的数据，使用派生状态而非存储冗余数据
4. **异步操作处理**: 使用异步动作中间件处理加载状态和错误

## 使用示例

### 创建和使用切片

```typescript
// 创建切片
const profileSlice = sliceManager.createSlice<ProfileState>({
  name: 'profile',
  initialState: { /* 初始状态 */ }
});

// 创建动作
export const updateProfile = profileSlice.createAction('updateProfile', 
  (state, profile) => {
    // 更新状态...
  }
);

// 在组件中使用
import { updateProfile } from './profileSlice';

function ProfileComponent() {
  const profile = useStore(state => state.profile);
  
  const handleUpdate = (data) => {
    updateProfile(data);
  };
  
  return (/* JSX */);
}
```

### 使用异步动作

```typescript
// 创建异步动作
export const fetchProfileAsync = profileSlice.createAsyncAction(
  'fetchProfile',
  async (state, userId) => {
    // 获取数据...
    return profileData;
  }
);

// 在组件中使用
function ProfileComponent() {
  const { loading } = useStore(state => ({
    loading: state.loading['fetchProfile'] || false
  }));
  
  useEffect(() => {
    fetchProfileAsync(userId);
  }, [userId]);
  
  if (loading) return <Loading />;
  
  return (/* JSX */);
}
```

## 性能考虑

- 使用选择器访问状态以避免不必要的渲染
- 对大型数据集使用记忆化选择器
- 适当使用持久化延迟，避免频繁写入存储
- 使用事件系统进行非关键状态的传播

## 调试

- 启用`devtools: true`选项集成Redux DevTools
- 使用`logging: true`选项记录状态变化
- 为关键动作和状态变化添加事件监听器 