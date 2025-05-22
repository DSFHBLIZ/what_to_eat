/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除静态导出配置，使用服务器端渲染
  // output: 'export',
  
  // 关键配置：告诉Next.js将src作为应用根目录
  experimental: {
    appDir: true,
    // 直接使用src作为项目根目录
    externalDir: true,
  },
  
  // 图片配置，允许从以下域名加载图片
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.cos.ap-*.myqcloud.com',
      },
    ],
    domains: [
      'images.unsplash.com',
      'source.unsplash.com',
      'random.imagecdn.app',
      'foodish-api.herokuapp.com',
      'picsum.photos',
      'recipe-api.example.com',
      'images.pexels.com',
      'cdn.pixabay.com',
      'food-images.example.com',
      'storage.googleapis.com',
      'assets.example.com',
    ],
  },
  
  // 禁用严格模式
  reactStrictMode: true,
  
  // 设置基本路径，如果部署在子目录中需要设置
  // basePath: '/your-base-path',
  
  // ESLint配置，在构建时忽略ESLint错误，避免因ESLint配置问题导致构建失败
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 自定义头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // 配置重定向
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/about',
        permanent: true,
      },
    ];
  },
};

// 为了在使用src/app目录的同时保持app目录下的简单导出文件方案，我们需要提供一个兼容性解决方案
// 这样将来修改src/app下的文件时，不需要同步修改app目录下的文件
module.exports = nextConfig; 