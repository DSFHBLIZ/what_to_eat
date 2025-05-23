# PRD - 产品需求文档
## 基础信息
产品名称：冰箱里有什么？

产品定位：主打"实用性 + 极简体验 + 智能搭配"的AI增强菜谱搜索工具

1.2. 目标用户
家庭主厨

有饮食限制的健康饮食者

忙碌人群（不看视频，直达做法）

宴会策划者（多人聚餐菜谱搭配需求）

美食爱好者（探索不同菜系和烹饪技法）

1.3. 核心价值主张
🔍 关键词 + 多标签组合搜索

🤖 AI语义搜索（基于OpenAI嵌入向量，理解用户真实意图）

🍽️ 宴会模式（智能菜谱搭配，根据人数自动推荐菜品组合方案）

📵 极简体验（无广告，可打印，纯文字展示）

🌐 多语言支持（中英文界面切换）

📱 响应式布局，移动优先

1.4. 品牌标识规范
网站名称颜色：导航栏中的"冰箱里有什么？"文字使用蓝色（text-blue-600）。这一调整旨在提升专业感和可读性。在组件实现上，应直接修改Navbar.tsx组件中的相关CSS类。

主题适配支持：系统已支持深色模式(Dark Mode)和浅色模式切换，通过系统偏好设置自动切换或用户手动选择。所有组件和UI元素都应实现对应的深色模式样式，确保在不同主题下都提供良好的视觉体验。主题切换时不应出现闪烁。

1.5. 关键页面布局与设计原则
导航栏样式：导航栏必须固定在顶部，在页面滚动时保持可见。使用fixed定位，确保良好的用户体验。已实现为带阴影的导航栏，确保在各种内容背景下都能清晰分辨。

页面背景统一：所有页面（包括菜谱列表、收藏夹等）背景统一设置为白色（深色模式下为深色背景），避免灰色背景带来的视觉突兀感。

菜单命名统一：将所有"菜谱库"/"食谱库"文本统一更改为"菜谱列表"，包括中英文版本，确保一致性。已完成"今日食谱"改为"今日菜谱"/"Random Recipe"的命名变更。

语言切换优化：已实现页面右上角的语言切换按钮，并移除页脚中的重复语言切换组件，减少冗余。语言切换组件集成在导航栏右侧，提供简洁的交互。

响应式布局优化：已实现响应式布局，根据不同设备自动适配页面宽度，解决在PC端页面过窄的问题。页面最大宽度已设置为xl:max-w-[1440px] 2xl:max-w-[1600px]，避免在大屏幕上呈现类似移动端的竖版布局。

1.6. 技术选型建议与实现要点
技术栈：Next.js 14 (App Router) + Supabase + OpenAI + Tailwind CSS + Vercel

前端技术栈详细清单：
- 框架：Next.js 14 (App Router)
- UI库：React 18 + TypeScript
- 样式：Tailwind CSS + Lucide React图标
- 状态管理：Zustand + React Query (@tanstack/react-query)
- 主题系统：next-themes
- 国际化：i18next + react-i18next
- 其他依赖：axios, lodash, clsx, uuid

后端与AI集成：
- 数据库：Supabase (PostgreSQL + pgvector扩展)
- AI服务：OpenAI text-embedding-3-small模型
- 部署：Vercel平台

实现细节：项目使用了Next.js 14的App Router架构，替代了之前的Pages Router方案，提供了更强大的路由能力和更好的性能。使用客户端组件和服务器组件的混合策略，保证了最佳的用户体验和搜索引擎优化。

核心数据技术：

数据库字段采用 JSONB + GIN 索引，支持高效的JSON数据查询

Supabase的pgvector扩展实现向量搜索，支持语义搜索功能

使用OpenAI的text-embedding-3-small模型生成嵌入向量

实现分布式缓存机制，提高重复搜索和相似查询的性能

搜索引擎架构：

混合搜索策略，结合SQL关键词匹配和向量相似度搜索

客户端请求管理与防抖，使用useCancellableRequests自定义Hook

统一的搜索控制器useUnifiedSearchController管理所有搜索状态

事件驱动的组件通信，使用自定义事件实现松耦合设计

API与集成：

安全的API密钥处理，服务端API路由隐藏敏感凭据

使用OpenAI API生成嵌入向量，支持语义搜索功能

集成Supabase RPC函数进行高效数据库查询

基于abort-controller实现请求取消和超时处理

性能优化：

推荐使用 .range() 进行分页加载

查询参数缓存防止重复请求

语义搜索结果缓存减少API调用

通过精细的分层CTE SQL查询提高检索效率

UX策略：

错误处理已封装全局错误边界（ErrorBoundary）和详细日志记录系统

响应式优化重点：点击热区放大、折叠面板处理、移动设备适配

食材替代建议功能提升用户体验，基于语义相似度算法

提供交互反馈机制，确保用户了解系统状态

代码架构：

所有筛选逻辑组件使用统一的useUnifiedSearchController控制器，确保一致的用户体验

分层设计：UI层、控制器层、服务层和数据访问层明确分离

统一的错误处理和日志记录策略

模块化SQL函数设计，支持独立维护和测试

2. 核心功能模块详解：搜索系统
2.1 搜索系统概述与功能目标
（整理说明：此部分提炼了搜索系统的核心目的和基本能力）

目的： 构建一个高效、灵活、准确的菜谱搜索系统，帮助用户快速找到符合其需求的菜谱。
核心能力： 系统支持关键词搜索、多标签筛选（包括必选、可选食材/调料、忌口食材/调料等多种条件），并结合传统匹配与语义理解，提供智能排序结果。
技术亮点： 融合了传统的基于关键词和结构化数据的搜索，以及基于向量嵌入的语义搜索，显著提升了搜索的准确性和相关性。
接下来，我们将详细展开用户界面与交互部分。

2.2 用户界面与交互 (UI & Interaction)
（整理说明：此部分整合了原文档中关于搜索框、筛选条件、首页布局、列表页融合及相关交互优化的所有描述，包括 HTML/CSS/JS 代码示例，以便集中展示用户看到和操作的部分。）

2.2.1 搜索框设计

搜索框分为三个独立部分：
主搜索框： 用户输入菜名关键词或自然语言描述（支持AI语义搜索）。
必选食材/调料搜索框： 用户输入必须包含的食材或调料（在匹配算法中权重更高）。
可选食材/调料搜索框： 用户输入可选包含的食材或调料（在匹配算法中权重较低）。
忌口食材/调料搜索框： 用户输入需要排除的食材或调料（红色标识，完全排除包含此类食材的菜谱）。
每个搜索框末端配有浅色"X"按钮，用于清除输入内容。
输入时提供智能推荐，直接从数据库查找匹配的食材值进行推荐。
宴会模式切换按钮：位于筛选区域，可开启/关闭宴会模式，支持人数设置和智能菜谱搭配。
2.2.2 筛选条件设计

筛选选项包括但不限于：菜系、口味、烹饪难度、饮食限制等。
难度筛选选项根据预估烹饪时长提供：10分钟、30分钟、60分钟及以上。
筛选标签点击后必须有明确视觉反馈，并自动添加到相应搜索栏下方，作为搜索条件的气泡标签展示。
所有筛选条件统一使用相同的选中样式，与菜系选择保持一致（带边框样式设计，选中时改变背景色并加粗显示）。
点击标签具有明显的"开关"效果，再次点击可取消选择。
选中的筛选标签以"气泡标签"形式展示在搜索框下方，每类筛选项一行（如菜系的标签集中在一行）。
2.2.3 首页与列表页融合设计

