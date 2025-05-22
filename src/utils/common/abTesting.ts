/**
 * A/B测试工具
 * 用于测试不同SEO策略和UI变体的效果
 */

// 可用实验变体
export type Variant = 'A' | 'B' | 'C' | 'D';

// 实验定义
export interface Experiment {
  id: string;
  variants: Variant[];
  weights?: number[]; // 各变体权重，默认均分
  storageKey?: string; // 存储键名，默认使用实验ID
}

// 获取实验变体
export function getVariant(experiment: Experiment): Variant {
  const { id, variants, weights = [], storageKey = id } = experiment;
  
  // 检查是否已有存储的变体
  if (typeof window !== 'undefined' && localStorage) {
    const storedVariant = localStorage.getItem(`ab-test-${storageKey}`);
    if (storedVariant && variants.includes(storedVariant as Variant)) {
      return storedVariant as Variant;
    }
  }
  
  // 生成新的变体分配
  const selectedVariant = selectVariantByWeight(variants, weights);
  
  // 存储分配结果
  if (typeof window !== 'undefined' && localStorage) {
    localStorage.setItem(`ab-test-${storageKey}`, selectedVariant);
  }
  
  return selectedVariant;
}

// 根据权重选择变体
function selectVariantByWeight(variants: Variant[], weights: number[]): Variant {
  // 确保权重数组与变体数组等长
  const normalizedWeights = weights.length === variants.length
    ? weights
    : variants.map(() => 1 / variants.length); // 默认等权重
  
  // 计算权重总和
  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  
  // 正则化权重，确保总和为1
  const normalizedProbabilities = normalizedWeights.map(
    weight => weight / totalWeight
  );
  
  // 生成0-1随机数
  const random = Math.random();
  
  // 根据概率选择变体
  let cumulativeProbability = 0;
  for (let i = 0; i < variants.length; i++) {
    cumulativeProbability += normalizedProbabilities[i];
    if (random <= cumulativeProbability) {
      return variants[i];
    }
  }
  
  // 保底返回第一个变体
  return variants[0];
}

// 跟踪实验转化率
export function trackConversion(experimentId: string, variant: Variant) {
  if (typeof window === 'undefined') return;
  
  // 发送到Google Analytics
  if (window.gtag) {
    window.gtag('event', 'experiment_conversion', {
      experiment_id: experimentId,
      variant: variant,
    });
  }
  
  // 发送到百度统计
  if (window._hmt) {
    window._hmt.push(['_trackEvent', 'Experiment', 'Conversion', `${experimentId}_${variant}`]);
  }
}

// 预定义实验
export const SEO_TITLE_EXPERIMENT: Experiment = {
  id: 'seo_title_format',
  variants: ['A', 'B'],
  storageKey: 'seo_title',
}; 