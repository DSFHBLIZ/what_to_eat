'use client';

import { useState, FormEvent } from 'react';
import { getSupabaseClient } from '../utils/data/dataService';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * 联系表单组件
 * 轻量化无边框风格
 */
export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 获取Supabase客户端
      const supabase = getSupabaseClient();
      
      // 确保supabase客户端存在
      if (!supabase) {
        throw new Error('无法连接到数据库');
      }
      
      // 提交到Supabase
      console.log('正在提交用户反馈到user_feedback表...');
      const { error } = await supabase
        .from('user_feedback')
        .insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'new',
          created_at: new Date().toISOString()
        }]);
        
      if (error) {
        throw error;
      }
      
      // 成功处理
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // 5秒后重置状态
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('提交表单时出错:', error);
      setSubmitStatus('error');
      
      // 5秒后重置错误状态
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="contact-form-container w-full max-w-2xl mx-auto">
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
          感谢您的反馈，我们会尽快回复！
        </div>
      )}
      
      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          提交失败，请稍后再试
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            姓名
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent transition-colors"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            邮箱
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent transition-colors"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            主题
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent transition-colors"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            留言内容
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-transparent"
            required
          ></textarea>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 text-white font-medium rounded-md 
              ${isSubmitting 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isSubmitting ? '提交中...' : '提交反馈'}
          </button>
        </div>
      </form>
    </div>
  );
} 