/**
 * 通用测试工具函数
 */
import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * 创建测试用的存储
 */
export function createTestStore(preloadedState = {}) {
  return {
    getState: () => ({ ...preloadedState }),
    setState: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  };
}

/**
 * 模拟API请求
 */
export function mockApiRequest(success = true, data = {}, delay = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve({ data });
      } else {
        reject(new Error('API request failed'));
      }
    }, delay);
  });
}

/**
 * 创建带有测试存储的渲染函数
 */
export function renderWithStore(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children);
  }
  
  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

/**
 * 模拟本地存储
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    setup: () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn((key: string) => store[key] || null),
          setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
          }),
          removeItem: vi.fn((key: string) => {
            delete store[key];
          }),
          clear: vi.fn(() => {
            store = {};
          })
        },
        writable: true
      });
    }
  };
})();

/**
 * 创建异步测试函数
 */
export function createAsyncTestFunction(result: any, error: Error | null = null, delay = 0) {
  return vi.fn().mockImplementation(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }, delay);
    });
  });
} 