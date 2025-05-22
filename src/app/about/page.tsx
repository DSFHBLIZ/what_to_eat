import React from 'react';
import ContactForm from '../../components/ContactForm';

export const metadata = {
  title: '联系我们 | 今天吃什么？',
  description: '通过联系表单与我们取得联系。',
};

export default function ContactPage() {
  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-8">联系我们</h1>
      
      <div className="mb-6">
        <p className="text-gray-600">
          有任何疑问、建议或合作意向？请填写下方表单与我们联系
        </p>
      </div>
      
      <ContactForm />
    </div>
  );
} 