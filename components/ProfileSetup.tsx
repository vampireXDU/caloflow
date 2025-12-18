import React, { useState } from 'react';
import { UserProfile } from '../types';
import { saveProfile } from '../services/storageService';

interface ProfileSetupProps {
  username: string;
  existingProfile?: UserProfile | null;
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ username, existingProfile, onComplete, onCancel }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>(
    existingProfile || {
      username,
      heightCm: 170,
      currentWeightKg: 70,
      age: 25,
      gender: 'male',
      activityLevel: 'moderate',
      targetWeightKg: 65, // 默认减5kg
      targetDays: 30, // 默认30天
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.heightCm && formData.currentWeightKg && formData.age) {
      const saved = saveProfile(username, formData as UserProfile);
      onComplete(saved);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-800">
            {existingProfile ? '编辑档案' : `欢迎, ${username}`}
        </h2>
        <p className="text-gray-500 mb-6">
            {existingProfile ? '调整您的身体数据和目标。' : '让我们来制定您的专属计划。'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 基础信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">身高 (cm)</label>
              <input type="number" required value={formData.heightCm} onChange={e => handleChange('heightCm', Number(e.target.value))} className="input-modern" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">当前体重 (kg)</label>
              <input type="number" step="0.1" required value={formData.currentWeightKg} onChange={e => handleChange('currentWeightKg', Number(e.target.value))} className="input-modern" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">年龄</label>
              <input type="number" required value={formData.age} onChange={e => handleChange('age', Number(e.target.value))} className="input-modern" />
            </div>
             <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">性别</label>
              <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} className="input-modern">
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">日常活动量</label>
            <select value={formData.activityLevel} onChange={e => handleChange('activityLevel', e.target.value)} className="input-modern">
              <option value="sedentary">久坐不动 (办公室工作)</option>
              <option value="light">轻度运动 (每周1-2次)</option>
              <option value="moderate">中度运动 (每周3-5次)</option>
              <option value="active">活跃 (每周6-7次)</option>
              <option value="very_active">专业运动员 (每天两次)</option>
            </select>
          </div>

          <div className="h-px bg-gray-200 my-4"></div>
          
          {/* 目标设定 */}
          <h3 className="font-bold text-gray-800">制定目标</h3>
          <p className="text-xs text-gray-500 mb-2">例如：想要20天瘦10斤 (5kg)</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-wide">目标体重 (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                required 
                value={formData.targetWeightKg} 
                onChange={e => handleChange('targetWeightKg', Number(e.target.value))} 
                className="input-modern ring-1 ring-emerald-100 bg-emerald-50/30" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-wide">计划天数</label>
              <input 
                type="number" 
                required 
                value={formData.targetDays} 
                onChange={e => handleChange('targetDays', Number(e.target.value))} 
                className="input-modern ring-1 ring-emerald-100 bg-emerald-50/30" 
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
             {onCancel && (
                <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition">
                    取消
                </button>
             )}
             <button type="submit" className="flex-1 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-lg">
                {existingProfile ? '保存修改' : '生成档案'}
             </button>
          </div>
        </form>
      </div>
      <style>{`
        .input-modern {
          width: 100%;
          padding: 1rem;
          margin-top: 0.25rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          outline: none;
          font-weight: 500;
          transition: all 0.2s;
        }
        .input-modern:focus {
          background: #fff;
          border-color: #000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
};

export default ProfileSetup;