'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// 用于测试的组件，会在渲染时抛出异常
function ErrorComponent() {
  // 故意访问undefined的属性
  const obj: any = undefined;
  
  // 使用安全的方式获取属性
  // 如果需要显示错误，可以在catch块中处理
  try {
    // 检查obj是否存在
    if (obj === undefined || obj === null) {
      return <div className="p-3 bg-red-50 text-red-800 rounded border border-red-200">
        对象为 {obj === undefined ? 'undefined' : 'null'}, 无法访问属性
      </div>;
    }
    return <div>{obj.nonExistentProperty}</div>;
  } catch (error) {
    console.error('渲染ErrorComponent时捕获到错误:', error instanceof Error ? error.message : String(error));
    return <div className="p-3 bg-red-50 text-red-800 rounded border border-red-200">
      尝试渲染组件时出错: {error instanceof Error ? error.message : String(error)}
    </div>;
  }
}

// 会在挂载后抛出异常的组件
function DelayedErrorComponent() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  useEffect(() => {
    // 使用try/catch包装计时器代码
    const timer = setTimeout(() => {
      // 设置错误状态，而不是抛出错误
      setHasError(true);
      setErrorMessage('这是一个计时器中的错误');
      console.error('DelayedErrorComponent计时器错误被模拟');
    }, 1000);
    
    // 清理计时器
    return () => clearTimeout(timer);
  }, []);

  // 根据错误状态显示不同内容
  if (hasError) {
    return (
      <div className="p-3 bg-orange-50 text-orange-800 rounded border border-orange-200">
        延迟组件出错: {errorMessage}
      </div>
    );
  }
  
  return <div>这个组件将在1秒后抛出错误...</div>;
}

// 会在点击时抛出异常的组件
function ClickErrorComponent() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const handleClick = () => {
    console.error('点击事件模拟错误');
    setHasError(true);
    setErrorMessage('点击操作时的错误');
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        点击触发错误
      </button>
      
      {hasError && (
        <div className="mt-2 p-3 bg-red-50 text-red-800 rounded border border-red-200">
          点击操作出错: {errorMessage}
        </div>
      )}
    </div>
  );
}

// 会触发Promise拒绝的组件
function PromiseErrorComponent() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const handleClick = async () => {
    try {
      // 使用await确保Promise错误被捕获
      await new Promise((_, reject) => {
        reject(new Error('处理Promise拒绝'));
      });
    } catch (error) {
      console.error('Promise拒绝被捕获:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      // 不再重新抛出错误
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
      >
        触发Promise拒绝
      </button>
      
      {hasError && (
        <div className="mt-2 p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
          Promise错误: {errorMessage}
        </div>
      )}
    </div>
  );
}

// 测试类型错误的组件
function TypeErrorComponent() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const handleClick = () => {
    try {
      const arr: string[] | null = null;
      // 安全地检查null
      if (arr === null || arr === undefined) {
        setHasError(true);
        setErrorMessage('数组为null，无法调用forEach方法');
        return;
      }
      
      // 这一行在安全检查后不会执行
      // @ts-ignore - 忽略类型检查，这行代码实际上永远不会执行
      arr.forEach(item => console.log(item));
    } catch (error) {
      console.error('类型错误被捕获:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        触发类型错误
      </button>
      
      {hasError && (
        <div className="mt-2 p-3 bg-purple-50 text-purple-800 rounded border border-purple-200">
          类型错误: {errorMessage}
        </div>
      )}
    </div>
  );
}

// 模拟网络错误的组件
function NetworkErrorComponent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 在组件卸载时中止任何挂起的请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    
    // 创建新的AbortController并保存引用
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // 设置超时处理
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort('请求超时');
        }
      }, 10000); // 10秒超时
      
      // 尝试请求一个不存在的URL，但使用AbortController信号
      await fetch('https://非法域名.com/不存在的路径', { 
        signal,
        // 一些基本请求设置
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 设置较短的超时
        cache: 'no-cache',
      });
      
      // 清除超时定时器
      clearTimeout(timeoutId);
    } catch (e) {
      console.error('网络错误被捕获:', e);
      
      // 检查错误类型以提供更详细的错误信息
      if (e instanceof TypeError) {
        // 网络错误、CORS错误等
        setError(`网络请求错误: ${e.message}`);
      } else if (e instanceof DOMException && e.name === 'AbortError') {
        // 请求被中止
        setError(`请求被中止: ${e.message}`);
      } else {
        // 其他错误
        setError(e instanceof Error ? e.message : String(e));
      }
      
      // 确保已清理AbortController
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded`}
      >
        {isLoading ? '请求中...' : '触发网络错误'}
      </button>
      {error && (
        <div className="mt-2 p-3 bg-indigo-50 text-indigo-800 rounded border border-indigo-200">
          网络错误: {error}
        </div>
      )}
    </div>
  );
}

// 测试页面，提供各种错误触发方式
export default function TestErrorPage() {
  const [showRenderError, setShowRenderError] = useState(false);
  const [showDelayedError, setShowDelayedError] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">错误处理测试页面</h1>
        <p className="text-gray-600 mb-4">
          本页面用于测试应用程序的错误处理和日志功能
        </p>
        <div className="flex space-x-4">
          <Link
            href="/debug"
            className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
          >
            返回调试页
          </Link>
          <Link
            href="/debug/errors"
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
          >
            查看错误日志
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 渲染错误测试 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-3">渲染错误测试</h2>
          <p className="text-sm text-gray-600 mb-4">
            点击按钮将尝试渲染一个会抛出异常的组件
          </p>
          <button
            onClick={() => setShowRenderError(true)}
            className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            显示错误组件
          </button>
          {showRenderError && <ErrorComponent />}
        </div>

        {/* 延迟错误测试 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-3">延迟错误测试</h2>
          <p className="text-sm text-gray-600 mb-4">
            点击按钮将加载一个组件，它会在1秒后抛出一个错误
          </p>
          <button
            onClick={() => setShowDelayedError(true)}
            className="px-4 py-2 bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
          >
            显示延迟错误组件
          </button>
          {showDelayedError && <DelayedErrorComponent />}
        </div>

        {/* 点击错误测试 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-3">点击事件错误测试</h2>
          <p className="text-sm text-gray-600 mb-4">
            点击按钮将在事件处理程序中触发一个错误
          </p>
          <ClickErrorComponent />
        </div>

        {/* Promise错误测试 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-3">Promise拒绝测试</h2>
          <p className="text-sm text-gray-600 mb-4">
            点击按钮将触发一个未处理的Promise拒绝
          </p>
          <PromiseErrorComponent />
        </div>

        {/* 类型错误测试 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-3">类型错误测试</h2>
          <p className="text-sm text-gray-600 mb-4">
            点击按钮将尝试对null调用方法
          </p>
          <TypeErrorComponent />
        </div>

        {/* 网络错误测试 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-3">网络错误测试</h2>
          <p className="text-sm text-gray-600 mb-4">
            点击按钮将尝试发送一个不可能成功的网络请求
          </p>
          <NetworkErrorComponent />
        </div>
      </div>
    </div>
  );
} 