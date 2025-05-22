# 统一UI组件库

本文档描述了What_to_eat_Web项目中的统一UI组件库，这些组件旨在减少样式重复和变体控制混乱，提供一致的用户界面。

## 标题组件 `TitleUI`

统一的标题组件，替代 PageTitle、SectionTitle 和各处重复的标题样式。

### 使用方法

```tsx
import TitleUI from '../components/ui/TitleUI';

// 页面标题
<TitleUI level="h1" variant="page">页面标题</TitleUI>

// 章节标题
<TitleUI level="h2" variant="section">章节标题</TitleUI>

// 卡片标题
<TitleUI level="h3" variant="card">卡片标题</TitleUI>

// 自定义大小和粗细
<TitleUI level="h2" size="3xl" weight="semibold">自定义标题</TitleUI>
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| level | 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' | 'h2' | HTML标签级别 |
| variant | 'default' \| 'page' \| 'section' \| 'card' \| 'subtitle' | 'default' | 标题类型 |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' | 根据level和variant自动设置 | 字体大小 |
| weight | 'normal' \| 'medium' \| 'semibold' \| 'bold' | 'bold' | 字体粗细 |
| withMargin | boolean | true | 是否添加底部边距 |
| className | string | '' | 额外的CSS类名 |

## 骨架加载组件 `SkeletonLoader`

统一的骨架加载器组件，替代 LoadingSpinner、RecipeListSkeleton、RecipeSkeleton、RecipeDetailSkeleton 等加载组件。

### 使用方法

```tsx
import SkeletonLoader from '../components/ui/SkeletonLoader';

// 加载旋转器
<SkeletonLoader type="spinner" />

// 列表骨架屏
<SkeletonLoader type="list" count={6} />

// 详情页骨架屏
<SkeletonLoader type="detail" />

// 文本骨架屏
<SkeletonLoader type="text" count={4} />

// 图片骨架屏
<SkeletonLoader type="image" size="full" />

// 自定义颜色
<SkeletonLoader type="spinner" color="blue" />
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | 'spinner' \| 'list' \| 'card' \| 'detail' \| 'text' \| 'image' \| 'combined' | 'spinner' | 骨架屏类型 |
| size | 'sm' \| 'md' \| 'lg' \| 'full' | 'md' | 骨架屏大小 |
| color | 'gray' \| 'blue' \| 'green' \| 'custom' | 'gray' | 骨架屏颜色 |
| count | number | 3 | 要显示的项目数量（用于列表类型） |
| animate | boolean | true | 是否添加脉冲动画 |
| showText | boolean | true for 'spinner', false for others | 是否显示文本 |
| text | string | '加载中...' | 加载文本 |
| className | string | '' | 额外的CSS类名 |

## 标签组件体系

项目使用统一的标签组件体系，替代原有的 Badge、TagUI、IngredientTag、FilterTag、FlavorTag、DifficultyBadge 等组件。

### 组件层次结构

- **BaseTag**: 最底层的基础组件，处理核心样式和交互逻辑
- **Tag**: 轻量级的BaseTag封装，适用于简单标签场景
- **TagWrapper**: 功能完整的标签组件，推荐大多数场景使用

### 使用 TagWrapper（推荐）

```tsx
import TagWrapper from '../components/ui/TagWrapper';

// 食材标签 - 必选
<TagWrapper 
  label="土豆" 
  type="ingredient-required" 
  color="blue"
  onRemove={() => handleRemove('土豆')}
/>

// 食材标签 - 可选
<TagWrapper 
  label="大蒜" 
  type="ingredient-optional" 
  color="green"
  onRemove={() => handleRemove('大蒜')}
/>

// 筛选标签
<TagWrapper 
  label="川菜" 
  type="filter" 
  color="blue"
  isSelected={selectedCuisine === '川菜'}
  onClick={() => handleCuisineClick('川菜')}
/>

// 徽章标签
<TagWrapper 
  label="难度" 
  value="中等" 
  type="badge" 
  badgeVariant="difficulty"
  showLabel={true}
/>

// 自定义标签
<TagWrapper 
  label="自定义标签" 
  type="custom"
  color="purple" 
  customColors={{
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200'
  }}
/>
```

### 使用 Tag（轻量级选项）

```tsx
import Tag from '../components/ui/Tag';

// 简单标签
<Tag 
  label="标签文本" 
  color="blue"
/>

// 可点击标签
<Tag 
  label="点击我" 
  onClick={() => alert('点击了标签')}
/>

// 带删除按钮的标签
<Tag 
  label="可删除标签" 
  onRemove={() => handleRemove()}
/>

// 带图标的标签
<Tag 
  label="图标标签" 
  iconElement={<CheckIcon className="mr-1" />}
/>
```