首页和列表页合并为单一页面，但保持视觉独立性。
首页仅显示搜索栏和筛选选项，不展示菜谱列表。
删除入门搜索和标签匹配逻辑区块，减少视觉干扰。
搜索结果区域在首次加载时必须隐藏，呈现纯净的首页搜索体验。
仅在用户点击搜索按钮后，才显示搜索结果区域并平滑滚动到该区域。
用户完成筛选条件选择后，点击搜索按钮即可在同一页面下方显示菜谱列表结果。
2.2.4 首页搜索交互优化

删除重复的"添加"按钮，每个筛选框后只保留一个"添加"按钮（建议统一放在筛选框右侧）。
将搜索按钮移至筛选栏的最右侧尽头，保持水平对齐，布局更合理。
筛选标签点击需设计为"气泡标签"形式，默认状态为未选中，点击后变为"选中"状态。
选中标签显示中必须有明确视觉反馈（颜色高亮、边框阴影等）。
搜索不会自动触发，仅在用户点击搜索按钮时执行。
2.2.5 布局与样式规范

整体 HTML 架构：
HTML

<div class="container">
  <div class="search-area">
    <div class="search-row">
      <input type="text" placeholder="输入菜名关键词或描述（支持AI语义搜索）">
      <button class="search-button">搜索</button>
    </div>
    <div class="search-row">
      <span class="px-2 py-1 bg-blue-500 text-white rounded-md whitespace-nowrap text-sm">必选</span>
      <input type="text" placeholder="输入必须包含的食材、调料">
      <button class="add-button">添加</button>
    </div>
    <div class="search-row">
      <span class="px-2 py-1 bg-green-500 text-white rounded-md whitespace-nowrap text-sm">可选</span>
      <input type="text" placeholder="输入可选包含的食材、调料">
      <button class="add-button">添加</button>
    </div>
    <div class="search-row">
      <span class="px-2 py-1 bg-red-500 text-white rounded-md whitespace-nowrap text-sm">忌口</span>
      <input type="text" placeholder="输入需要排除的食材、调料">
      <button class="add-button">添加</button>
    </div>
  </div>

  <div class="filter-section">
    <div class="filter-group">
      <span class="filter-label">菜系</span>
      <span class="filter-tag">中餐-其它</span>
    </div>
    <div class="filter-group">
      <span class="filter-label">口味</span>
      <span class="filter-tag">咸</span>
    </div>
    <!-- 宴会模式切换按钮 -->
    <div class="banquet-mode-section">
      <button class="banquet-toggle-button">开启宴会模式</button>
      <input type="number" placeholder="人数" class="guest-count-input" style="display:none;">
    </div>
  </div>

  <div class="results-area" style="display:none;">
    <!-- 搜索结果展示区域 -->
    <!-- 宴会模式下显示多选菜谱卡片 -->
    <!-- 普通模式下显示标准菜谱卡片 -->
  </div>
</div>
全局与布局 CSS 规范：
CSS

/* —— 全局风格 —— */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;      /* 基准字体 */
  line-height: 1.5;     /* 1.5 倍行高 */
  color: #333;          /* 主文本颜色 */
  background-color: #fff;
}

/* —— 中心容器 —— */
.container {
  max-width: 720px;     /* 最大宽度 */
  margin: 0 auto;       /* 水平居中 */
  padding: 20px;        /* 内边距 */
  box-sizing: border-box;
}

/* 区块间距 */
.search-area,
.filter-section,
.results-area {
  margin-top: 24px;     /* 块级间距 */
}
搜索区样式规范：
CSS

/* —— 搜索区 —— */
.search-area {
  display: flex;
  flex-direction: column;
  gap: 12px;            /* 行间距 */
}
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-row input {
  flex: 1;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
}

.search-row .add-button {
  height: 36px;
  width: 60px;
  border: none;
  background-color: #b5b8e1;
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.search-button {
  align-self: flex-start;   /* 左对齐 */
  margin-top: 12px;
  height: 40px;
  width: 80px;
  background-color: #2763f9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
筛选区样式规范：
CSS

/* —— 筛选区 —— */
.filter-section {
  margin-top: 24px;
}

.filter-group {
  display: flex;
  align-items: center; /* 标签基线对齐 */
  gap: 8px;            /* 标签间距 */
  flex-wrap: wrap;
  margin-bottom: 8px;  /* 组间距 */
}

.filter-label {
  min-width: 56px;
  font-weight: bold;
  line-height: 28px;   /* 标签高度 */
  color: #333;
}

.filter-tag {
  height: 28px;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: #f2f2f2;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.filter-tag.selected {
  background-color: #2763f9;
  color: white;
}
交互实现规范：
JavaScript

// 切换标签选中
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('selected');
  });
});

// 搜索 & 平滑滚动
document.querySelector('.search-button').addEventListener('click', () => {
  const results = document.querySelector('.results-area');
  results.style.display = 'block';
  results.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});
接下来，我们将详细展开功能需求详情部分。

2.3 功能需求详情 (Detailed Functional Requirements)
（整理说明：此部分集中描述搜索系统提供的具体功能，包括基础搜索、智能推荐以及新增的语义搜索和忌口搜索功能。）

2.3.1 基础搜索功能

关键词搜索： 支持对菜谱名称、食材、调料等进行模糊匹配。
标签组合搜索： 支持按 AND / OR 逻辑组合多个标签进行搜索（逻辑可控）。
必选/可选搜索： 系统会根据用户在必选和可选搜索框中输入的内容，在匹配度算法中赋予不同的权重。
2.3.2 智能搜索推荐

实时推荐： 用户输入食材/调料时，实时从数据库中查找匹配值进行推荐，响应迅速无延迟。
查询优化： 使用 Supabase RPC 函数 search_ingredients_and_seasonings 优化查询效率。
排序逻辑： 搜索结果按照相关性排序（完全匹配 > 开头匹配 > 部分匹配）。
多维度覆盖： 考虑食材、调料和菜名多个维度进行智能搜索推荐。
精确推荐示例：
输入"五" → 推荐"五花肉"、"五香粉"。
输入"大蒜" → 直接显示包含"大蒜"的食材建议。
请求管理： 使用 useCancellableRequests 自定义 Hook 管理并发搜索请求，防止请求竞争并提高响应速度。实现 300ms 延迟的智能搜索，确保在用户快速输入时不会过于频繁地发起请求。
2.3.3 语义搜索实现 (新增功能)

功能描述： 实现基于向量嵌入的语义搜索功能，使用 OpenAI 的嵌入模型和 Supabase 的 pgvector 插件，显著提升搜索的准确性和相关性。能够理解语义相似概念，提供更智能的结果排序。即使用户使用同义词、方言表达或不完整描述，也能找到满足需求的菜谱。

关键技术实现：

嵌入向量生成与存储：
使用 OpenAI 的 text-embedding-3-small 模型将菜谱数据转换为高维向量表示。
所有菜谱的嵌入向量已预先生成并存储在 recipe_embeddings 表中。
搜索时只需为用户查询生成一次嵌入向量，减少 API 调用和延迟。
实现了嵌入向量的本地缓存，提高重复搜索的速度。
向量相似度搜索：
利用 Supabase 的 pgvector 扩展和余弦相似度计算，查找语义相似的菜谱。
通过 search_recipes_by_embedding 存储过程执行高效的向量搜索。
提供相似度阈值控制（默认 0.5），确保搜索结果的质量。
支持结果数量限制，避免返回过多不相关结果。
客户端-服务器协作模式：
优先通过服务端 API 生成嵌入向量，避免在前端暴露 API 密钥。
实现了请求取消机制，在页面切换或新搜索时自动取消进行中的请求。
使用 AbortController 管理复杂的异步操作，防止竞争条件。
结果加工与排序：
根据向量相似度为搜索结果计算相关性分数。
将语义相似度分数与传统搜索相关性分数结合，提供更全面的排序依据。
结合传统关键词匹配与语义相似度，提供集成的搜索策略。
搜索流程设计 (集成搜索)：

