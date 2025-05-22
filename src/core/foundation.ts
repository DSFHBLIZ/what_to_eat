/**
 * 应用程序基础设施
 * 整合设计系统、事件系统和可观测性平台
 */

// 导入设计Token系统
import designTokens from '../design-tokens';
import { lightSemanticTokens, darkSemanticTokens } from '../design-tokens/semantic';

// 导入事件系统
import { domainEvents, initializeEventSystem } from '../events';

// 导入可观测性系统
import { 
  initObservability, 
  observability, 
  logger, 
  metrics 
} from '../observability';
import { 
  ObservabilityConfig, 
  LogLevel, 
  SpanType 
} from '../types/observability';

/**
 * 应用程序基础设施配置
 */
export interface FoundationConfig {
  // 设计Token配置
  designTokens?: {
    applyOnInit?: boolean;
    preferDarkMode?: boolean;
  };
  
  // 可观测性配置
  observability?: Partial<ObservabilityConfig>;
}

/**
 * 初始化应用程序基础设施
 * @param config 配置选项
 */
export function initializeFoundation(config: FoundationConfig = {}): void {
  // 初始化事件系统
  initializeEventSystem();
  
  // 初始化可观测性系统
  initObservability(config.observability);
  
  // 记录初始化信息
  logger.info('应用程序基础设施初始化完成', {
    component: 'foundation',
    config: JSON.stringify(config),
  });
}

/**
 * 测量函数执行时间并自动记录
 * @param name 操作名称
 * @param fn 要执行的函数
 * @param component 组件名称
 */
export function measure<T>(
  name: string,
  fn: () => T,
  component: string = 'app'
): T {
  return observability.withSpan(name, SpanType.OPERATION, fn, { component });
}

// 导出基础设施组件
export {
  // 设计Tokens
  designTokens,
  lightSemanticTokens,
  darkSemanticTokens,
  
  // 事件系统
  domainEvents,
  
  // 可观测性系统
  observability,
  logger,
  metrics,
}; 