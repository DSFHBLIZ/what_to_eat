styles文件夹详细描述
1.1. globals.css
文件大小：863字节，共34行
功能：全局CSS样式文件，使用Tailwind CSS框架
主要内容：
引入Tailwind的基础、组件和工具样式
定义了亮色和暗色主题的基本变量（前景色和背景色）
设置了基本的body样式，包括颜色、背景、字体和过渡效果
定义了文本平衡工具类
添加了自定义主题过渡动画，使颜色、背景等在主题切换时平滑过渡
1.2. print.css
文件大小：3.9KB，共230行
功能：定义打印样式，专为美化食谱打印输出而设计
主要内容：
设置基础页面打印参数（A4纸张大小和边距）
隐藏打印时不需要的UI元素（如页头、页脚、导航栏等）
重置基础样式（字体大小、颜色等）
优化容器、图片、标题、段落、列表、表格等元素的打印样式
控制分页（避免元素在页面边界断开）
为食谱特定元素（配料、步骤等）定义特殊样式
提供多种打印工具类（隐藏元素、显示元素、调整边距等）
确保打印时文本对比度高且背景颜色正确显示
1.3. theme.ts
文件大小：6.0KB，共261行
功能：TypeScript主题配置文件，集中管理颜色和样式变量
主要内容：
定义主题名称类型（亮色、暗色、系统）
定义多个主题接口：颜色、字体、间距、圆角、阴影、过渡、z-index和断点
实现明亮主题设置，包含完整的颜色方案和其他样式变量
实现暗色主题设置，部分沿用明亮主题的设置但调整了颜色和阴影
定义各种专用颜色配置：
难度标签颜色（简单、中等、困难）
口味标签颜色
烹饪方法标签颜色
菜系标签颜色
食材颜色
调料颜色
包含难度值标准化函数
data文件夹详细描述
2.1. recipes.ts
文件大小：1.8KB，共63行
功能：处理和导出菜谱数据
主要内容：
从sample-recipes.json导入原始菜谱数据
定义RawRecipe接口，描述原始菜谱数据的结构
实现数据处理逻辑：
从菜谱数据构建标签
根据菜名自动添加菜系标签（川式、家常菜、粤式等）
根据烹饪时间添加速度标签
包含错误处理机制，防止数据处理失败
导出处理后的菜谱数据
2.2. sample-recipes.json
文件大小：3字节，共1行
功能：存储示例菜谱数据的JSON文件
主要内容：
当前文件只包含一个空数组 []，表示目前没有预定义的示例菜谱




observability文件夹详细描述
1.1. types.ts
文件大小：5.1KB，共204行
功能：定义可观测性系统的类型
主要内容：
定义日志级别枚举（DEBUG, INFO, WARNING, ERROR, CRITICAL）
定义日志条目接口，包含id、时间戳、级别、消息等字段
定义指标类型枚举（COUNTER, GAUGE, HISTOGRAM, TIMER）
定义指标值类型和指标条目接口
定义跟踪跨度类型和状态枚举
定义跨度接口，包含id、名称、类型、跟踪id等字段
定义可观测性点接口，统一包含所有类型的观测数据
定义完整的可观测性配置接口，包括基本配置、输出目标配置、功能开关等
定义可观测性上下文接口，包含追踪相关、用户会话相关、环境信息等
定义可观测性API接口，包含日志方法、指标方法、追踪方法等完整功能集
1.2. core.ts
文件大小：17KB，共675行
功能：可观测性系统的核心实现
主要内容：
导入所有相关类型定义
定义默认配置常量
实现ObservabilityCore类，采用单例模式
提供完整的日志记录功能（debug, info, warn, error等方法）
实现指标记录功能（计数器、仪表盘、计时器等）
提供分布式追踪功能，包括跨度创建、结束和事件添加
实现上下文管理，允许传递和修改上下文信息
提供配置管理、本地存储和网络传输功能
实现系统指标自动收集，如内存使用和页面加载时间
支持条件采样和组件过滤
1.3. index.ts
文件大小：5.6KB，共188行
功能：提供可观测性系统的公共API和初始化方法
主要内容：
导出所有类型和核心实现
提供初始化可观测性系统的函数
设置全局错误和性能处理
拦截未处理的Promise拒绝和全局错误
拦截网络请求（fetch），自动创建和记录跨度
监控性能指标，如长任务、布局偏移和首次绘制
导出简化的日志API
导出度量标准API，便于记录和跟踪性能指标
events文件夹详细描述
2.1. types.ts
文件大小：8.2KB，共301行
功能：定义事件系统的类型
主要内容：
定义基础事件接口，包含时间戳和元数据
定义通用领域事件类型，使用泛型约束不同类型的事件结构
定义多个命名空间下的特定事件类型：
UserEvent：搜索、查看食谱、收藏食谱、过滤、标签等用户操作
UIEvent：通知、错误、主题变更、模态窗口等UI相关事件
DataEvent：数据加载、更新、缓存等数据相关事件
APIEvent：API调用开始、成功、失败等网络相关事件
SystemEvent：性能、生命周期、路由等系统事件
定义所有领域事件的类型映射
定义事件处理器类型和事件键的联合类型
提供事件常量，避免字符串硬编码
提供创建事件的辅助函数
2.2. eventBus.ts
文件大小：5.9KB，共213行
功能：实现领域事件总线，提供基于类型安全的系统间通信机制
主要内容：
实现DomainEventBus类，管理事件监听器和中间件
提供事件订阅方法（on），返回取消订阅的函数
提供一次性订阅方法（once）
实现事件发布方法（emit），支持类型安全的事件发布
提供事件监听管理功能：检查监听器、获取监听器数量、获取事件名称
实现事件历史记录功能，支持获取和清除历史
支持设置最大历史记录数和调试模式
提供移除所有监听器的方法
创建并导出事件总线单例实例
2.3. middleware.ts
文件大小：3.3KB，共113行
功能：提供事件拦截、调试和监控能力的中间件
主要内容：
实现开发模式过滤器中间件，允许开发者过滤特定事件
提供设置事件过滤器的函数
实现分析中间件，收集事件频率和模式的统计数据
提供获取事件统计信息的函数
实现将事件转发到可观测性系统的函数
集成observability系统，记录事件日志和性能指标
2.4. index.ts
文件大小：1.9KB，共79行
功能：提供事件系统的公共API和初始化方法
主要内容：
导出所有事件类型、事件总线和中间件
实现初始化事件系统的函数（initializeEventSystem）
提供配置选项：启用日志、性能追踪、分析和自定义中间件
自动根据环境选择默认配置
在开发环境下打印初始化信息