用户输入搜索关键词和筛选条件，点击搜索按钮。
系统执行集成搜索流程：
将搜索关键词和必选食材组合生成查询文本。
使用 OpenAI API 将查询文本转换为嵌入向量，获取语义相似度分数。
同时执行传统搜索，应用所有筛选条件。
系统将语义相似度分数作为排序权重的一部分，与传统相关性评分结合：
语义相似度权重为 0.6。
传统相关性权重为 0.4。
最终根据综合得分进行排序，返回结果给用户。
<!-- end list -->

确保： 搜索结果既满足用户的精确筛选需求，又能理解语义相似概念，提供更智能的结果排序。所有搜索条件在一个统一的流程中处理，没有割裂的搜索体验。
相似食材智能推荐：

系统提供基于语义相似度的食材推荐功能。
getSemanticSimilarIngredients 函数支持查找与给定食材语义相似的其他食材。
checkIngredientsSemanticSimilarity 函数可判断两种食材的相似程度。
在食材搜索和替代食材建议中提供智能辅助。
2.3.4 忌口搜索功能 (新增需求)

功能定义： 允许用户指定不希望包含在搜索结果中的食材或调料。适用于有饮食限制、过敏症状或个人口味偏好的用户。
忌口食材搜索框： 用户可以输入需要排除的食材或调料。
显示样式： 使用红色背景标签"忌口"，在 UI 上区分于必选和可选食材。标签显示以红色气泡形式展示，风格与必选/可选标签统一但使用红色主题。
智能提示： 与其他搜索框一样提供输入时的实时推荐，使用相同的食材/调料数据库。
排除逻辑： 包含任意忌口食材的菜谱将被完全排除，不会出现在搜索结果中。
多项选择： 支持添加多个忌口食材/调料标签。
清除功能： 可单独删除某个标签，或通过"清除筛选"按钮一次性清除所有忌口条件。
实现状态： 已完整实现忌口搜索功能（增加了 avoidInput 输入框和 avoidIngredients 状态管理，扩展了控制器状态接口，在搜索参数构建和 API 中增加了过滤逻辑，添加了忌口标签的样式和交互处理）。
接下来，我们将深入探讨搜索算法与逻辑部分。

2.4 搜索算法与逻辑 (Search Algorithm & Logic)
（整理说明：此部分包含了所有与搜索后端处理、算法、数据过滤、排序原理相关的技术细节，包括 Supabase 存储过程的设计思路、JSONB 应用、权重计算等。）

2.4.1 查询逻辑与混合搜索策略

系统采用混合搜索策略，提高搜索质量：
首先尝试执行语义搜索，利用向量相似度获取最相关结果。
如果语义搜索无结果，自动回退到传统关键词 + 筛选搜索。
传统查询逻辑结合了数据库层面的初步筛选和客户端/API 层面的后处理：
优先使用 Supabase 数据库的 ilike 和 contains 操作符进行简单搜索。
对于复杂搜索（多条件组合、相关性排序），在客户端进行后处理和排序。
通过 searchRecipes 函数实现混合搜索策略，调用Supabase的RPC存储过程。
SQL 查询示例：
SQL

SELECT * FROM recipes
WHERE 食材::jsonb @> '[{"name": "鸡蛋"}]' OR 食材::jsonb @> '[{"name": "西红柿"}]'
AND NOT (食材::jsonb @> '[{"name": "香菜"}]') -- 排除包含忌口食材的菜谱
AND NOT (调料::jsonb @> '[{"name": "花椒"}]'); -- 排除包含忌口调料的菜谱
客户端/API 后处理示例：
JavaScript

// 1. 获取符合基本条件的菜谱 (示例，实际可能在SP内完成大部分筛选)
const recipes = await supabase.from('CHrecipes').select('*')
  .or('食材->>.name.eq.鸡蛋,食材->>.name.eq.西红柿')
  .not('食材', 'cs', '{"name": "香菜"}'); // 排除包含香菜的菜谱

// 2. 计算每个菜谱的匹配得分
const scoredRecipes = recipes.data.map(recipe => {
  const score = calculateMatchScore(recipe, {
    searchKeywords: ['西红柿'],
    requiredIngredients: ['鸡蛋'],
    optionalIngredients: ['葱'],
    requiredSeasonings: [],
    optionalSeasonings: ['盐'],
    avoidIngredients: ['香菜', '花椒']  // 增加忌口食材/调料
  });

  return {
    ...recipe,
    matchScore: score
  };
});

// 3. 按匹配得分降序排序
scoredRecipes.sort((a, b) => b.matchScore - a.matchScore);

// 4. 过滤掉匹配了忌口食材但未被数据库查询捕获的情况
const filteredRecipes = scoredRecipes.filter(recipe => {
  return !['香菜', '花椒'].some(avoidItem =>
    // 检查菜名
    recipe.name.includes(avoidItem) ||
    // 深度检查食材
    recipe.ingredients.some(ing => ing.name.includes(avoidItem)) ||
    // 深度检查调料
    recipe.seasonings.some(sea => sea.name.includes(avoidItem))
  );
});

// 现在可以返回排序后的结果
return filteredRecipes;
2.4.2 匹配度排序算法

使用匹配度算法对检索结果进行排序，根据用户输入的必选和可选食材/调料，计算每个菜谱的匹配分数。
实现精确的权重系统（完善 calculateRelevanceScore 函数）：
菜名中包含关键词：15分基础分 + 5分(精确匹配) + 3分(开头匹配)
食材名称包含关键词：12分基础分 + 3分(精确匹配)
调料名称包含关键词：8分基础分 + 2分(精确匹配)
菜谱描述/步骤包含关键词：较低权重(根据匹配质量加分)
确保多关键词搜索时，匹配度计算合理累加各关键词得分。
搜索结果必须严格按照得分从高到低排序，提供最相关的结果。
包含忌口食材的菜谱大幅降低得分或直接从结果中排除。
匹配类型权重分值表： | 匹配类型 | 权重分值 | | :------------------ | :------- | | 菜名关键词匹配 | 15 分 | | 食材/调料名称关键词匹配 | 12 分 | | 必选食材匹配 | 10 分 | | 必选调料匹配 | 8 分 | | 可选食材匹配 | 5 分 | | 可选调料匹配 | 3 分 | | 忌口食材/调料匹配 | -100 分 |
2.4.3 SQL 数据库查询核心原理 (基于 PostgreSQL 存储过程 search_recipes)

架构设计： 搜索功能的核心在于 PostgreSQL 数据库的 search_recipes 存储过程，它采用了分层筛选和相关性计算的设计思路，以避免将大量数据传输到应用层进行过滤，提升性能。

分层 CTE 筛选链：

使用 Common Table Expressions (CTE) 创建分层筛选链。
按筛选条件对数据集进行逐步缩小，优先执行高效筛选。
使用索引友好的条件优先筛选，最大化数据库索引利用率。
筛选条件优先级排序 (在存储过程中实现)：

筛选条件优先级:
1. 菜系(cuisines) - 枚举值+结构化+索引友好，能早期大量排除不匹配
2. 口味(flavors) - JSON结构内可提取，影响极大，早排除
3. 烹饪难度(difficulties) - 有限值枚举，结构化字段，早排除
4. 饮食限制(dietary_restrictions) - 布尔值字段，无需解析JSON，早排除
5. 必选食材分类(required_ingredient_categories) - JSONB字段，结构清晰，可组合GIN索引
6. 必选调料分类(required_condiment_categories) - 同上
7. 必选食材(required_ingredients) - JSONB字段但可能较多，略慢，往后放
8. 必选调料(required_condiments) - 同上
9. 菜名关键词(dish_name_keywords) - 转为强过滤条件

