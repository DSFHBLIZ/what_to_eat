# 重构总结：三层架构实现

## 重构目标

根据DDD-lite思路，将原本混在一起的"数据状态 + 业务逻辑 + UI交互"分离成三个清晰的层次，以解决以下问题：

1. 逻辑层次混乱
2. 重复逻辑难以维护
3. 测试困难
4. 修改一处波及多文件
5. 功能扩展容易失控

## 架构设计

遵循三层架构原则：

1. **领域层（Domain）**：纯函数、状态逻辑、权限规则、验证规则
2. **控制器层（Controller）**：提供交互方法、封装副作用
3. **UI层（Hook/Context）**：提供组件订阅数据、用于渲染和交互

## 重构内容

### 1. 目录结构调整

创建了清晰的目录结构：

```
src/
├── domain/             # 领域层
│   ├── validation/     # 验证规则
│   └── auth/           # 权限和认证
├── controllers/        # 控制器层
└── contexts/           # UI上下文层
    └── hooks/          # UI钩子层
```

### 2. 领域层实现

将纯逻辑和业务规则移动到领域层：

- `domain/validation/validators.ts`：基础验证器
- `domain/validation/formValidation.ts`：表单验证核心逻辑
- `domain/validation/formValidationExtended.ts`：扩展表单验证
- `domain/validation/recipeValidation.ts`：食谱验证
- `domain/auth/permissions.ts`：权限规则

### 3. 控制器层实现

控制器封装了业务逻辑和副作用，提供给UI层调用：

- `controllers/useSearchController.ts`：搜索控制器
- `controllers/useFormController.ts`：表单控制器

### 4. UI层实现

UI层专注于界面渲染和交互逻辑：

- `contexts/SearchContext.tsx`：搜索上下文，使用SearchController
- `hooks/useForm.tsx`：表单Hook，使用FormController

### 5. 删除冗余文件

删除了原来混乱架构中的文件：

- `validation/validators.ts`
- `validation/formValidation.ts`
- `validation/formValidationExtended.ts`
- `validation/recipeValidation.ts`
- `validation/zustandIntegration.ts`
- `validation/index.ts`
- `auth/permissions.ts`
- `auth/authStore.ts`
- `hooks/useSearchController.ts`

### 6. 更新导入路径

更新了所有引用这些模块的代码，使其指向新的领域层或控制器层路径。

## 重构效果

1. **逻辑清晰**：每层都有明确的职责和边界
2. **代码复用**：领域层逻辑可以被多个控制器和UI组件复用
3. **易于测试**：纯函数和业务逻辑集中在领域层，易于单元测试
4. **变更隔离**：UI变化不会影响业务逻辑，业务逻辑变化不需要修改UI
5. **可维护性**：功能扩展遵循清晰的模式，不会失控

## 后续工作

1. 编写单元测试，特别是针对领域层的逻辑
2. 继续完善文档，方便团队理解新架构
3. 根据实际使用情况优化API设计

# 配置中心与语义数据层重构

## 问题描述

项目中的配置常量与功能逻辑耦合，导致以下问题：

- 硬编码常量散落在业务逻辑文件中
- 各类常量（如筛选条件、验证消息、主题定义）被当作配置使用，却无法复用
- 重复定义导致代码冗余和维护困难
- 配置改变需要修改多处代码

## 解决方案

构建"配置中心"和"语义数据层"，实现配置与逻辑的解耦。

### 架构设计

1. **配置架构定义**
   - 创建各类配置的架构定义（Schema）
   - 为每种配置定义清晰的类型和结构
   - 提供自描述的元数据（如标签、描述、验证规则等）

2. **中心化管理**
   - 集中管理所有配置常量
   - 提供统一的访问接口
   - 减少重复定义和冗余代码

3. **国际化集成**
   - 配置与国际化键值关联
   - 提供多语言支持
   - 简化国际化工作流程

## 实现细节

### 1. 配置架构模块

创建了以下核心架构文件：

- `src/config/filterSchema.ts`: 筛选器配置架构
- `src/config/validationSchema.ts`: 验证消息配置架构
- `src/config/themeSchema.ts`: 主题配置架构
- `src/config/index.ts`: 配置中心入口

每个架构文件包括：
- 类型定义
- 配置常量
- 辅助函数
- 验证逻辑

### 2. 国际化键值系统

创建了标准化的国际化键值系统：

- `src/i18n/keys.ts`: 定义所有国际化键
- 更新了 `src/i18n/index.ts`: 集成新的键值系统

## 使用示例

### 1. 筛选器配置

```typescript
// 旧方式
import { CUISINE_OPTIONS } from '../config/filterConstants';

// 新方式
import { FILTER_SCHEMA, getFilterOptions } from '../config';

const cuisineOptions = getFilterOptions('cuisine');
```

