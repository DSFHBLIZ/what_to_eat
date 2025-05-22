/* eslint-disable react-hooks/exhaustive-deps */
// 注意: 此文件包含搜索筛选逻辑
'use client';

import React from 'react';
import WithSkeleton from '../../components/ui/WithSkeleton';
import ErrorBoundary from '../../components/error/ErrorBoundary';
import RecipesClient from './recipes-client';

// 标记为动态路由，不进行静态生成
export const dynamic = 'force-dynamic';

/**
 * 菜谱页面
 * 使用recipeSlice提供状态管理
 */
export default function RecipesPage() {
  return (
    <React.Suspense fallback={
      <div className="flex justify-center items-center min-h-[40vh]">
        <WithSkeleton loading={true} variant="spinner">
          <div>内容加载中</div>
        </WithSkeleton>
      </div>
    }>
      <ErrorBoundary theme="recipe">
        <RecipesClient />
      </ErrorBoundary>
    </React.Suspense>
  );
} 