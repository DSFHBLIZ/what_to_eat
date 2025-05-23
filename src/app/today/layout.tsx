import { Metadata } from 'next';

// 保持网站名称，在功能描述中优化SEO
export const metadata: Metadata = {
  title: '每日推荐 - 冰箱里有什么？',
  description: '每天为您推荐一道精选家常菜，解决"今天吃什么"的烦恼。基于您的食材智能推荐，简单易做的每日菜谱。',
  keywords: '每日推荐, 今天吃什么, 每日菜谱, 冰箱里有什么, 今日推荐, 一日三餐, 今天做什么菜',
  alternates: {
    canonical: '/today',
  },
  openGraph: {
    title: '每日推荐 - 冰箱里有什么？',
    description: '每天为您推荐一道精选家常菜，解决"今天吃什么"的烦恼',
    type: 'website',
    url: '/today',
    siteName: '冰箱里有什么？',
  },
  twitter: {
    card: 'summary_large_image',
    title: '每日推荐 - 冰箱里有什么？',
    description: '每天为您推荐一道精选家常菜，解决"今天吃什么"的烦恼',
  },
};

export default function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* SEO内容，对搜索引擎可见 */}
      <div className="sr-only">
        <h1>每日菜谱推荐 - 冰箱里有什么？</h1>
        <p>
          每天为您精选一道简单易做的家常菜，基于您现有的食材智能推荐，
          让"今天吃什么"不再是烦恼。发现适合您口味和食材的完美菜谱。
        </p>
        <p>
          我们的每日推荐功能会根据中式家常菜的特点，为您随机推荐一道美味菜谱。
          每道菜都经过精心筛选，确保制作简单、营养均衡、味道美味。
        </p>
      </div>
      
      {children}
    </>
  );
} 