controllers文件夹详细描述
1.1. useSearchController.ts
文件大小：13KB，共441行
功能：搜索控制器，负责处理搜索相关的业务逻辑和副作用
主要内容：
导入必要的钩子和工具函数，如useState、useEffect、debounce等
定义SearchState接口，包含搜索条件、分页状态和排序状态
定义SearchControllerOptions接口，用于配置搜索控制器的行为
实现useSearchController钩子，提供以下功能：
初始化搜索状态，支持从URL参数加载
构建过滤条件、排序选项和分页选项
同步状态到URL参数
自动搜索功能，支持防抖处理
提供清除过滤器、更新搜索条件等方法
处理页面导航和浏览器前进/后退事件
使用useAsyncResourceController处理异步数据加载和状态管理
实现从URL参数同步到状态，以及从状态同步到URL的双向绑定
1.2. index.ts
文件大小：131字节，共6行
功能：控制器层的入口文件，导出所有控制器
主要内容：
简要介绍控制器层的作用：提供交互方法、封装副作用
导出useSearchController控制器
domain文件夹详细描述
2.1. index.ts
文件大小：167字节，共7行
功能：领域层的入口文件，导出所有领域模块
主要内容：
简要介绍领域层的作用：包含纯函数、状态逻辑、权限规则、验证规则等
导出validation和auth模块
2.2. auth目录
2.2.1. index.ts
文件大小：108字节，共6行
功能：权限模块的入口文件
主要内容：
导出permissions和authStore模块
2.2.2. permissions.ts
文件大小：5.1KB，共195行
功能：定义系统权限和权限检查逻辑
主要内容：
定义UserRole枚举：GUEST, USER, EDITOR, ADMIN
定义ResourceType枚举：RECIPE, INGREDIENT, USER_PROFILE, COMMENT, COLLECTION
定义ActionType枚举：VIEW, CREATE, EDIT, DELETE, PUBLISH等
定义PermissionRule接口，包含资源类型、操作类型、允许的角色和高级检查函数
实现完整的权限规则集，涵盖食谱、评论、收藏等各类资源
提供hasPermission函数，用于检查用户是否有特定权限
支持基于角色的权限检查和自定义逻辑的权限检查
2.2.3. authStore.ts
文件大小：9.9KB，共339行
功能：身份验证状态管理，包含用户认证和授权的核心逻辑
主要内容：
使用zustand创建认证状态存储
定义User接口，包含id、email、name、role等字段
定义UserPreferences接口，包含主题、语言等用户偏好设置
定义AuthState接口，包含用户状态和认证操作
实现登录、注册、登出等认证方法
实现更新用户信息、更新偏好设置等方法
支持邮箱验证、忘记密码、重置密码等功能
集成事件总线，发送认证相关事件
2.3. validation目录
2.3.1. index.ts
文件大小：529字节，共24行
功能：验证模块的入口文件
主要内容：
导出基础验证器、表单验证、食谱验证等功能
为向后兼容性导出API和类型
2.3.2. recipeValidation.ts
文件大小：8.9KB，共292行
功能：食谱验证逻辑和Schema
主要内容：
使用zod库定义RecipeValidatorSchema，详细规定各字段验证规则
定义RecipeValidationErrors类型
实现RecipeValidator类，提供多种验证方法：
validate：验证完整菜谱
validateWithErrors：验证并返回详细错误
validatePartial：验证部分菜谱对象
validateField：验证单个字段
getValidationErrors：生成食谱验证错误消息映射
validateRecipeData：验证食谱数据并提供详细错误信息
提供useRecipeValidator钩子，简化验证操作
2.3.3. 其他验证文件
formValidation.ts：基本表单验证功能（1.4KB）
validators.ts：通用验证器（6.1KB）
formValidationExtended.ts：扩展的表单验证功能（18KB）
2.4. filter目录 和 store目录
目前这两个目录是空的，可能是为未来扩展预留的




