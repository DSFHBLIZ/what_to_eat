/**
 * 领域层：表单验证
 * 提供所有表单验证功能（基础+扩展）
 */
import { Validator, ValidationResult as BaseValidationResult } from './validators';
import { getValidationMessage } from '../../config/validationSchema';

// 使用类型别名以便逐步迁移
type ValidationResult = BaseValidationResult;

/**
 * 基础表单验证状态
 */
export interface FormValidationState {
  // 字段验证结果映射，键为字段名，值为验证结果
  fields: Record<string, FieldValidationState>;
  // 表单整体是否有效
  isValid: boolean;
  // 表单是否已提交过
  isSubmitted: boolean;
  // 是否正在提交
  isSubmitting: boolean;
  // 提交错误信息
  submitError: string | null;
}

/**
 * 基础字段验证状态
 */
export interface FieldValidationState {
  // 字段值
  value: any;
  // 字段是否被修改过
  isDirty: boolean;
  // 字段是否被访问过
  isTouched: boolean;
  // 字段是否有效
  isValid: boolean;
  // 字段验证错误信息
  error: string | null;
  // 字段验证器列表
  validators: Validator[];
}

/**
 * 基础表单验证配置
 */
export interface FormValidationConfig {
  // 字段验证规则配置
  fields: Record<string, {
    // 初始值
    initialValue?: any;
    // 验证器列表
    validators?: Validator[];
    // 字段标签（用于错误消息）
    label?: string;
  }>;
  // 是否在表单提交时验证所有字段
  validateOnSubmit?: boolean;
  // 是否在字段值变化时验证
  validateOnChange?: boolean;
  // 是否在字段失去焦点时验证
  validateOnBlur?: boolean;
}

/**
 * 表单验证状态 (扩展版)
 */
export interface FormValidationExtendedState extends FormValidationState {
  // 字段验证结果映射，键为字段名，值为验证结果 (覆盖基础接口以使用扩展字段状态)
  fields: Record<string, FieldValidationExtendedState>;
  // 表单步骤 (用于多步骤表单)
  currentStep: number;
  // 表单总步骤数
  totalSteps: number;
  // 每个步骤的有效性
  stepValidity: boolean[];
  // 表单是否已完成
  isCompleted: boolean;
}

/**
 * 字段验证状态 (扩展版)
 */
export interface FieldValidationExtendedState extends FieldValidationState {
  // 字段所属步骤
  step: number;
  // 字段是否依赖于其他字段
  dependencies: string[];
  // 字段是否被禁用
  isDisabled: boolean;
  // 字段是否隐藏
  isHidden: boolean;
}

/**
 * 表单验证配置 (扩展版)
 */
export interface FormValidationExtendedConfig extends FormValidationConfig {
  // 字段验证规则配置 (覆盖基础接口以使用扩展配置)
  fields: Record<string, {
    // 初始值
    initialValue?: any;
    // 验证器列表
    validators?: Validator[];
    // 字段标签（用于错误消息）
    label?: string;
    // 字段所属步骤
    step?: number;
    // 字段依赖
    dependencies?: string[];
    // 字段是否被禁用
    isDisabled?: boolean;
    // 字段是否隐藏
    isHidden?: boolean;
    // 条件函数，根据其他字段值决定是否启用该字段
    enableWhen?: (values: Record<string, any>) => boolean;
    // 条件函数，根据其他字段值决定是否显示该字段
    showWhen?: (values: Record<string, any>) => boolean;
  }>;
  // 总步骤数 (用于多步骤表单)
  totalSteps?: number;
  // 是否在切换步骤时验证当前步骤
  validateOnStepChange?: boolean;
}

/**
 * 创建新的基础表单验证状态
 */
export function createFormValidationState(config: FormValidationConfig): FormValidationState {
  const fields: Record<string, FieldValidationState> = {};
  
  // 初始化每个字段的验证状态
  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    fields[fieldName] = {
      value: fieldConfig.initialValue !== undefined ? fieldConfig.initialValue : '',
      isDirty: false,
      isTouched: false,
      isValid: true, // 初始假设为有效
      error: null,
      validators: fieldConfig.validators || [],
    };
  }
  
  return {
    fields,
    isValid: true, // 初始假设表单有效
    isSubmitted: false,
    isSubmitting: false,
    submitError: null,
  };
}

/**
 * 创建新的表单验证状态 (扩展版)
 */
