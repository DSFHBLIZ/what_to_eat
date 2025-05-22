import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * 测试运行器组件，用于在测试中渲染React组件
 */
interface TestRunnerProps {
  children: React.ReactNode;
  onRender?: () => void;
  testId?: string;
}

/**
 * 用于在测试环境中渲染React组件的包装器组件
 */
export const TestRunner: React.FC<TestRunnerProps> = ({ 
  children, 
  onRender, 
  testId = 'test-container' 
}) => {
  React.useEffect(() => {
    if (onRender) {
      onRender();
    }
  }, [onRender]);

  return (
    <div data-testid={testId}>
      {children}
    </div>
  );
};

// 设置组件显示名称
TestRunner.displayName = 'TestRunner';

/**
 * 渲染组件并返回渲染结果和相关辅助方法
 */
export function renderComponent<T = any>(
  ui: React.ReactElement,
  options?: {
    testId?: string;
    onRender?: () => void;
    renderOptions?: any;
  }
) {
  const { testId, onRender, renderOptions } = options || {};
  
  const result = render(
    <TestRunner testId={testId} onRender={onRender}>
      {ui}
    </TestRunner>,
    renderOptions
  );
  
  return {
    ...result,
    container: result.container,
    getContainer: () => screen.getByTestId(testId || 'test-container'),
    rerender: (newUi: React.ReactElement) => {
      result.rerender(
        <TestRunner testId={testId} onRender={onRender}>
          {newUi}
        </TestRunner>
      );
    }
  };
}

/**
 * 创建一个测试上下文提供器，用于在测试中提供上下文
 */
export function createTestContextProvider<T>(
  Context: React.Context<T>,
  initialValue: T
) {
  return ({ children, value }: { children: React.ReactNode; value?: Partial<T> }) => (
    <Context.Provider value={{ ...initialValue, ...value }}>
      {children}
    </Context.Provider>
  );
}

/**
 * 创建一个模拟的窗口尺寸环境
 */
export function mockWindowSize(width: number, height: number) {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  
  // 修改窗口尺寸
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
  
  // 触发resize事件
  window.dispatchEvent(new Event('resize'));
  
  // 返回清理函数
  return () => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
    window.dispatchEvent(new Event('resize'));
  };
}

/**
 * 等待指定时间
 */
export function wait(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * 创建DOM元素选择器
 */
export const byTestId = (id: string) => `[data-testid="${id}"]`;

/**
 * 模拟交互事件（例如屏幕点击、滚动等）
 */
export const mockInteraction = {
  click: (element: Element | null) => {
    if (!element) throw new Error('Cannot click on null element');
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },
  
  scroll: (element: Element | null, { top, left }: { top?: number; left?: number } = {}) => {
    if (!element) throw new Error('Cannot scroll null element');
    const scrollOptions: ScrollToOptions = {};
    
    if (top !== undefined) scrollOptions.top = top;
    if (left !== undefined) scrollOptions.left = left;
    
    element.scrollTo(scrollOptions);
    element.dispatchEvent(new Event('scroll', { bubbles: true }));
  },
  
  hover: (element: Element | null) => {
    if (!element) throw new Error('Cannot hover over null element');
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  },
  
  unhover: (element: Element | null) => {
    if (!element) throw new Error('Cannot unhover from null element');
    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }
};

/**
 * 可访问性测试工具
 */
export const a11y = {
  getByRole: (role: string, name?: string) => {
    const selector = name 
      ? `[role="${role}"][aria-label="${name}"]` 
      : `[role="${role}"]`;
    return document.querySelector(selector);
  },
  
  getByLabelText: (text: string) => {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent?.includes(text)) {
        const id = label.getAttribute('for');
        if (id) {
          return document.getElementById(id);
        }
      }
    }
    return null;
  }
};

/**
 * 创建自定义断言函数
 */
export const expectUtils = {
  toBeVisible: (element: Element | null) => {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  },
  
  toHaveClasses: (element: Element | null, classNames: string[]) => {
    if (!element) return false;
    return classNames.every(className => element.classList.contains(className));
  },
  
  toMatchPattern: (text: string, pattern: RegExp) => {
    return pattern.test(text);
  }
}; 