/**
 * 国际化系统核心文件
 * 整合i18next和自定义实现
 */

import { 
  initI18n, 
  getCurrentLocale,
  loadLocaleResources,
  changeLocale,
  t,
  tValidationMessage,
  ErrorKey,
  getErrorMessage
} from './index';

// 导出所有功能
export {
  initI18n,
  getCurrentLocale,
  loadLocaleResources,
  changeLocale,
  t,
  tValidationMessage,
  ErrorKey,
  getErrorMessage
};

export default {
  initI18n,
  getCurrentLocale,
  loadLocaleResources,
  changeLocale,
  t,
  tValidationMessage,
  ErrorKey,
  getErrorMessage
}; 