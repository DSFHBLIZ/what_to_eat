/**
 * 图片类型
 */
export type ImageType = 'recipe' | 'user' | 'ingredient' | 'category' | 'default';

/**
 * 获取图片加载失败时的缺省图片
 * @param type 图片类型
 * @returns 缺省图片URL
 */
export function getFallbackImage(type: ImageType = 'default'): string {
  switch (type) {
    case 'recipe':
      return '/images/default-recipe.jpg';
    case 'user':
      return '/images/default-user.jpg';
    case 'ingredient':
      return '/images/default-ingredient.jpg';
    case 'category':
      return '/images/default-category.jpg';
    case 'default':
    default:
      return '/images/default-placeholder.jpg';
  }
}

/**
 * 创建图片加载错误处理函数
 * @param type 图片类型
 * @returns 处理函数
 */
export function createImageErrorHandler(type: ImageType = 'default') {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement;
    target.onerror = null; // 防止无限循环
    target.src = getFallbackImage(type);
  };
}

/**
 * 检查图片URL是否有效
 * @param url 图片URL
 * @returns 是否有效
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  
  // 简单检查URL格式
  if (url.startsWith('data:image') || url.startsWith('http') || url.startsWith('/')) {
    return true;
  }
  
  return false;
}

/**
 * 获取优化的图片URL
 * @param url 原始URL
 * @param options 优化选项
 * @returns 优化后的URL
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!isValidImageUrl(url)) {
    return getFallbackImage();
  }
  
  const imageUrl = url as string;
  
  // 如果是相对路径，直接返回
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // 如果是data URL，直接返回
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  try {
    const urlObj = new URL(imageUrl);
    
    // 已经包含优化参数的不再处理
    if (urlObj.searchParams.has('w') || urlObj.searchParams.has('width')) {
      return imageUrl;
    }
    
    // 添加优化参数
    if (options.width) {
      urlObj.searchParams.append('w', options.width.toString());
    }
    
    if (options.height) {
      urlObj.searchParams.append('h', options.height.toString());
    }
    
    if (options.quality) {
      urlObj.searchParams.append('q', options.quality.toString());
    }
    
    return urlObj.toString();
  } catch (error) {
    // URL解析失败，返回原始URL
    return imageUrl;
  }
} 