'use client';

import React from 'react';
import { useLanguage } from '../contexts/AppProvider';

/**
 * 页脚组件 - 简洁风格
 * 显示网站版权信息和简短标语
 */
export default function Footer() {
  const { language } = useLanguage();
  
  return (
    <footer className="bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <p className="text-gray-600 mb-2">
            © 2025 - 冰箱里有什么？版权所有
          </p>
          <p className="text-gray-600 mb-2">
            本网站提供的所有内容仅供一般参考之用。我们尽力确保信息的准确性和时效性，但不对其完整性、准确性或适用性作出任何保证。使用本网站内容所产生的任何风险由用户自行承担。
          </p>
          <p className="text-gray-700 italic mb-2">
            To Eat or Not to Eat? That's Not the Question.
          </p>
          <p className="text-gray-700 italic">
            What to Eat Is.
          </p>
        </div>
      </div>
    </footer>
  );
} 