#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('开始执行性能检查和优化...\n');

// 检查是否安装了必要的依赖
const requiredDeps = ['next-bundle-analyzer', 'sharp', 'next-pwa'];
const packageJsonPath = path.join(process.cwd(), 'package.json');
let packageJson = require(packageJsonPath);

const missingDeps = [];
requiredDeps.forEach(dep => {
  if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.log(`安装缺失的依赖: ${missingDeps.join(', ')}`);
  execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  console.log('依赖安装完成\n');
  // 重新加载 package.json
  packageJson = require(packageJsonPath);
}

// 检查 next.config.js 是否包含必要的优化配置
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
let nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

// 检查是否已启用图像优化
if (!nextConfigContent.includes('images:')) {
  console.log('添加图像优化配置...');
  const imageConfig = `
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },`;
  
  nextConfigContent = nextConfigContent.replace(
    /module\.exports\s*=\s*{/,
    `module.exports = {${imageConfig}`
  );
  fs.writeFileSync(nextConfigPath, nextConfigContent, 'utf8');
  console.log('图像优化配置已添加\n');
}

// 检查是否已启用 Bundle Analyzer
if (!nextConfigContent.includes('withBundleAnalyzer')) {
  console.log('添加Bundle Analyzer配置...');
  
  const analyzerConfig = `
const withBundleAnalyzer = require('next-bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

`;
  const updatedConfig = analyzerConfig + nextConfigContent.replace(
    /module\.exports\s*=\s*/,
    'const nextConfig = '
  ) + '\n\nmodule.exports = withBundleAnalyzer(nextConfig);';
  
  fs.writeFileSync(nextConfigPath, updatedConfig, 'utf8');
  console.log('Bundle Analyzer配置已添加\n');
}

// 检查是否已启用 PWA
if (!nextConfigContent.includes('withPWA')) {
  console.log('添加PWA配置...');
  
  // 重新读取文件，因为我们可能已经修改了它
  nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfigContent.includes('withBundleAnalyzer')) {
    // 如果已经有了 withBundleAnalyzer 包装
    const pwaConfig = `
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

`;
    const updatedConfig = nextConfigContent
      .replace('module.exports = withBundleAnalyzer(nextConfig);', 'module.exports = withBundleAnalyzer(withPWA(nextConfig));')
      .replace('const withBundleAnalyzer', pwaConfig + 'const withBundleAnalyzer');
    
    fs.writeFileSync(nextConfigPath, updatedConfig, 'utf8');
  } else {
    // 如果没有 withBundleAnalyzer 包装
    const pwaConfig = `
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

`;
    const updatedConfig = pwaConfig + nextConfigContent.replace(
      /module\.exports\s*=\s*/,
      'const nextConfig = '
    ) + '\n\nmodule.exports = withPWA(nextConfig);';
    
    fs.writeFileSync(nextConfigPath, updatedConfig, 'utf8');
  }
  
  console.log('PWA配置已添加\n');
  
  // 创建 manifest.json 文件
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.log('创建PWA manifest.json文件...');
    
    const manifest = {
      name: '冰箱里有什么',
      short_name: '冰箱里有什么',
      description: '智能菜谱推荐平台',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    };
    
    // 确保 public/icons 目录存在
    const iconsDir = path.join(process.cwd(), 'public', 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('PWA manifest.json文件已创建\n');
  }
}

// 添加脚本到 package.json
const scriptsToAdd = {
  'analyze': 'ANALYZE=true next build',
  'performance:check': 'node scripts/performance-check.js',
};

let scriptAdded = false;
Object.entries(scriptsToAdd).forEach(([key, value]) => {
  if (!packageJson.scripts[key]) {
    packageJson.scripts[key] = value;
    scriptAdded = true;
  }
});

if (scriptAdded) {
  console.log('添加性能分析脚本到package.json...');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log('性能分析脚本已添加\n');
}

console.log('性能检查和优化完成！');
console.log('\n您可以运行以下命令来分析应用性能:');
console.log('- npm run analyze: 分析应用bundle大小');
console.log('- npm run performance:check: 重新运行此性能检查脚本');
console.log('\n建议:');
console.log('1. 在部署前运行 npm run analyze 检查bundle大小');
console.log('2. 确保添加缺少的PWA图标到 public/icons 目录'); 