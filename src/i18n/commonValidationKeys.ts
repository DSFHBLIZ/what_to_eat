/**
 * 通用验证消息键
 * 所有语言包都应该包含这些基础验证键
 */

// 验证消息模板类型
export interface ValidationTemplate {
  // 基础验证消息
  'validation.required': string;
  'validation.minLength': string;
  'validation.maxLength': string;
  'validation.min': string;
  'validation.max': string;
  'validation.email': string;
  'validation.url': string;
  'validation.pattern': string;
  'validation.number': string;
  'validation.integer': string;
  'validation.custom': string;
  'validation.phone': string;
  
  // 密码验证消息
  'validation.password.weak': string;
  'validation.password.medium': string;
  'validation.password.strong': string;
  'validation.password.mismatch': string;
  
  // 文件验证消息
  'validation.file.maxSize': string;
  'validation.file.types': string;
  
  // 日期验证消息
  'validation.date.invalid': string;
  'validation.date.past': string;
  'validation.date.future': string;
  'validation.date.range': string;
  
  // 错误消息
  'error.unknown': string;
  'error.server': string;
  'error.network': string;
  
  // 认证错误
  'auth.required': string;
  'auth.invalid': string;
  
  // 数据错误
  'data.notFound': string;
  'data.invalid': string;
  'data.emptyResponse': string;
  
  // 操作错误
  'operation.failed': string;
  
  // 特定功能错误
  'recipe.idRequired': string;
  'recipe.fetchFailed': string;
  'recipe.dataInvalid': string;
  
  // 上下文错误
  'context.invalid': string;
  'context.searchRequired': string;
  'context.unifiedSearchRequired': string;
  'context.authRequired': string;
  
  // 数据库错误
  'db.connectionFailed': string;
  'db.emptyResult': string;
  'db.searchFieldRequired': string;
  
  // 其他必要的错误消息键
  [key: string]: string;
}

// 中文验证消息模板（默认值）
export const zhCNValidationTemplate: ValidationTemplate = {
  // 基础验证消息
  'validation.required': '{{label}}不能为空',
  'validation.minLength': '{{label}}长度不能少于{{min}}个字符',
  'validation.maxLength': '{{label}}长度不能超过{{max}}个字符',
  'validation.min': '{{label}}不能小于{{min}}',
  'validation.max': '{{label}}不能大于{{max}}',
  'validation.email': '{{label}}必须是有效的电子邮箱',
  'validation.url': '{{label}}必须是有效的URL',
  'validation.pattern': '{{label}}格式无效',
  'validation.number': '{{label}}必须是有效的数字',
  'validation.integer': '{{label}}必须是有效的整数',
  'validation.custom': '{{label}}无效',
  'validation.phone': '{{label}}必须是有效的电话号码',
  
  // 密码验证消息
  'validation.password.weak': '密码强度太弱',
  'validation.password.medium': '密码强度中等',
  'validation.password.strong': '密码强度很强',
  'validation.password.mismatch': '两次输入的密码不匹配',
  
  // 文件验证消息
  'validation.file.maxSize': '文件大小不能超过{{size}}',
  'validation.file.types': '文件类型无效。允许的类型：{{types}}',
  
  // 日期验证消息
  'validation.date.invalid': '{{label}}不是有效的日期',
  'validation.date.past': '{{label}}必须是过去的日期',
  'validation.date.future': '{{label}}必须是将来的日期',
  'validation.date.range': '{{label}}必须在{{start}}和{{end}}之间',
  
  // 错误消息
  'error.unknown': '发生未知错误',
  'error.server': '服务器错误',
  'error.network': '网络连接错误',
  
  // 认证错误
  'auth.required': '请先登录',
  'auth.invalid': '用户未登录',
  
  // 数据错误
  'data.notFound': '未找到请求的数据',
  'data.invalid': '数据无效',
  'data.emptyResponse': '服务器返回空响应',
  
  // 操作错误
  'operation.failed': '操作失败',
  
  // 特定功能错误
  'recipe.idRequired': '菜谱ID不能为空',
  'recipe.fetchFailed': '获取菜谱详情失败',
  'recipe.dataInvalid': '未获取有效的菜谱数据',
  
  // 上下文错误
  'context.invalid': '上下文无效',
  'context.searchRequired': 'useSearch必须在SearchProvider内部使用',
  'context.unifiedSearchRequired': 'useUnifiedSearch必须在UnifiedSearchProvider内部使用',
  'context.authRequired': 'useAuth必须在AuthProvider内部使用',
  
  // 数据库错误
  'db.connectionFailed': '数据库连接测试失败',
  'db.emptyResult': '数据库返回空数据',
  'db.searchFieldRequired': '必须提供至少一个搜索字段'
};

// 英文验证消息模板
export const enUSValidationTemplate: ValidationTemplate = {
  // 基础验证消息
  'validation.required': '{{label}} is required',
  'validation.minLength': '{{label}} must be at least {{min}} characters',
  'validation.maxLength': '{{label}} must be at most {{max}} characters',
  'validation.min': '{{label}} must be at least {{min}}',
  'validation.max': '{{label}} must be at most {{max}}',
  'validation.email': '{{label}} must be a valid email',
  'validation.url': '{{label}} must be a valid URL',
  'validation.pattern': '{{label}} has an invalid format',
  'validation.number': '{{label}} must be a valid number',
  'validation.integer': '{{label}} must be a valid integer',
  'validation.custom': '{{label}} is invalid',
  'validation.phone': '{{label}} must be a valid phone number',
  
  // 密码验证消息
  'validation.password.weak': 'Password strength is weak',
  'validation.password.medium': 'Password strength is medium',
  'validation.password.strong': 'Password strength is strong',
  'validation.password.mismatch': 'Passwords do not match',
  
  // 文件验证消息
  'validation.file.maxSize': 'File size cannot exceed {{size}}',
  'validation.file.types': 'Invalid file type. Allowed types: {{types}}',
  
  // 日期验证消息
  'validation.date.invalid': '{{label}} is not a valid date',
  'validation.date.past': '{{label}} must be a date in the past',
  'validation.date.future': '{{label}} must be a date in the future',
  'validation.date.range': '{{label}} must be between {{start}} and {{end}}',
  
  // 错误消息
  'error.unknown': 'An unknown error occurred',
  'error.server': 'Server error',
  'error.network': 'Network connection error',
  
  // 认证错误
  'auth.required': 'Please login first',
  'auth.invalid': 'User is not logged in',
  
  // 数据错误
  'data.notFound': 'Requested data not found',
  'data.invalid': 'Invalid data',
  'data.emptyResponse': 'Server returned an empty response',
  
  // 操作错误
  'operation.failed': 'Operation failed',
  
  // 特定功能错误
  'recipe.idRequired': 'Recipe ID is required',
  'recipe.fetchFailed': 'Failed to fetch recipe details',
  'recipe.dataInvalid': 'Failed to get valid recipe data',
  
  // 上下文错误
  'context.invalid': 'Context is invalid',
  'context.searchRequired': 'useSearch must be used within a SearchProvider',
  'context.unifiedSearchRequired': 'useUnifiedSearch must be used within a UnifiedSearchProvider',
  'context.authRequired': 'useAuth must be used within an AuthProvider',
  
  // 数据库错误
  'db.connectionFailed': 'Database connection test failed',
  'db.emptyResult': 'Database returned empty data',
  'db.searchFieldRequired': 'At least one search field must be provided'
};

export default {
  zhCNValidationTemplate,
  enUSValidationTemplate
}; 