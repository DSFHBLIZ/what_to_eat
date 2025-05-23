import { Metadata } from 'next';
import { fetchRecipeById } from '../../../utils';
import { RecipeClient } from './recipe-client';
import { notFound } from 'next/navigation';
import { validateAndSanitizeRecipe } from '../../../utils/common/safeData';

// 生成动态元数据
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // 尝试获取菜谱数据
  const { recipe } = await fetchRecipeById(params.id);

  // 如果找不到菜谱，返回默认元数据
  if (!recipe) {
    return {
      title: '菜谱未找到 - 冰箱里有什么？',
      description: '无法找到请求的菜谱，请尝试搜索其他菜谱。',
      robots: { index: false, follow: false },
    };
  }

  // 安全处理菜谱数据
  const safeRecipe = validateAndSanitizeRecipe(recipe);

  // 保持网站品牌名称
  const seoTitle = `${safeRecipe.name}的家常做法 - 冰箱里有什么？`;
  const seoDescription = safeRecipe.description 
    ? `学会${safeRecipe.name}的简单做法：${safeRecipe.description.substring(0, 100)}...详细步骤、用料清单，根据现有食材轻松制作。`
    : `${safeRecipe.name}怎么做？详细的制作步骤、用料清单，基于您现有食材的智能推荐菜谱。`;

  // 生成关键字
  const keywords = `${safeRecipe.name}, ${safeRecipe.name}的做法, ${safeRecipe.name}怎么做, 家常菜, 菜谱, 做菜, 冰箱里有什么, 中式料理, 家常做法`;

  // 返回基于菜谱数据的元数据
  return {
    title: seoTitle,
    description: seoDescription,
    keywords: keywords,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: safeRecipe.imageUrl ? [{ url: safeRecipe.imageUrl }] : [],
    },
  };
}

// 菜谱详情服务端组件 - 负责数据获取和初始渲染
export default async function RecipePage({ params }: { params: { id: string } }) {
  // 检查ID格式是否有效
  if (!params.id || typeof params.id !== 'string' || params.id.length < 10) {
    return notFound();
  }

  console.log(`服务端获取菜谱数据，ID: ${params.id}`);
  
  try {
    // 获取菜谱数据
    const { recipe: recipeData, error } = await fetchRecipeById(params.id);
        
    // 如果找不到菜谱，重定向到404页面
    if (!recipeData) {
      console.error('未找到菜谱，ID:', params.id, error ? `错误: ${error}` : '');
      return notFound();
    }
    
    // 使用安全验证函数处理数据
    const recipe = validateAndSanitizeRecipe(recipeData);
    
    console.log(`服务端处理后的菜谱数据 - ${params.id} - 食材长度: ${recipe.ingredients.length}, 调料长度: ${recipe.seasonings.length}`);
    
    // 传递初始数据给客户端组件
    return <RecipeClient recipe={recipe} />;
  } catch (error) {
    // 错误处理
    console.error('加载菜谱失败:', error);
    
    // 检查是否是Next.js的notFound错误
    if (error instanceof Error && error.message === 'NEXT_NOT_FOUND') {
      return notFound();
    }
    
    // 其他类型的错误
    return (
      <div className="container text-center py-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">加载菜谱失败</h1>
        <p className="mb-4">抱歉，无法加载菜谱内容。请尝试刷新页面或稍后再试。</p>
        <p className="text-sm text-gray-500">
          错误信息: {error instanceof Error ? error.message : '未知错误'}
        </p>
      </div>
    );
  }
}