import React from 'react';
import { normalizeDifficulty, getDifficultyColor } from '../../styles/theme';

export interface DifficultyBadgeUIProps {
  difficulty: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * 难度气泡UI组件 - 纯展示组件，没有客户端行为，可用于服务端组件
 * 
 * @param difficulty - 难度等级（'简单'/'easy', '中等'/'medium', '困难'/'hard'）
 * @param showLabel - 是否显示"难度："标签
 * @param size - 尺寸大小
 * @param className - 额外的CSS类名
 * @param theme - 主题类型
 */
export const DifficultyBadgeUI: React.FC<DifficultyBadgeUIProps> = ({ 
  difficulty, 
  showLabel = true, 
  size = 'md', 
  className = '',
  theme = 'light'
}) => {
  // 如果没有提供难度或难度为"未知"，则不显示组件
  if (!difficulty || difficulty === '未知' || difficulty === '暂无难度') {
    return null;
  }

  // 标准化难度值
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  
  // 获取对应难度的样式
  const colors = getDifficultyColor(difficulty, theme);
  
  // 根据尺寸确定内边距和字体大小
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  // 获取翻译后的难度文本
  const difficultyTextMap: Record<'easy' | 'medium' | 'hard', string> = {
    easy: '简单',
    medium: '中等',
    hard: '复杂',
  };
  
  const difficultyText = difficultyTextMap[normalizedDifficulty];
  
  // 圆角样式
  const borderRadiusClass = 'rounded-full';
  
  return (
    <span 
      className={`${colors.bg} ${colors.text} ${sizeClasses[size]} ${colors.printBg || ''} ${borderRadiusClass} ${className}`}
      data-difficulty={normalizedDifficulty}
    >
      {showLabel ? '难度：' : ''}{difficultyText}
    </span>
  );
};

export default DifficultyBadgeUI; 