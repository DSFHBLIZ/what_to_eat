import { fetchRecipeById } from '../../../utils';
import { generateRecipeMetadata } from '../../../utils/common/seoUtils';

// 动态生成元数据
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { recipe } = await fetchRecipeById(params.id);
  return generateRecipeMetadata(recipe || {} as any);
} 