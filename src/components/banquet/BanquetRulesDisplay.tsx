'use client';

import React, { useMemo } from 'react';
import { Recipe } from '../../types/recipe';
import { DishAllocation, SelectedDish, RuleCheckResult } from '../../types/banquet';
import { checkBanquetRules, convertRecipeToSelectedDish } from '../../utils/banquetRules';
import { AlertTriangle, CheckCircle, Info, X, Target, Users } from 'lucide-react';

interface BanquetRulesDisplayProps {
  selectedRecipes: Recipe[];
  allocation: DishAllocation;
  guestCount: number;
  onNavigateToSummary?: () => void;
}

/**
 * 宴会规则提示组件
 * 显示选菜进度、规则检查和建议
 */
export default function BanquetRulesDisplay({
  selectedRecipes,
  allocation,
  guestCount,
  onNavigateToSummary
}: BanquetRulesDisplayProps) {
  
  // 转换为SelectedDish格式并检查规则
  const { selectedDishes, ruleCheckResult } = useMemo(() => {
    const dishes = selectedRecipes.map(recipe => convertRecipeToSelectedDish(recipe));
    const result = checkBanquetRules(dishes, allocation);
    return { selectedDishes: dishes, ruleCheckResult: result };
  }, [selectedRecipes, allocation]);

  const selectedCount = selectedRecipes.length;
  const targetCount = allocation.totalDishes;
  const progress = Math.min((selectedCount / targetCount) * 100, 100);
  
  // 确定整体状态
  const getOverallStatus = () => {
    if (ruleCheckResult.forbidden.length > 0) return 'error';
    if (ruleCheckResult.missing.length > 0) return 'incomplete';
    if (ruleCheckResult.warnings.length > 0) return 'warning';
    if (selectedCount === targetCount && ruleCheckResult.isValid) return 'complete';
    return 'incomplete';
  };

  const overallStatus = getOverallStatus();

  const statusConfig = {
    error: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertTriangle size={20} className="text-red-500" />
    },
    warning: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <AlertTriangle size={20} className="text-yellow-500" />
    },
    incomplete: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <Info size={20} className="text-blue-500" />
    },
    complete: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <CheckCircle size={20} className="text-green-500" />
    }
  };

  const currentStatus = statusConfig[overallStatus];

  return (
    <div className={`
      p-4 rounded-lg border-2 ${currentStatus.borderColor} ${currentStatus.bgColor}
      transition-all duration-200
    `}>
      {/* 标题和进度 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {currentStatus.icon}
          <h3 className={`font-semibold ${currentStatus.color}`}>
            宴会配菜进度
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users size={16} className="text-gray-500" />
            <span className="text-gray-600">{guestCount}人桌</span>
          </div>
          <div className="flex items-center gap-1">
            <Target size={16} className="text-gray-500" />
            <span className={currentStatus.color}>
              {selectedCount}/{targetCount}道菜
            </span>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              overallStatus === 'complete' ? 'bg-green-500' :
              overallStatus === 'error' ? 'bg-red-500' :
              overallStatus === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          进度: {progress.toFixed(0)}%
        </div>
      </div>

      {/* 规则检查结果 */}
      <div className="space-y-3">
        {/* 忌讳项目 */}
        {ruleCheckResult.forbidden.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <X size={16} className="text-red-500" />
              <span className="font-medium text-red-700">宴会忌讳</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {ruleCheckResult.forbidden.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 缺少项目 */}
        {ruleCheckResult.missing.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-blue-500" />
              <span className="font-medium text-blue-700">待完善</span>
            </div>
            <ul className="text-sm text-blue-600 space-y-1">
              {ruleCheckResult.missing.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 警告 */}
        {ruleCheckResult.warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              <span className="font-medium text-yellow-700">注意事项</span>
            </div>
            <ul className="text-sm text-yellow-600 space-y-1">
              {ruleCheckResult.warnings.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 建议 */}
        {ruleCheckResult.suggestions.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="font-medium text-green-700">优化建议</span>
            </div>
            <ul className="text-sm text-green-600 space-y-1">
              {ruleCheckResult.suggestions.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {selectedCount > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onNavigateToSummary}
              disabled={selectedCount === 0}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${overallStatus === 'complete' 
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {overallStatus === 'complete' ? '生成宴会菜单' : `预览菜单 (${selectedCount}道菜)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 