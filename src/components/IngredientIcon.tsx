import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getIngredientIcon } from '../utils/recipe/ingredientUtils';

interface IngredientIconProps {
  ingredient: string;
  size?: number;
  className?: string;
}

export default function IngredientIcon({ 
  ingredient, 
  size = 24, 
  className = '' 
}: IngredientIconProps) {
  const [iconPath, setIconPath] = useState<string>('/icons/default.svg');
  
  useEffect(() => {
    // 使用工具函数获取图标路径
    const loadIcon = async () => {
      try {
        const path = await getIngredientIcon(ingredient);
        setIconPath(path);
      } catch (error) {
        console.error('加载食材图标失败:', error);
        setIconPath('/icons/default.svg');
      }
    };
    
    loadIcon();
  }, [ingredient]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={iconPath}
        alt={ingredient}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setIconPath('/icons/default.svg')}
      />
    </div>
  );
} 