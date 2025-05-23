'use client';

import React, { useState } from 'react';
import { ChefHat, Users } from 'lucide-react';
import { BanquetConfig } from '../../types/banquet';
import { calculateDishAllocation } from '../../utils/banquetRules';

interface BanquetModeButtonProps {
  banquetConfig: BanquetConfig;
  onConfigChange: (config: BanquetConfig) => void;
}

/**
 * 宴会模式切换按钮组件
 * 简化版本，适合放在按钮栏中
 */
export default function BanquetModeButton({ 
  banquetConfig, 
  onConfigChange 
}: BanquetModeButtonProps) {
  const [guestInput, setGuestInput] = useState(banquetConfig.guestCount.toString());
  const [showGuestInput, setShowGuestInput] = useState(false);

  const handleToggleBanquetMode = () => {
    console.log('BanquetModeButton: 点击切换按钮', { 
      currentState: banquetConfig.isEnabled,
      showGuestInput 
    });
    
    if (banquetConfig.isEnabled) {
      // 如果宴会模式已启用，点击按钮展开人数设置而不是关闭
      console.log('BanquetModeButton: 展开人数设置');
      setShowGuestInput(true);
    } else {
      // 显示人数输入
      console.log('BanquetModeButton: 显示人数输入');
      setShowGuestInput(true);
    }
  };

  const handleConfirmGuestCount = () => {
    const guestCount = parseInt(guestInput) || 8;
    console.log('BanquetModeButton: 确认人数', { guestCount });
    
    if (guestCount > 0 && guestCount <= 100) {
      const allocation = calculateDishAllocation(guestCount);
      console.log('BanquetModeButton: 开启宴会模式', { guestCount, allocation });
      
      onConfigChange({
        isEnabled: true,
        guestCount,
        allocation
      });
      setShowGuestInput(false);
    }
  };

  const handleCancelGuestInput = () => {
    setGuestInput(banquetConfig.guestCount.toString());
    setShowGuestInput(false);
  };

  // 新增：明确取消宴会模式的函数
  const handleCancelBanquetMode = () => {
    console.log('BanquetModeButton: 明确取消宴会模式');
    onConfigChange({
      isEnabled: false,
      guestCount: 8,
      allocation: null
    });
    setShowGuestInput(false);
  };

  // 如果显示人数输入
  if (showGuestInput) {
    return (
      <div className="flex items-center gap-2">
        <Users size={16} className="text-indigo-600" />
        <span className="text-sm text-gray-700">人数:</span>
        <input
          type="number"
          min="1"
          max="100"
          value={guestInput}
          onChange={(e) => setGuestInput(e.target.value)}
          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="8"
          autoFocus
        />
        <button
          onClick={handleConfirmGuestCount}
          className="px-2 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 transition-colors"
        >
          确认
        </button>
        <button
          onClick={handleCancelGuestInput}
          className="px-2 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-100 transition-colors"
        >
          取消
        </button>
        {/* 如果已启用宴会模式，显示彻底取消按钮 */}
        {banquetConfig.isEnabled && (
          <button
            onClick={handleCancelBanquetMode}
            className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors ml-2"
          >
            关闭宴会模式
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleToggleBanquetMode}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
        ${banquetConfig.isEnabled 
          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
          : 'bg-indigo-500 text-white hover:bg-indigo-600'
        }
      `}
    >
      <ChefHat size={16} />
      {banquetConfig.isEnabled ? (
        <span>宴会模式 ({banquetConfig.guestCount}人)</span>
      ) : (
        <span>宴会模式</span>
      )}
    </button>
  );
} 