### 2. 验证消息

```typescript
// 旧方式
import { getValidationMessage } from '../config/validationSchema';
const requiredMessage = getValidationMessage('required', { label: '用户名' });

// 新方式
import { ErrorKey, getErrorMessage } from '../i18n/errorMessages';
const requiredMessage = getErrorMessage(ErrorKey.DATA_INVALID, { field: '用户名' });
```

### 3. 主题配置

```typescript
// 旧方式
import darkTheme from '../theme/darkTheme';

// 新方式
import { createDefaultTheme } from '../config';
const darkTheme = {
  ...createDefaultTheme(),
  name: 'dark',
  colors: {
    // 自定义颜色
  }
};
```

## 优势

1. **一次性配置多处使用**
   - 筛选UI、验证、表单、国际化可共用一份schema
   - 减少重复代码和维护成本

2. **配置集中管理**
   - 修改配置只需在一处进行
   - 避免配置不一致

3. **自动化能力**
   - 根据schema自动生成校验器
   - 自动生成表单控件
   - 自动生成默认值
   - 自动关联国际化键

4. **类型安全**
   - 提供完整的类型定义
   - 在编译时捕获潜在错误

5. **扩展性**
   - 轻松添加新的配置项
   - 无需修改现有代码结构

## 后续工作

1. 进一步迁移现有代码到新的配置架构
2. 创建更多辅助工具，简化配置使用
3. 实现配置的运行时验证
4. 考虑支持配置的动态加载和热更新 
3. 根据实际使用情况优化API设计 

## 维度一：原子组件级别冗余优化（2023年7月10日）

### 问题描述

原子组件级别存在样式逻辑和UI表现重叠，导致代码冗余和维护困难。

### 优化组件

1. **Tag相关组件**
   - 问题：Tag.tsx, TagUI.tsx, SelectableTagUI.tsx 都涉及"标签样式 + 状态"处理，存在颜色/尺寸/交互重复逻辑
   - 优化：创建统一的 BaseTag 组件作为基础，简化Tag组件结构，删除冗余的TagUI和SelectableTagUI
   - 结果：形成清晰的三层结构：
     - BaseTag：核心UI组件，处理样式和基本交互
     - Tag：轻量级包装，只保留最基本属性，适用于简单场景
     - TagWrapper：功能完整组件，提供所有高级功能，适用于复杂场景

2. **Button相关组件**
   - 问题：Button.tsx, ButtonUI.tsx 封装层和样式层分离不彻底，重复定义 loading, disabled, icon 等状态
   - 优化：将核心样式逻辑集中于 ButtonUI.tsx，Button.tsx 仅做 props 控制和行为封装

3. **Skeleton相关组件**
   - 问题：Skeleton.tsx, SkeletonLoader.tsx 存在"骨架通用样式"和"特定布局"重复封装
   - 优化：删除Skeleton.tsx，将所有功能集成到 SkeletonLoader 组件中

### 实施步骤

1. **组件结构重构**
   - 创建 BaseTag.tsx 作为标签组件核心，提供完整的样式和交互基础
   - 简化 Tag.tsx，将复杂的图标和交互逻辑移至单独的 TagWrapper.tsx
   - 删除冗余的 TagUI.tsx 和 SelectableTagUI.tsx，保持组件结构简洁
   - 修改所有组件引用，直接使用TagWrapper代替特化组件
   - 删除不必要的 Skeleton.tsx，集成到 SkeletonLoader.tsx

2. **引用更新**
   - 更新所有使用已重构组件的地方
   - 替换组件引用路径和属性用法
   - 确保组件接口的一致性
   - 采用直接引用而非兼容层，避免代码冗余

3. **代码清理**
   - 删除不必要的hooks（useSkeletonLayout.ts）
   - 确保不存在残留的冗余代码
   - 从源头删除所有已废弃组件

### 优化效果

1. **代码重用度提高**：核心样式和交互逻辑只在一个地方定义
2. **维护成本降低**：修改样式或行为时只需更改一个组件
3. **使用一致性增强**：所有使用该组件的地方行为一致
4. **开发效率提升**：新功能开发可以复用已有组件，无需重复实现基础功能
5. **代码体积减少**：通过删除冗余组件和合并相似功能，减少了代码量
6. **组件清晰分层**：形成了清晰的组件层次结构，每层职责明确

### 使用建议

1. **对新代码**：
   - 使用 TagWrapper 作为主要标签组件，提供全套功能
   - 对极简场景使用 Tag，它只提供最基本的标签功能
   - 避免直接使用 BaseTag（除非有特殊需求）

2. **对旧代码**：
   - 全部迁移到新组件体系
   - 不保留兼容层，彻底清理旧组件

后续可继续审查其他原子组件，寻找类似的优化机会。 