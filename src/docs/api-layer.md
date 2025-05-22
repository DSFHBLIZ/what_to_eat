# API层详细文档

## 概述

API层是应用程序与后端服务通信的统一接口，提供了一套完整的请求管理、缓存策略、离线支持和错误处理机制。本文档详细介绍API层的主要组件、使用方法和最佳实践。

## 核心组件

### 1. 统一API客户端（UnifiedApiClient）

统一API客户端封装了底层HTTP请求实现，提供一致的接口进行网络通信。

```typescript
// 基本使用示例
import { createApiClient } from '@/api/unified/apiClient';

const apiClient = createApiClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
});

// 发起GET请求
const data = await apiClient.get('/recipes', { params: { limit: 10 } });

// 发起POST请求
const result = await apiClient.post('/recipes', { 
  name: '西红柿炒鸡蛋',
  ingredients: ['西红柿', '鸡蛋']
});
```

#### 主要特性

- **请求类型支持**：支持GET、POST、PUT、DELETE等标准HTTP方法
- **请求拦截**：可以在请求发送前进行修改或处理
- **响应拦截**：可以在响应返回后进行统一处理
- **取消请求**：支持取消正在进行的请求
- **超时控制**：可设置请求超时时间
- **重试机制**：可配置自动重试策略

### 2. 缓存管理（CacheManager）

缓存管理器提供了灵活的缓存策略，可有效减少重复请求并提升用户体验。

```typescript
// 配置带缓存的API客户端
const apiClient = createApiClient({
  baseUrl: 'https://api.example.com',
  cache: {
    enabled: true,
    strategy: CacheStrategy.CacheFirst,
    ttl: 600, // 缓存有效期，单位秒
    maxSize: 100 // 最多缓存项数
  }
});

// 使用缓存策略的请求
const recipes = await apiClient.get('/popular-recipes', {
  cache: {
    key: 'popular-recipes', // 自定义缓存键
    ttl: 300 // 覆盖默认TTL
  }
});
```

#### 缓存策略

缓存管理器支持以下策略：

1. **NetworkOnly**：始终从网络获取，不使用缓存
2. **CacheFirst**：优先使用缓存，如果缓存不存在或已过期则从网络获取
3. **NetworkFirst**：优先从网络获取，如果网络请求失败则使用缓存
4. **CacheOnly**：仅使用缓存，如果缓存不存在则失败
5. **StaleWhileRevalidate**：立即返回缓存（即使已过期），同时在后台更新缓存

### 3. 离线队列（OfflineQueue）

离线队列允许在网络不可用时将请求存储起来，并在网络恢复后自动执行。

```typescript
// 创建并配置离线队列
import { createOfflineQueue } from '@/api/offlineQueue';

const offlineQueue = createOfflineQueue({
  storageKey: 'app-offline-queue',
  maxRetries: 3,
  retryDelay: 5000, // 重试间隔（毫秒）
  batchSize: 3 // 同时处理的请求数
});

// 添加请求到离线队列
offlineQueue.addToQueue({
  url: '/recipes',
  method: 'POST',
  data: { name: '宫保鸡丁', ingredients: ['鸡肉', '花生'] },
  priority: 1 // 优先级（越小越优先）
});

// 监听队列事件
offlineQueue.on('processed', (result) => {
  console.log('请求处理完成', result);
});

offlineQueue.on('failed', (error) => {
  console.error('请求失败', error);
});

// 启动队列处理
offlineQueue.start();
```

#### 主要功能

- **持久化存储**：离线请求持久化到localStorage
- **优先级处理**：支持按优先级顺序处理请求
- **批量处理**：控制同时处理的请求数量
- **自动重试**：失败请求自动重试
- **事件通知**：提供处理状态事件通知
- **手动控制**：支持暂停、恢复和清空队列

### 4. 错误处理（ErrorHandler）

API层提供统一的错误处理机制，可捕获、转换和报告各类错误。

