'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Users, Target, AlertTriangle, 
  Heart, Minimize2, Maximize2, HelpCircle
} from 'lucide-react';
import { BanquetConfig } from '../../types/banquet';
import { Recipe } from '../../types/recipe';
import Tooltip from '../Tooltip';

// 详细信息内容
const detailsContent = {
  dishCount: [
    '中式宴会一般每桌10-12道菜',
    '凉菜占20-30%，热菜占60-70%',
    '菜品数量要根据客人数量合理配置'
  ],
  meatVegetable: [
    '荤素搭配比例通常为6:4或7:3',
    '荤菜应包括海鲜、禽类和畜肉',
    '避免重复使用相同主要食材'
  ],
  taboos: [
    '梨：谐音"离"，不宜在婚宴使用',
    '苦瓜：代表苦涩，不适合喜庆场合',
    '带刺食物：暗示生活坎坷',
    '四：谐音"死"，避免四道菜搭配'
  ]
};

interface BanquetFloatingRulesProps {
  selectedRecipes: Recipe[];
  banquetConfig: BanquetConfig;
  onNavigateToSummary: () => void;
  isVisible: boolean;
}

/**
 * 宴会规则右侧悬浮窗口组件
 * 跟随页面滚动，显示选菜进度、规则提示和建议
 */
export default function BanquetFloatingRules({
  selectedRecipes,
  banquetConfig,
  onNavigateToSummary,
  isVisible
}: BanquetFloatingRulesProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isVisible || !banquetConfig.isEnabled) {
    return null;
  }

  const selectedCount = selectedRecipes.length;
  const targetCount = banquetConfig.allocation?.totalDishes || 10;
  const progress = Math.min((selectedCount / targetCount) * 100, 100);
  const guestCount = banquetConfig.guestCount;

  // 计算具体菜品数量建议
  const getMeatDishCount = () => {
    const allocation = banquetConfig.allocation;
    if (!allocation) return { meat: 0, vegetarian: 0 };
    
    return {
      meat: allocation.meatHotDishes || Math.ceil(allocation.hotDishes * 0.65),
      vegetarian: allocation.vegetarianHotDishes || Math.floor(allocation.hotDishes * 0.35)
    };
  };

  const meatVegCounts = getMeatDishCount();

  // 确定整体状态
  const getOverallStatus = () => {
    if (selectedCount === 0) return { status: 'start', color: 'blue', message: '开始选择菜品' };
    if (selectedCount < targetCount * 0.5) return { status: 'beginning', color: 'blue', message: '继续选择菜品' };
    if (selectedCount < targetCount * 0.8) return { status: 'progress', color: 'yellow', message: '选择进度良好' };
    if (selectedCount < targetCount) return { status: 'almost', color: 'orange', message: '即将完成' };
    if (selectedCount === targetCount) return { status: 'complete', color: 'green', message: '配菜完成' };
    return { status: 'over', color: 'red', message: '超出建议数量' };
  };

  const statusInfo = getOverallStatus();

  // 添加问号图标带提示
  const TitleWithTooltip = ({ title, details }: { title: string, details: string[] }) => (
    <div className="flex items-center gap-1">
      <span>{title}</span>
      <Tooltip 
        content={
          <div className="w-64 p-2">
            <ul className="list-disc pl-3 space-y-1 text-xs leading-relaxed">
              {details.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        }
        position="left"
        style={{
          bg: 'bg-gray-800',
          text: 'text-white',
          width: 'w-64'
        }}
      >
        <span>
          <HelpCircle size={14} className="text-gray-400 cursor-help" />
        </span>
      </Tooltip>
    </div>
  );

  // 生成菜单处理函数
  const handleGenerateMenu = () => {
    try {
      // 保存状态到sessionStorage
      sessionStorage.setItem('banquet-selected-recipes', JSON.stringify(selectedRecipes));
      sessionStorage.setItem('banquet-config', JSON.stringify(banquetConfig));
      
      // 如果没有选择菜谱，跳转到提示页面
      if (selectedCount === 0) {
        window.open('/banquet-empty', '_blank');
      } else {
        // 在新标签页中打开汇总页面
        window.open('/banquet-summary', '_blank');
      }
    } catch (error) {
      console.error('保存宴会数据失败:', error);
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed right-4 bg-white shadow-lg rounded-lg border border-gray-200"
        style={{ 
          top: '20px',
          zIndex: 50
        }}
      >
        <div className="p-3 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <ChefHat size={16} className="text-amber-600" />
            <span className="text-sm font-medium">宴会配菜</span>
            <div className={`text-xs px-2 py-1 rounded text-white bg-${statusInfo.color}-500`}>
              {selectedCount}/{targetCount}
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed right-4 w-80 bg-white shadow-xl rounded-lg border border-gray-200"
      style={{ 
        top: '20px',
        zIndex: 50
      }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2">
          <ChefHat size={18} className="text-amber-600" />
          <h3 className="font-semibold text-amber-800">宴会配菜助手</h3>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* 进度区域 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">{guestCount}人桌</span>
          </div>
          <div className={`text-sm font-medium text-${statusInfo.color}-600`}>
            {statusInfo.message}
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 bg-${statusInfo.color}-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>已选 {selectedCount} 道菜</span>
          <span>目标 {targetCount} 道菜</span>
        </div>
      </div>

      {/* 规则提示区域 */}
      <div className="p-4 space-y-3 text-sm">
        <div className="mb-3">
          <TitleWithTooltip 
            title="配菜数量"
            details={detailsContent.dishCount}
          />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">凉菜</div>
              <div className="text-lg font-bold text-blue-600">{banquetConfig.allocation?.coldDishes || 0}</div>
              <div className="text-xs text-gray-500">道推荐</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">热菜</div>
              <div className="text-lg font-bold text-green-600">{banquetConfig.allocation?.hotDishes || 0}</div>
              <div className="text-xs text-gray-500">道推荐</div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <TitleWithTooltip 
            title="荤素搭配"
            details={detailsContent.meatVegetable}
          />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">荤菜</div>
              <div className="text-lg font-bold text-orange-600">{meatVegCounts.meat}</div>
              <div className="text-xs text-gray-500">道推荐</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">素菜</div>
              <div className="text-lg font-bold text-emerald-600">{meatVegCounts.vegetarian}</div>
              <div className="text-xs text-gray-500">道推荐</div>
            </div>
          </div>
        </div>

        <div>
          <TitleWithTooltip 
            title="宴会忌讳"
            details={detailsContent.taboos}
          />
          <div className="space-y-2 text-xs text-gray-600 mt-2 relative">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>避开带"梨"的菜品</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>避免苦味菜品</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>避免不吉利谐音菜名</span>
            </div>
            
            {/* 生成菜单按钮 - 放置在列表区域内 */}
            <button
              onClick={handleGenerateMenu}
              className={`
                absolute -top-6 right-8 flex items-center justify-center w-18 h-18 rounded-lg font-medium transition-all duration-200 shadow-md
                ${selectedCount > 0 
                  ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg transform hover:scale-105' 
                  : 'bg-gray-400 text-white hover:bg-gray-500'
                }
              `}
              title={selectedCount > 0 ? '生成菜单' : '还未选择菜品'}
            >
              <div className="flex flex-col items-center">
                <ChefHat size={20} />
                <span className="text-sm mt-1 font-semibold">生成菜单</span>
                {selectedCount > 0 && (
                  <span className="text-xs opacity-90 font-medium">
                    ({selectedCount})
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}