加分项(不用于筛选，仅影响排序):
10. 可选食材(optional_ingredients) - 不影响主过滤，仅影响打分排序
11. 可选调料(optional_condiments) - 同上
12. 可选食材分类(optional_ingredient_categories) - 同上
13. 可选调料分类(optional_condiment_categories) - 同上
14. 搜索关键词(search_query) - 权重最小，只对相关性排序起作用
权重打分机制 (在存储过程中实现)：

使用常量定义的权重系统确保一致性和可调整性。
<!-- end list -->

SQL

-- 评分权重常量，便于统一调整
score_weight_dish_name CONSTANT FLOAT8 := 60.0;
score_weight_required_ingredient CONSTANT FLOAT8 := 50.0;
score_weight_optional_ingredient CONSTANT FLOAT8 := 10.0;
score_weight_required_condiment CONSTANT FLOAT8 := 45.0;
score_weight_optional_condiment CONSTANT FLOAT8 := 8.0;
score_weight_cuisine CONSTANT FLOAT8 := 20.0;
score_weight_flavor CONSTANT FLOAT8 := 15.0;
score_weight_difficulty CONSTANT FLOAT8 := 10.0;
score_weight_dietary CONSTANT FLOAT8 := 25.0;
score_weight_avoid_ingredient CONSTANT FLOAT8 := -1000.0; -- 忌口食材权重（负值，用于排除）
JSONB 操作和匹配技术： 系统大量使用 PostgreSQL 的 JSONB 功能处理复杂数据结构。

JSONB 包含操作符： 使用 @> 操作符查找包含特定键值对的 JSONB 数据。
SQL

-- 使用@>操作符查找包含特定食材的菜谱
SELECT * FROM CHrecipes
WHERE 食材 @> '[{"名称": "鸡蛋"}]'
JSONB 路径访问： 通过 -> 和 ->> 操作符访问 JSONB 内部元素。
SQL

-- 检查口味特点标签
WHERE jsonb_typeof(r.口味特点->>'标签') = 'array'
JSONB 数组操作： 使用 jsonb_array_elements 解构复杂 JSON 数组。
SQL

-- 从食材数组提取单个食材进行匹配
FROM jsonb_array_elements(COALESCE(r.食材, '[]'::jsonb)) AS ingredient
WHERE ingredient @> jsonb_build_object('名称', ing)
GIN 索引利用： 为 JSONB 字段创建 GIN 索引加速包含和等值查询。
SQL

-- GIN索引定义示例
CREATE INDEX idx_recipes_ingredients ON CHrecipes USING GIN (食材);
动态 SQL 和性能监控： search_recipes 函数使用动态 SQL 构建技术和内置性能监控。

参数绑定安全： 所有用户输入都使用 SQL 参数绑定传递，防止注入。
<!-- end list -->

SQL

RETURN QUERY EXECUTE sql_query USING
    cuisines,                -- $1 菜系
    flavors,                 -- $2 口味
    difficulties,            -- $3 难度
    dietary_restrictions,  -- $4 饮食限制
    -- ... 更多参数
性能监控机制： 内置计时器记录各阶段处理时间。
<!-- end list -->

SQL

-- 计时器基准点
timer_base AS (
    SELECT clock_timestamp() AS base_timestamp
),

-- 筛选阶段计时
filter_timing AS (
    SELECT extract(epoch from (clock_timestamp() -
          (SELECT base_timestamp FROM timer_base))) * 1000 AS duration_ms
)
条件激活逻辑： 使用布尔开关变量决定是否激活特定筛选条件。
<!-- end list -->

SQL

-- 设置过滤条件的布尔开关
has_required_ingredients := required_ingredients IS NOT NULL AND
                             array_length(required_ingredients, 1) > 0;
忌口食材排除实现： 系统实现了忌口食材的智能排除机制。

负权重评分： 给忌口食材赋予大幅负权重，从而显著降低包含忌口食材的菜谱排名。
<!-- end list -->

SQL

CASE
    WHEN EXISTS (
        SELECT 1
        FROM unnest($14::TEXT[]) avoid_ing
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements(r.食材) ing
            WHERE ing @> jsonb_build_object('名称', avoid_ing)
        )
    ) THEN -100.0  -- 大幅降低排序
    ELSE 0.0
END
多层次检查： 在菜名、食材、调料三个层面进行忌口检查。
<!-- end list -->

SQL

-- 检查菜名是否包含忌口关键词
r.菜名 NOT ILIKE '%' || avoid_ing || '%'

-- 检查食材是否包含忌口食材
NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(r.食材) AS ingredient
    WHERE ingredient->>'名称' ILIKE '%' || avoid_ing || '%'
)
忌口搜索逻辑： 进行搜索时，系统会检查菜谱名称、食材列表、调料列表以及原始数据中的各种字段是否包含忌口食材。如果发现任何匹配的忌口食材，该菜谱将被从结果中排除。排除处理在其他筛选条件之后进行。在大型数据集上优先在数据库层面使用 SQL NOT 条件进行初步过滤，对于复杂的忌口匹配在应用层进行第二轮过滤。
2.4.4 搜索算法核心

搜索系统基于多维度匹配和相关性排序实现。
食材标准化处理：
实现文本规范化函数 normalizeString，处理全角半角转换、标点符号统一。
通过 getIngredientVariants 函数扩展食材变体，识别同类食材（如"猪肉"、"猪排"、"五花肉"等）。
递归深度搜索： 使用 deepSearchInObject 函数对嵌套对象进行递归搜索，无论数据结构多复杂都能找到匹配项，灵活处理各种数据类型。
多级权重匹配： （此点在 2.4.2 匹配度排序算法中已详细描述）
数据库与客户端搜索结合： （此点在 2.4.1 查询逻辑与混合搜索策略中已描述）
2.4.5 搜索优化技术

搜索建议智能补全： （代码示例已在 2.3.2 中展示）
事件驱动架构： 使用自定义事件 execute-search 触发搜索操作，实现组件间松耦合。所有搜索行为统一由控制器层处理，确保一致的用户体验。
用户体验优化： 搜索不会自动触发，仅在用户点击搜索按钮时执行。实现加载状态指示器和错误处理机制。支持历史搜索记录和热门搜索建议。
包容性搜索： 实现忌口食材筛选功能，降低或排除包含特定食材的菜谱。支持 AND/OR 标签逻辑，灵活调整搜索策略。综合考虑菜名、食材、调料多个维度的匹配度。
2.4.6 搜索性能优化

请求去重与合并： 使用唯一请求 ID 和相似请求合并，减少服务器负载。实现请求节流和防抖（使用自定义 Hook useCancellableRequests 实现 300ms 延迟），控制请求频率。
请求取消： 通过 AbortController 管理并发请求，自动取消过期请求，避免竞争条件。
缓存机制： 实现了请求缓存，相同搜索条件的请求会直接返回缓存结果，提高响应速度。忌口条件会纳入缓存键，确保相同的搜索和忌口条件组合返回一致的结果。
增量加载： 支持分页加载搜索结果，避免一次性加载大量数据。实现"加载更多"功能，按需获取额外结果。
服务端优化： 使用 Supabase 存储过程优化数据库查询。实现文本搜索索引，加速关键词匹配。支持过滤参数直接在数据库层应用，减少传输数据量。
接下来，我们将列出数据结构与接口详情。

