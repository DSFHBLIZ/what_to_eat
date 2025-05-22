/** @type {import('tailwindcss').Config} */

// 导入design token系统
const DesignTokens = require('./src/design-tokens');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 使用生成的配置扩展Tailwind默认配置
      ...DesignTokens.generateTailwindConfig(),
    },
  },
  plugins: [],
  // 启用暗色模式，基于类名而不是媒体查询
  darkMode: ['class', '[data-theme="dark"]'],
}; 