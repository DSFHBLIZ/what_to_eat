'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import Skeleton from './ui/SkeletonLoader';
import cn from 'classnames';
import { getFallbackImage, ImageType } from '../utils/common/imageUtils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  quality?: number;
  priority?: boolean;
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  fallbackType?: ImageType;
}

/**
 * 带有懒加载和渐进式加载效果的图片组件
 * 优化首屏加载性能
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = 0,
  height = 0,
  className = '',
  placeholderClassName = '',
  quality = 75,
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  fallbackType = 'default',
}) => {
  const [loading, setLoading] = useState(!priority);
  const [error, setError] = useState(false);
  const [blurUrl, setBlurUrl] = useState<string | null>(null);
  
  // 生成模糊占位图
  useEffect(() => {
    if (!priority && src && !error) {
      // 使用极小尺寸图像作为占位
      const tinyWidth = Math.round(width > 0 ? Math.min(width, 20) : 20);
      const tinyHeight = Math.round(height > 0 ? Math.min(height, 20) : 20);
      setBlurUrl(`${src}?w=${tinyWidth}&h=${tinyHeight}&q=10`);
    }
  }, [src, width, height, priority, error]);
  
  // 处理加载成功
  const handleLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };
  
  // 处理加载失败
  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setError(true);
    setLoading(false);
    if (onError) onError(event);
  };
  
  // 错误占位图
  if (error) {
    return (
      <div 
        className={cn(
          'bg-gray-200 flex items-center justify-center',
          className
        )}
        style={{ width: width || '100%', height: height || 200 }}
        role="img"
        aria-label={`图片加载失败: ${alt}`}
      >
        <Image
          src={getFallbackImage(fallbackType)}
          alt={`${alt} (加载失败)`}
          width={width || 200}
          height={height || 200}
          className="object-contain"
        />
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden" style={{ width: width || '100%', height: height || 'auto' }}>
      {/* 模糊占位图 */}
      {loading && blurUrl && (
        <div 
          className={cn(
            'absolute inset-0 bg-gray-100',
            placeholderClassName
          )}
        >
          <Image
            src={blurUrl}
            alt={alt}
            className="w-full h-full blur-sm"
            width={width || undefined}
            height={height || undefined}
            style={{
              objectFit,
              objectPosition,
              filter: 'blur(10px)',
              opacity: 0.7,
            }}
            unoptimized
          />
        </div>
      )}
      
      {/* 实际图片 */}
      <Image
        src={src}
        alt={alt}
        width={width || undefined}
        height={height || undefined}
        className={cn(
          className,
          loading ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-300'
        )}
        loading={priority ? 'eager' : 'lazy'}
        quality={quality}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit,
          objectPosition,
        }}
      />
    </div>
  );
};

export default LazyImage; 