2.5 数据结构与接口 (Data Structure & Interfaces)
（整理说明：此部分收集了数据库表结构、返回结果格式以及核心搜索 API 的签名和使用说明。）

2.5.1 数据库结构

菜谱主表 (表名：CHrecipes)
| column_name         | data_type               | 备注                                         |
| :------------------- | :----------------------- | :------------------------------------------- |
| id                   | uuid                     | 主键                                         |
| 菜名                 | text                     | 菜谱名称                                     |
| 菜系                 | text                     | 菜系（例如：中餐-家常菜）                          |
| 口味特点             | jsonb                    | 例如：{"标签": ["鲜", "咸", "甜"], "主要口味": ["家常", "微辣"]} |
| 烹饪技法             | jsonb                    | 例如：["炒", "炖"]                              |
| 食材                 | jsonb                    | 例如：[{"名称": "鸡蛋", "用量": "2个"}, {"名称": "西红柿", "用量": "1个"}] |
| 调料                 | jsonb                    | 例如：[{"名称": "食盐", "用量": "适量"}]             |
| 步骤                 | jsonb                    | 例如：{"准备步骤": [...], "烹饪步骤": [...]}           |
| 注意事项             | jsonb                    | 例如：[...]                                   |
| created_at          | timestamp with time zone | 创建时间                                     |
| updated_at          | timestamp with time zone | 更新时间                                     |
| 烹饪难度             | text                     | 例如："简单"、"中等"、"困难"                         |
| 是否无麸质           | boolean                  |                                              |
| 调料分类             | jsonb                    | 例如：["盐", "醋"]                              |
| user_id             | uuid                     | 创建菜谱的用户 ID                             |
| 是否清真             | boolean                  |                                              |
| 食材分类             | jsonb                    | 例如：{"蔬菜": ["西红柿"], "蛋类": ["鸡蛋"]}         |
| 是否纯素             | boolean                  |                                              |
| 菜系_jsonb          | jsonb                    | 菜系字段的 JSONB 副本（可能用于特定索引或查询）        |
| 菜名_jsonb          | jsonb                    | 菜名字段的 JSONB 副本（可能用于特定索引或查询）        |

语义搜索向量表 (表名：recipe_embeddings)

语义搜索表存储菜谱的嵌入向量，用于实现基于向量相似度的搜索功能。 | column_name | data_type | 备注 | | :------------ | :----------------------- | :------------------------------- | | id | uuid | 主键 | | recipe_id | uuid | 关联到 CHrecipes 表的 id 字段 | | title | text | 菜谱标题，提取自菜名字段 | | ingredients | text | 食材文本，从食材 jsonb 字段提取并格式化 | | description | text | 菜谱描述，结合步骤和注意事项生成 | | embedding | vector(1536) | OpenAI 模型生成的 1536 维向量 | | created_at | timestamp with time zone | 创建时间 | | updated_at | timestamp with time zone | 更新时间 | | source_text | text | 用于生成嵌入向量的原始文本 | | model | text | 使用的嵌入模型名称 |
数据示例 (CHrecipes 表):

