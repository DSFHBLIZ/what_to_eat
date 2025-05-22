// vitest.setup.ts
import { vi } from 'vitest';

// 设置为中文环境
// @ts-ignore
global.navigator = {
  language: 'zh-CN'
};

// 模拟IndexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn().mockReturnValue({
      onupgradeneeded: vi.fn(),
      onsuccess: vi.fn(),
      onerror: vi.fn(),
      result: {
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            get: vi.fn(),
            put: vi.fn(),
            getAll: vi.fn(),
            clear: vi.fn(),
            count: vi.fn(),
            createIndex: vi.fn()
          }),
          oncomplete: vi.fn(),
          onerror: vi.fn()
        }),
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(true)
        },
        createObjectStore: vi.fn().mockReturnValue({
          createIndex: vi.fn()
        })
      }
    })
  },
  writable: true
}); 