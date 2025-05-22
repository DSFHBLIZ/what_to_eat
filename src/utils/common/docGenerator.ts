/**
 * 自动文档生成器
 * 用于从代码注释中自动生成API文档和使用指南
 */

import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';

// 简单的路径匹配函数，用于替代minimatch
function simplePathMatch(filepath: string, pattern: string): boolean {
  // 将glob模式转换为正则表达式
  const regex = new RegExp(
    `^${pattern.replace(/\*/g, '.*').replace(/\?/g, '.')}$`,
    'i'
  );
  return regex.test(filepath);
}

// 支持的文档格式
export enum DocFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  JSON = 'json'
}

// 文档节点类型
export enum DocNodeType {
  FUNCTION = 'function',
  CLASS = 'class',
  INTERFACE = 'interface',
  TYPE = 'type',
  ENUM = 'enum',
  CONST = 'const',
  VARIABLE = 'variable',
  NAMESPACE = 'namespace',
  MODULE = 'module'
}

// 文档节点结构
export interface DocNode {
  name: string;
  type: DocNodeType;
  description: string;
  signature?: string;
  params?: Array<{
    name: string;
    type: string;
    description: string;
    optional: boolean;
    defaultValue?: string;
  }>;
  returns?: {
    type: string;
    description: string;
  };
  examples?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
  since?: string;
  see?: string[];
  throws?: Array<{
    type: string; 
    description: string;
  }>;
  filePath: string;
  lineNumber: number;
  modifiers?: string[];
  children?: DocNode[];
}

// 文档生成配置
export interface DocGeneratorConfig {
  // 要包含的文件模式
  include: string[];
  // 要排除的文件模式
  exclude?: string[];
  // 输出目录
  outputDir: string;
  // 输出格式
  format: DocFormat;
  // 标题
  title: string;
  // 项目基础路径
  basePath: string;
  // 是否递归子目录
  recursive?: boolean;
  // 是否包含私有成员
  includePrivate?: boolean;
  // 是否使用连接内部链接
  resolveInternalLinks?: boolean;
  // 是否自动分类API
  autoGroupByPath?: boolean;
  // 自定义分组
  groups?: Record<string, string[]>;
  // 版本号
  version?: string;
  // 是否生成索引文件
  generateIndex?: boolean;
  // 自定义模板路径
  templatePath?: string;
  // 是否格式化输出
  formatOutput?: boolean;
  // 自定义头部内容
  header?: string;
  // 自定义底部内容
  footer?: string;
  // 是否包含源代码链接
  includeSourceLink?: boolean;
  // 源代码基础URL
  sourceBaseUrl?: string;
}

/**
 * 文档生成器类
 * 负责从源代码提取文档信息并生成文档
 */
export class DocGenerator {
  private config: DocGeneratorConfig;
  private docNodes: DocNode[] = [];
  private fileContents: Record<string, string> = {};

  /**
   * 创建文档生成器实例
   * @param config 文档生成配置
   */
  constructor(config: DocGeneratorConfig) {
    this.config = {
      // 默认配置
      recursive: true,
      includePrivate: false,
      resolveInternalLinks: true,
      autoGroupByPath: true,
      generateIndex: true,
      formatOutput: true,
      includeSourceLink: true,
      ...config,
    };
  }

  /**
   * 开始生成文档
   * @returns 返回生成的文件路径数组
   */
  public async generate(): Promise<string[]> {
    // 收集文件路径
    const filePaths = await this.collectFiles();
    
    console.log(`找到 ${filePaths.length} 个文件需要处理`);
    if (filePaths.length === 0) {
      console.log('没有找到匹配的文件，请检查include和exclude配置');
      return [];
    }
    
    // 解析文件内容
    await this.parseFiles(filePaths);
    
    // 分组文档节点
    const groupedNodes = this.groupNodes();
    
    // 生成文档
    const outputFiles = await this.generateOutput(groupedNodes);
    
    // 生成索引文件
    if (this.config.generateIndex) {
      outputFiles.push(await this.generateIndexFile(groupedNodes));
    }
    
    console.log(`文档生成完成，共生成 ${outputFiles.length} 个文件`);
    return outputFiles;
  }

  /**
   * 收集需要处理的文件路径
   * @returns 文件路径数组
   */
  private async collectFiles(): Promise<string[]> {
    const { include, exclude = [], recursive, basePath } = this.config;
    
    let allFiles: string[] = [];
    
    // 收集包含的文件
    for (const pattern of include) {
      const files = await glob(pattern, {
        cwd: basePath,
        absolute: true,
        ignore: exclude,
        nodir: true,
      });
      allFiles = [...allFiles, ...files];
    }
    
    return Array.from(new Set(allFiles));
  }
  
