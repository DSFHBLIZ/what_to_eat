import RandomRecipesClient from './random-client';

export const metadata = {
  title: '随机推荐 | 今天吃什么',
  description: '让我们帮你随机推荐几道美食，减轻你的选择困难症',
  keywords: ['随机推荐', '菜谱推荐', '美食随机', '选择困难', '今天吃什么']
};

// 强制页面动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RandomPage() {
  return (
    <RandomRecipesClient />
  );
} 