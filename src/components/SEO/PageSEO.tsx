'use client';

import Head from 'next/head';
import React from 'react';

interface PageSEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * 页面SEO组件
 * 用于为普通页面设置SEO相关元数据
 */
const PageSEO: React.FC<PageSEOProps> = ({
  title = '冰箱里有什么 - 智能菜谱推荐',
  description = '基于你家现有食材推荐食谱，解决每天"吃什么"的难题',
  canonical = '',
  ogImage = '/images/og-image.jpg',
  noIndex = false,
}) => {
  const siteName = '冰箱里有什么';
  const fullUrl = canonical 
    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://whattoeat.vercel.app'}${canonical}` 
    : '';

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={fullUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {canonical && <meta property="og:url" content={fullUrl} />}
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* No index if specified */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
};

export default PageSEO; 