'use client';

/**
 * 性能优化工具函数集合
 * 注意：基础性能监控功能已集成到performanceMonitor.ts
 * 此文件仅保留特殊工具函数
 */

/**
 * 批量基准测试 - 用于同时测试和比较多个函数的性能
 * @param fns 要测试的函数及其名称
 * @param iterations 运行次数
 */
export function benchmarkGroup(
  fns: { name: string; fn: () => any }[],
  iterations: number = 100
): void {
  console.group('性能基准测试');
  
  // 预热一次
  fns.forEach(({ fn }) => fn());
  
  // 进行基准测试
  const results = fns.map(({ name, fn }) => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    const end = performance.now();
    const average = (end - start) / iterations;
    
    return { name, time: average };
  });
  
  // 按性能排序并显示结果
  results.sort((a, b) => a.time - b.time);
  
  // 计算相对性能
  const fastest = results[0].time;
  
  results.forEach(({ name, time }, index) => {
    const relative = time / fastest;
    const relativeStr = index === 0 ? '(最快)' : `(慢 ${relative.toFixed(2)}x)`;
    console.log(`${name}: ${time.toFixed(3)}ms/次 ${relativeStr}`);
  });
  
  console.groupEnd();
}

/**
 * 使用requestAnimationFrame优化DOM操作
 * @param callback DOM操作回调
 */
export function rafSchedule(callback: () => void): void {
  requestAnimationFrame(() => {
    callback();
  });
}

/**
 * 批量处理DOM更新操作
 * @param updateFn 更新函数
 */
export function batchDOMUpdates(updateFn: () => void): void {
  // 创建一个微任务以批量处理DOM更新
  Promise.resolve().then(updateFn);
}

/**
 * 资源预加载
 * @param url 要预加载的资源URL
 * @param type 资源类型
 */
export function preloadResource(url: string, type: 'image' | 'style' | 'script' = 'image'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'image':
      link.as = 'image';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'script':
      link.as = 'script';
      break;
  }
  
  document.head.appendChild(link);
}

/**
 * 延迟加载图片
 * @param imageElement 图片元素
 * @param src 图片URL
 */
export function lazyLoadImage(imageElement: HTMLImageElement, src: string): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          imageElement.src = src;
          observer.unobserve(imageElement);
        }
      });
    });
    
    observer.observe(imageElement);
  } else {
    // 降级处理
    imageElement.src = src;
  }
} 