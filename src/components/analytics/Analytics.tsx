'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface AnalyticsProps {
  googleAnalyticsId?: string;
  baiduAnalyticsId?: string;
}

/**
 * 统计分析组件
 * 支持百度统计和Google Analytics
 */
const Analytics: React.FC<AnalyticsProps> = ({
  googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID,
  baiduAnalyticsId = process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 页面浏览跟踪
  useEffect(() => {
    if (pathname) {
      // 向百度统计发送页面浏览数据
      if (window._hmt && baiduAnalyticsId) {
        window._hmt.push(['_trackPageview', pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')]);
      }
      
      // 向Google Analytics发送页面浏览数据
      if (window.gtag && googleAnalyticsId) {
        window.gtag('config', googleAnalyticsId, {
          page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
        });
      }
    }
  }, [pathname, searchParams, googleAnalyticsId, baiduAnalyticsId]);
  
  return (
    <>
      {/* Google Analytics */}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}', {
                page_path: window.location.pathname,
                cookie_flags: 'SameSite=None;Secure'
              });
            `}
          </Script>
        </>
      )}
      
      {/* 百度统计 */}
      {baiduAnalyticsId && (
        <Script id="baidu-analytics" strategy="afterInteractive">
          {`
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?${baiduAnalyticsId}";
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();
          `}
        </Script>
      )}
    </>
  );
};

// 添加全局类型声明
declare global {
  interface Window {
    _hmt?: any[];
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export default Analytics; 