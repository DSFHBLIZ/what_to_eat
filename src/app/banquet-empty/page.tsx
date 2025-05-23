'use client';

import React from 'react';
import { ChefHat, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * 宴会空状态提示页面
 * 当用户没有选择菜谱就点击生成菜单时显示
 */
export default function BanquetEmptyPage() {
  const router = useRouter();

  const handleGoBack = () => {
    window.close(); // 关闭当前标签页
  };

  const handleGoToHome = () => {
    window.location.href = '/'; // 跳转到首页
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* 图标 */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle size={40} className="text-amber-600" />
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          还未选择菜谱
        </h1>

        {/* 描述 */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          请先在首页选择一些菜谱，然后再生成宴会菜单。<br />
          建议根据宴会规模选择适量的菜品。
        </p>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleGoToHome}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            <ChefHat size={18} />
            去选择菜谱
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
            关闭页面
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>提示：</strong>启用宴会模式后，可以根据人数自动推荐菜品数量和搭配方案。
          </p>
        </div>
      </div>
    </div>
  );
} 