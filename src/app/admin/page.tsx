'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Database, 
  FileText, 
  Settings, 
  Users, 
  BarChart2, 
  Shield,
  Home
} from 'lucide-react';

// 管理功能卡片定义
interface ManagementCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

export default function AdminPage() {
  // 管理功能列表
  const managementFunctions: ManagementCardProps[] = [
    {
      title: '数据库优化',
      description: '创建索引和优化数据库性能',
      icon: <Database size={24} />,
      path: '/admin/db-optimization',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: '数据管理',
      description: '管理菜谱和食材数据',
      icon: <FileText size={24} />,
      path: '/admin/data',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: '系统设置',
      description: '配置系统参数和功能开关',
      icon: <Settings size={24} />,
      path: '/admin/settings',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: '用户管理',
      description: '管理用户账号和权限',
      icon: <Users size={24} />,
      path: '/admin/users',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: '性能监控',
      description: '监控系统性能和资源使用',
      icon: <BarChart2 size={24} />,
      path: '/admin/monitoring',
      color: 'bg-cyan-50 text-cyan-600'
    },
    {
      title: '安全中心',
      description: '管理安全设置和访问控制',
      icon: <Shield size={24} />,
      path: '/admin/security',
      color: 'bg-red-50 text-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      <div className="container">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">管理面板</h1>
            <p className="text-gray-600 mt-1">欢迎使用管理功能，请谨慎操作</p>
          </div>
          <Link 
            href="/" 
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <Home size={16} className="mr-1" />
            返回主页
          </Link>
        </div>

        {/* 管理功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {managementFunctions.map((func, index) => (
            <Link 
              key={index} 
              href={func.path}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${func.color}`}>
                  {func.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{func.title}</h3>
                <p className="text-gray-600">{func.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 系统信息 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">系统信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500 mb-1">系统版本</div>
              <div className="font-medium">v1.0.0</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500 mb-1">最后更新</div>
              <div className="font-medium">{new Date().toLocaleDateString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500 mb-1">数据库状态</div>
              <div className="font-medium text-green-600">运行中</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-500 mb-1">API状态</div>
              <div className="font-medium text-green-600">正常</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 