design-tokens文件夹详细描述
1.1. index.ts
文件大小：3.6KB，共145行
功能：设计Token系统的入口文件，整合所有设计Token相关模块
主要内容：
导出原子tokens和语义tokens
提供工具函数将嵌套对象转换为扁平的CSS变量格式(flattenObject)
提供生成CSS变量的函数(getCSSVars)
提供获取亮色和暗色主题CSS变量的函数
实现生成Tailwind配置对象的函数(generateTailwindConfig)
导出整合接口，包含所有tokens和工具函数
1.2. tokens.ts
文件大小：3.1KB，共147行
功能：定义设计系统的基本变量和属性
主要内容：
定义原子级别的设计Token(primitiveTokens)，包括：
颜色原语：各种颜色的不同深浅级别，如blue, red, green等
字体大小：从xs到xxl各级尺寸
字重：light, regular, medium, bold
行高：tight, normal, relaxed
间距：none, xs, sm, md, lg, xl, xxl
边框半径：none, xs, sm, md, lg, xl, full
阴影：none, sm, md, lg, xl
过渡：包含持续时间和缓动函数
导出PrimitiveTokens类型，方便类型检查
1.3. semantic.ts
文件大小：5.8KB，共198行
功能：定义语义级别的设计Token，基于原子级别Token构建
主要内容：
定义亮色主题语义tokens(lightSemanticTokens)，包含：
品牌色：primary, secondary, accent
状态颜色：success, warning, error, info
表面颜色：primary, secondary, tertiary
文本颜色：primary, secondary, tertiary, disabled, inverse
边框颜色：light, medium, dark
背景颜色：page, card, overlay
交互元素颜色：default, hover, active, focus, disabled
组件圆角：button, card, input, tooltip, badge
组件阴影：card, dropdown, modal, tooltip
组件间距：layout, inset
组件过渡：button, card, modal, tooltip
定义暗色主题语义tokens(darkSemanticTokens)，与亮色主题结构相同但色值适应暗色模式
导出SemanticTokens类型，方便类型检查
cache文件夹详细描述
2.1. userPreferences.ts
文件大小：5.8KB，共217行
功能：用户偏好管理模块，处理用户的语言、主题等偏好设置
主要内容：
定义UserPreferences接口，包含：
界面语言(language)
主题(theme)
字体大小(fontSize)
列表视图偏好(listView)
通知设置(notifications)，含启用状态、推送和邮件选项
自定义设置(custom)
定义默认用户偏好(defaultPreferences)
创建缓存管理器实例用于永久存储用户偏好
提供完整的用户偏好管理功能：
loadUserPreferences：加载用户偏好设置
saveUserPreferences：保存用户偏好设置
applyPreferences：应用用户偏好设置到DOM
setPreference：设置单个偏好
resetPreferences：重置偏好为默认值
getCurrentPreferences：获取当前偏好
syncPreferencesToServer：同步偏好到服务器(备用)
syncPreferencesFromServer：从服务器获取偏好(备用)
实现事件通知机制，在偏好变更时发布自定义事件




