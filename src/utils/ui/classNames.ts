import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并类名工具函数
 * 结合clsx和tailwind-merge以有效处理类名合并和冲突解决
 * 
 * @param inputs 任意数量的类名值（字符串、对象、数组等）
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
} 