import React, { useState } from 'react';
import { UserProfile } from '../types';
import { saveProfile } from '../services/storageService';

interface PProps { username: string; existingProfile?: UserProfile | null; onComplete: (p: UserProfile) => void; onCancel?: () => void; }

const ProfileSetup: React.FC<PProps> = ({ username, existingProfile, onComplete, onCancel }) => {
  const [data, setData] = useState<Partial<UserProfile>>(existingProfile || { username, heightCm: 170, currentWeightKg: 70, age: 25, gender: 'male', activityLevel: 'moderate', targetWeightKg: 65, targetDays: 30 });
  const hc = (f: keyof UserProfile, v: any) => setData(p => ({ ...p, [f]: v }));
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6">{existingProfile ? '编辑' : '欢迎'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onComplete(saveProfile(username, data as UserProfile)); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <input type="number" placeholder="身高 cm" value={data.heightCm} onChange={e=>hc('heightCm', Number(e.target.value))} className="p-3 border rounded-xl" required/>
             <input type="number" placeholder="体重 kg" value={data.currentWeightKg} onChange={e=>hc('currentWeightKg', Number(e.target.value))} className="p-3 border rounded-xl" required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <input type="number" placeholder="年龄" value={data.age} onChange={e=>hc('age', Number(e.target.value))} className="p-3 border rounded-xl" required/>
             <select value={data.gender} onChange={e=>hc('gender', e.target.value)} className="p-3 border rounded-xl"><option value="male">男</option><option value="female">女</option></select>
          </div>
          <select value={data.activityLevel} onChange={e=>hc('activityLevel', e.target.value)} className="w-full p-3 border rounded-xl"><option value="sedentary">久坐</option><option value="light">轻度</option><option value="moderate">中度</option><option value="active">活跃</option></select>
          <div className="h-px bg-gray-100 my-4"></div>
          <p className="font-bold">目标</p>
          <div className="grid grid-cols-2 gap-4">
             <input type="number" placeholder="目标体重" value={data.targetWeightKg} onChange={e=>hc('targetWeightKg', Number(e.target.value))} className="p-3 border ring-1 ring-emerald-200 rounded-xl" required/>
             <input type="number" placeholder="天数" value={data.targetDays} onChange={e=>hc('targetDays', Number(e.target.value))} className="p-3 border ring-1 ring-emerald-200 rounded-xl" required/>
          </div>
          <div className="flex gap-3 pt-4">
            {onCancel && <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 py-3 rounded-xl">取消</button>}
            <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl shadow-lg">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProfileSetup;