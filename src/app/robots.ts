import { MetadataRoute } from 'next';

/**
 * 生成robots.txt文件
 * 控制搜索引擎爬虫的访问规则
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whattoeat.vercel.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/debug/',
          '/*.json$',
          '/404',
          '/private/*',
        ],
        crawlDelay: 10,
      },
      {
        // 百度爬虫特殊规则
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
        crawlDelay: 5,
      },
      {
        // 必应爬虫特殊规则
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
      {
        // 谷歌爬虫特殊规则
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
      {
        // 搜狗爬虫特殊规则
        userAgent: 'Sogou',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
} 