i18n文件夹详细描述
1.1. index.ts
文件大小：1.3KB，共55行
功能：国际化系统的入口文件，统一导出所有i18n相关功能
主要内容：
导入并重新导出国际化键值配置
导入验证消息配置
导入错误消息系统
导出i18nStore中的函数和常量
提供tValidationMessage函数用于获取翻译后的验证消息
统一导出所有相关API和常量，包括I18N_KEYS、getI18nKey、changeLocale等
1.2. i18nStore.ts
文件大小：4.3KB，共178行
功能：国际化状态管理系统，配合React组件使用
主要内容：
使用zustand创建国际化状态存储
导入中文(zh-CN)和英文(en-US)语言资源
定义支持的语言列表(SUPPORTED_LOCALES)
设置默认语言(DEFAULT_LANGUAGE = 'zh-CN')
实现获取当前语言(getCurrentLocale)的函数
定义i18n状态接口(I18nState)，包含初始化状态、当前语言等
提供国际化初始化函数(initI18n)，配置i18next
实现语言切换功能(changeLocale)
提供检查是否为RTL语言的工具函数(isRTL)
1.3. i18n.ts
文件大小：581字节，共38行
功能：i18n基础配置
1.4. commonValidationKeys.ts
文件大小：7.6KB，共213行
功能：定义通用的验证错误消息键
1.5. errorMessages.ts
文件大小：5.3KB，共170行
功能：定义错误消息系统
1.6. keys.ts
文件大小：4.5KB，共164行
功能：i18n键值配置中心，统一管理所有国际化的键名
主要内容：
定义I18N_KEYS常量，包含所有国际化键名的层次结构：
validation：表单验证相关键值
ui：UI相关键值，包含common和auth两个子分类
filters：筛选器相关键值，如ingredients、cuisine、difficulty等
fields：字段标签，如username、password、email等
errors：错误消息，如general、notFound、unauthorized等
pages：页面标题，如home、search、profile等
提供getI18nKey辅助函数，用于获取指定i18n key的值
1.7. locales目录
1.7.1. zh-CN.ts
文件大小：7.6KB，共265行
功能：简体中文语言包
主要内容：
定义所有UI文本的中文翻译，按功能模块分类：
common：通用文本，如"加载中"、"确认"、"取消"等
nav：导航文本，如"首页"、"搜索"、"设置"等
home：首页相关文本
search：搜索相关文本
recipe：食谱详情相关文本
account：用户账户相关文本
settings：设置相关文本
1.7.2. en-US.ts
文件大小：7.9KB，共265行
功能：美式英语语言包
主要内容：
结构与zh-CN.ts相同，但内容为英文翻译




