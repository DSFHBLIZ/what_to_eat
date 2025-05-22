'use client';

import { memo } from 'react';
import DifficultyBadgeUI, { DifficultyBadgeUIProps } from './DifficultyBadgeUI';

/**
 * 难度气泡客户端组件 - 包装DifficultyBadgeUI并添加客户端功能（如果需要）
 */
const DifficultyBadge: React.FC<DifficultyBadgeUIProps> = (props) => {
  // 目前这个组件没有交互行为，直接传递props到UI组件
  return <DifficultyBadgeUI {...props} />;
};

// 使用memo优化组件，避免不必要的重渲染
export default memo(DifficultyBadge); 