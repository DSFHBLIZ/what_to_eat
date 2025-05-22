'use client';

// 性能指标类型
export interface PerformanceMetrics {
  timeToFirstByte?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  networkInfo?: {
    effectiveType: string;
    rtt: number;
    downlink: number;
  };
}

// 用户行为类型
export interface UserAction {
  type: 'pageView' | 'search' | 'filter' | 'recipeView' | 'error' | 'other';
  label: string;
  value?: any;
  timestamp?: string; // 修改为可选字符串，以便兼容新版本
}

// 保存性能指标
export function capturePerformance(): PerformanceMetrics {
  if (typeof window === 'undefined') return {};

  const metrics: PerformanceMetrics = {};

  // 提取网络信息
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      metrics.networkInfo = {
        effectiveType: conn.effectiveType,
        rtt: conn.rtt,
        downlink: conn.downlink,
      };
    }
  }

  // 提取性能指标
  if ('performance' in window) {
    // Time to First Byte
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      metrics.timeToFirstByte = navEntry.responseStart - navEntry.requestStart;
    }

    // First Contentful Paint
    const paintMetrics = performance.getEntriesByType('paint');
    const fcpEntry = paintMetrics.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.firstContentfulPaint = fcpEntry.startTime;
    }
  }

  return metrics;
}

// 跟踪用户行为
export function trackUserAction(action: Omit<UserAction, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  const fullAction: UserAction = {
    ...action,
    timestamp: Date.now().toString(),
  };

  // 这里应该发送到你的分析服务，例如 Google Analytics、百度统计等
  console.log('User Action:', fullAction);

  // 存储到本地，用于调试或本地分析
  const actions = JSON.parse(localStorage.getItem('user_actions') || '[]');
  actions.push(fullAction);
  localStorage.setItem('user_actions', JSON.stringify(actions));
}

// 记录搜索行为
export function trackSearch(query: string, resultsCount: number): void {
  trackUserAction({
    type: 'search',
    label: query,
    value: { resultsCount }
  });
}

// 记录菜谱浏览
export function trackRecipeView(recipeId: number | string, recipeName: string): void {
  trackUserAction({
    type: 'recipeView',
    label: recipeName,
    value: { recipeId }
  });
}

// 记录过滤器使用
export function trackFilter(filterType: string, filterValue: any): void {
  trackUserAction({
    type: 'filter',
    label: filterType,
    value: filterValue
  });
}

// 记录错误
export function trackError(errorType: string, errorMessage: string, errorDetails?: any): void {
  trackUserAction({
    type: 'error',
    label: errorType,
    value: { message: errorMessage, details: errorDetails }
  });
}

// 初始化分析功能
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return;

  // 记录页面加载
  trackUserAction({
    type: 'pageView',
    label: window.location.pathname,
  });

  // 捕获性能指标
  if ('PerformanceObserver' in window) {
    // 监控 LCP
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        const metrics = capturePerformance();
        metrics.largestContentfulPaint = lastEntry.startTime;
        
        console.log('Performance Metrics:', metrics);
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.error('LCP观察器错误', e);
    }

    // 监控布局偏移
    try {
      let cumulativeLayoutShiftScore = 0;
      
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cumulativeLayoutShiftScore += (entry as any).value;
          }
        }
        
        console.log('当前CLS:', cumulativeLayoutShiftScore);
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.error('CLS观察器错误', e);
    }
  }
}

/**
 * 记录用户交互行为
 * 将用户行为记录到localStorage中，可以在将来用于分析
 * @param action 用户执行的行为
 */
export function logUserAction(action: UserAction) {
  if (typeof window === 'undefined') return;
  
  try {
    // 添加时间戳
    const actionWithTimestamp = {
      ...action,
      timestamp: new Date().toISOString()
    };
    
    console.log('User Action:', actionWithTimestamp);
    
    // 从localStorage获取现有行为记录
    let actions: UserAction[] = [];
    try {
      const storedActions = localStorage.getItem('user_actions');
      actions = storedActions ? JSON.parse(storedActions) : [];
      
      // 验证解析结果是否为数组
      if (!Array.isArray(actions)) {
        console.warn('存储的用户行为不是有效数组，重置为空数组');
        actions = [];
      }
    } catch (parseError) {
      console.error('解析用户行为数据失败', 
        parseError instanceof Error ? parseError.message : String(parseError));
      actions = []; // 解析失败时重置为空数组
    }
    
    // 添加新行为
    actions.push(actionWithTimestamp);
    
    // 如果记录过多，只保留最近的100条
    if (actions.length > 100) {
      actions = actions.slice(-100);
    }
    
    // 保存回localStorage
    localStorage.setItem('user_actions', JSON.stringify(actions));
  } catch (error) {
    console.error('记录用户行为失败', 
      error instanceof Error ? error.message : String(error));
  }
} 