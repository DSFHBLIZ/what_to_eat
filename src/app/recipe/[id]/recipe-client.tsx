'use client';

import { memo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RecipeDetail from '../../../components/RecipeDetail';
import { 
  useRecipe, 
  useRecipeError, 
  RecipeErrorHelper, 
  RecipeProvider,
  RecipeErrorProvider,
  LanguageProvider,
  AuthProvider,
  FavoriteProvider
} from '../../../contexts/AppProvider';
import { RecipeSkeleton } from '../../../components/loading';
import { RecipeSEO } from '../../../components/SEO';
import WithSkeleton from '../../../components/ui/WithSkeleton';
import { Recipe } from '../../../types/recipe';
import { ErrorBoundary } from '../../../components/error/ErrorBoundary';
import { validateAndSanitizeRecipe } from '../../../utils/common/safeData';

// 客户端组件，负责交互和动态UI变化
interface RecipeClientProps {
  recipe?: Recipe | null;
}

// 内部组件 - 使用上下文hooks
const RecipeClientInner = ({ recipe: initialRecipe }: RecipeClientProps) => {
  const router = useRouter();
  const [localRecipe, setLocalRecipe] = useState(initialRecipe);
  const { loading, error } = useRecipe();
  const { addError } = useRecipeError();
  
  // 确保使用安全处理过的数据
  useEffect(() => {
    if (initialRecipe) {
      console.log('接收到菜谱数据:', initialRecipe);
      // 对initialRecipe再次进行安全处理，以防止客户端数据不一致问题
      const safeRecipe = validateAndSanitizeRecipe(initialRecipe);
      console.log('处理后的菜谱数据:', {
        id: safeRecipe.id,
        name: safeRecipe.name,
        ingredients: safeRecipe.ingredients.length > 0 ? safeRecipe.ingredients[0] : '无食材',
        seasonings: safeRecipe.seasonings.length > 0 ? safeRecipe.seasonings[0] : '无调料'
      });
      setLocalRecipe(safeRecipe);
    }
  }, [initialRecipe]);
  
  // 处理返回按钮
  const handleGoBack = () => {
    router.back();
  };

  // 处理错误
  const handleError = (error: Error) => {
    console.error('菜谱详情组件发生错误:', error);
    if (localRecipe?.id) {
      addError(localRecipe.id, RecipeErrorHelper.createGenericError(error.message));
    }
  };

  // 如果没有菜谱数据且不在加载中，显示错误信息
  const showErrorPlaceholder = !localRecipe && !loading;
  const isLoading = loading && !localRecipe;
  
  return (
    <ErrorBoundary 
      theme="recipe" 
      onError={handleError}
      errorTitle="菜谱加载失败"
      errorMessage="抱歉，无法正确加载菜谱内容。这可能是由于网络问题或数据异常。"
    >
      {/* SEO 元数据 */}
      {localRecipe && <RecipeSEO recipe={localRecipe} />}
      
      <div className="container pt-16 print:p-0">
        {/* 返回按钮 */}
        <div className="flex justify-between mb-4">
          <button 
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </button>
        </div>
        
        <WithSkeleton loading={isLoading} variant="detail">
          {/* 错误状态显示 */}
          {showErrorPlaceholder ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                无法加载菜谱
              </h2>
              <p className="text-red-600 mb-4">
                抱歉，我们无法加载所请求的菜谱。请检查您的链接是否正确，或稍后再试。
              </p>
              <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                返回上一页
              </button>
            </div>
          ) : (
            /* 使用统一菜谱详情组件 */
            localRecipe && (
              <RecipeDetail 
                errorBoundaryTheme="recipe"
                onError={handleError}
                directRecipe={localRecipe}
                validate={false}
              />
            )
          )}
        </WithSkeleton>
      </div>
    </ErrorBoundary>
  );
};

// 外部包装组件 - 提供完整的Provider上下文链
const RecipeClient = ({ recipe }: RecipeClientProps) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RecipeErrorProvider>
          <RecipeProvider>
            <FavoriteProvider>
              <RecipeClientInner recipe={recipe} />
            </FavoriteProvider>
          </RecipeProvider>
        </RecipeErrorProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export { RecipeClient };
export default memo(RecipeClient); 