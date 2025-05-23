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
  title: '冰箱里有什么？ - 智能菜谱推荐',
  description: '根据冰箱现有食材智能推荐菜谱，解决每天"今天吃什么"的难题。简单家常菜做法，10分钟快手菜，让做饭变得轻松有趣。',
  keywords: '冰箱里有什么, 今天吃什么, 晚饭吃什么, 中午吃什么, 家常菜做法, 简单菜谱, 快手菜, 懒人菜谱, 食材搭配',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://whattoeat.vercel.app'),
  openGraph: {
    title: '冰箱里有什么？ - 智能菜谱推荐',
    description: '根据冰箱现有食材智能推荐菜谱，解决每天"今天吃什么"的难题',
    locale: 'zh_CN',
    type: 'website',
    siteName: '冰箱里有什么？',
  },
  twitter: {
    card: 'summary',
    title: '冰箱里有什么？ - 智能菜谱推荐',
    description: '根据冰箱现有食材智能推荐菜谱，解决每天"今天吃什么"的难题',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'none',
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