Utils文件夹详细描述
analytics.ts:
用户行为跟踪和性能监控工具
定义了PerformanceMetrics和UserAction接口
提供capturePerformance()捕获性能指标
跟踪用户行为(trackUserAction、trackSearch等)
初始化分析系统(initializeAnalytics)
abTesting.ts:
A/B测试功能实现工具
提供实验分组和变体分配功能
支持记录实验数据
cn.ts:
类名合并工具函数
结合clsx和tailwind-merge处理类名
提供cn()函数组合多个类名并解决冲突
dataMapper.ts:
数据映射转换模块
定义DbRecipe接口表示数据库菜谱格式
提供safeParseJsonb()解析PostgreSQL的jsonb数据
实现transformDbToFrontend/transformFrontendToDb数据转换
dataService.ts:
与Supabase数据库交互的数据服务层
提供单例模式的数据库客户端
实现菜谱查询、过滤和排序功能
管理数据缓存和相关性计算
db-optimization.ts:
数据库索引优化工具
定义数据库索引结构和创建脚本
提供索引创建和检查功能
支持数据库性能分析
docGenerator.ts:
文档生成工具
自动从代码生成文档内容
支持多种文档格式输出
domUtils.ts:
DOM操作安全层
提供元素查询、事件处理、属性设置等DOM操作
安全处理DOM异常和错误情况
实现DOM元素创建和操作工具函数
enhancedSafeJsonParse.ts:
增强版安全JSON解析工具
定义错误类型和处理机制
结合性能监控和完整错误处理
支持结构验证和数据修复
errorHandler.ts:
错误处理系统
集中管理应用错误和异常
提供错误分类和报告机制
errorLogger.ts:
增强版错误日志记录系统
管理不同级别的错误日志(error/warning/info)
记录应用状态和错误历史
提供错误查询和分析功能
fieldMapping.ts:
字段映射工具
处理不同数据源字段的转换
支持自定义映射规则
highlightUtils.tsx:
文本高亮工具函数
实现搜索结果中关键词高亮
提供文本标记和React元素渲染功能
i18nValidation.ts:
国际化文本验证工具
检查翻译完整性和一致性
支持自动检测缺失翻译
id.ts:
统一ID生成工具
提供各种类型ID的生成函数
支持请求ID、跟踪ID、事件ID等
imageUtils.ts:
图片处理工具函数
处理图片加载失败情况
提供图片URL验证和优化
实现懒加载和预加载功能
index.ts:
工具函数统一导出入口
整合所有工具模块为单一导出点
indexedDB.ts:
IndexedDB数据库操作封装
提供数据存储和查询接口
实现数据库版本管理
indexedDBCache.ts:
基于IndexedDB的缓存系统
管理大型数据的持久化缓存
支持过期和自动清理机制
ingredient/index.ts:
食材处理核心模块(预留)
定义食材接口和基础数据结构
ingredientUtils.ts:
食材工具函数集合
维护食材名称映射表
提供食材图标获取和分类判断
实现食材标准化处理
jsonLoader.ts:
JSON数据加载工具
从数据服务加载菜谱数据
处理数据缓存和类型转换
提供数据适配和转换功能
jsonMigrationHelper.ts:
JSON数据迁移助手
支持数据格式版本升级
处理旧数据到新格式的转换
keywordUtils.ts:
关键词处理工具
提供搜索关键词建议和缓存
实现关键词标准化和评分
支持关键词解析和分类
localStorage.ts:
localStorage操作封装
提供类型安全的存储接口
处理存储错误和容量限制
nestedArrayUtils.ts:
嵌套数组操作工具
处理复杂数据结构的转换
提供深度搜索和修改功能
networkUtils.ts:
网络请求工具
封装Fetch API
处理请求重试和错误
提供缓存和数据转换
performanceMonitor.ts:
性能监控系统
跟踪关键性能指标
提供性能数据收集和分析
支持性能问题自动报告
performanceUtils.ts:
性能优化工具函数
提供基准测试功能
实现DOM操作优化技术
支持资源预加载和懒加载
preferenceManager.ts:
用户首选项管理系统
存储和加载用户界面设置
实现主题、字体、动画等选项管理
提供首选项同步和事件通知
recipe/index.ts:
菜谱核心模块
提供菜谱数据访问和格式化函数
实现食材标准化和菜谱收藏功能
safeTypeConversions.ts:
安全类型转换工具
提供各种数据类型的安全转换函数
处理类型转换中的异常情况
实现类型验证和默认值机制
sampleData.ts:
示例数据生成工具
提供开发和测试用的样本数据
支持自定义样本数据生成
searchService.ts:
搜索服务实现
提供菜谱搜索和过滤功能
实现相关性评分和结果排序
处理多条件复合搜索
searchUtils.ts:
搜索工具函数集合
提供关键词建议和防抖功能
实现高亮匹配和结果处理
处理搜索参数和结果格式化
seoUtils.ts:
SEO优化工具
生成元标签和结构化数据
支持动态页面SEO优化
sessionStorage.ts:
sessionStorage操作封装
提供会话存储接口
处理存储错误和异常
stateUtils.ts:
状态管理辅助工具
提供状态转换和处理函数
支持状态持久化和恢复
stateSynchronizer.ts:
状态同步工具
在不同组件间同步状态
实现客户端/服务端状态一致性
systemInit.ts:
系统初始化管理工具
提供应用启动和关闭功能
初始化事件监听和错误处理
支持开发环境配置检查
typeChecks.ts:
类型检查工具函数
提供各种数据类型的验证函数
实现类型守卫和安全类型断言
支持自定义类型验证
usePerformanceMonitor.ts:
性能监控React Hook
在React组件中监控性能
提供组件级性能数据
validation.ts:
数据验证工具
提供表单和数据验证规则
支持自定义验证逻辑
validationCache.ts:
验证结果缓存工具
缓存常用验证结果
提高验证性能




1. src/theme/themeStore.ts
这是一个使用Zustand库实现的主题状态管理文件，主要功能包括：
主题状态管理：
使用Zustand创建了一个主题状态存储(useThemeStore)
支持亮色、暗色和系统主题
使用persist中间件实现主题设置的持久化
使用devtools中间件支持开发调试
主题首选项功能：
定义了ThemeState接口，包含主题状态和相关方法
实现了多种主题设置：字体大小(fontSize)、动画开关(enableAnimations)、高对比度(highContrast)
提供了设置这些首选项的方法
React上下文集成：
创建了PreferenceThemeContext上下文
实现了PreferenceThemeProvider组件，用于在React应用中提供主题状态
提供了usePreferenceTheme自定义钩子，简化主题状态的使用
实现了PreferenceThemePreloader组件，防止主题闪烁
系统主题检测：
使用媒体查询检测系统主题(prefers-color-scheme)
监听系统主题变化并自动更新
主题样式应用：
当主题变化时，自动将主题颜色应用到DOM的CSS变量
自动设置相应的类名和数据属性
实现了字体大小、动画和高对比度设置的DOM应用




