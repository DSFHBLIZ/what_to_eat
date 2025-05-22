/**
 * 验证消息配置架构
 * 统一管理表单验证相关的消息结构和配置
 */

// 验证消息类型定义
export interface ValidationMessageItem {
  key: string;
  defaultMessage: string;
  i18nKey: string;
  params?: string[];
}

// 验证消息配置架构
export const VALIDATION_SCHEMA = {
  // 必填项验证
  required: {
    key: 'required',
    defaultMessage: '{{label}}不能为空',
    i18nKey: 'validation.required',
    params: ['label']
  },
  
  // 长度验证
  minLength: {
    key: 'minLength',
    defaultMessage: '{{label}}长度不能少于{{min}}个字符',
    i18nKey: 'validation.minLength',
    params: ['label', 'min']
  },
  maxLength: {
    key: 'maxLength',
    defaultMessage: '{{label}}长度不能超过{{max}}个字符',
    i18nKey: 'validation.maxLength',
    params: ['label', 'max']
  },
  
  // 数值范围验证
  min: {
    key: 'min',
    defaultMessage: '{{label}}不能小于{{min}}',
    i18nKey: 'validation.min',
    params: ['label', 'min']
  },
  max: {
    key: 'max',
    defaultMessage: '{{label}}不能大于{{max}}',
    i18nKey: 'validation.max',
    params: ['label', 'max']
  },
  
  // 数字验证
  number: {
    key: 'number',
    defaultMessage: '{{label}}必须是有效的数字',
    i18nKey: 'validation.number',
    params: ['label']
  },
  integer: {
    key: 'integer',
    defaultMessage: '{{label}}必须是有效的整数',
    i18nKey: 'validation.integer',
    params: ['label']
  },
  
  // 格式验证
  email: {
    key: 'email',
    defaultMessage: '{{label}}必须是有效的电子邮箱',
    i18nKey: 'validation.email',
    params: ['label']
  },
  url: {
    key: 'url',
    defaultMessage: '{{label}}必须是有效的URL',
    i18nKey: 'validation.url',
    params: ['label']
  },
  phone: {
    key: 'phone',
    defaultMessage: '{{label}}必须是有效的电话号码',
    i18nKey: 'validation.phone',
    params: ['label']
  },
  
  // 匹配验证
  pattern: {
    key: 'pattern',
    defaultMessage: '{{label}}格式无效',
    i18nKey: 'validation.pattern',
    params: ['label']
  },
  
  // 自定义验证
  custom: {
    key: 'custom',
    defaultMessage: '{{label}}无效',
    i18nKey: 'validation.custom',
    params: ['label']
  },
  
  // 密码验证
  password: {
    weak: {
      key: 'password.weak',
      defaultMessage: '密码强度太弱',
      i18nKey: 'validation.password.weak',
      params: []
    },
    medium: {
      key: 'password.medium',
      defaultMessage: '密码强度中等',
      i18nKey: 'validation.password.medium',
      params: []
    },
    strong: {
      key: 'password.strong',
      defaultMessage: '密码强度很强',
      i18nKey: 'validation.password.strong',
      params: []
    },
    mismatch: {
      key: 'password.mismatch',
      defaultMessage: '两次输入的密码不匹配',
      i18nKey: 'validation.password.mismatch',
      params: []
    }
  },
  
  // 文件验证
  file: {
    maxSize: {
      key: 'file.maxSize',
      defaultMessage: '文件大小不能超过{{size}}',
      i18nKey: 'validation.file.maxSize',
      params: ['size']
    },
    types: {
      key: 'file.types',
      defaultMessage: '文件类型无效。允许的类型：{{types}}',
      i18nKey: 'validation.file.types',
      params: ['types']
    }
  },
  
  // 日期验证
  date: {
    invalid: {
      key: 'date.invalid',
      defaultMessage: '{{label}}不是有效的日期',
      i18nKey: 'validation.date.invalid',
      params: ['label']
    },
    past: {
      key: 'date.past',
      defaultMessage: '{{label}}必须是过去的日期',
      i18nKey: 'validation.date.past',
      params: ['label']
    },
    future: {
      key: 'date.future',
      defaultMessage: '{{label}}必须是将来的日期',
      i18nKey: 'validation.date.future',
      params: ['label']
    },
    range: {
      key: 'date.range',
      defaultMessage: '{{label}}必须在{{start}}和{{end}}之间',
      i18nKey: 'validation.date.range',
      params: ['label', 'start', 'end']
    }
  }
};

// 字段默认标签
export const FIELD_LABELS = {
  username: '用户名',
  password: '密码',
  email: '邮箱',
  phone: '电话',
  address: '地址',
  city: '城市',
  country: '国家',
  zip: '邮编',
  name: '姓名',
  firstName: '名字',
  lastName: '姓氏',
  title: '标题',
  content: '内容',
  description: '描述',
  date: '日期',
  time: '时间',
  datetime: '日期和时间',
  search: '搜索',
  category: '分类',
  tags: '标签',
  price: '价格',
  quantity: '数量',
  field: '该字段'
};

// 辅助函数：获取验证消息
export function getValidationMessage(
  key: string, 
  params: Record<string, string | number> = {},
  locale: string = 'zh-CN'
): string {
  // 从架构中获取消息配置
  const messageParts = key.split('.');
  let config: any = VALIDATION_SCHEMA;
  
  for (const part of messageParts) {
    if (config && typeof config === 'object' && part in config) {
      config = config[part];
    } else {
      // 如果找不到配置，返回键本身
      return key;
    }
  }
  
  // 如果找到了配置，但不是验证消息项
  if (!config || typeof config !== 'object' || !('defaultMessage' in config)) {
    return key;
  }
  
  // 替换参数
  let message = config.defaultMessage;
  
  for (const [paramKey, paramValue] of Object.entries(params)) {
    message = message.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
  }
  
  return message;
}

// 辅助函数：获取字段标签
export function getFieldLabel(field: string, customLabels: Record<string, string> = {}): string {
  // 优先使用自定义标签
  if (field in customLabels) {
    return customLabels[field];
  }
  
  // 其次从默认标签中获取
  if (field in FIELD_LABELS) {
    return FIELD_LABELS[field as keyof typeof FIELD_LABELS];
  }
  
  // 如果找不到，返回字段名本身
  return field;
}

// 导出类型定义
export type ValidationSchemaKey = keyof typeof VALIDATION_SCHEMA; 