'use client';

import { useState } from 'react';
import { searchIngredientsAndSeasonings } from '../../../utils/recipe/searchService';

export default function SearchTest() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用searchIngredientsAndSeasonings获取建议
  const fetchSuggestions = async () => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchIngredientsAndSeasonings(query);
      setSuggestions(results.map(item => item.tag));
    } catch (err) {
      console.error('获取建议时出错:', err);
      setError('获取建议失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">搜索推荐测试</h1>
      
      <div className="mb-6">
        <label htmlFor="search" className="block mb-2 text-sm font-medium">
          搜索关键词
        </label>
        <div className="flex">
          <input
            id="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词..."
            className="flex-grow p-3 border border-gray-300 rounded-l-lg"
          />
          <button 
            onClick={fetchSuggestions}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition"
          >
            获取建议
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500">加载中...</p>}
      
      {error && <p className="text-red-500">{error}</p>}

      {!loading && suggestions.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">搜索建议:</h2>
          <ul className="border rounded-lg overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => setQuery(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && query && suggestions.length === 0 && (
        <p className="text-gray-500">没有找到相关建议</p>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">调试信息</h2>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-[300px]">
          {JSON.stringify({ query, suggestions, loading, error }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 