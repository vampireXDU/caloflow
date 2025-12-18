import React, { useState, useEffect } from 'react';
import { UserProfile, DayLog, ThemeConfig, ThemeName } from '../types';
import { getDayLog, saveDayLog, getWeightHistory, addWeightEntry } from '../services/storageService';
import { estimateFoodNutrition, estimateExerciseBurn, getDailyMotivation } from '../services/geminiService';
import { Flame, Utensils, Droplets, Plus, Loader2, Home, BarChart2, Settings, User, Trash2, Check } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

interface DProps { user: UserProfile; currentTheme: ThemeName; onLogout: () => void; onUpdateProfile: (p: UserProfile) => void; onUpdateTheme: (t: ThemeName) => void; onEditProfile: () => void; theme: ThemeConfig; }

const Dashboard: React.FC<DProps> = ({ user, currentTheme, onLogout, onUpdateProfile, onUpdateTheme, onEditProfile, theme }) => {
  const [tab, setTab] = useState('overview');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [log, setLog] = useState<DayLog>(getDayLog(user.username, date));
  const [loading, setLoading] = useState(false);
  const [fi, setFi] = useState('');
  const [ei, setEi] = useState('');
  const [wi, setWi] = useState('');

  const addF = async () => { if(!fi)return; setLoading(true); try { const n = await estimateFoodNutrition(fi, user); const nl={...log, foods:[...log.foods, {...n, id:Date.now(), timestamp:Date.now()}]}; setLog(nl); saveDayLog(user.username, nl); setFi(''); setTab('overview'); } catch(e){alert('Error');} finally{setLoading(false);} };
  const addE = async () => { if(!ei)return; setLoading(true); try { const n = await estimateExerciseBurn(ei, user); const nl={...log, exercises:[...log.exercises, {...n, id:Date.now(), timestamp:Date.now()}]}; setLog(nl); saveDayLog(user.username, nl); setEi(''); setTab('overview'); } catch(e){alert('Error');} finally{setLoading(false);} };

  const calIn = log.foods.reduce((a,b)=>a+b.calories,0);
  const calOut = log.exercises.reduce((a,b)=>a+b.caloriesBurned,0);
  const goal = user.tdee - 500; // Simplified
  const remain = goal - (calIn - calOut);

  return (
    <div className={`min-h-screen ${theme.bg} pb-24`}>
       <div className={`sticky top-0 p-4 flex justify-between bg-white/50 backdrop-blur-md z-10`}>
          <h1 className={`font-bold text-xl ${theme.text}`}>CaloFlow</h1>
          <div className={`w-8 h-8 rounded-full ${theme.primary} flex items-center justify-center text-white text-xs`}>{user.username.slice(0,2)}</div>
       </div>

       <div className="px-4 pt-2 max-w-lg mx-auto space-y-6">
         {tab === 'overview' && (
           <>
             <div className={`${theme.primary} text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden`}>
                <p className="opacity-80 text-sm">今日剩余</p>
                <h2 className="text-5xl font-black">{remain}</h2>
                <div className="flex mt-4 pt-4 border-t border-white/20 justify-between text-center">
                   <div><p className="text-xs opacity-70">目标</p><p className="font-bold">{goal}</p></div>
                   <div><p className="text-xs opacity-70">摄入</p><p className="font-bold">{calIn}</p></div>
                   <div><p className="text-xs opacity-70">消耗</p><p className="font-bold">{calOut}</p></div>
                </div>
             </div>
             
             {/* Water */}
             <div className={`${theme.card} p-5 rounded-3xl shadow-sm border ${theme.border} flex justify-between items-center`}>
                <div className="flex gap-3 items-center"><Droplets className="text-blue-500"/><span className="font-bold text-lg">{log.waterIntakeCups}/8</span></div>
                <button onClick={()=>{const nl={...log, waterIntakeCups:log.waterIntakeCups+1};setLog(nl);saveDayLog(user.username,nl);}} className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold">+1 杯</button>
             </div>

             {/* List */}
             <div className="space-y-3">
               {log.foods.map((f,i)=>(<div key={i} className={`${theme.card} p-4 rounded-xl flex justify-between border ${theme.border}`}><div><p className="font-bold">{f.name}</p><p className="text-xs text-gray-500">{f.calories} kcal</p></div><Trash2 size={16} onClick={()=>{const nf=[...log.foods];nf.splice(i,1);const nl={...log,foods:nf};setLog(nl);saveDayLog(user.username,nl);}}/></div>))}
               {log.exercises.map((e,i)=>(<div key={i} className={`${theme.card} p-4 rounded-xl flex justify-between border ${theme.border}`}><div><p className="font-bold">{e.name}</p><p className="text-xs text-gray-500">-{e.caloriesBurned} kcal</p></div><Trash2 size={16} onClick={()=>{const ne=[...log.exercises];ne.splice(i,1);const nl={...log,exercises:ne};setLog(nl);saveDayLog(user.username,nl);}}/></div>))}
             </div>
           </>
         )}

         {tab === 'add' && (
           <div className="space-y-4">
             <h2 className="text-2xl font-bold">记录</h2>
             <div className={`${theme.card} p-6 rounded-3xl border ${theme.border}`}>
               <div className="flex gap-2 mb-2 text-emerald-600 font-bold"><Utensils/> 饮食</div>
               <textarea value={fi} onChange={e=>setFi(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl mb-3" placeholder="例如: 一个鸡蛋"/>
               <button onClick={addF} disabled={loading} className={`${theme.primary} w-full py-3 rounded-xl text-white font-bold flex justify-center`}>{loading?<Loader2 className="animate-spin"/>:'AI 添加'}</button>
             </div>
             <div className={`${theme.card} p-6 rounded-3xl border ${theme.border}`}>
               <div className="flex gap-2 mb-2 text-orange-500 font-bold"><Flame/> 运动</div>
               <textarea value={ei} onChange={e=>setEi(e.target.value)} className="w-full bg-gray-50 p-3 rounded-xl mb-3" placeholder="例如: 跑步30分钟"/>
               <button onClick={addE} disabled={loading} className="bg-orange-500 w-full py-3 rounded-xl text-white font-bold flex justify-center">{loading?<Loader2 className="animate-spin"/>:'AI 添加'}</button>
             </div>
           </div>
         )}

         {tab === 'stats' && (
             <div className={`${theme.card} p-6 rounded-3xl border ${theme.border} h-80`}>
                 <h3 className="font-bold mb-4">体重趋势</h3>
                 <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={getWeightHistory(user.username)}><Area type="monotone" dataKey="weight" stroke={theme.chartFill} fill={theme.chartFill} fillOpacity={0.2}/><Tooltip/></AreaChart>
                 </ResponsiveContainer>
                 <div className="flex gap-2 mt-2"><input type="number" value={wi} onChange={e=>setWi(e.target.value)} className="bg-gray-50 p-2 rounded-lg flex-1" placeholder="今日体重"/><button onClick={()=>{if(wi){addWeightEntry(user.username,{date, weight:Number(wi)});onUpdateProfile({...user, currentWeightKg:Number(wi)});setWi('');}}} className={`${theme.primary} text-white px-4 rounded-lg`}>记</button></div>
             </div>
         )}
         
         {tab === 'settings' && (
             <div className="space-y-4">
                 <button onClick={onEditProfile} className="w-full p-4 bg-white border rounded-xl font-bold text-left flex gap-2"><User/> 编辑档案</button>
                 <div className="grid grid-cols-4 gap-2">
                     {['vitality','midnight','rose','ocean'].map(t=>(<button key={t} onClick={()=>onUpdateTheme(t as any)} className={`h-10 rounded-lg ${t===currentTheme?'ring-2 ring-black':''} ${t==='vitality'?'bg-emerald-500':t==='midnight'?'bg-slate-900':t==='rose'?'bg-rose-500':'bg-blue-600'}`}></button>))}
                 </div>
                 <button onClick={onLogout} className="w-full p-4 bg-red-50 text-red-500 rounded-xl font-bold">退出登录</button>
             </div>
         )}
       </div>

       {/* Nav */}
       <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur border-t p-2 pb-safe flex justify-around items-center h-16">
          <button onClick={()=>setTab('overview')} className={tab==='overview'?theme.primaryText:'text-gray-400'}><Home/></button>
          <button onClick={()=>setTab('stats')} className={tab==='stats'?theme.primaryText:'text-gray-400'}><BarChart2/></button>
          <button onClick={()=>setTab('add')} className={`w-12 h-12 rounded-full ${theme.primary} text-white flex items-center justify-center -mt-6 shadow-lg border-4 border-white`}><Plus/></button>
          <button onClick={()=>setTab('settings')} className={tab==='settings'?theme.primaryText:'text-gray-400'}><Settings/></button>
       </div>
    </div>
  );
};
export default Dashboard;