export function createFormValidationExtendedState(config: FormValidationExtendedConfig): FormValidationExtendedState {
  const totalSteps = config.totalSteps || 1;
  const fields: Record<string, FieldValidationExtendedState> = {};
  
  // 初始化每个字段的验证状态
  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    fields[fieldName] = {
      value: fieldConfig.initialValue !== undefined ? fieldConfig.initialValue : '',
      isDirty: false,
      isTouched: false,
      isValid: true, // 初始假设为有效
      error: null,
      validators: fieldConfig.validators || [],
      step: fieldConfig.step || 0,
      dependencies: fieldConfig.dependencies || [],
      isDisabled: fieldConfig.isDisabled || false,
      isHidden: fieldConfig.isHidden || false,
    };
  }
  
  return {
    fields,
    isValid: true, // 初始假设表单有效
    isSubmitted: false,
    isSubmitting: false,
    submitError: null,
    currentStep: 0,
    totalSteps,
    stepValidity: Array(totalSteps).fill(true),
    isCompleted: false,
  };
}

/**
 * 验证单个字段 (基础版)
 */
export function validateField(
  state: FormValidationState,
  fieldName: string,
  fieldLabel?: string
): FormValidationState {
  const field = state.fields[fieldName];
  if (!field) return state;
  
  // 如果没有验证器，则字段默认有效
  if (!field.validators || field.validators.length === 0) {
    return {
      ...state,
      fields: {
        ...state.fields,
        [fieldName]: {
          ...field,
          isValid: true,
          error: null,
        },
      },
    };
  }
  
  // 逐个应用验证器，直到发现第一个错误
  for (const validator of field.validators) {
    const result = validator(field.value, fieldLabel);
    if (!result.valid) {
      // 使用标准化的错误消息系统
      const errorMessage = result.message || 
        getValidationMessage('custom', { label: fieldLabel || fieldName });
      
      return {
        ...state,
        fields: {
          ...state.fields,
          [fieldName]: {
            ...field,
            isValid: false,
            error: errorMessage,
          },
        },
        isValid: false,
      };
    }
  }
  
  // 所有验证器通过，字段有效
  return {
    ...state,
    fields: {
      ...state.fields,
      [fieldName]: {
        ...field,
        isValid: true,
        error: null,
      },
    },
  };
}

/**
 * 验证单个字段 (扩展版)
 */
export function validateFieldExtended(
  state: FormValidationExtendedState,
  fieldName: string,
  fieldLabel?: string,
  formValues?: Record<string, any>
): FormValidationExtendedState {
  const field = state.fields[fieldName];
  if (!field) return state;
  
  // 如果字段被禁用或隐藏，则不验证
  if (field.isDisabled || field.isHidden) {
    return {
      ...state,
      fields: {
        ...state.fields,
        [fieldName]: {
          ...field,
          isValid: true,
          error: null,
        },
      },
    };
  }
  
  // 如果没有验证器，则字段默认有效
  if (!field.validators || field.validators.length === 0) {
    return {
      ...state,
      fields: {
        ...state.fields,
        [fieldName]: {
          ...field,
          isValid: true,
          error: null,
        },
      },
    };
  }
  
  // 逐个应用验证器，直到发现第一个错误
  for (const validator of field.validators) {
    const result = validator(field.value, fieldLabel);
    if (!result.valid) {
      // 使用标准化的错误消息系统
      const errorMessage = result.message || 
        getValidationMessage('custom', { label: fieldLabel || fieldName });
      
      return {
        ...state,
        fields: {
          ...state.fields,
          [fieldName]: {
            ...field,
            isValid: false,
            error: errorMessage,
          },
        },
      };
    }
  }
  
  // 所有验证器通过，字段有效
  return {
    ...state,
    fields: {
      ...state.fields,
      [fieldName]: {
        ...field,
        isValid: true,
        error: null,
      },
    },
  };
}

/**
 * 验证所有字段 (基础版)
 */
export function validateAllFields(
  state: FormValidationState,
  fieldLabels?: Record<string, string>
): FormValidationState {
  let newState = { ...state };
  let isFormValid = true;
  
  // 验证每个字段
  for (const fieldName of Object.keys(state.fields)) {
    const label = fieldLabels ? fieldLabels[fieldName] : undefined;
    newState = validateField(newState, fieldName, label);
    
    // 如果任何字段无效，则表单无效
    if (!newState.fields[fieldName].isValid) {
      isFormValid = false;
    }
  }
  
  return {
    ...newState,
    isValid: isFormValid,
  };
}

/**
 * 验证所有字段 (扩展版)
 */
