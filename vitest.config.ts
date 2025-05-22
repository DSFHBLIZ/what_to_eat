import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // @ts-ignore - vite与vitest版本不匹配导致类型错误
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/']
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    deps: {
      inline: ['@testing-library/react']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
}); 