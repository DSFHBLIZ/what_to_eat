/**
 * 事件系统
 * 通过可观测性系统统一管理事件
 */

// 重新导出类型和事件总线实例
export { domainEvents } from './eventBus';
export * from '../types/observability';

// 重新导出事件分析功能
export {
  setEventFilter,
  getEventAnalytics,
  isEventFiltered,
  observability as eventLogger
} from '../observability';

/**
 * 事件系统初始化函数
 * 与可观测性系统集成
 */
export function initializeEventSystem(): void {
  // 简化的初始化函数，大部分功能已经在observability系统中实现
} 