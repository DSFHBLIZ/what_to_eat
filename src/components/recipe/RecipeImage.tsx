'use client';

import React, { useState } from 'react';
import { FiZoomIn, FiX } from 'react-icons/fi';
import LazyImage from '../LazyImage';
import Image from 'next/image';
import { createImageErrorHandler } from '../../utils/common/imageUtils';

interface RecipeImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * 菜谱图片组件，提供图片展示与缩放功能
 * 使用LazyImage作为基础组件
 */
const RecipeImage = ({ 
  src, 
  alt, 
  className = '',
  width = 800,
  height = 500,
  priority = false
}: RecipeImageProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <LazyImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-auto object-cover"
          priority={priority}
          onError={createImageErrorHandler('recipe')}
          fallbackType="recipe"
        />
        <button
          onClick={() => setIsZoomed(true)}
          className="absolute bottom-3 right-3 bg-white/80 hover:bg-white p-2 rounded-full text-gray-700 transition-colors"
          aria-label="放大图片"
        >
          <FiZoomIn className="w-5 h-5" />
        </button>
      </div>

      {isZoomed && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors"
            aria-label="关闭图片"
          >
            <FiX className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="w-full h-auto object-contain"
              onError={createImageErrorHandler('recipe')}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RecipeImage; 