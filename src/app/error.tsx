'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { trackUserAction } from '../utils/common/analytics';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误
    trackUserAction({
      type: 'error',
      label: `应用程序错误: ${error.message}`,
      value: error.digest || error.stack || error.name,
    });
    
    // 可以添加错误日志上报
    console.error('应用错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 mx-auto text-red-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">发生了错误</h2>
          <p className="mt-2 text-md text-gray-600">
            抱歉，应用程序遇到了一个问题。
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-500">您可以尝试以下操作:</p>
          <ul className="list-disc text-left pl-5 text-sm text-gray-600 space-y-2">
            <li>刷新页面重试</li>
            <li>清除浏览器缓存后再试</li>
            <li>使用下方按钮重置应用</li>
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={reset}
            className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            重试
          </button>
          <Link
            href="/"
            className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            返回首页
          </Link>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-400">
            错误代码: {error.digest || 'unknown'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            如果问题持续存在，请
            <Link href="/about" className="text-indigo-600 hover:text-indigo-800 ml-1">
              联系我们
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 