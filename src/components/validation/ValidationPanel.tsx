/**
 * component:ValidationPanel 验证结果展示面板
 * 统一显示验证结果、统计数据和错误信息
 */
import React from 'react';
import { RecipeValidationResult, ValidationStats } from '../../types/validation';

interface ValidationPanelProps {
  title?: string;
  result?: RecipeValidationResult | null;
  stats?: ValidationStats | null;
  showDetails?: boolean;
  showStats?: boolean;
  className?: string;
}

/**
 * 验证面板组件
 * 统一显示验证结果、统计数据和错误信息
 */
const ValidationPanel: React.FC<ValidationPanelProps> = ({
  title = '验证结果',
  result = null,
  stats = null,
  showDetails = false,
  showStats = false,
  className = ''
}) => {
  if (!result && !stats) return null;
  
  // 确定验证是否有效
  const isValid = result?.isValid ?? stats?.isValid ?? false;
  
  // 获取错误信息（从结果或统计中）
  const errors = result?.errors || [];
  const statsErrors = stats?.errors || [];
  
  // 是否显示错误信息
  const hasErrors = errors.length > 0 || statsErrors.length > 0;
  
  return (
    <div className={`validation-panel ${className}`}>
      {/* 标题和状态 */}
      <div className={`p-2 rounded-t-md font-medium ${isValid 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'}`}
      >
        {title}: {isValid ? '验证通过' : '验证失败'}
      </div>
      
      {/* 验证错误区域 */}
      {(!isValid && hasErrors) && (
        <div className="border border-red-300 border-t-0 bg-red-50 p-3 text-sm">
          <h4 className="font-medium text-red-700 mb-1">错误信息：</h4>
          <ul className="list-disc pl-5">
            {/* 显示结果中的错误 */}
            {errors.map((error, index) => (
              <li key={`result-${index}`} className="text-red-600">
                {error.path ? `${error.path}: ` : ''}{error.message}
              </li>
            ))}
            
            {/* 显示统计中的错误 */}
            {statsErrors.map((error, index) => (
              <li key={`stats-${index}`} className="text-red-600">
                {`[项目 ${error.index}] `}{error.path ? `${error.path}: ` : ''}{error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 验证统计区域 */}
      {showStats && stats && (
        <div className={`border ${isValid ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} border-t-0 p-3 text-sm`}>
          <h4 className="font-medium text-gray-700 mb-1">验证统计：</h4>
          <div className="grid grid-cols-2 gap-1">
            {stats.totalItems !== undefined && (
              <>
                <div className="text-gray-600">总项目数:</div>
                <div>{stats.totalItems}</div>
              </>
            )}
            
            {stats.invalidItemsCount !== undefined && (
              <>
                <div className="text-gray-600">无效项目数:</div>
                <div>{stats.invalidItemsCount}</div>
              </>
            )}
            
            {stats.validationTime !== undefined && (
              <>
                <div className="text-gray-600">验证时间:</div>
                <div>{stats.validationTime.toFixed(2)}ms</div>
              </>
            )}
            
            {stats.fromCache !== undefined && (
              <>
                <div className="text-gray-600">缓存命中:</div>
                <div>{stats.fromCache ? '是' : '否'}</div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* 详细信息区域 */}
      {showDetails && result && (
        <div className="border border-gray-300 border-t-0 bg-gray-50 p-3 rounded-b-md text-sm">
          <h4 className="font-medium text-gray-700 mb-1">验证详情：</h4>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-gray-600">错误数量:</div>
            <div>{result.errors.length}</div>
            
            <div className="text-gray-600">数据项目数:</div>
            <div>
              {result.fixedData && typeof result.fixedData === 'object' 
                ? Array.isArray(result.fixedData) 
                  ? `${result.fixedData.length} 个项目` 
                  : `${Object.keys(result.fixedData).length} 个属性`
                : '非对象数据'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel; 