```typescript
// 使用错误处理
import { ApiError, NetworkError } from '@/api/unified/errors';

try {
  const data = await apiClient.get('/recipes/123');
  // 处理成功情况
} catch (error) {
  if (error instanceof ApiError) {
    // 处理API错误（4xx, 5xx状态码）
    console.error(`API错误: ${error.status} - ${error.message}`);
  } else if (error instanceof NetworkError) {
    // 处理网络错误（连接问题）
    console.error(`网络错误: ${error.message}`);
  } else {
    // 处理其他错误
    console.error(`未知错误: ${error}`);
  }
}
```

## 高级用法

### 请求拦截器

拦截器可用于添加认证信息、修改请求头或请求体等。

```typescript
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证头
    config.headers.Authorization = `Bearer ${getToken()}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 响应拦截器

响应拦截器可用于统一处理响应数据或错误。

```typescript
apiClient.interceptors.response.use(
  (response) => {
    // 提取API响应中的data字段
    return response.data;
  },
  (error) => {
    // 处理401错误，可能需要刷新token或重定向到登录页
    if (error.status === 401) {
      // 刷新token逻辑
    }
    return Promise.reject(error);
  }
);
```

### 请求防抖和节流

对于频繁触发的请求，可以使用防抖和节流功能：

```typescript
// 使用防抖，仅执行最后一次调用
const debouncedSearch = apiClient.debounce(
  (query) => apiClient.get('/search', { params: { q: query } }),
  300 // 延迟毫秒数
);

// 使用节流，限制调用频率
const throttledRefresh = apiClient.throttle(
  () => apiClient.get('/refresh-data'),
  1000 // 间隔毫秒数
);
```

## 性能优化

### 1. 请求合并

当多个组件同时请求相同资源时，API客户端会自动合并这些请求，减少网络开销：

```typescript
// 组件A和B同时发起相同请求
// 实际只会发出一次网络请求
const dataA = apiClient.get('/recipes/popular');
const dataB = apiClient.get('/recipes/popular');
```

### 2. 预加载

可以使用预加载功能提前获取可能需要的数据：

```typescript
// 预加载可能需要的数据
apiClient.preload('/recipes/categories');
```

### 3. 选择性缓存失效

针对特定资源更新缓存，而不是清空整个缓存：

```typescript
// 使特定缓存项失效
apiClient.invalidateCache('/recipes/123');

// 使匹配模式的所有缓存项失效
apiClient.invalidateCache('/recipes/*');
```

## 最佳实践

1. **集中管理API客户端**：创建一个中心配置，应用全局共享一个API客户端实例
2. **错误处理策略**：开发明确的错误处理策略，包括重试、降级和用户通知
3. **合理使用缓存**：根据数据更新频率选择合适的缓存策略和TTL
4. **资源模型化**：为不同类型的资源创建专门的服务类，封装特定资源的API操作
5. **监控和日志**：添加监控和日志记录，追踪API性能和错误率

## 示例：完整的API服务实现

```typescript
// src/services/recipeService.ts
import { apiClient } from '@/api/client';

export class RecipeService {
  // 获取食谱列表
  async getRecipes(params) {
    return apiClient.get('/recipes', { params });
  }
  
  // 获取单个食谱
  async getRecipeById(id) {
    return apiClient.get(`/recipes/${id}`, {
      cache: {
        strategy: CacheStrategy.CacheFirst,
        ttl: 3600 // 缓存1小时
      }
    });
  }
  
  // 创建新食谱
  async createRecipe(recipeData) {
    return apiClient.post('/recipes', recipeData, {
      offline: {
        enabled: true,
        priority: 1
      }
    });
  }
  
  // 更新食谱
  async updateRecipe(id, recipeData) {
    return apiClient.put(`/recipes/${id}`, recipeData);
  }
  
  // 删除食谱
  async deleteRecipe(id) {
    return apiClient.delete(`/recipes/${id}`);
  }
  
  // 搜索食谱
  async searchRecipes(query, filters) {
    return apiClient.get('/recipes/search', {
      params: { query, ...filters },
      debounce: 300 // 添加防抖
    });
  }
}

// 创建全局单例
export const recipeService = new RecipeService();
```

通过以上完整示例，可以看到API层如何组织和简化与后端的交互，同时提供灵活的缓存、离线支持和错误处理。 