4. api文件夹详细描述
api文件夹是项目的核心网络通信层，提供了一套完整的API请求管理系统，设计精良且功能丰富：
index.ts
API模块的统一入口
导出统一API接口，集中管理所有API调用
简化导入路径，提高代码可读性
types.ts
定义API相关的类型和接口
包含请求、响应、缓存和错误处理等相关类型
定义了完整的HTTP客户端接口规范
支持扩展的请求配置和响应结构
constants.ts
定义API相关常量、枚举和默认配置
包含缓存策略(CacheStrategy)、离线策略(OfflineStrategy)和响应类型(ResponseType)等枚举
提供HTTP状态码、事件类型和错误码的标准化定义
定义默认的超时设置、缓存配置和重试策略
offlineQueue.ts
实现离线请求队列管理系统
支持请求优先级排序和重试机制
提供网络状态监听和自动重试功能
支持冲突解决策略和数据持久化
unified目录
提供统一的API调用接口，是整个API层的核心
包含以下关键文件：
index.ts
定义领域驱动的API接口
包含菜谱、认证和用户偏好相关的API函数
提供类型安全的函数签名和优化的缓存策略
支持中间件和错误处理机制
apiAdapter.ts
实现API客户端适配器
处理请求拦截、响应转换和错误处理
支持缓存策略和离线功能
提供请求合并和批处理能力
dataAdapter.ts
提供数据模型转换功能
在API数据格式和应用领域模型之间进行映射
确保数据的一致性和类型安全
types.ts
定义unified API层专用的类型
补充和扩展根目录types.ts中的类型定义
README.md
提供统一API层的详细文档
包含基本用法、高级特性和最佳实践
提供完整的代码示例和集成指南




5. theme文件夹详细描述
src/theme文件夹负责管理应用程序的主题系统，提供了完整的主题状态管理和切换功能。该文件夹包含：
themeStore.ts
使用Zustand库实现的主题状态管理器
主要功能包括：
支持亮色(light)、暗色(dark)和系统(system)三种主题模式
通过persist中间件实现主题设置的持久化存储
使用devtools中间件支持开发调试
系统主题检测和自动适配功能
高级用户偏好设置，包括：
字体大小(fontSize)控制
动画开关(enableAnimations)
高对比度模式(highContrast)
实时应用主题样式到DOM元素
自动监听系统主题变化并更新




core 文件夹代码详细描述
README.md - 核心架构设计文档，包含整个核心架构的概览、主要组件说明、数据流程、错误处理策略和使用示例。核心架构采用分层设计，整合了缓存管理、状态管理和事件系统成统一的数据流架构。
store.ts - 全局状态管理系统，使用zustand库实现。包含应用状态接口定义、通知接口、创建应用状态存储、集中存储访问接口和初始化所有存储的功能。还实现了网络状态监听和心跳检测机制。
eventBus.ts - 统一事件总线，提供集中式的事件处理机制。使用mitt库实现，定义了完整的事件类型映射，包括认证、搜索、筛选、标签、主题、食材、菜谱、UI、语言、国际化、验证、用户、应用、API、网络、离线队列和存储相关的事件。同时提供了常用的事件发射助手函数。
foundation.ts - 应用程序基础设施，整合设计系统、事件系统和可观测性平台。提供初始化基础设施、测量函数执行时间和发布领域事件的功能。
integration.ts - 核心集成层，将缓存系统、状态管理和事件总线连接起来，形成统一的数据流动架构。包含与API缓存、网络状态、错误处理和数据自动刷新相关的功能。
AppProvider.tsx - 应用核心提供器组件，为React应用提供全局状态管理、主题、国际化等基础功能。管理应用初始化状态，处理初始化过程中的加载状态和错误显示。
init.ts - 应用程序初始化模块，协调所有系统的初始化，确保正确的启动顺序。定义了初始化阶段枚举、获取阶段描述、初始化过程状态和初始化配置选项。实现了完整的初始化流程，包括系统初始化、缓存初始化、主题初始化、国际化初始化、存储初始化、API初始化、集成层初始化和认证初始化。
index.ts - 核心模块索引文件，导出核心模块的公共API。包括基础设施、状态管理、API层抽象、缓存管理、表单验证、国际化、用户偏好管理、实用工具和事件总线等。提供了初始化应用程序的便捷方法。
env.ts - 环境配置系统，管理不同环境（开发、测试、生产）的配置参数。定义了环境变量接口，提供了环境工具函数来判断当前环境、获取API URL、获取图片优化URL和记录日志等。
stateCacheBinding.ts - 状态缓存绑定系统，实现状态与缓存系统的双向数据同步。提供了过滤状态、深度合并对象、获取存储适配器等辅助函数，以及缓存选项接口、缓存绑定状态接口和withCache高阶函数。
cache/cacheManager.ts - 统一缓存管理器，对本地存储和会话存储缓存进行统一管理。提供了缓存接口、缓存作用域、缓存存储接口和缓存管理器类。实现了设置缓存、获取缓存、检查缓存、移除缓存、清空缓存、按标签管理缓存和清理过期缓存等功能。
ErrorBoundary.tsx.bak - 统一的错误边界组件，用于捕获React组件树中的错误，防止整个应用崩溃。提供了丰富的配置选项，包括不同的错误主题（default、minimal、recipe、critical等）、自定义UI、错误处理回调和文案定制。组件可以记录错误到日志系统，触发错误事件，并提供重置错误状态和返回首页的功能。实现了React的getDerivedStateFromError和componentDidCatch生命周期方法，提供完整的错误捕获和处理机制。
cache/localCache.ts - 本地存储缓存适配器，使用localStorage实现持久化缓存。定义了StoredCacheEntry接口用于存储缓存内容，包含值、创建时间、过期时间、标签和更新时间。LocalStorageCache类实现了ICacheStorage接口，提供设置缓存、获取缓存、检查缓存存在性、移除缓存、清空缓存、按标签管理缓存等功能。缓存项默认7天过期，支持自定义TTL和缓存标签，自动检查和清除过期缓存项。
cache/sessionCache.ts - 会话存储缓存适配器，使用sessionStorage实现会话级别缓存。结构和功能与localCache.ts非常相似，主要区别在于使用sessionStorage作为存储介质和默认过期时间为30分钟。同样实现了ICacheStorage接口的所有方法，包括set、get、getOrSet、has、remove、clear、removeByTag、getKeysByTag、getKeys和purgeExpired等。会话缓存在浏览器会话结束后自动清除，适合存储临时性数据。




