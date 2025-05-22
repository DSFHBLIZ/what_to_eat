import { MetadataRoute } from 'next';
import { getAllRecipeIds } from '../utils/recipe';
import processedRecipes from '../data/recipes';

/**
 * 生成动态网站地图
 * 包含首页、菜谱详情页和其他重要页面
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whattoeat.vercel.app';
  
  // 获取所有菜谱ID
  const recipeIds = getAllRecipeIds(processedRecipes);
  
  // 菜谱详情页链接
  const recipeUrls = recipeIds.map((id: string) => ({
    url: `${baseUrl}/recipe/${id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  
  // 主要页面
  const mainPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/recipes`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/random`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];
  
  // 其他辅助页面
  const otherPages = [
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];
  
  // 合并所有URL
  return [...mainPages, ...recipeUrls, ...otherPages];
} 