  /**
   * 解析文件并提取文档信息
   * @param filePaths 文件路径数组
   */
  private async parseFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        // 读取文件内容
        const content = await fs.promises.readFile(filePath, 'utf-8');
        this.fileContents[filePath] = content;
        
        // 使用TypeScript编译器API解析文件
        const sourceFile = ts.createSourceFile(
          filePath,
          content,
          ts.ScriptTarget.Latest,
          true
        );
        
        const docNodes = this.extractDocNodes(sourceFile, filePath);
        this.docNodes.push(...docNodes);
      } catch (error) {
        console.error(`解析文件 ${filePath} 时出错:`, error);
      }
    }
  }
  
  /**
   * 从TypeScript源文件提取文档节点
   * @param sourceFile TypeScript源文件
   * @param filePath 文件路径
   * @returns 文档节点数组
   */
  private extractDocNodes(sourceFile: ts.SourceFile, filePath: string): DocNode[] {
    const nodes: DocNode[] = [];
    // 实现从AST中提取信息的逻辑
    // 这里需要根据不同的节点类型进行处理
    
    // 遍历AST提取文档信息的功能将在这里实现
    
    // 简单提取文件描述作为示例
    const fileDocComment = ts.getLeadingCommentRanges(sourceFile.getFullText(), 0)?.[0];
    if (fileDocComment) {
      const commentText = sourceFile.getFullText().substring(fileDocComment.pos, fileDocComment.end);
      const description = commentText
        .replace(/\/\*\*|\*\/|\*/g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');

      nodes.push({
        name: path.basename(filePath, path.extname(filePath)),
        type: DocNodeType.MODULE,
        description,
        filePath,
        lineNumber: 1
      });
    }
    
    // 这里可以递归遍历AST，提取更多信息
    
    return nodes;
  }
  
  /**
   * 将文档节点按照配置分组
   * @returns 分组后的文档节点
   */
  private groupNodes(): Record<string, DocNode[]> {
    const { autoGroupByPath, groups } = this.config;
    const groupedNodes: Record<string, DocNode[]> = {};
    
    if (autoGroupByPath) {
      // 按文件路径分组
      this.docNodes.forEach(node => {
        const relativePath = path.relative(this.config.basePath, node.filePath);
        const dir = path.dirname(relativePath);
        
        if (!groupedNodes[dir]) {
          groupedNodes[dir] = [];
        }
        
        groupedNodes[dir].push(node);
      });
    }
    
    if (groups) {
      // 按自定义组分组
      Object.entries(groups).forEach(([groupName, patterns]) => {
        if (!groupedNodes[groupName]) {
          groupedNodes[groupName] = [];
        }
        
        patterns.forEach(pattern => {
          const matchingNodes = this.docNodes.filter(node => {
            const relativePath = path.relative(this.config.basePath, node.filePath);
            return simplePathMatch(relativePath, pattern);
          });
          
          groupedNodes[groupName].push(...matchingNodes);
        });
      });
    }
    
    if (Object.keys(groupedNodes).length === 0) {
      // 如果没有分组，则所有节点放在一起
      groupedNodes['API'] = this.docNodes;
    }
    
    return groupedNodes;
  }
  
  /**
   * 生成文档输出
   * @param groupedNodes 分组后的文档节点
   * @returns 生成的文件路径数组
   */
  private async generateOutput(groupedNodes: Record<string, DocNode[]>): Promise<string[]> {
    const { outputDir, format } = this.config;
    const outputFiles: string[] = [];
    
    // 确保输出目录存在
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // 为每个组生成文档
    for (const [groupName, nodes] of Object.entries(groupedNodes)) {
      if (nodes.length === 0) continue;
      
      const outputContent = await this.renderDocumentation(nodes, groupName);
      const sanitizedGroupName = groupName.replace(/[\/\\]/g, '-');
      const fileName = `${sanitizedGroupName}.${this.getFileExtension()}`;
      const outputPath = path.join(outputDir, fileName);
      
      await fs.promises.writeFile(outputPath, outputContent);
      outputFiles.push(outputPath);
    }
    
    return outputFiles;
  }
  
  /**
   * 生成索引文件
   * @param groupedNodes 分组后的文档节点
   * @returns 生成的索引文件路径
   */
  private async generateIndexFile(groupedNodes: Record<string, DocNode[]>): Promise<string> {
    const { outputDir, title, version, format } = this.config;
    
    let indexContent = '';
    
    switch (format) {
      case DocFormat.MARKDOWN:
        indexContent = `# ${title}${version ? ` v${version}` : ''}\n\n`;
        indexContent += `## 目录\n\n`;
        
        for (const groupName of Object.keys(groupedNodes)) {
          const sanitizedGroupName = groupName.replace(/[\/\\]/g, '-');
          const fileName = `${sanitizedGroupName}.md`;
          indexContent += `- [${groupName}](./${fileName})\n`;
        }
        break;
        
      case DocFormat.HTML:
        // HTML索引文件实现
        break;
        
      case DocFormat.JSON:
        // JSON索引文件实现
        break;
    }
    
    const indexPath = path.join(outputDir, `index.${this.getFileExtension()}`);
    await fs.promises.writeFile(indexPath, indexContent);
    
    return indexPath;
  }
  
  /**
   * 渲染文档内容
   * @param nodes 文档节点数组
   * @param groupName 组名
   * @returns 渲染后的文档内容
   */
  private async renderDocumentation(nodes: DocNode[], groupName: string): Promise<string> {
    const { format, title, header, footer, formatOutput } = this.config;
    
    let content = '';
    
    switch (format) {
      case DocFormat.MARKDOWN:
        content = `# ${groupName}\n\n`;
        
        if (header) {
          content += `${header}\n\n`;
        }
        
        // 渲染每个节点
        for (const node of nodes) {
          content += this.renderNodeToMarkdown(node);
          content += '\n\n';
        }
        
        if (footer) {
          content += `\n\n${footer}`;
        }
        break;
        
      case DocFormat.HTML:
        // HTML格式实现
        break;
        
      case DocFormat.JSON:
        // JSON格式实现
        break;
    }
    
    // 格式化输出
    if (formatOutput) {
      try {
        // 简单格式化，不使用prettier库
        content = this.simpleFormat(content, format);
      } catch (error) {
        console.warn('格式化文档内容失败:', error);
      }
    }
    
    return content;
  }
  
  /**
   * 简单的格式化函数，不依赖外部库
   * @param content 要格式化的内容
   * @param format 格式类型
   * @returns 格式化后的内容
   */
  private simpleFormat(content: string, format: DocFormat): string {
    if (format === DocFormat.MARKDOWN) {
      // 简单的Markdown格式化
      // 确保标题后有空行
      content = content.replace(/^(#+.*)\n(?!\n)/gm, '$1\n\n');
      // 确保列表项后有适当的缩进
      content = content.replace(/^(\s*[-*+]\s.*)\n(?!\n)/gm, '$1\n');
      // 代码块前后有空行
      content = content.replace(/^(?!\n)(.*)```/gm, '\n$1```');
      content = content.replace(/```(.*)(?!\n)/gm, '```$1\n');
    }
    
    return content;
  }
  
  /**
   * 将文档节点渲染为Markdown格式
   * @param node 文档节点
   * @returns Markdown格式的文档内容
   */
  private renderNodeToMarkdown(node: DocNode): string {
    let content = `## ${node.name}\n\n`;
    
    if (node.deprecated) {
      content += `> **已废弃**${node.deprecationMessage ? `: ${node.deprecationMessage}` : ''}\n\n`;
    }
    
    content += `${node.description}\n\n`;
    
    if (node.signature) {
      content += `\`\`\`typescript\n${node.signature}\n\`\`\`\n\n`;
    }
    
    if (node.params && node.params.length > 0) {
      content += `### 参数\n\n`;
      node.params.forEach(param => {
        content += `- \`${param.name}${param.optional ? '?' : ''}\` **(${param.type})** - ${param.description}`;
        if (param.defaultValue) {
          content += ` 默认值: \`${param.defaultValue}\``;
        }
        content += '\n';
      });
      content += '\n';
    }
    
    if (node.returns) {
      content += `### 返回值\n\n`;
      content += `**(${node.returns.type})** - ${node.returns.description}\n\n`;
    }
    
    if (node.throws && node.throws.length > 0) {
      content += `### 异常\n\n`;
      node.throws.forEach(throwInfo => {
        content += `- **${throwInfo.type}** - ${throwInfo.description}\n`;
      });
      content += '\n';
    }
    
    if (node.examples && node.examples.length > 0) {
      content += `### 示例\n\n`;
      node.examples.forEach(example => {
        content += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
      });
    }
    
    if (node.see && node.see.length > 0) {
      content += `### 参见\n\n`;
      node.see.forEach(ref => {
        if (this.config.resolveInternalLinks) {
          // 尝试解析内部链接
          const linkedNode = this.docNodes.find(n => n.name === ref);
          if (linkedNode) {
            const relativePath = path.relative(this.config.basePath, linkedNode.filePath);
            const dir = path.dirname(relativePath);
            const sanitizedDir = dir.replace(/[\/\\]/g, '-');
            content += `- [${ref}](./${sanitizedDir}.md#${ref.toLowerCase()})\n`;
            return;
          }
        }
        content += `- ${ref}\n`;
      });
      content += '\n';
    }
    
    if (this.config.includeSourceLink) {
      const relativePath = path.relative(this.config.basePath, node.filePath);
      if (this.config.sourceBaseUrl) {
        content += `[源代码](${this.config.sourceBaseUrl}/${relativePath}#L${node.lineNumber})\n\n`;
      } else {
        content += `*定义在 \`${relativePath}:${node.lineNumber}\`*\n\n`;
      }
    }
    
    // 递归渲染子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        content += this.renderNodeToMarkdown(child);
      });
    }
    
    return content;
  }
  
  /**
   * 获取当前格式对应的文件扩展名
   * @returns 文件扩展名
   */
  private getFileExtension(): string {
    switch (this.config.format) {
      case DocFormat.MARKDOWN:
        return 'md';
      case DocFormat.HTML:
        return 'html';
      case DocFormat.JSON:
        return 'json';
      default:
        return 'md';
    }
  }
}

/**
 * 创建文档生成器配置
 * @param options 文档生成器配置选项
 * @returns 完整的文档生成器配置
 */
export function createDocConfig(options: Partial<DocGeneratorConfig>): DocGeneratorConfig {
  return {
    include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    outputDir: './docs/api',
    format: DocFormat.MARKDOWN,
    title: '项目API文档',
    basePath: process.cwd(),
    recursive: true,
    includePrivate: false,
    resolveInternalLinks: true,
    autoGroupByPath: true,
    generateIndex: true,
    formatOutput: true,
    includeSourceLink: true,
    ...options
  };
}

/**
 * 快速生成文档的实用函数
 * @param options 文档生成器配置
 * @returns 生成的文件路径数组
 */
export async function generateDocs(options: Partial<DocGeneratorConfig>): Promise<string[]> {
  const config = createDocConfig(options);
  const generator = new DocGenerator(config);
  return generator.generate();
}

/**
 * 为设计Token系统生成文档
 */
export async function generateDesignTokensDocs() {
  console.log('生成设计Token系统文档...');
  return generateDocs({
    title: '设计Token系统',
    outputDir: './docs/api/design-tokens',
    include: ['src/design-tokens/**/*.ts'],
    groups: {
      '原子级Token': ['src/design-tokens/tokens.ts'],
      '语义级Token': ['src/design-tokens/semantic.ts'],
      '生成器': ['src/design-tokens/generator.ts']
    },
    header: '> 本文档自动从源代码生成，请勿手动修改。'
  });
}

/**
 * 为事件系统生成文档
 */
export async function generateEventSystemDocs() {
  console.log('生成事件系统文档...');
  return generateDocs({
    title: '事件系统',
    outputDir: './docs/api/events',
    include: ['src/events/**/*.ts', 'src/core/eventBus.ts'],
    autoGroupByPath: true,
    header: '> 本文档自动从源代码生成，请勿手动修改。'
  });
}

/**
 * 为可观测性平台生成文档
 */
export async function generateObservabilityDocs() {
  console.log('生成可观测性平台文档...');
  return generateDocs({
    title: '可观测性平台',
    outputDir: './docs/api/observability',
    include: ['src/observability/**/*.ts'],
    autoGroupByPath: true,
    header: '> 本文档自动从源代码生成，请勿手动修改。'
  });
}

/**
 * 在package.json中添加以下依赖：
 * 
 * ```json
 * "dependencies": {
 *   "glob": "^8.0.3",
 *   "typescript": "^4.7.4"
 * }
 * ```
 * 
 * 运行 `npm install` 或 `yarn` 安装依赖后即可使用本模块
 */

// 直接执行当前文件时的入口函数
async function main() {
  try {
    // 生成设计Token系统文档
    const designTokenFiles = await generateDesignTokensDocs();
    console.log('设计Token系统文档生成成功，输出文件:');
    designTokenFiles.forEach(file => console.log(` - ${file}`));
    
    // 生成事件系统文档
    const eventSystemFiles = await generateEventSystemDocs();
    console.log('事件系统文档生成成功，输出文件:');
    eventSystemFiles.forEach(file => console.log(` - ${file}`));
    
    // 生成可观测性平台文档
    const observabilityFiles = await generateObservabilityDocs();
    console.log('可观测性平台文档生成成功，输出文件:');
    observabilityFiles.forEach(file => console.log(` - ${file}`));
    
  } catch (error) {
    console.error('文档生成失败:', error);
    process.exit(1);
  }
}

// 检查是否直接执行此文件
const isMainModule = typeof require !== 'undefined' && require.main === module;
if (isMainModule) {
  main();
} 