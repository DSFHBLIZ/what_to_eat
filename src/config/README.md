# 配置中心

本目录包含项目的所有配置架构和常量定义，实现了配置与业务逻辑的解耦。

## 配置架构

### 1. 筛选器配置 `filterSchema.ts`

定义了筛选组件所需的配置架构，包括：
- 食材选项
- 菜系选项
- 难度选项
- 烹饪方法选项
- 口味选项
- 饮食限制选项

提供的辅助函数：
- `getFilterOptions`: 获取指定筛选器的选项列表
- `generateDefaultValues`: 根据架构生成默认值

```typescript
import { FILTER_SCHEMA, getFilterOptions } from '../config';

// 获取菜系选项
const cuisineOptions = getFilterOptions('cuisine');
```

### 2. 验证消息配置 `validationSchema.ts`

定义了表单验证消息的配置架构，包括：
- 必填项验证
- 长度验证
- 数值范围验证
- 格式验证
- 密码验证
- 文件验证
- 日期验证

提供的辅助函数：
- `getValidationMessage`: 获取指定验证规则的消息
- `getFieldLabel`: 获取字段标签

```typescript
import { getValidationMessage } from '../config';

// 获取必填错误消息
const requiredMessage = getValidationMessage('required', { label: '用户名' });
```

### 3. 主题配置 `themeSchema.ts`

定义了主题系统的配置架构，包括：
- 颜色系统
- 间距系统
- 断点系统
- 排版系统
- 过渡效果
- 阴影系统

提供的辅助函数：
- `validateTheme`: 验证主题是否符合架构
- `createDefaultTheme`: 创建默认主题

```typescript
import { createDefaultTheme } from '../config';

// 创建自定义主题
const darkTheme = {
  ...createDefaultTheme(),
  name: 'dark',
  colors: {
    // 自定义颜色...
  }
};
```

## 统一配置入口 `index.ts`

提供集中的配置访问入口，导出：
- 所有配置架构
- 环境配置
- 缓存配置
- 应用常量
- 错误码映射
- 辅助函数

```typescript
import { Config } from '../config';

// 判断当前环境
if (Config.isDev()) {
  // 开发环境代码
}
```

## 使用指南

### 1. 添加新的配置项

要添加新的配置，在相应的配置架构文件中添加定义：

```typescript
// 在 filterSchema.ts 中添加新的筛选选项
export const FILTER_SCHEMA = {
  // 现有配置...
  
  // 新增配置
  newFilter: {
    type: 'enum',
    label: '新筛选器',
    i18nKey: 'filters.newFilter',
    options: [
      { value: 'option1', label: '选项1' },
      { value: 'option2', label: '选项2' }
    ]
  }
};
```

### 2. 配置的国际化

所有配置都可以关联国际化键，通过 `i18nKey` 属性指定。

```typescript
// 筛选器配置中的国际化键
cuisine: {
  type: 'enum',
  label: '菜系',
  i18nKey: 'filters.cuisine',
  // ...
}
```

### 3. 动态生成表单和验证

可以基于配置架构自动生成表单控件和验证规则。

```typescript
// 根据筛选器配置生成表单控件
Object.entries(FILTER_SCHEMA).forEach(([key, schema]) => {
  if (schema.type === 'enum') {
    // 生成下拉框
  } else if (schema.type === 'range') {
    // 生成滑块
  }
});
```

## 扩展与维护

添加新的配置时，遵循以下原则：
1. 保持配置与业务逻辑分离
2. 为所有配置提供类型定义
3. 提供辅助函数以方便访问配置
4. 关联国际化键以支持多语言 