Tag组件只提供基本属性，不支持类型切换、选中状态等高级功能。它适用于简单的展示场景。

### Tag 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| label | string | 必填 | 标签文本 |
| value | string | undefined | 标签值 |
| color | 'blue' \| 'green' \| 'red' \| 'amber' \| 'purple' \| 'gray' \| 'custom' | 'blue' | 标签颜色 |
| iconElement | React.ReactNode | undefined | 图标元素 |
| onRemove | () => void | undefined | 移除标签的回调函数 |
| onClick | () => void | undefined | 点击标签的回调函数 |
| size | 'sm' \| 'md' \| 'lg' | 'md' | 标签大小 |
| rounded | boolean | true | 是否圆角 |
| className | string | '' | 额外的CSS类名 |

### TagWrapper 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| label | string | 必填 | 标签文本 |
| value | string | undefined | 标签值（用于徽章类型） |
| type | TagType | 'custom' | 标签类型 |
| badgeVariant | 'flavor' \| 'method' \| 'cuisine' \| 'difficulty' \| 'custom' | 'custom' | 徽章变体 |
| color | 'blue' \| 'green' \| 'red' \| 'amber' \| 'purple' \| 'gray' \| 'custom' | 'blue' | 标签颜色 |
| isSelected | boolean | false | 是否选中 |
| onRemove | () => void | undefined | 移除标签的回调函数 |
| onClick | () => void | undefined | 点击标签的回调函数 |
| onTypeChange | (newType: TagType) => void | undefined | 切换标签类型的回调函数 |
| showIcon | boolean | 自动判断 | 是否显示图标 |
| customIcon | React.ReactNode | undefined | 自定义图标 |
| size | 'sm' \| 'md' \| 'lg' | 'md' | 标签大小 |
| showLabel | boolean | true | 是否显示标签文本（用于带值的徽章） |
| className | string | '' | 额外的CSS类名 |

## 迁移指南

### 从 PageTitle 迁移到 TitleUI

```tsx
// 旧代码
import PageTitle from '../components/PageTitle';
<PageTitle>页面标题</PageTitle>

// 新代码
import TitleUI from '../components/ui/TitleUI';
<TitleUI level="h1" variant="page">页面标题</TitleUI>
```

### 从 LoadingSpinner 迁移到 SkeletonLoader

```tsx
// 旧代码
import LoadingSpinner from '../components/LoadingSpinner';
<LoadingSpinner size="lg" color="blue" />

// 新代码
import SkeletonLoader from '../components/ui/SkeletonLoader';
<SkeletonLoader type="spinner" size="lg" color="blue" />
```

### 从 RecipeListSkeleton 迁移到 SkeletonLoader

```tsx
// 旧代码
import RecipeListSkeleton from '../components/RecipeListSkeleton';
<RecipeListSkeleton count={6} />

// 新代码
import SkeletonLoader from '../components/ui/SkeletonLoader';
<SkeletonLoader type="list" count={6} />
```

### 从 Badge、IngredientTag、FilterTag等标签组件迁移到 TagWrapper

```tsx
// 旧代码 - Badge
import Badge from '../components/ui/Badge';
<Badge label="标签" color="green" onRemove={handleRemove} />

// 旧代码 - IngredientTag
import IngredientTag from '../components/ui/IngredientTag';
<IngredientTag 
  label="土豆" 
  type="required" 
  onRemove={handleRemove} 
/>

// 旧代码 - SelectableTagUI
import { FilterTag } from '../components/ui/SelectableTagUI';
<FilterTag 
  label="川菜" 
  isSelected={true} 
  onSelect={handleSelect} 
/>

// 新代码 - 统一使用 TagWrapper
import TagWrapper from '../components/ui/TagWrapper';

// 替代Badge
<TagWrapper label="标签" color="green" onRemove={handleRemove} />

// 替代IngredientTag
<TagWrapper 
  label="土豆" 
  type="ingredient-required" 
  onRemove={handleRemove} 
/>

// 替代FilterTag
<TagWrapper 
  label="川菜" 
  type="filter" 
  color="blue" 
  isSelected={true} 
  onClick={handleSelect} 
/>
```

## 样式复用和扩展

这些组件设计为高度可定制，可以通过props进行配置。如果需要更多样式变体或功能，可以按照以下方式扩展：

1. 为TagWrapper添加新的类型或变体
2. 为SkeletonLoader添加新的骨架类型
3. 为TitleUI添加新的标题变体 