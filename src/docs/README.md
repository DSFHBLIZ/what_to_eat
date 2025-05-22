# 自动文档生成器使用说明

## 简介

自动文档生成器是一个从代码注释中提取信息并生成格式化文档的工具。该工具分析TypeScript/JavaScript源代码，识别函数、类、接口等结构以及相关的JSDoc注释，然后生成易于阅读的Markdown或HTML文档。

## 主要功能

- **从源代码提取文档**：自动从代码注释中提取API文档
- **多种输出格式**：支持Markdown、HTML和JSON格式
- **自动分组**：根据文件路径或自定义规则对API进行分组
- **内部链接解析**：自动识别和链接相关API
- **源代码引用**：生成指向源代码的链接
- **自定义模板**：支持自定义文档模板
- **命令行支持**：支持通过命令行生成文档

## 安装

首先确保项目中安装了必要的依赖：

```bash
npm install glob typescript --save-dev
```

## 使用方法

### 基本用法

```typescript
import { generateDocs, DocFormat } from '../utils/docGenerator';

// 快速生成文档
await generateDocs({
  title: '项目API文档',
  outputDir: './docs/api',
  include: ['src/**/*.ts'],
  exclude: ['**/*.spec.ts', '**/*.test.ts'],
  format: DocFormat.MARKDOWN
});
```

### 高级配置

```typescript
import { createDocConfig, DocGenerator, DocFormat } from '../utils/docGenerator';

// 创建配置
const config = createDocConfig({
  title: '项目API文档',
  outputDir: './docs/api',
  basePath: process.cwd(),
  include: ['src/**/*.ts'],
  exclude: ['**/*.spec.ts', '**/*.test.ts'],
  format: DocFormat.MARKDOWN,
  recursive: true,
  includePrivate: false,
  resolveInternalLinks: true,
  autoGroupByPath: true,
  generateIndex: true,
  formatOutput: true,
  includeSourceLink: true,
  sourceBaseUrl: 'https://github.com/yourusername/yourrepo/blob/main',
  groups: {
    '核心API': ['src/core/**/*.ts'],
    '工具函数': ['src/utils/**/*.ts'],
    '组件API': ['src/components/**/*.ts']
  },
  version: '1.0.0',
  header: '> 本文档由自动文档生成器生成，请勿手动修改。',
  footer: '© 2023 项目团队'
});

// 创建生成器实例
const generator = new DocGenerator(config);

// 生成文档
const outputFiles = await generator.generate();
console.log('生成的文档文件:', outputFiles);
```

### 命令行使用

可以通过命令行直接运行文档生成器：

```bash
# 使用环境变量配置
DOC_TITLE="项目API文档" DOC_OUTPUT_DIR="./docs/api" node src/utils/docGenerator.ts

# 或者通过 npm 脚本
# 在 package.json 中添加:
# "scripts": {
#   "generate-docs": "node src/utils/docGenerator.ts"
# }
npm run generate-docs
```

## JSDoc 注释规范

为了生成完整的文档，请在代码中遵循以下JSDoc注释规范：

```typescript
/**
 * 函数描述
 * @param param1 参数1描述
 * @param param2 参数2描述
 * @returns 返回值描述
 * @throws {ErrorType} 可能抛出的错误描述
 * @example
 * // 使用示例
 * const result = myFunction(1, 'test');
 * @deprecated 如果已废弃，添加废弃说明
 * @since 1.0.0 添加该功能的版本
 * @see otherFunction 相关函数引用
 */
function myFunction(param1: number, param2: string): ReturnType {
  // 函数实现
}
```

## 配置选项详解

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `include` | `string[]` | `['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']` | 要包含的文件模式 |
| `exclude` | `string[]` | `undefined` | 要排除的文件模式 |
| `outputDir` | `string` | `'./docs/api'` | 输出目录 |
| `format` | `DocFormat` | `DocFormat.MARKDOWN` | 输出格式 |
| `title` | `string` | `'项目API文档'` | 文档标题 |
| `basePath` | `string` | `process.cwd()` | 项目基础路径 |
| `recursive` | `boolean` | `true` | 是否递归处理子目录 |
| `includePrivate` | `boolean` | `false` | 是否包含私有成员 |
| `resolveInternalLinks` | `boolean` | `true` | 是否解析内部链接 |
| `autoGroupByPath` | `boolean` | `true` | 是否按路径自动分组 |
| `groups` | `Record<string, string[]>` | `undefined` | 自定义分组配置 |
| `version` | `string` | `undefined` | 文档版本号 |
| `generateIndex` | `boolean` | `true` | 是否生成索引文件 |
| `formatOutput` | `boolean` | `true` | 是否格式化输出 |
| `header` | `string` | `undefined` | 自定义文档头部 |
| `footer` | `string` | `undefined` | 自定义文档底部 |
| `includeSourceLink` | `boolean` | `true` | 是否包含源代码链接 |
| `sourceBaseUrl` | `string` | `undefined` | 源代码基础URL |

## 最佳实践

1. **规范注释格式**：遵循JSDoc规范编写注释
2. **示例代码**：为关键API提供示例代码
3. **参数描述**：详细描述每个函数参数的用途和类型
4. **分组API**：使用合理的分组结构组织API
5. **定期更新**：在代码变更后重新生成文档
6. **CI集成**：将文档生成集成到CI流程中

## 输出示例

生成的Markdown文档示例：

```markdown
# 核心API

## initialize

初始化应用程序核心功能。

```typescript
function initialize(options: InitOptions): Promise<boolean>
```

### 参数

- `options` **(InitOptions)** - 初始化选项对象

### 返回值

**(Promise<boolean>)** - 初始化是否成功的Promise

### 示例

```typescript
await initialize({ debug: true });
```

*定义在 `src/core/initialization.ts:25`*
```

## 故障排除

如果遇到问题，请检查：

1. 确认TypeScript和glob依赖已正确安装
2. 检查文件路径和包含/排除模式是否正确
3. 确保源代码中的JSDoc注释格式正确
4. 检查输出目录是否有写入权限
5. 对于大型代码库，考虑增加Node.js内存限制：`node --max-old-space-size=4096 src/utils/docGenerator.ts`

## 后续计划

1. 支持更多输出格式（如PDF、Vue组件文档）
2. 改进类型推断能力
3. 添加文档变更检测
4. 增强文档搜索功能
5. 提供交互式文档浏览界面 