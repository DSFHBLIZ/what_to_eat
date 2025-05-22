'use client';

import React from 'react';
import { memo } from 'react';

export type RecipeStepDisplayFormat = 'list' | 'sections' | 'combined';

interface RecipeStepsUIProps {
  // 步骤数据
  preparationSteps?: string[];
  cookingSteps?: string[];
  combinedSteps?: string[];
  
  // 显示控制
  showCombinedSteps?: boolean; // 兼容旧版本接口
  
  // 标题配置
  preparationTitle?: string;
  cookingTitle?: string;
  combinedTitle?: string;
  
  // 显示格式控制
  displayFormat?: RecipeStepDisplayFormat;
  
  // 样式配置
  className?: string;
  preparationIconColor?: string;
  cookingIconColor?: string;
}

/**
 * 统一的菜谱步骤UI组件 - 可显示准备步骤、烹饪步骤或组合步骤
 */
const RecipeStepsUI = ({
  // 步骤数据
  preparationSteps = [],
  cookingSteps = [],
  combinedSteps = [],
  
  // 显示控制
  showCombinedSteps,
  
  // 标题配置
  preparationTitle = '准备工作',
  cookingTitle = '烹饪过程',
  combinedTitle = '烹饪步骤',
  
  // 显示格式控制
  displayFormat = 'sections',
  
  // 样式配置
  className = '',
  preparationIconColor = 'bg-indigo-500',
  cookingIconColor = 'bg-amber-500'
}: RecipeStepsUIProps) => {
  // 清理步骤文本，去除数字前缀
  const cleanStepText = (step: string) => {
    if (!step) return '步骤信息缺失';
    return step.replace(/^(\d+\.|\d+、|\d+\s|\(\d+\)|\d+\)|\d+）|\d+\.|【\d+】|\d+[:：]|\d+\-|\d+\、|\d+[^\u4e00-\u9fa5a-zA-Z0-9])/g, '').trim();
  };

  // 如果没有任何步骤，或步骤数组是空的，显示提示
  if ((!preparationSteps || preparationSteps.length === 0) && 
      (!cookingSteps || cookingSteps.length === 0) && 
      (!combinedSteps || combinedSteps.length === 0)) {
    return (
      <div className="recipe-steps mb-8">
        <h2 className="text-xl font-bold mb-4">{combinedTitle}</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-amber-700">抱歉，该菜谱暂无详细步骤信息。</p>
        </div>
      </div>
    );
  }

  // 使用列表格式显示步骤
  const renderStepsList = (steps: string[], title: string, iconColor: string) => {
    if (!steps || steps.length === 0) return null;
    
    // 检查步骤是否全部相同或为默认步骤
    const isDefaultStep = steps.every(step => 
      step === '准备食材' || 
      step === '按照个人口味烹饪' || 
      step === 'undefined' || 
      step === 'null'
    );
    
    if (isDefaultStep && steps.length <= 2) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">{title}</h3>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-amber-700">抱歉，该菜谱暂无详细步骤信息。</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">{title}</h3>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="pb-3 border-b last:border-0">
              <div className="flex gap-3">
                <span className={`flex-shrink-0 w-8 h-8 ${iconColor} text-white rounded-full flex items-center justify-center font-medium`}>
                  {index + 1}
                </span>
                <div className="mt-1">{cleanStepText(step)}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  // 根据显示格式渲染内容
  const renderContent = () => {
    // 如果使用旧接口的showCombinedSteps
    if (showCombinedSteps !== undefined) {
      if (showCombinedSteps) {
        return renderStepsList(combinedSteps, combinedTitle, cookingIconColor);
      } else {
        return (
          <>
            {renderStepsList(preparationSteps, preparationTitle, preparationIconColor)}
            {renderStepsList(cookingSteps, cookingTitle, cookingIconColor)}
          </>
        );
      }
    }
    
    // 否则使用新的displayFormat参数
    switch (displayFormat) {
      case 'list':
        // 列表模式：显示组合步骤或所有步骤作为单个列表
        return renderStepsList(
          combinedSteps.length > 0 ? combinedSteps : [...preparationSteps, ...cookingSteps],
          combinedTitle,
          cookingIconColor
        );
        
      case 'combined':
        // 组合模式：显示组合步骤
        return renderStepsList(combinedSteps, combinedTitle, cookingIconColor);
        
      case 'sections':
      default:
        // 分区模式：分开显示准备和烹饪步骤
        return (
          <>
            {renderStepsList(preparationSteps, preparationTitle, preparationIconColor)}
            {renderStepsList(cookingSteps, cookingTitle, cookingIconColor)}
          </>
        );
    }
  };

  return (
    <div className={`recipe-steps mb-8 ${className}`}>
      <h2 className="text-xl font-bold mb-4">{combinedTitle}</h2>
      {renderContent()}
    </div>
  );
};

export default memo(RecipeStepsUI); 