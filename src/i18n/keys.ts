/**
 * i18n 键值配置中心
 * 统一管理所有国际化的键名，避免硬编码
 */

export const I18N_KEYS = {
  // 表单验证相关键值
  validation: {
    required: 'validation.required',
    minLength: 'validation.minLength',
    maxLength: 'validation.maxLength',
    min: 'validation.min',
    max: 'validation.max',
    number: 'validation.number',
    integer: 'validation.integer',
    email: 'validation.email',
    url: 'validation.url',
    phone: 'validation.phone',
    pattern: 'validation.pattern',
    custom: 'validation.custom',
    password: {
      weak: 'validation.password.weak',
      medium: 'validation.password.medium',
      strong: 'validation.password.strong',
      mismatch: 'validation.password.mismatch'
    },
    file: {
      maxSize: 'validation.file.maxSize',
      types: 'validation.file.types'
    },
    date: {
      invalid: 'validation.date.invalid',
      past: 'validation.date.past',
      future: 'validation.date.future',
      range: 'validation.date.range'
    }
  },
  
  // UI相关键值
  ui: {
    common: {
      save: 'ui.common.save',
      cancel: 'ui.common.cancel',
      delete: 'ui.common.delete',
      edit: 'ui.common.edit',
      submit: 'ui.common.submit',
      loading: 'ui.common.loading',
      success: 'ui.common.success',
      error: 'ui.common.error',
      warning: 'ui.common.warning',
      info: 'ui.common.info',
      close: 'ui.common.close',
      back: 'ui.common.back',
      next: 'ui.common.next',
      previous: 'ui.common.previous',
      more: 'ui.common.more',
      less: 'ui.common.less',
      search: 'ui.common.search',
      filter: 'ui.common.filter',
      sort: 'ui.common.sort',
      select: 'ui.common.select',
      all: 'ui.common.all',
      none: 'ui.common.none',
      clear: 'ui.common.clear',
      reset: 'ui.common.reset',
      apply: 'ui.common.apply',
      confirm: 'ui.common.confirm'
    },
    
    auth: {
      login: 'ui.auth.login',
      register: 'ui.auth.register',
      logout: 'ui.auth.logout',
      forgotPassword: 'ui.auth.forgotPassword',
      resetPassword: 'ui.auth.resetPassword',
      changePassword: 'ui.auth.changePassword',
      verifyEmail: 'ui.auth.verifyEmail'
    }
  },
  
  // 筛选器相关键值
  filters: {
    ingredients: 'filters.ingredients',
    seasonings: 'filters.seasonings',
    cuisine: 'filters.cuisine',
    difficulty: 'filters.difficulty',
    cookingTime: 'filters.cookingTime',
    cookingMethod: 'filters.cookingMethod',
    dietaryRestrictions: 'filters.dietaryRestrictions',
    flavor: 'filters.flavor',
    tags: 'filters.tags'
  },
  
  // 字段标签
  fields: {
    username: 'fields.username',
    password: 'fields.password',
    email: 'fields.email',
    phone: 'fields.phone',
    address: 'fields.address',
    city: 'fields.city',
    country: 'fields.country',
    zip: 'fields.zip',
    name: 'fields.name',
    firstName: 'fields.firstName',
    lastName: 'fields.lastName',
    title: 'fields.title',
    content: 'fields.content',
    description: 'fields.description',
    date: 'fields.date',
    time: 'fields.time',
    datetime: 'fields.datetime',
    search: 'fields.search',
    category: 'fields.category',
    tags: 'fields.tags',
    price: 'fields.price',
    quantity: 'fields.quantity'
  },
  
  // 错误消息
  errors: {
    general: 'errors.general',
    notFound: 'errors.notFound',
    unauthorized: 'errors.unauthorized',
    forbidden: 'errors.forbidden',
    serverError: 'errors.serverError',
    networkError: 'errors.networkError',
    validationError: 'errors.validationError',
    timeout: 'errors.timeout'
  },
  
  // 页面标题
  pages: {
    home: 'pages.home',
    search: 'pages.search',
    favorites: 'pages.favorites',
    profile: 'pages.profile',
    settings: 'pages.settings',
    about: 'pages.about',
    help: 'pages.help',
    contact: 'pages.contact',
    notFound: 'pages.notFound',
    error: 'pages.error'
  }
};

// 辅助函数：获取指定i18n key的值
export function getI18nKey(keyPath: string): string {
  const keys = keyPath.split('.');
  let result: any = I18N_KEYS;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return keyPath; // 如果找不到键，则返回原始键路径
    }
  }
  
  return typeof result === 'string' ? result : keyPath;
}

// 导出类型定义
export type I18nKeyPath = string; 