export function validateAllFieldsExtended(
  state: FormValidationExtendedState,
  fieldLabels?: Record<string, string>,
  onlyCurrentStep: boolean = false
): FormValidationExtendedState {
  let newState = { ...state };
  const fieldEntries = Object.entries(state.fields);
  
  // 按步骤分组字段
  const fieldsByStep: Record<number, string[]> = {};
  for (const [fieldName, field] of fieldEntries) {
    const step = field.step;
    if (!fieldsByStep[step]) {
      fieldsByStep[step] = [];
    }
    fieldsByStep[step].push(fieldName);
  }
  
  // 验证全部字段或当前步骤的字段
  const stepsToValidate = onlyCurrentStep 
    ? [state.currentStep] 
    : Object.keys(fieldsByStep).map(Number);
  
  // 更新每个步骤的有效性
  const stepValidity = [...state.stepValidity];
  
  for (const step of stepsToValidate) {
    let isStepValid = true;
    const fieldsInStep = fieldsByStep[step] || [];
    
    for (const fieldName of fieldsInStep) {
      const field = state.fields[fieldName];
      
      // 跳过禁用或隐藏的字段
      if (field.isDisabled || field.isHidden) continue;
      
      const label = fieldLabels ? fieldLabels[fieldName] : undefined;
      newState = validateFieldExtended(newState, fieldName, label);
      
      // 如果任何字段无效，则步骤无效
      if (!newState.fields[fieldName].isValid) {
        isStepValid = false;
      }
    }
    
    stepValidity[step] = isStepValid;
  }
  
  // 计算表单整体是否有效
  const isFormValid = stepValidity.every(Boolean);
  
  return {
    ...newState,
    isValid: isFormValid,
    stepValidity,
  };
}

/**
 * 更新字段值 (基础版)
 */
export function updateFieldValue(
  state: FormValidationState,
  fieldName: string,
  value: any,
  shouldValidate = false,
  fieldLabel?: string
): FormValidationState {
  const field = state.fields[fieldName];
  if (!field) return state;
  
  // 更新字段值和状态
  let newState = {
    ...state,
    fields: {
      ...state.fields,
      [fieldName]: {
        ...field,
        value,
        isDirty: true,
      },
    },
  };
  
  // 如果需要验证，则验证字段
  if (shouldValidate) {
    newState = validateField(newState, fieldName, fieldLabel);
    
    // 重新计算表单整体有效性
    let isFormValid = true;
    for (const field of Object.values(newState.fields)) {
      if (!field.isValid) {
        isFormValid = false;
        break;
      }
    }
    
    newState = {
      ...newState,
      isValid: isFormValid,
    };
  }
  
  return newState;
}

/**
 * 更新字段值 (扩展版)
 */
export function updateFieldValueExtended(
  state: FormValidationExtendedState,
  fieldName: string,
  value: any,
  shouldValidate = false,
  fieldLabel?: string
): FormValidationExtendedState {
  const field = state.fields[fieldName];
  if (!field) return state;
  
  // 更新字段值和状态
  let newState = {
    ...state,
    fields: {
      ...state.fields,
      [fieldName]: {
        ...field,
        value,
        isDirty: true,
      },
    },
  };
  
  // 获取表单当前值
  const values = getFormValues(newState);
  
  // 更新条件字段状态（禁用/隐藏状态）
  newState = updateConditionalFields(newState, values);
  
  // 如果需要验证，则验证字段
  if (shouldValidate) {
    newState = validateFieldExtended(newState, fieldName, fieldLabel, values);
    
    // 验证依赖于此字段的其他字段
    for (const [otherFieldName, otherField] of Object.entries(newState.fields)) {
      if (otherField.dependencies.includes(fieldName)) {
        const otherLabel = fieldLabel ? fieldLabel : otherFieldName;
        newState = validateFieldExtended(newState, otherFieldName, otherLabel, values);
      }
    }
    
    // 重新计算当前步骤的有效性
    const currentStep = newState.currentStep;
    let isStepValid = true;
    
    for (const [checkFieldName, checkField] of Object.entries(newState.fields)) {
      if (checkField.step === currentStep && !checkField.isDisabled && !checkField.isHidden && !checkField.isValid) {
        isStepValid = false;
        break;
      }
    }
    
    const stepValidity = [...newState.stepValidity];
    stepValidity[currentStep] = isStepValid;
    
    // 计算表单整体是否有效
    const isFormValid = stepValidity.every(Boolean);
    
    newState = {
      ...newState,
      isValid: isFormValid,
      stepValidity,
    };
  }
  
  return newState;
}

/**
 * 获取表单值
 */
