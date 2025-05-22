/**
 * 统一ID生成工具
 * 
 * 提供各种ID生成函数，用于不同场景下的唯一标识符生成
 */

/**
 * 生成通用操作ID
 * @param prefix ID前缀，默认为空
 * @returns 生成的唯一ID
 */
export function createOperationId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.floor(Math.random() * 1000000).toString(16)}`;
}

/**
 * 生成请求ID
 * @param prefix ID前缀，默认为'req'
 * @returns 生成的请求ID
 */
export function createRequestId(prefix: string = 'req'): string {
  return createOperationId(`${prefix}-`);
}

/**
 * 生成跟踪ID
 * @param prefix ID前缀，默认为'trace'
 * @returns 生成的跟踪ID
 */
export function createTraceId(prefix: string = 'trace'): string {
  return createOperationId(`${prefix}-`);
}

/**
 * 生成跨度ID
 * @param prefix ID前缀，默认为'span'
 * @returns 生成的跨度ID
 */
export function createSpanId(prefix: string = 'span'): string {
  return createOperationId(`${prefix}-`);
}

/**
 * 生成事件ID
 * @param prefix ID前缀，默认为'event'
 * @returns 生成的事件ID
 */
export function createEventId(prefix: string = 'event'): string {
  return createOperationId(`${prefix}-`);
}

/**
 * 生成会话ID
 * @param prefix ID前缀，默认为'session'
 * @returns 生成的会话ID
 */
export function createSessionId(prefix: string = 'session'): string {
  return createOperationId(`${prefix}-`);
}

/**
 * 生成用户ID
 * @param prefix ID前缀，默认为'user'
 * @returns 生成的用户ID
 */
export function createUserId(prefix: string = 'user'): string {
  return createOperationId(`${prefix}-`);
}

/**
 * 生成实体ID
 * @param entityType 实体类型
 * @returns 生成的实体ID
 */
export function createEntityId(entityType: string): string {
  return createOperationId(`${entityType}-`);
} 