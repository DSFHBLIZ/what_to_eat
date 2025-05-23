'use client';

import Head from 'next/head';
import React from 'react';
import { Recipe } from '../../types/recipe';

interface RecipeSEOProps {
  recipe: Recipe;
}

/**
 * 菜谱SEO组件
 * 专用于菜谱页面的SEO元数据设置
 */
const RecipeSEO: React.FC<RecipeSEOProps> = ({ recipe }) => {
  if (!recipe) return null;

  const title = `${recipe.name} 的做法 - 冰箱里有什么`;
  const description = recipe.description
    ? recipe.description.substring(0, 150) + (recipe.description.length > 150 ? '...' : '')
    : `查看${recipe.name}的做法、用料和烹饪步骤`;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://whattoeat.vercel.app';
  const canonical = `/recipe/${recipe.id}`;
  const fullUrl = `${baseUrl}${canonical}`;
  
  const ogImage = recipe.imageUrl
    ? (recipe.imageUrl.startsWith('http') ? recipe.imageUrl : `${baseUrl}${recipe.imageUrl}`)
    : `${baseUrl}/images/default-recipe.jpg`;
    
  // 构建结构化数据
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: description,
    image: ogImage,
    author: {
      '@type': 'Organization',
      name: '冰箱里有什么',
    },
    datePublished: recipe.createdAt || new Date().toISOString(),
    prepTime: recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
    cookTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
    totalTime: (recipe.prepTime && recipe.cookTime) ? `PT${recipe.prepTime + recipe.cookTime}M` : undefined,
    recipeYield: `${recipe.servings || 2} 份`,
    recipeCategory: recipe.cuisine || undefined,
    recipeCuisine: recipe.cuisine || undefined,
    keywords: [
      recipe.name,
      ...(recipe.cuisine ? [recipe.cuisine] : []),
      ...(recipe.flavors || []),
      ...(recipe.tags || []),
    ].join(', '),
    recipeIngredient: recipe.ingredients?.map(ing => 
      typeof ing === 'string' ? ing : `${ing.name}${ing.quantity ? ` ${ing.quantity}` : ''}`
    ),
    recipeInstructions: recipe.steps?.map(step => ({
      '@type': 'HowToStep',
      text: step
    })),
    nutrition: {
      '@type': 'NutritionInformation',
      // 如果没有营养信息则省略
    }
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="冰箱里有什么" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* 结构化数据 */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
};

export default RecipeSEO; 