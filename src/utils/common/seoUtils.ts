import type { Metadata } from 'next';
import { Recipe } from '../../types/recipe';

// 全局站点基本配置
const SITE_CONFIG = {
  name: '冰箱里有什么？',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://whattoeat.vercel.app',
  defaultImage: '/images/og-image.jpg',
  twitterHandle: '@whattoeat',
  googleVerification: 'google_verification_code',
};

// 通用元数据生成函数
export function generateMetadata({
  title,
  description,
  keywords = '',
  image = SITE_CONFIG.defaultImage,
  url = '/',
  type = 'website',
  noindex = false,
}: {
  title: string;
  description: string;
  keywords?: string | string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}): Metadata {
  // 确保标题包含站点名称
  const formattedTitle = title.includes(SITE_CONFIG.name) 
    ? title 
    : `${title} - ${SITE_CONFIG.name}`;
  
  // 格式化关键词
  const formattedKeywords = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  
  // 确保图片URL为完整路径
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_CONFIG.baseUrl}${image}`;
  
  // 确保URL为完整路径
  const fullUrl = url.startsWith('http') ? url : `${SITE_CONFIG.baseUrl}${url}`;

  return {
    title: formattedTitle,
    description,
    keywords: formattedKeywords,
    authors: [{ name: `${SITE_CONFIG.name}团队` }],
    creator: `${SITE_CONFIG.name}团队`,
    publisher: SITE_CONFIG.name,
    formatDetection: {
      email: false,
      telephone: false,
      address: false,
    },
    metadataBase: new URL(SITE_CONFIG.baseUrl),
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: formattedTitle,
      description,
      url: fullUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: formattedTitle,
        }
      ],
      locale: 'zh_CN',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: formattedTitle,
      description,
      images: [fullImageUrl],
      creator: SITE_CONFIG.twitterHandle,
      site: SITE_CONFIG.twitterHandle,
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
    },
    robots: noindex ? 
      { index: false, follow: false } : 
      {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    verification: {
      google: SITE_CONFIG.googleVerification,
    },
  };
}

// 菜谱专用元数据生成函数
export function generateRecipeMetadata(recipe: Recipe): Metadata {
  if (!recipe) {
    return generateMetadata({
      title: '菜谱未找到',
      description: '抱歉，我们无法找到您请求的菜谱。',
      noindex: true,
    });
  }
  
  // 构建完整的图片URL
  const imageUrl = recipe.imageUrl 
    ? (recipe.imageUrl.startsWith('http') ? recipe.imageUrl : `${SITE_CONFIG.baseUrl}${recipe.imageUrl}`)
    : `${SITE_CONFIG.baseUrl}/images/default-recipe.jpg`;
  
  // 构造规范的描述
  const description = recipe.description 
    ? recipe.description.substring(0, 150) + (recipe.description.length > 150 ? '...' : '')
    : `查看${recipe.name}的做法、用料和烹饪步骤`;
  
  // 构建关键词
  const keywords = [
    recipe.name,
    ...(recipe.cuisine ? [recipe.cuisine] : []),
    ...(recipe.flavors && Array.isArray(recipe.flavors) ? recipe.flavors : []),
    ...(recipe.tags && Array.isArray(recipe.tags) ? recipe.tags : []),
    '做法', '食谱', '菜谱'
  ].filter(Boolean);
  
  // 使用通用元数据生成函数
  const baseMetadata = generateMetadata({
    title: recipe.name,
    description,
    keywords,
    image: imageUrl,
    url: `/recipe/${recipe.id}`,
    type: 'article',
  });

  // 添加食谱结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    image: imageUrl,
    description: description,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name
    },
    datePublished: recipe.createdAt || new Date().toISOString(),
    recipeCategory: recipe.cuisine || '',
    recipeCuisine: recipe.cuisine || '',
    prepTime: recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
    cookTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings}人份` : '2人份',
    recipeIngredient: recipe.ingredients && Array.isArray(recipe.ingredients) 
      ? recipe.ingredients.map(ing => typeof ing === 'string' ? ing : ing.name || '')
      : [],
    recipeInstructions: recipe.steps && Array.isArray(recipe.steps)
      ? recipe.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          text: step
        }))
      : [],
    aggregateRating: recipe.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: recipe.rating,
          reviewCount: recipe.reviewCount || 1
        }
      : undefined,
  };

  return {
    ...baseMetadata,
    other: {
      'script:type:application/ld+json': JSON.stringify(jsonLd),
    },
  };
} 