import './globals.css';
import { Inter } from 'next/font/google';
import { setupGlobalErrorHandler } from '../utils/common/errorLogger';
import ErrorBoundary from '../components/error/ErrorBoundary';
import Navbar from '../components/Navbar';
import type { Metadata } from 'next';
import Script from 'next/script';
import Footer from '../components/Footer';
import { Providers } from './providers';
import Analytics from '../components/analytics';
import BackToTop from '../components/ui/BackToTop';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// 元数据
export const metadata: Metadata = {
  title: '今天吃什么 - 找到你想做的美食',
  description: '基于你家现有食材推荐食谱，解决每天"吃什么"的难题',
  keywords: '菜谱, 食谱, 推荐, 智能, 搜索, 今天吃什么, 做饭, 食材',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://whattoeat.vercel.app'),
  openGraph: {
    title: '今天吃什么 - 智能菜谱推荐',
    description: '基于你家现有食材推荐食谱，解决每天"吃什么"的难题',
    locale: 'zh_CN',
    type: 'website',
    siteName: '今天吃什么',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '今天吃什么 - 智能菜谱推荐平台',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '今天吃什么 - 智能菜谱推荐',
    description: '基于你家现有食材推荐食谱，解决每天"吃什么"的难题',
    images: ['/images/twitter-card.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: {
      'zh-CN': '/',
    },
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_BAIDU_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 在客户端环境下初始化全局错误处理
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandler();
  }
  
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 内联主题预加载脚本，避免闪烁 */}
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              function getThemePreference() {
                try {
                  const stored = localStorage.getItem('theme-storage');
                  if (stored) {
                    const data = JSON.parse(stored);
                    if (data.state && data.state.theme) {
                      return data.state.theme === 'system' 
                        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                        : data.state.theme;
                    }
                  }
                } catch (e) {}
                
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              
              const theme = getThemePreference();
              document.documentElement.setAttribute('data-theme', theme);
              document.documentElement.style.setProperty('--color-background', theme === 'dark' ? '#1f2937' : '#ffffff');
              document.documentElement.style.setProperty('--color-text', theme === 'dark' ? '#f9fafb' : '#1f2937');
            })();
          `}
        </Script>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧅</text></svg>" />
      </head>
      <body className={`${inter.className} min-h-screen bg-white dark:bg-gray-900 dark:text-gray-100`} suppressHydrationWarning>
        <Providers>
          <ErrorBoundary enableLogging={true} className="w-full h-full">
            <Navbar className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800" />
            <main className="flex-1 mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 max-w-full xl:max-w-[1440px] 2xl:max-w-[1600px] pt-6">
              {children}
            </main>
            <Footer />
            {/* 全局回到顶部按钮 */}
            <BackToTop />
          </ErrorBoundary>
        </Providers>
        
        {/* 统计分析代码 */}
        <Analytics />
      </body>
    </html>
  );
} 