store 文件夹代码详细描述
src/store/index.ts：状态管理系统的入口文件，集成了所有增强功能，提供统一的状态管理解决方案。使用 Zustand 创建应用状态存储，包含应用状态、用户状态和食谱状态，并通过中间件提供了异步操作支持、状态持久化和可组合状态功能。暴露了 useStore 钩子及各种专用钩子如 useUserSlice、useRecipeSlice 和 useApp 等，方便在组件中使用特定状态。
src/store/createStore.ts：通用状态存储创建工具，提供了灵活的配置选项，支持多种中间件和存储引擎。定义了 StorageType、MiddlewareType 和 StorageEngine 等类型，提供了创建存储的函数 createStore，支持持久化、开发工具和 Immer 等中间件，可配置存储名称、默认值、持久化选项和事件前缀等，实现了自定义的存储引擎和状态筛选逻辑。
src/store/store.ts：主要状态存储文件，定义了应用的核心状态结构和操作方法。使用 Zustand 创建全局状态存储，包含用户状态、应用状态、搜索状态和食谱状态，实现了登录/登出、更新用户信息、更新偏好设置、管理通知、处理搜索历史、收藏食谱等功能，并提供了多个自定义钩子如 useUserState、useAppState、useAuthentication 等，方便在组件中使用特定功能。
src/store/StoreProvider.tsx：状态提供者组件，为应用提供全局状态访问，确保状态在服务器端渲染和客户端之间正确同步。该组件处理应用初始化、网络状态监听和状态变化订阅，支持自动处理离线队列和自动同步状态，提供了灵活的配置选项，适用于 Next.js 的服务器组件架构。
src/store/offlineStorage.ts：离线存储管理，提供在网络不可用时的状态持久化和操作队列。实现了离线操作队列、操作重试机制、队列持久化和网络状态监听，支持添加操作到队列、从队列中移除操作和批量处理队列，提供了指数退避重试策略和最大队列长度限制，确保在网络恢复后自动执行缓存的操作。
src/store/syncMiddleware.ts：状态同步中间件，提供跨标签页的状态同步能力。使用 BroadcastChannel API 和 localStorage 实现跨标签页通信，支持选择性同步特定状态键，提供同步前处理和同步后回调，自动加载本地存储的状态和处理广播消息，确保在多个标签页中保持状态一致性。
src/store/formStore.ts：表单状态管理，提供统一的表单状态、验证和提交逻辑。定义了 FormState 接口，实现了表单值设置、错误管理、表单重置和提交，支持表单状态持久化和缓存过期配置，提供表单初始化和外部值导入，适用于复杂表单处理场景。
src/store/enhancedStore.ts：增强型状态存储，集成了所有中间件和增强功能，提供统一的 API 和扩展点。实现了标准化的状态 setter、toggler 和 resetter 创建函数，定义了切片选项接口和增强型存储配置，提供了 createSlice 和 combineSlices 函数，支持状态选择器和动作创建器，确保状态操作符合命名规范和使用模式。
src/store/storeTypes.ts：定义了状态存储的核心类型和接口，包括用户偏好设置、用户状态、应用状态、搜索状态、通知和食谱状态，以及所有状态管理方法的类型定义，为整个状态管理系统提供严格的类型检查和文档参考。
src/store/slices/userSlice.ts：用户状态切片，演示如何使用切片管理系统管理用户数据。定义了 UserPreferences、UserInfo 和 UserState 接口，实现了登录、登出、更新用户信息和偏好设置等操作，支持异步登录和活动历史记录，提供了多个状态选择器和 useUserSlice 钩子，方便在组件中访问用户状态和操作。
src/store/slices/filterSlice.ts：过滤器状态管理切片，集中管理所有与过滤相关的状态和逻辑。定义了 FilterState 接口和 useFilterStore 存储，实现了添加/移除必选和可选食材、切换筛选条件、清除筛选、设置搜索查询、设置标签逻辑等功能，支持将筛选条件同步到 URL，方便分享和保存筛选状态，通过 persist 中间件实现筛选条件的持久化。
src/store/slices/recipeSlice.ts：食谱状态切片，使用切片管理系统管理食谱数据。定义了 RecipeState 接口，包含食谱、收藏、历史、当前食谱、加载状态、错误状态、筛选条件等属性，实现了设置食谱、添加/更新/移除食谱、设置当前食谱、添加/移除收藏、设置推荐食谱、更新筛选条件等操作，通过持久化特定字段保存用户的收藏和历史记录。
src/store/controllers/recipeController.ts：食谱控制器，负责管理菜谱相关的业务逻辑和数据流，将状态操作与副作用分离。实现了加载菜谱列表、加载单个菜谱、加载推荐菜谱、加载收藏菜谱、切换收藏状态、搜索菜谱和更新菜谱等方法，处理异步操作的加载状态和错误处理，发送事件通知以支持系统其他部分响应变化，提供了 useRecipeController 钩子方便在组件中使用。
src/store/middlewares/asyncActions.ts：异步动作中间件，提供对异步操作的支持，包括 loading 状态和错误处理。定义了 AsyncState 接口、AsyncAction 类型和 AsyncActionOptions 接口，实现了 asyncActionsMiddleware 中间件，支持设置 loading 状态、错误处理、事件触发和性能跟踪，提供了 createAsyncActionHook 函数，方便在组件中使用异步操作，支持自动清理错误和全局 loading 状态。
src/store/middlewares/persistState.ts：增强的状态持久化中间件，提供可配置的持久化能力，支持多存储引擎、压缩和加密。定义了 PersistenceStorage、Compressor 和 Encryptor 接口，实现了 createLocalStorage、createSessionStorage 和 createMemoryStorage 存储引擎，提供了 enhancedPersist 中间件，支持版本控制、数据迁移、状态合并、选择性持久化、调试日志和存储延迟等功能。
src/store/middlewares/composableState.ts：可组合状态中间件，允许定义派生状态和状态依赖关系，实现了状态的自动计算和更新。支持声明式的计算属性定义，提供了依赖跟踪和自动重新计算机制，允许添加和移除派生状态，优化了计算性能，避免不必要的重新计算，实现了类似 Vue 的计算属性功能。
src/store/README.md：状态管理系统的文档，详细介绍了设计目标、文件结构、状态组织和使用方法。说明了系统支持的功能，包括持久化配置、跨标签页同步、离线支持和调试功能，提供了各种使用示例，展示如何访问状态、修改状态和处理离线操作，为开发者提供了全面的参考指南。
src/store/slices/favoriteSlice.ts：收藏状态切片，专门管理用户收藏的食谱和收藏集。实现了添加/移除收藏、检查收藏状态、创建和管理收藏集、与后端同步收藏状态等功能，支持离线收藏和同步，提供了状态选择器和操作方法，确保收藏功能的一致性和可靠性。
src/store/slices/searchSlice.ts：搜索状态切片，管理搜索历史、搜索结果和搜索设置。实现了搜索查询执行、搜索历史管理、搜索参数存储和搜索结果缓存等功能，支持本地搜索和远程搜索，提供了搜索建议和自动完成功能，优化了搜索性能和用户体验。
src/store/slices/ingredientSlice.ts：食材状态切片，管理食材库、食材分类和用户的食材库存。实现了食材的添加/移除、分类浏览、食材搜索和用户食材库存管理等功能，支持食材标签和属性，提供了多种食材选择模式，确保食材数据的准确性和完整性。