function getFormValues(state: FormValidationExtendedState): Record<string, any> {
  const values: Record<string, any> = {};
  
  for (const [fieldName, field] of Object.entries(state.fields)) {
    values[fieldName] = field.value;
  }
  
  return values;
}

/**
 * 更新条件字段状态
 */
function updateConditionalFields(
  state: FormValidationExtendedState,
  values: Record<string, any>
): FormValidationExtendedState {
  const newFields = { ...state.fields };
  const fieldConfigs = {} as FormValidationExtendedConfig['fields'];
  
  // 从state中获取字段配置
  // 注意：实际使用时，可能需要将原始配置作为参数传入
  for (const [fieldName, field] of Object.entries(state.fields)) {
    fieldConfigs[fieldName] = {
      validators: field.validators,
      dependencies: field.dependencies,
    };
  }
  
  // 更新条件字段状态
  for (const [fieldName, fieldConfig] of Object.entries(fieldConfigs)) {
    // 跳过没有条件的字段
    if (!fieldConfig.enableWhen && !fieldConfig.showWhen) {
      continue;
    }
    
    const field = newFields[fieldName];
    if (!field) continue;
    
    // 更新禁用状态
    if (fieldConfig.enableWhen) {
      field.isDisabled = !fieldConfig.enableWhen(values);
    }
    
    // 更新隐藏状态
    if (fieldConfig.showWhen) {
      field.isHidden = !fieldConfig.showWhen(values);
    }
  }
  
  return {
    ...state,
    fields: newFields,
  };
}

/**
 * 标记字段为已触摸 (基础版)
 */
export function touchField(
  state: FormValidationState,
  fieldName: string,
  shouldValidate = false,
  fieldLabel?: string
): FormValidationState {
  const field = state.fields[fieldName];
  if (!field) return state;
  
  // 更新字段状态
  let newState = {
    ...state,
    fields: {
      ...state.fields,
      [fieldName]: {
        ...field,
        isTouched: true,
      },
    },
  };
  
  // 如果需要验证，则验证字段
  if (shouldValidate) {
    newState = validateField(newState, fieldName, fieldLabel);
  }
  
  return newState;
}

/**
 * 标记字段为已触摸 (扩展版)
 */
export function touchFieldExtended(
  state: FormValidationExtendedState,
  fieldName: string,
  shouldValidate = false,
  fieldLabel?: string
): FormValidationExtendedState {
  const field = state.fields[fieldName];
  if (!field) return state;
  
  // 更新字段状态
  let newState = {
    ...state,
    fields: {
      ...state.fields,
      [fieldName]: {
        ...field,
        isTouched: true,
      },
    },
  };
  
  // 如果需要验证，则验证字段
  if (shouldValidate) {
    newState = validateFieldExtended(newState, fieldName, fieldLabel);
  }
  
  return newState;
}

/**
 * 重置表单 (基础版)
 */
export function resetForm(
  state: FormValidationState,
  config: FormValidationConfig
): FormValidationState {
  const fields: Record<string, FieldValidationState> = {};
  
  // 重置每个字段
  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    fields[fieldName] = {
      value: fieldConfig.initialValue !== undefined ? fieldConfig.initialValue : '',
      isDirty: false,
      isTouched: false,
      isValid: true,
      error: null,
      validators: fieldConfig.validators || [],
    };
  }
  
  return {
    fields,
    isValid: true,
    isSubmitted: false,
    isSubmitting: false,
    submitError: null,
  };
}

/**
 * 重置表单 (扩展版)
 */
export function resetFormExtended(
  state: FormValidationExtendedState,
  config: FormValidationExtendedConfig
): FormValidationExtendedState {
  const totalSteps = config.totalSteps || 1;
  const fields: Record<string, FieldValidationExtendedState> = {};
  
  // 重置每个字段
  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    fields[fieldName] = {
      value: fieldConfig.initialValue !== undefined ? fieldConfig.initialValue : '',
      isDirty: false,
      isTouched: false,
      isValid: true,
      error: null,
      validators: fieldConfig.validators || [],
      step: fieldConfig.step || 0,
      dependencies: fieldConfig.dependencies || [],
      isDisabled: fieldConfig.isDisabled || false,
      isHidden: fieldConfig.isHidden || false,
    };
  }
  
  return {
    fields,
    isValid: true,
    isSubmitted: false,
    isSubmitting: false,
    submitError: null,
    currentStep: 0,
    totalSteps,
    stepValidity: Array(totalSteps).fill(true),
    isCompleted: false,
  };
} 