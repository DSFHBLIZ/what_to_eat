/**
 * 国际化系统入口文件
 * 统一导出所有i18n相关的功能
 */

// 导入国际化键值配置
import { I18N_KEYS, getI18nKey } from './keys';

// 导入验证消息配置
import { getValidationMessage, FIELD_LABELS } from '../config/validationSchema';

// 导入错误消息系统
import { ErrorKey, getErrorMessage } from './errorMessages';

// 统一导出i18nStore中的函数和常量
import useI18nStore, { 
  changeLocale, 
  getCurrentLocale, 
  SUPPORTED_LOCALES,
  DEFAULT_LANGUAGE as DEFAULT_LOCALE,
  initI18n,
  isRTL
} from './i18nStore';

// 从i18n-react获取翻译函数
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import i18next from 'i18next';

// 导出翻译函数
export const t = i18next.t.bind(i18next);

/**
 * 加载指定语言资源
 * @param locale 需要加载的语言代码
 * @returns Promise<void>
 */
export async function loadLocaleResources(locale: string): Promise<void> {
  // 此处实现语言资源加载逻辑
  console.log(`Loading resources for locale: ${locale}`);
  // 这里可以是动态加载语言资源的逻辑
  // 在此项目中可能不需要实际实现，因为资源已在i18nStore中预加载
}

/**
 * 获取验证消息
 * @param key 验证消息键
 * @param params 替换参数
 * @param locale 语言代码
 * @returns 翻译后的验证消息
 */
export function tValidationMessage(key: string, params: Record<string, string | number> = {}, locale?: string): string {
  const targetLocale = locale || getCurrentLocale();
  
  // 使用错误消息系统获取消息
  return getErrorMessage(key, params, targetLocale);
}

// 导出所有内容
export { 
  I18N_KEYS, 
  getI18nKey,
  ErrorKey,
  getErrorMessage,
  changeLocale,
  getCurrentLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  initI18n,
  isRTL,
  useI18nStore
}; 