# 统一API层使用指南

## 简介

统一API层提供了一个一致的接口来处理所有API请求，具有以下核心功能：

- **请求统一管理**：统一的请求格式、错误处理和响应解析
- **自动缓存**：智能的缓存策略，提高应用性能
- **离线支持**：自动处理网络状态变化，支持离线请求队列
- **拦截器系统**：灵活的请求/响应拦截器
- **API注册机制**：集中管理所有API端点配置

## 基本用法

### 1. 初始化API客户端

```typescript
import { UnifiedApiClient } from './api/unified/apiClient';
import { CacheStrategy } from './api/enhancedApiClient';

// 创建API客户端实例
const apiClient = new UnifiedApiClient({
  baseUrl: 'https://api.example.com',
  defaultCacheStrategy: CacheStrategy.NETWORK_FIRST,
  defaultTimeout: 10000,
  enableRetries: true,
  maxRetries: 3,
  enableOfflineSupport: true
});

export default apiClient;
```

### 2. 注册API端点

```typescript
// 注册单个API
apiClient.registerApi('getRecipes', {
  endpoint: '/recipes',
  method: 'get',
  cacheStrategy: CacheStrategy.CACHE_FIRST,
  cacheTtl: 300 // 5分钟缓存
});

// 批量注册API
apiClient.registerApis({
  getRecipeDetail: {
    endpoint: '/recipes/:id',
    method: 'get',
    cacheStrategy: CacheStrategy.CACHE_FIRST
  },
  createRecipe: {
    endpoint: '/recipes',
    method: 'post',
    cacheStrategy: CacheStrategy.NETWORK_ONLY
  },
  updateRecipe: {
    endpoint: '/recipes/:id',
    method: 'put',
    cacheStrategy: CacheStrategy.NETWORK_ONLY
  },
  deleteRecipe: {
    endpoint: '/recipes/:id',
    method: 'delete',
    cacheStrategy: CacheStrategy.NETWORK_ONLY
  }
});
```

### 3. 调用API

```typescript
// 基本调用
const recipes = await apiClient.callApi('getRecipes');

// 带参数调用
const detail = await apiClient.callApi('getRecipeDetail', { id: 123 });

// 带选项调用
const newRecipe = await apiClient.callApi('createRecipe', 
  { name: '红烧肉', ingredients: ['猪肉', '酱油'] },
  { headers: { 'X-Custom-Header': 'value' } }
);
```

### 4. 处理响应与错误

```typescript
try {
  const response = await apiClient.callApi('getRecipes');
  
  // 成功响应
  console.log('数据:', response.data);
  console.log('是否来自缓存:', response.cacheInfo?.fromCache);
  console.log('状态码:', response.status);
  
} catch (error) {
  // 错误处理
  console.error('API错误:', error.message);
  console.error('状态码:', error.status);
  console.error('错误数据:', error.data);
}
```

## 高级特性

### 缓存管理

```typescript
// 清除所有缓存
apiClient.clearCache();

// 删除特定缓存
apiClient.removeFromCache('getRecipes?page=1');

// 使用标签批量失效缓存
apiClient.invalidateCacheByTags(['recipes', 'list']);
```

### 拦截器

```typescript
// 请求拦截器
const requestInterceptorId = apiClient.addRequestInterceptor(config => {
  // 添加认证头
  config.headers = { 
    ...config.headers,
    'Authorization': `Bearer ${getToken()}`
  };
  return config;
});

// 响应拦截器
const responseInterceptorId = apiClient.addResponseInterceptor(response => {
  // 转换响应数据
  response.data = transformData(response.data);
  return response;
});

// 错误拦截器
const errorInterceptorId = apiClient.addErrorInterceptor(error => {
  // 处理401错误
  if (error.status === 401) {
    // 刷新token或跳转到登录页
    redirectToLogin();
  }
  return Promise.reject(error);
});
```

### 离线支持

离线支持自动处理，无需额外代码。当网络中断时，API请求会被加入队列，等待网络恢复后自动重试。

```typescript
// 检查是否启用了离线支持
if (apiClient.isOfflineSupportEnabled()) {
  // 查看当前离线队列状态
  console.log('离线队列大小:', apiClient.getOfflineQueueSize());
}
```

## 与Zustand集成示例

```typescript
import { create } from 'zustand';
import apiClient from './apiClient';

// 创建食谱存储
const useRecipeStore = create((set, get) => ({
  recipes: [],
  loading: false,
  error: null,
  
  // 获取食谱列表
  fetchRecipes: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.callApi('getRecipes', params);
      set({ recipes: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  // 添加新食谱
  addRecipe: async (recipe) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.callApi('createRecipe', recipe);
      set({ 
        recipes: [...get().recipes, response.data],
        loading: false
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));

export default useRecipeStore;
```

## 模拟(Mock)数据支持

在开发阶段，可以使用模拟数据进行快速迭代。

```typescript
// 注册带模拟数据的API
apiClient.registerApi('getRecipes', {
  endpoint: '/recipes',
  method: 'get',
  mockData: [
    { id: 1, name: '红烧肉', ingredients: ['五花肉', '酱油', '糖'] },
    { id: 2, name: '清蒸鱼', ingredients: ['鲈鱼', '葱', '姜'] }
  ],
  // 只在开发环境使用模拟数据
  useMockInDev: true
});
```

## 性能优化

API层内置了多种性能优化措施：

1. **智能缓存**：减少不必要的网络请求
2. **请求合并**：合并短时间内相同的请求
3. **请求取消**：可自动取消重复请求
4. **预取数据**：支持提前获取可能需要的数据

```typescript
// 预取数据示例
apiClient.prefetch('getRecipeDetail', { id: 1 });
```

## 最佳实践

- 集中注册所有API，统一管理请求配置
- 使用适当的缓存策略减少网络请求
- 为相关API使用相同的缓存标签，便于批量操作
- 使用拦截器处理通用逻辑，如认证、错误处理
- 配合状态管理工具使用，如Zustand
- 适当使用模拟数据加速开发 