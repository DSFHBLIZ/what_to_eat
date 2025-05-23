'use client';

import React, { useState } from 'react';
import { HelpCircle, Users, ChefHat } from 'lucide-react';
import { BanquetConfig } from '../../types/banquet';
import { calculateDishAllocation } from '../../utils/banquetRules';

interface BanquetModeToggleProps {
  banquetConfig: BanquetConfig;
  onConfigChange: (config: BanquetConfig) => void;
}

/**
 * 宴会模式切换组件
 * 包含开启按钮、人数输入和使用说明
 */
export default function BanquetModeToggle({ 
  banquetConfig, 
  onConfigChange 
}: BanquetModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [guestInput, setGuestInput] = useState(banquetConfig.guestCount.toString());

  const handleToggleBanquetMode = () => {
    if (banquetConfig.isEnabled) {
      // 关闭宴会模式
      onConfigChange({
        isEnabled: false,
        guestCount: 8,
        allocation: null
      });
    } else {
      // 开启宴会模式
      const guestCount = parseInt(guestInput) || 8;
      const allocation = calculateDishAllocation(guestCount);
      onConfigChange({
        isEnabled: true,
        guestCount,
        allocation
      });
    }
  };

  const handleGuestCountChange = (value: string) => {
    setGuestInput(value);
    const guestCount = parseInt(value);
    
    if (guestCount && guestCount > 0 && guestCount <= 100) {
      const allocation = calculateDishAllocation(guestCount);
      onConfigChange({
        ...banquetConfig,
        guestCount,
        allocation
      });
    }
  };

  const usageInstructions = `
🍽️ 宴会菜谱搜索模式使用说明：

📊 智能配菜规则：
• 根据人数自动计算菜品总数（偶数原则，避开4和14）
• 冷热搭配：凉菜占15-25%，至少2道且为偶数
• 荤素搭配：荤菜60-70%，素菜30-40%
• 荤菜细分：海鲜1-2道，禽类1-2道，畜肉1-3道

🎯 必备菜品：
• 必须包含汤品和主食
• 建议包含硬菜（招牌菜）

🎉 吉祥推荐：
• 鱼类：寓意年年有余
• 鸡肉：寓意大吉大利  
• 虾类：寓意欢声笑语
• 圆形菜：寓意团圆美满

⚠️ 宴会忌讳：
• 避免带"梨"的菜品（谐音"离"）
• 避免苦味菜品
• 避免过酸菜品
• 避免不吉利谐音菜名

💡 使用方法：
1. 输入每桌人数
2. 系统自动计算配菜方案
3. 搜索并多选菜谱
4. 查看规则提示和建议
5. 确认后生成宴会菜单
  `.trim();

  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
      {/* 宴会模式切换按钮 */}
      <button
        onClick={handleToggleBanquetMode}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${banquetConfig.isEnabled 
            ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600' 
            : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
          }
        `}
      >
        <ChefHat size={18} />
        {banquetConfig.isEnabled ? '关闭宴会模式' : '开启宴会模式'}
      </button>

      {/* 人数输入框 */}
      {banquetConfig.isEnabled && (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-amber-600" />
          <span className="text-sm text-amber-700 font-medium">每桌人数:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={guestInput}
            onChange={(e) => handleGuestCountChange(e.target.value)}
            className="w-16 px-2 py-1 text-center border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="8"
          />
          <span className="text-sm text-amber-600">人</span>
        </div>
      )}

      {/* 帮助图标和tooltip */}
      <div className="relative">
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-amber-600 hover:text-amber-700 transition-colors"
        >
          <HelpCircle size={18} />
        </button>
        
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 w-96 max-w-screen-sm p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {usageInstructions}
            </div>
            <div className="absolute -top-2 right-4 w-4 h-4 bg-white border border-gray-200 transform rotate-45 border-b-0 border-r-0"></div>
          </div>
        )}
      </div>

      {/* 配菜方案显示 */}
      {banquetConfig.isEnabled && banquetConfig.allocation && (
        <div className="ml-auto text-sm text-amber-700 bg-white px-3 py-1 rounded border border-amber-200">
          <span className="font-medium">配菜方案:</span> 
          <span className="ml-1">
            共{banquetConfig.allocation.totalDishes}道
            (凉菜{banquetConfig.allocation.coldDishes}道，热菜{banquetConfig.allocation.hotDishes}道)
          </span>
        </div>
      )}
    </div>
  );
} 