id  èœå èœç³» å£å'³ç‰¹ç‚¹ çƒ¹é¥ªæŠ€æ³• é£Ÿæ è°ƒæ–™ æ­¥éª¤ æ³¨æ„äº‹é¡¹ created_at  updated_at çƒ¹é¥ªéš¾åº¦ æ˜¯å¦æ— éº¸è´¨ è°ƒæ–™åˆ†ç±» user_id æ˜¯å¦æ¸…çœŸ é£Ÿæåˆ†ç±» æ˜¯å¦çº¯ç´ èœç³»_jsonb èœå_jsonb
002b884e-f2cc-48d5-97a1-edfcf41e1a5e çŽ«ç'°èŠ±é±¼ç¿…ç‚'è›‹ ä¸­é¤-å…¶å®ƒ {"æ‡ç­¾": ["é²œ", "å'¸", "ç"œ"], "ä¸»è¦å£å'³": ["åšæ³•ç®€å •", "é£Žå'³ç‹¬ç‰¹", "æœ‰è¯ç"¨ä»·å€¼"]} ["ç‚'"] [{"åç§°": "é¸¡è›‹", "ç"¨é‡": "é€‚é‡"}, {"åç§°": "é±¼ç¿…ï¼ˆå'å¥½ï¼‰", "ç"¨é‡": "é€‚é‡"}, {"å ç§°": "çŽ«ç'°èŠ±", "ç"¨é‡": "é€‚é‡"}, {"å ç§°": "é»„ç"œ", "ç"¨é‡": "é€‚é‡"}, {"å ç§°": "ç•ªèŒ„", "ç"¨é‡": "é€‚é‡"}] [{"å ç§°": "é£Ÿç›", "ç"¨é‡": "8å…‹"}, {"å ç§°": "ç†ŸçŒªæ²¹", "ç"¨é‡": "20å…‹"}, {"å ç§°": "ç™½èƒ¡æ¤'ç²‰", "ç"¨é‡": "5å…‹"}, {"å ç§°": "å¤§è'±èŠ±", "ç"¨é‡": "10å…‹"}] å‡†å¤‡æ­¥éª¤": ["1. é¸¡è›‹æ‰"å…¥ç¢—ä¸­æ å¥½", "2. çŽ«ç'°èŠ±æ´—å‡€ï¼Œæ"¾å…¥é¸¡è›‹ä¸­", "3. åŠ å…¥ç›ã€ç™½èƒ¡æ¤'ç²‰", "4. é±¼ç¿…ç"¨æ‰‹æ'•å¼€"], "çƒ¹é¥ªæ­¥éª¤": ["1. ç‚'é"…ä¸Šç«åŠ æ²¹", "2. çƒ§è‡³å…«æˆç†ŸåŠ å…¥é¸¡è›‹", "3. ç‚'ç†Ÿå ³å¯", "4. é»„ç"œï¼Œè¥¿çº¢æŸ¿å›´è¾¹"]} ["ç¡®ä¿é±¼ç¿…å¤„ç†å¾—å½"ï¼ŒçŽ«ç'°èŠ±åº"é€‰æ‹©æ— æ±¡æŸ"çš„é£Ÿç"¨çŽ«ç'°ã€‚"] 2025-03-20 10:14:04.59311+00 2025-04-21 08:34:31.33219+00 30åˆ†é'Ÿ TRUE ["ç›", "è'±", "åŠ¨ç‰©è„‚è‚ª", "è¾›é¦™æ–™"] 1d930926-9aeb-4bc5-ab1c-a79adee32409 FALSE {"é£Ÿæåˆ†ç±»": {"èŠ±å‰": ["çŽ«ç'°èŠ±"], "è"¬èœ": ["é»„ç"œ", "ç•ªèŒ„"], "è›‹ç±»": ["é¸¡è›‹"], "ä¸­è¯æ": ["é±¼ç¿…ï¼ˆå'å¥½ï¼‰"]}} FALSE "ä¸­é¤-å…¶å®ƒ" "çŽ«ç'°èŠ±é±¼ç¿…ç‚'è›‹"
(注：数据示例中的乱码是由于字符编码问题，实际应显示正确的中文)

2.5.2 返回结果格式

搜索结果将按照综合得分（包含匹配度、语义相似度等）降序排列，高分数的菜谱优先展示。
结果接口定义：
TypeScript

interface MatchResult {
  recipeId: string;
  name: string;
  matchScore: number; // 综合匹配得分
  matchedIngredients: string[]; // 匹配到的食材列表 (可能仅用于前端展示)
  // ... 其他需要展示的菜谱信息，如 difficulty, cuisine, flavorProfile 等
}
2.5.3 核心搜索 API/RPC (search_recipes)

功能描述： 此 PostgreSQL RPC 函数（search_recipes）旨在直接在数据库服务器上实现高效、灵活的菜谱搜索、过滤和排序。主要目标是避免将大量数据传输到应用层进行过滤，从而提高整体性能和响应能力。
技术实现： 实现为 PostgreSQL RPC 函数。利用 CTEs 结构化复杂的搜索逻辑，包括多个过滤条件、用于相关性排名的评分系统、排序和分页。利用 PostgreSQL 的能力（包括 JSONB 操作符）高效查询菜谱详情中的半结构化数据。
方法签名：
SQL

search_recipes(
    search_query TEXT DEFAULT NULL,                  -- 搜索关键词 (可能用于综合排序或作为部分过滤)
    required_ingredients TEXT[] DEFAULT NULL,        -- 必须包含的食材
    optional_ingredients TEXT[] DEFAULT NULL,        -- 可选包含的食材
    required_condiments TEXT[] DEFAULT NULL,         -- 必须包含的调料
    optional_condiments TEXT[] DEFAULT NULL,         -- 可选包含的调料
    dish_name_keywords TEXT[] DEFAULT NULL,          -- 菜名关键词 (作为强过滤条件)
    cuisines TEXT[] DEFAULT NULL,                    -- 菜系筛选
    flavors TEXT[] DEFAULT NULL,                     -- 口味筛选
    difficulties TEXT[] DEFAULT NULL,                -- 难度筛选
    dietary_restrictions TEXT[] DEFAULT NULL,        -- 饮食限制
    required_ingredient_categories TEXT[] DEFAULT NULL, -- 必须包含的食材分类
    optional_ingredient_categories TEXT[] DEFAULT NULL, -- 可选包含的食材分类
    required_condiment_categories TEXT[] DEFAULT NULL, -- 必须包含的调料分类
    optional_condiment_categories TEXT[] DEFAULT NULL, -- 可选包含的调料分类
    avoid_ingredients TEXT[] DEFAULT NULL,           -- 需要排除的忌口食材 (新增)
    avoid_condiments TEXT[] DEFAULT NULL,            -- 需要排除的忌口调料 (新增)
    avoid_ingredient_categories TEXT[] DEFAULT NULL, -- 需要排除的食材分类 (新增)
    page INTEGER DEFAULT 1,                          -- 分页：页码
    page_size INTEGER DEFAULT 10,                    -- 分页：每页条数
    sort_field TEXT DEFAULT 'relevance_score',       -- 排序字段 ('菜名', '菜系', '烹饪难度', 'relevance_score', 'created_at', 'updated_at')
    sort_direction TEXT DEFAULT 'DESC',              -- 排序方向：'asc'升序，'desc'降序
    return_all_results BOOLEAN DEFAULT FALSE,        -- 是否返回所有结果（不分页）
    debug_mode BOOLEAN DEFAULT FALSE                 -- 是否启用性能调试模式
)
RETURNS TABLE (...) -- Returns a table with recipe details and relevance score
筛选与加分项处理：
菜系、口味、难度、饮食限制、必选食材/调料/分类、菜名关键词作为强筛选条件，必须完全匹配才会返回结果。
可选食材/调料/分类、搜索关键词主要作为加分项，影响排序但不强制过滤。
使用说明：
函数使用分层 CTE 结构，按性能优先级依次筛选，大幅提高性能。
不符合筛选条件的菜谱将被完全排除，不会出现在结果中。
对于有多个可能匹配表达式的条件，使用 EXISTS 和复合条件确保不错过匹配。
使用布尔参数绑定代替字符串拼接，增加 SQL 安全性。
优化特点：
筛选条件按照性能和过滤效率重新排序，最高效的过滤条件最先执行。
将重要的筛选条件从加分项变为强制过滤条件，确保结果准确性。
安全注意：
该函数使用动态 SQL，但已实施严格参数绑定和白名单机制防止 SQL 注入。
排序字段及方向已限制在可接受值范围内。
搜索条件均通过参数绑定方式传递，不直接拼接到 SQL 字符串中。
最后，我们整理与搜索功能相关的其他页面和组件的需求。

2.6 相关功能与页面 (Related Features & Pages)
（整理说明：此部分包含了菜谱列表页、菜谱详情页以及今日食谱/随机推荐功能中与搜索相关的需求或改进。）

2.6.1 菜谱列表展示

搜索结果纯文字展示，不显示图片。
简洁明了地展示关键菜谱信息。
按匹配度（综合得分）降序排序显示结果。
2.6.2 菜谱列表页改进 (新增)

与首页搜索功能合并，在同一页面下方展示结果。
实现滚动加载或分页功能，支持查看更多菜谱内容而不限于初始结果数量。
确保搜索与筛选逻辑与首页完全一致，提供统一的用户体验。
页面背景必须使用白色。
所有页面标题统一使用"菜谱列表"。
菜谱卡片整体可点击，点击卡片任意区域均可跳转到该菜谱详情页。
卡片需要展示完整信息，包括菜系、难度、口味和饮食限制等标签。
2.6.3 菜谱详情页结构

需完整展示选中菜谱的所有信息，确保页面不出现空白。
数据结构接口示例：
TypeScript

interface Recipe {
  name: string;
  difficulty: string;
  cuisine: string;
  flavorProfile: string[];
  techniques: string[];
  dietary: string[];
  ingredients: { name: string, quantity: string }[];
  seasonings: { name: string, quantity: string }[];
  preparationSteps: string[];
  cookingSteps: string[];
  cookingTips: string[];
  isFavorited: boolean;
  // ... 其他可能需要的字段
}
确保菜谱详情页所有字段正确渲染，将步骤和食材信息清晰展示。
数据安全处理 (关键修复)：
实现强健的数据安全处理机制，防止页面空白问题。
为所有可能为 undefined 的数据设置默认值：所有数组类型属性使用 safeArray 函数确保是数组，字符串属性设置空字符串默认值，数值属性设置 0 或其他合理默认值。
使用 try-catch 块捕获数据处理过程中的异常。
添加详细的错误日志记录，便于定位和修复问题。
实现菜谱数据验证功能，自动过滤不合格数据。
对关键字段提供可视化指示（如缺失时显示"暂无"等提示）。
2.6.4 今日食谱页面设计 (新增)

将今日食谱页面改造为"随机推荐"功能，从家常菜菜系中随机推荐一个菜谱。
添加相应后端 API 支持，确保随机选择功能正常运行。
显示推荐中的加载状态，提升用户体验。
统一称为"今日菜谱"，保持命名一致性。
每道菜的标签展示需包含"菜系、难度、口味和饮食限制"，删除冗余的"匹配度"信息。
页脚设计与首页保持一致。
实现细节： 今日菜谱功能已完全实现，使用客户端组件加载随机菜谱数据。页面加载时会通过 /api/recipes/random?cuisine=中餐-家常菜 接口获取一个随机菜谱，然后重定向到菜谱详情页。页面包含加载状态展示和错误处理，用户体验流畅。

3. 宴会模式功能模块详解

本章节详细描述宴会模式这一核心新功能，该功能专为多人聚餐场景设计，提供智能菜谱搭配和配菜建议。

3.1 宴会模式概述与功能目标

功能定位： 宴会模式是专为多人聚餐场景设计的智能菜谱搭配功能，帮助用户根据用餐人数自动计算菜品数量和搭配方案，确保荤素搭配合理、营养均衡、寓意吉祥。

核心价值： 解决用户在准备宴会时"做多少道菜"、"如何搭配"、"有什么忌讳"等问题，提供专业的配菜建议和传统宴会文化指导。

技术亮点： 基于传统中式宴会文化和营养学原理，结合智能算法自动计算最优配菜方案，支持多选菜谱管理和实时规则验证。

3.2 宴会配菜规则体系

3.2.1 基础数量规则

人数计算公式： 菜品总数 = 人数 + 随机调整(1-4道)
偶数原则： 菜品总数必须为偶数，符合中式宴会传统
忌讳数字： 自动避开4道菜和14道菜的组合（谐音忌讳）
最小保证： 不少于6道菜，确保宴会基本规模

3.2.2 冷热搭配规则

凉菜比例： 占总菜数的15%-25%
最少数量： 至少2道凉菜
偶数要求： 凉菜数量必须为偶数
余下热菜： 总菜数减去凉菜数量

3.2.3 荤素搭配规则

荤菜比例： 热菜中荤菜占60%-70%
素菜比例： 热菜中素菜占30%-40%
荤菜细分：
- 海鲜类：1-2道（寓意年年有余）
- 禽类：1-2道（寓意大吉大利）
- 畜肉类：1-3道（主要荤菜来源）

3.2.4 必备菜品要求

汤品： 必须包含1道汤（营养和文化需求）
主食： 必须包含主食（米饭、面条等）
硬菜推荐： 建议包含1-2道招牌菜或特色菜

3.2.5 吉祥寓意推荐

推荐食材：
- 鱼类菜品：年年有余
- 鸡肉菜品：大吉大利
- 虾类菜品：欢声笑语
- 圆形菜品：团圆美满
- 红色菜品：红红火火

3.2.6 宴会忌讳规则

食材忌讳：
- 梨（谐音"离"）：避免在婚庆宴会使用
- 苦瓜：代表苦涩，不适合喜庆场合
- 带刺食物：暗示生活坎坷

口味忌讳：
- 避免过于苦涩的菜品
- 避免过酸的菜品
- 控制辛辣程度

数量忌讳：
- 避免单数菜品组合
- 特别避免4道菜和14道菜

3.3 宴会模式用户界面设计

3.3.1 模式切换界面

宴会模式按钮： 位于搜索筛选区域，带有ChefHat图标的醒目按钮
开启流程：
1. 点击"开启宴会模式"按钮
2. 弹出人数输入框（1-100人）
3. 系统自动计算配菜方案
4. 显示配菜规则提示

关闭流程：
1. 再次点击宴会模式按钮
2. 确认关闭操作
3. 清除选中菜谱状态
4. 返回普通搜索模式

3.3.2 人数设置界面

输入控件： 数字输入框，支持1-100人范围
实时计算： 人数变化时实时更新配菜方案
视觉反馈： 当前设置人数和计算出的菜品数量显示

3.3.3 多选菜谱界面

卡片样式： 宴会模式下所有菜谱卡片增加多选功能
选中状态： 
- 未选中：默认边框和背景
- 已选中：琥珀色边框和阴影
- 悬停效果：轻微阴影和边框变化

选择按钮： 右下角圆形选择按钮，清晰的选中/未选中状态
新标签页： 点击菜谱卡片在新标签页打开详情，不影响选择状态

3.3.4 悬浮规则提示窗口

显示位置： 页面右侧悬浮窗口
折叠功能： 支持最小化/最大化切换
实时更新： 根据选中菜谱实时更新搭配分析

提示内容：
- 当前选择统计（已选/目标数量）
- 荤素搭配分析
- 冷热搭配分析
- 必备菜品检查（汤品、主食）
- 吉祥寓意提醒
- 忌讳提醒

操作按钮：
- 生成菜单：跳转到宴会汇总页面
- 规则说明：显示详细的配菜规则
- 最小化：折叠悬浮窗口

3.4 宴会汇总页面设计

3.4.1 页面结构

页面路径： /banquet-summary
访问方式： 宴会模式下点击"生成菜单"按钮
数据传递： 通过sessionStorage传递选中菜谱和配置信息

3.4.2 菜单展示区域

选中菜谱列表： 展示所有选中的菜谱信息
菜谱详情： 每个菜谱包含名称、菜系、难度、食材等信息
分类展示： 按照荤素、冷热进行分类显示

3.4.3 搭配分析区域

数量统计：
- 总菜数
- 凉菜数量和比例
- 荤菜数量和比例
- 素菜数量和比例

分类分析：
- 海鲜类菜品统计
- 禽类菜品统计
- 畜肉类菜品统计

完整性检查：
- 汤品检查
- 主食检查
- 硬菜检查

3.4.4 购物清单生成

食材汇总： 自动汇总所有选中菜谱的食材
调料汇总： 自动汇总所需的调料
数量合并： 相同食材的数量自动合并
打印支持： 支持购物清单的打印输出

3.4.5 空菜单处理

空状态页面： /banquet-empty
触发条件： 宴会模式下未选择任何菜谱时点击生成菜单
页面内容：
- 友好的提示文案
- 返回选择菜谱的引导
- 宴会模式使用说明

3.5 宴会模式技术实现

3.5.1 状态管理

宴会配置接口：
```typescript
interface BanquetConfig {
  isEnabled: boolean;           // 是否启用宴会模式
  guestCount: number;          // 每桌人数
  allocation: DishAllocation | null;  // 配菜方案
}

interface DishAllocation {
  totalDishes: number;         // 菜品总数
  coldDishes: number;          // 凉菜数量
  hotDishes: number;           // 热菜数量
  meatHotDishes: number;       // 荤菜数量
  vegetarianHotDishes: number; // 素菜数量
  seafoodCount: number;        // 海鲜数量
  poultryCount: number;        // 禽类数量
  livestockCount: number;      // 畜肉数量
}
```

统一控制器： 通过useUnifiedSearchController管理宴会模式状态
状态持久化： 使用sessionStorage保存宴会配置和选中菜谱

3.5.2 配菜算法实现

calculateDishAllocation函数： 根据人数计算最优配菜方案
规则验证： checkBanquetRules函数验证当前选择是否符合规则
实时分析： 选择菜谱时实时计算搭配情况

3.5.3 组件架构

BanquetModeButton： 宴会模式切换按钮组件
BanquetRecipeCard： 宴会模式下的多选菜谱卡片
BanquetFloatingRules： 悬浮规则提示窗口
BanquetGenerateButton： 生成菜单按钮组件

3.5.4 数据流管理

选择流程：
1. 开启宴会模式 → 计算配菜方案
2. 设置人数 → 更新配菜方案
3. 选择菜谱 → 更新选择状态
4. 实时验证 → 显示规则提示
5. 生成菜单 → 跳转汇总页面

数据传递：
- 宴会配置：存储在统一控制器状态中
- 选中菜谱：存储在统一控制器状态中
- 页面跳转：通过sessionStorage传递数据

3.6 宴会模式用户交互流程

3.6.1 基础使用流程

1. 用户进入首页或菜谱列表页
2. 点击"开启宴会模式"按钮
3. 输入每桌人数（例如：8人）
4. 系统自动计算配菜方案（例如：10道菜，2道凉菜，8道热菜）
5. 用户开始搜索和选择菜谱
6. 每选择一个菜谱，右侧悬浮窗口实时更新搭配分析
7. 完成选择后，点击"生成菜单"按钮
8. 跳转到宴会汇总页面查看完整菜单

3.6.2 高级使用流程

配菜优化：
1. 根据规则提示调整菜谱选择
2. 确保荤素搭配比例合理
3. 检查是否包含汤品和主食
4. 考虑吉祥寓意和忌讳提醒

菜单管理：
1. 在汇总页面查看完整分析
2. 生成购物清单
3. 打印菜单和购物清单
4. 根据需要返回调整菜谱选择

3.7 宴会模式错误处理

3.7.1 输入验证

人数范围： 限制在1-100人之间
数字格式： 确保输入为有效数字
边界处理： 极端人数下的合理配菜方案

3.7.2 状态恢复

页面刷新： 通过sessionStorage恢复宴会状态
跨页面： 在不同页面间保持宴会模式状态
错误恢复： 状态异常时的默认值处理

3.7.3 用户引导

空选择： 未选择菜谱时的友好提示
规则说明： 详细的宴会配菜规则说明
操作提示： 关键操作步骤的用户引导

4. 收藏夹功能模块详解

本章节详细描述收藏夹功能，该功能允许用户收藏喜欢的菜谱，支持离线存储和跨设备同步。

4.1 收藏夹概述与功能目标

功能定位： 收藏夹是用户个人化菜谱管理功能，帮助用户保存感兴趣的菜谱，建立个人专属的菜谱库。

核心价值： 解决用户"好菜谱太多记不住"、"临时想做某道菜找不到"等问题，提供便捷的个人菜谱收藏和管理体验。

技术亮点： 基于localStorage实现离线收藏功能，无需登录即可使用，支持旧版本数据迁移和多标签页状态同步。

4.2 收藏功能核心特性

4.2.1 无需登录收藏

本地存储策略： 使用localStorage存储收藏数据，确保用户无需注册即可使用收藏功能
数据持久化： 收藏数据在浏览器清除数据前永久保存
跨会话保持： 关闭浏览器重新打开后收藏状态依然保持

4.2.2 智能数据管理

双重存储结构：
- savedRecipes：存储收藏的菜谱ID数组
- savedRecipesData：存储完整的菜谱数据对象

数据同步机制：
- 收藏时同时保存ID和完整数据
- 取消收藏时同步删除两处数据
- 支持从API批量获取菜谱详情

4.2.3 旧版本数据迁移

自动迁移逻辑：
- 检测并迁移旧版'favorites'数据
- 兼容'whattoeat_favorites'系统数据
- 合并多个数据源避免重复
- 迁移完成后自动清理旧数据

兼容性保证：
- 支持从任意旧版本无缝升级
- 保证用户收藏数据不丢失
- 自动数据格式标准化

4.3 收藏夹用户界面设计

4.3.1 收藏按钮设计

统一组件： FavoriteButton组件，支持多种尺寸和样式
视觉状态：
- 未收藏：空心爱心图标，灰色或默认色
- 已收藏：实心爱心图标，红色高亮
- 悬停效果：图标放大和颜色渐变过渡
- 点击效果：按钮缩放动画反馈

按钮配置：
- 尺寸选项：sm、md、lg三种尺寸
- 文字显示：可选择显示"收藏"/"已收藏"文字
- 自定义样式：支持className传入自定义样式
- 回调函数：支持收藏状态变化回调

4.3.2 收藏夹页面布局

页面路径： /collections
页面结构：
- 面包屑导航：首页 / 收藏夹
- 页面标题："收藏夹"
- 菜谱网格：响应式卡片布局展示收藏的菜谱
- 空状态提示：无收藏时显示友好提示

导航集成：
- 主导航栏包含收藏夹入口
- 移动端底部导航支持
- 收藏数量徽章显示（可选）

4.3.3 菜谱卡片增强

收藏状态指示： 每个菜谱卡片显示收藏按钮
快速取消收藏： 在收藏夹页面支持直接取消收藏
批量操作： 支持全选和批量删除收藏（可选功能）

4.4 收藏夹技术实现详情

4.4.1 本地存储数据结构

收藏ID存储： 存储键为'savedRecipes'，保存string[]类型的菜谱ID数组
完整菜谱存储： 存储键为'savedRecipesData'，保存Recipe[]类型的完整菜谱数据

4.4.2 收藏管理核心函数

主要API接口：
- getFavoriteIds(): 获取收藏ID列表
- isFavorite(recipeId): 判断是否已收藏
- addToFavorites(recipe): 添加到收藏
- removeFromFavorites(recipeId): 从收藏移除
- toggleFavorite(recipe): 切换收藏状态
- clearAllFavorites(): 清空所有收藏
- fetchFavoriteRecipes(ids): 批量获取收藏菜谱详情

4.4.3 多标签页状态同步

监听机制： 同时监听'storage'和'favoritechange'事件
状态更新： 收藏状态变化时自动更新所有打开的标签页
事件触发： 收藏操作完成后触发自定义'favoritechange'事件

4.5 收藏夹错误处理与用户体验

4.5.1 数据安全处理

异常捕获： 所有localStorage操作包装在try-catch中
默认值保护： 数据解析失败时返回空数组
数据验证： 检查数据完整性，过滤无效数据

4.5.2 用户体验优化

加载状态： 显示收藏操作的loading状态
操作反馈： 收藏成功后显示确认提示
空状态处理： 无收藏时显示引导界面

5. 用户反馈功能模块

本章节描述位于"关于我们"页面中的用户反馈（联系我们）功能，包括其界面设计、功能流程及相关数据存储需求。

5.1 功能概述与用户界面

* **入口与设计:** 用户反馈功能通过"关于我们"页面中的"联系我们"表单实现。页面设计保持简洁，移除多余区块和卡片结构样式，采用轻量化无边框风格，使表单自然融入页面背景。
* **引导文字:** 表单上方显示引导文字："有任何疑问、建议或合作意向？请填写下方表单与我们联系"。
* **表单字段:** 表单包含以下输入字段：
    * 姓名 (name)
    * 邮箱 (email)
    * 主题 (subject)
    * 留言内容 (message)

5.2 核心功能流程

* **表单提交:** 用户填写表单后，点击提交按钮，系统将用户填写的数据发送至后端。
* **数据保存:** 接收到的用户反馈数据将保存到 Supabase 后端服务的 `user_feedback` 表中。
* **提交状态反馈:**
    * 成功提交后，页面显示绿色提示信息："感谢您的反馈，我们会尽快回复！"。
    * 提交失败时，页面显示红色提示信息："提交失败，请稍后再试"。
    * 无论成功或失败，提示信息将在显示 5 秒后自动消失。
* **提交按钮状态:** 在提交过程中，提交按钮显示"提交中..."并禁用，提交完成后恢复。

5.3 数据存储需求

为存储用户提交的反馈信息，需要创建专门的数据表。

5.4 用户反馈数据表结构

* **表名:** `user_feedback`
* **字段结构:**

| column_name | data_type                | 描述                     |
| :---------- | :----------------------- | :----------------------- |
| id          | uuid                     | 唯一标识符 (主键)        |
| name        | text                     | 提交人姓名               |
| email       | text                     | 提交人邮箱               |
| subject     | text                     | 反馈主题                 |
| message     | text                     | 留言/反馈内容            |
| created_at  | timestamp with time zone | 提交时间                 |
| status      | text                     | 反馈处理状态 (如：待处理、已回复) |

5.5 提交状态交互示例 (参考实现)

以下为提交状态反馈的参考 JSX 实现片段：

```jsx
<div className="contact-form-container w-full max-w-2xl mx-auto">
  {submitStatus === 'success' && (
    <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
      感谢您的反馈，我们会尽快回复！
    </div>
  )}

  {submitStatus === 'error' && (
    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
      提交失败，请稍后再试
    </div>
  )}

  <form onSubmit={handleSubmit} className="space-y-5">
    {/* 表单字段... */}
    <div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-6 py-3 text-white font-medium rounded-md
          ${isSubmitting
            ? 'bg-indigo-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        {isSubmitting ? '提交中...' : '提交反馈'}
      </button>
    </div>
  </form>
</div>
