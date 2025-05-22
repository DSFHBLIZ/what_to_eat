import React, { memo } from 'react';

interface RecipeTipsSectionUIProps {
  tips: string[];
  className?: string;
}

/**
 * 菜谱小贴士UI组件
 * 负责展示菜谱的烹饪提示和技巧
 */
const RecipeTipsSectionUI = memo(function RecipeTipsSectionUI({
  tips,
  className = ''
}: RecipeTipsSectionUIProps) {
  // 如果没有小贴士，不渲染任何内容
  if (!tips || tips.length === 0) {
    return null;
  }

  return (
    <div className={`recipe-tips ${className}`}>
      <h2 className="text-xl font-bold mb-4">小贴士</h2>
      <ul className="space-y-2 bg-amber-50 p-4 rounded-md">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default RecipeTipsSectionUI; 