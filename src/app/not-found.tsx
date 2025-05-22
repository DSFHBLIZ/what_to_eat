'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { trackUserAction } from '../utils/common/analytics';

export default function NotFound() {
  useEffect(() => {
    // 记录404错误
    trackUserAction({
      type: 'error',
      label: '404页面未找到',
      value: window.location.pathname,
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-extrabold text-indigo-600">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">页面未找到</h2>
          <p className="mt-2 text-md text-gray-600">
            抱歉，您访问的页面不存在或已被移除。
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-500">
            您可以尝试以下操作:
          </p>
          <ul className="list-disc text-left pl-5 text-sm text-gray-600 space-y-2">
            <li>检查URL是否输入正确</li>
            <li>返回上一页并尝试其他链接</li>
            <li>使用下方按钮返回首页</li>
          </ul>
        </div>
        
        <div className="mt-6">
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            返回首页
          </Link>
        </div>
        
        <div className="mt-6">
          <p className="text-xs text-gray-400">
            如果您认为这是一个错误，请<Link href="/about" className="text-indigo-600 hover:text-indigo-800">联系我们</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 