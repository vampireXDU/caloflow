import React, { useState, useEffect } from 'react';
import { UserProfile, DayLog, FoodItem, ExerciseItem, WeightEntry, ThemeConfig, ThemeName } from '../types';
import { getDayLog, saveDayLog, getWeightHistory, addWeightEntry } from '../services/storageService';
import { estimateFoodNutrition, estimateExerciseBurn, getDailyMotivation } from '../services/geminiService';
import { 
  Flame, Utensils, Droplets, Trophy, Plus, 
  Loader2, Home, BarChart2, Settings, User, AlertTriangle, Trash2, Edit3, Brain, Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DashboardProps {
  user: UserProfile;
  currentTheme: ThemeName;
  onLogout: () => void;
  onUpdateProfile: (p: UserProfile) => void;
  onUpdateTheme: (t: ThemeName) => void;
  onEditProfile: () => void;
  theme: ThemeConfig;
}

// --- Helper Components ---

const WaterCard = ({ log, theme, onUpdate }: { log: DayLog, theme: ThemeConfig, onUpdate: (delta: number) => void }) => {
    const target = 8;
    const percentage = Math.min((log.waterIntakeCups / target) * 100, 100);
    
    let message = "多喝水，身体棒！";
    if (log.waterIntakeCups >= 2) message = "不错的开始！";
    if (log.waterIntakeCups >= 5) message = "保持住，快达标了！";
    if (log.waterIntakeCups >= 8) message = "完美！今日水分充足。";

    return (
        <div className={`${theme.card} relative overflow-hidden rounded-3xl shadow-sm border ${theme.border} min-h-[160px] flex flex-col justify-between transform transition-all hover:scale-[1.01]`}>
            {/* Wave Background */}
            <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-100 transition-all duration-700 ease-in-out z-0"
                style={{ height: `${percentage}%`, opacity: 0.3 }}
            >
                <div className="wave-bg w-full h-4 absolute -top-4"></div>
            </div>
            
            <div className="relative z-10 p-5">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                             <Droplets className="w-5 h-5" />
                        </div>
                        <div>
                             <h3 className={`font-bold ${theme.text}`}>水分补给</h3>
                             <p className="text-xs text-blue-500 font-medium">{message}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <span className="text-3xl font-black text-blue-600">{log.waterIntakeCups}</span>
                         <span className="text-sm text-gray-400 font-medium">/{target}</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 p-4 flex gap-3">
                <button onClick={() => onUpdate(-1)} className="w-12 h-12 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition active:scale-90">
                    -
                </button>
                <button onClick={() => onUpdate(1)} className="flex-1 h-12 rounded-full bg-blue-500 text-white font-bold shadow-blue-200 shadow-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 active:scale-95">
                    <Plus className="w-4 h-4" /> 喝一杯
                </button>
            </div>
        </div>
    );
};

const AddTabContent = ({ 
    theme, 
    foodInput, setFoodInput, 
    exerciseInput, setExerciseInput, 
    onAddFood, onAddExercise, 
    loading 
}: any) => (
    <div className="space-y-6 pb-24 animate-slide-up">
      <h2 className={`text-2xl font-bold ${theme.text}`}>快速记录</h2>
      
      <div className={`${theme.card} p-6 rounded-3xl shadow-md border ${theme.border} stagger-1 animate-scale-in`}>
        <div className="flex items-center gap-2 mb-4 text-emerald-600">
          <Utensils className="w-6 h-6" />
          <h3 className="font-bold">记录饮食</h3>
        </div>
        <textarea
          value={foodInput}
          onChange={e => setFoodInput(e.target.value)}
          placeholder="例如：麦当劳巨无霸套餐，或者 一碗红烧牛肉面"
          className={`w-full p-4 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-emerald-500 mb-4 ${theme.text} transition-all`}
          rows={3}
        />
        <button 
          onClick={onAddFood}
          disabled={loading === 'food' || !foodInput}
          className={`w-full py-4 rounded-xl ${theme.primary} text-white font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition`}
        >
          {loading === 'food' ? <Loader2 className="animate-spin" /> : "AI 智能估算添加"}
        </button>
      </div>

      <div className={`${theme.card} p-6 rounded-3xl shadow-md border ${theme.border} stagger-2 animate-scale-in`}>
        <div className="flex items-center gap-2 mb-4 text-orange-500">
          <Flame className="w-6 h-6" />
          <h3 className="font-bold">记录运动</h3>
        </div>
        <textarea
          value={exerciseInput}
          onChange={e => setExerciseInput(e.target.value)}
          placeholder="例如：跳绳2000个，或者 骑共享单车5公里"
          className={`w-full p-4 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-orange-500 mb-4 ${theme.text} transition-all`}
          rows={3}
        />
        <button 
          onClick={onAddExercise}
          disabled={loading === 'exercise' || !exerciseInput}
          className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition"
        >
           {loading === 'exercise' ? <Loader2 className="animate-spin" /> : "AI 计算热量消耗"}
        </button>
      </div>
    </div>
);

// --- Main Dashboard Component ---

const Dashboard: React.FC<DashboardProps> = ({ user, currentTheme, onLogout, onUpdateProfile, onUpdateTheme, onEditProfile, theme }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'stats' | 'settings'>('overview');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [log, setLog] = useState<DayLog>(getDayLog(user.username, date));
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(getWeightHistory(user.username));
  const [motivation, setMotivation] = useState('');
  
  // Stats View State
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');

  // Input States
  const [foodInput, setFoodInput] = useState('');
  const [exerciseInput, setExerciseInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [loading, setLoading] = useState<'food' | 'exercise' | 'motivation' | null>(null);
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);

  // Calculations
  const weightDiff = (user.currentWeightKg || 0) - (user.targetWeightKg || user.currentWeightKg);
  const isLosing = weightDiff > 0;
  const days = user.targetDays || 30;
  const totalDeficitNeeded = Math.abs(weightDiff) * 7700;
  const dailyDeficitTarget = Math.round(totalDeficitNeeded / days);
  
  let recommendedCalories = isLosing 
    ? user.tdee - dailyDeficitTarget 
    : user.tdee + dailyDeficitTarget;
  
  const isDangerous = isLosing && recommendedCalories < user.bmr;
  const displayGoal = isDangerous ? user.bmr : recommendedCalories; 

  const totalCaloriesIn = log.foods.reduce((sum, f) => sum + f.calories, 0);
  const totalCaloriesOut = log.exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
  const netIntake = totalCaloriesIn - totalCaloriesOut;
  const remaining = displayGoal - netIntake;
  const progress = Math.min((netIntake / displayGoal) * 100, 100);

  useEffect(() => {
    setLog(getDayLog(user.username, date));
  }, [date, user.username]);

  useEffect(() => {
    const fetchMotivation = async () => {
      const quote = await getDailyMotivation(user, weightHistory, user.apiBaseUrl);
      setMotivation(quote);
    };
    fetchMotivation();
  }, [user.username]); 

  // --- Handlers ---

  const handleAddFood = async () => {
    if (!foodInput) return;
    setLoading('food');
    try {
      const nutrition = await estimateFoodNutrition(foodInput, user);
      const newItem: FoodItem = {
        id: Date.now().toString(),
        name: nutrition.name,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        timestamp: Date.now(),
      };
      const newLog = { ...log, foods: [...log.foods, newItem] };
      setLog(newLog);
      saveDayLog(user.username, newLog);
      setFoodInput('');
      setActiveTab('overview'); 
    } catch (e) {
      alert("AI 连接失败。如果您是开发者，请检查代码中的 Key 配置。");
    } finally {
      setLoading(null);
    }
  };

  const handleAddExercise = async () => {
    if (!exerciseInput) return;
    setLoading('exercise');
    try {
      const burn = await estimateExerciseBurn(exerciseInput, user);
      const newItem: ExerciseItem = {
        id: Date.now().toString(),
        name: burn.name,
        caloriesBurned: burn.caloriesBurned,
        durationMinutes: burn.durationMinutes,
        timestamp: Date.now(),
      };
      const newLog = { ...log, exercises: [...log.exercises, newItem] };
      setLog(newLog);
      saveDayLog(user.username, newLog);
      setExerciseInput('');
      setActiveTab('overview');
    } catch (e) {
      alert("AI 连接失败。请检查配置。");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteFood = (index: number) => {
    if(confirm("确定删除这条饮食记录吗？")) {
        const newFoods = [...log.foods];
        newFoods.splice(index, 1);
        const newLog = { ...log, foods: newFoods };
        setLog(newLog);
        saveDayLog(user.username, newLog);
    }
  };

  const handleDeleteExercise = (index: number) => {
     if(confirm("确定删除这条运动记录吗？")) {
        const newExercises = [...log.exercises];
        newExercises.splice(index, 1);
        const newLog = { ...log, exercises: newExercises };
        setLog(newLog);
        saveDayLog(user.username, newLog);
     }
  };

  const updateWater = (delta: number) => {
    const newLog = { ...log, waterIntakeCups: Math.max(0, log.waterIntakeCups + delta) };
    setLog(newLog);
    saveDayLog(user.username, newLog);
  };

  // --- Chart Data Filtering ---
  const getChartData = () => {
      const now = new Date();
      const limit = chartRange === '7d' ? 7 : 30;
      const cutoff = new Date(now.setDate(now.getDate() - limit));
      
      return weightHistory.filter(item => new Date(item.date) >= cutoff);
  };

  // --- Views Implementation ---

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Top Header */}
      <div className={`sticky top-0 z-20 ${theme.bg}/90 backdrop-blur-md px-6 py-4 flex justify-between items-center animate-slide-up`}>
        <h1 className={`text-xl font-extrabold tracking-tight ${theme.text}`}>CaloFlow</h1>
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
           <div className={`w-full h-full flex items-center justify-center ${theme.primary} text-white font-bold text-xs`}>
             {user.username.slice(0,2).toUpperCase()}
           </div>
        </div>
      </div>

      <main className="px-4 pt-2 max-w-lg mx-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-slide-up pb-24">
            {/* Hero Card */}
            <div className={`rounded-[2rem] p-6 ${theme.primary} text-white shadow-xl relative overflow-hidden transform transition hover:scale-[1.01]`}>
                <div className="relative z-10">
                    <p className="opacity-80 text-sm font-medium mb-1">今日热量盈余</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-black">{remaining}</h2>
                        <span className="text-lg font-medium opacity-80">kcal</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-black/20 h-3 rounded-full mt-4 overflow-hidden backdrop-blur-sm">
                        <div 
                           className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                           style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
                         <div className="text-center">
                            <p className="text-xs opacity-70 mb-1">目标</p>
                            <p className="font-bold text-lg">{displayGoal}</p>
                         </div>
                         <div className="text-center border-l border-white/10 pl-6">
                            <p className="text-xs opacity-70 mb-1">摄入</p>
                            <p className="font-bold text-lg">{totalCaloriesIn}</p>
                         </div>
                         <div className="text-center border-l border-white/10 pl-6">
                            <p className="text-xs opacity-70 mb-1">消耗</p>
                            <p className="font-bold text-lg">{totalCaloriesOut}</p>
                         </div>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl"></div>
            </div>

            {isDangerous && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl flex gap-3 text-yellow-800 text-sm items-start animate-scale-in">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>计划过于激进，建议减少目标或延长时间。</p>
                </div>
            )}

            {motivation && (
                <div className={`${theme.card} p-4 rounded-2xl shadow-sm border ${theme.border} flex gap-3 items-center stagger-1 animate-scale-in`}>
                    <Trophy className={`w-5 h-5 ${theme.primaryText}`} />
                    <p className={`text-sm ${theme.text} italic`}>"{motivation}"</p>
                </div>
            )}

            <div className="stagger-2 animate-scale-in">
                <WaterCard log={log} theme={theme} onUpdate={updateWater} />
            </div>

            {/* Recent Activity */}
            <div className="space-y-3 stagger-3 animate-scale-in">
                <div className="flex justify-between items-end px-2">
                     <h3 className={`text-sm font-bold ${theme.textSec} uppercase tracking-wider`}>今日记录</h3>
                     <span className="text-xs text-gray-400">滑动删除</span>
                </div>
                
                {log.foods.length === 0 && log.exercises.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl">
                     <p className="text-gray-400 text-sm mb-2">暂无数据</p>
                     <button onClick={() => setActiveTab('add')} className={`text-sm font-bold ${theme.primaryText}`}>去记录 +</button>
                </div>
                )}
                
                {log.foods.map((f, i) => (
                <div key={`f-${i}`} className={`${theme.card} p-4 rounded-2xl flex justify-between items-center shadow-sm border ${theme.border}`}>
                    <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl"><Utensils className="w-4 h-4 text-emerald-600"/></div>
                    <div>
                        <p className={`font-bold ${theme.text}`}>{f.name}</p>
                        <p className={`text-xs ${theme.textSec}`}>{f.calories} kcal</p>
                    </div>
                    </div>
                    <button onClick={() => handleDeleteFood(i)} className="p-2 text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                ))}
                
                {log.exercises.map((e, i) => (
                <div key={`e-${i}`} className={`${theme.card} p-4 rounded-2xl flex justify-between items-center shadow-sm border ${theme.border}`}>
                    <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 rounded-xl"><Flame className="w-4 h-4 text-orange-600"/></div>
                    <div>
                        <p className={`font-bold ${theme.text}`}>{e.name}</p>
                        <p className={`text-xs ${theme.textSec}`}>{e.durationMinutes} min / {e.caloriesBurned} kcal</p>
                    </div>
                    </div>
                    <button onClick={() => handleDeleteExercise(i)} className="p-2 text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                ))}
            </div>
            </div>
        )}

        {/* ADD TAB */}
        {activeTab === 'add' && (
            <AddTabContent 
                theme={theme} 
                foodInput={foodInput} setFoodInput={setFoodInput}
                exerciseInput={exerciseInput} setExerciseInput={setExerciseInput}
                onAddFood={handleAddFood} onAddExercise={handleAddExercise}
                loading={loading}
            />
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
             <div className="space-y-6 pb-24 h-full flex flex-col animate-slide-up">
                <div className="flex justify-between items-center">
                    <h2 className={`text-2xl font-bold ${theme.text}`}>进度分析</h2>
                    <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                        <button 
                            onClick={() => setChartRange('7d')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartRange === '7d' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                        >
                            7天
                        </button>
                        <button 
                            onClick={() => setChartRange('30d')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartRange === '30d' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                        >
                            30天
                        </button>
                    </div>
                </div>
                
                <div className={`${theme.card} p-6 rounded-3xl shadow-sm border ${theme.border} flex-1 min-h-[350px]`}>
                   <h3 className={`font-semibold ${theme.text} mb-4`}>体重变化趋势 (kg)</h3>
                   <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={getChartData()}>
                         <defs>
                           <linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={theme.chartFill} stopOpacity={0.3}/>
                             <stop offset="95%" stopColor={theme.chartFill} stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <XAxis dataKey="date" hide />
                         <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                         <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                         />
                         {user.targetWeightKg && (
                            <ReferenceLine y={user.targetWeightKg} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: '目标', fill: '#10b981', fontSize: 10 }} />
                         )}
                         <Area type="monotone" dataKey="weight" stroke={theme.chartFill} fillOpacity={1} fill="url(#colorW)" strokeWidth={3} animationDuration={1000} />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                   
                   <div className="mt-6 flex gap-2">
                     <input 
                       type="number" 
                       value={weightInput}
                       onChange={e => setWeightInput(e.target.value)}
                       placeholder="记录今日体重..."
                       className="flex-1 p-4 bg-gray-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <button 
                       onClick={() => {
                          if(weightInput) {
                             addWeightEntry(user.username, { date, weight: parseFloat(weightInput) });
                             setWeightHistory(getWeightHistory(user.username));
                             onUpdateProfile({...user, currentWeightKg: parseFloat(weightInput)});
                             setWeightInput('');
                          }
                       }}
                       className={`${theme.primary} text-white px-6 rounded-xl font-bold shadow-lg active:scale-95 transition`}
                     >
                       保存
                     </button>
                   </div>
                </div>
         
                <div className={`${theme.card} p-6 rounded-3xl shadow-sm border ${theme.border} stagger-1 animate-scale-in`}>
                   <div className="flex justify-between text-sm opacity-70 mb-4">
                      <span className="font-bold text-gray-900">身体数据</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-xs text-gray-500">BMI</p>
                            <p className="font-bold text-xl text-gray-800">{(user.currentWeightKg / ((user.heightCm/100)**2)).toFixed(1)}</p>
                       </div>
                       <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-xs text-gray-500">BMR (基础)</p>
                            <p className="font-bold text-xl text-gray-800">{user.bmr}</p>
                       </div>
                   </div>
                </div>
             </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
            <div className="space-y-8 pb-24 animate-slide-up">
            <h2 className={`text-2xl font-bold ${theme.text}`}>系统设置</h2>
      
            {/* Profile Edit */}
            <section>
                <div onClick={onEditProfile} className={`${theme.card} p-4 rounded-2xl border ${theme.border} flex items-center justify-between cursor-pointer active:scale-95 transition hover:bg-gray-50`}>
                   <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                           <User className="w-6 h-6 text-gray-500" />
                       </div>
                       <div>
                           <p className={`font-bold ${theme.text}`}>{user.username}</p>
                           <p className={`text-xs ${theme.textSec}`}>修改身高、体重及目标</p>
                       </div>
                   </div>
                   <Edit3 className="w-5 h-5 text-gray-400" />
                </div>
            </section>
      
            {/* Theme Picker */}
            <section>
              <h3 className={`text-sm font-bold ${theme.textSec} uppercase mb-3`}>主题颜色</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'vitality', color: 'bg-emerald-500', name: '活力' },
                  { id: 'midnight', color: 'bg-slate-900', name: '暗夜' },
                  { id: 'rose', color: 'bg-rose-400', name: '玫瑰' },
                  { id: 'ocean', color: 'bg-blue-600', name: '深海' },
                ].map((t) => (
                  <button 
                    key={t.id}
                    onClick={() => onUpdateTheme(t.id as ThemeName)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl transition ${currentTheme === t.id ? 'bg-white shadow-md ring-2 ring-offset-2 ring-gray-200' : 'opacity-60'}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${t.color}`}></div>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* AI Provider Config */}
            <section>
                <h3 className={`text-sm font-bold ${theme.textSec} uppercase mb-3 flex items-center gap-2`}>
                    <Brain className="w-4 h-4"/> AI 服务设置
                </h3>
                <div className={`${theme.card} p-5 rounded-3xl border ${theme.border} space-y-4`}>
                    <p className="text-xs text-gray-400 mb-2">选择 AI 服务引擎 (推荐 DeepSeek 以获得最佳中文体验)</p>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                        <button 
                            onClick={() => onUpdateProfile({...user, aiProvider: 'gemini'})}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex justify-center items-center gap-2 ${(!user.aiProvider || user.aiProvider === 'gemini') ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                        >
                            Gemini
                            {(!user.aiProvider || user.aiProvider === 'gemini') && <Check className="w-4 h-4 text-emerald-500"/>}
                        </button>
                        <button 
                            onClick={() => onUpdateProfile({...user, aiProvider: 'deepseek'})}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex justify-center items-center gap-2 ${user.aiProvider === 'deepseek' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                        >
                            DeepSeek
                            {user.aiProvider === 'deepseek' && <Check className="w-4 h-4 text-blue-500"/>}
                        </button>
                    </div>
                    
                    {/* Advanced Toggle */}
                    <div className="pt-2">
                         <button 
                           onClick={() => setShowAdvancedApi(!showAdvancedApi)}
                           className="text-xs text-gray-400 underline"
                         >
                           {showAdvancedApi ? "隐藏高级设置" : "我有自己的 API Key (高级)"}
                         </button>

                         {showAdvancedApi && (
                            <div className="mt-3 animate-slide-up space-y-3 p-3 bg-gray-50 rounded-xl">
                                {user.aiProvider === 'deepseek' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">自定义 DeepSeek Key</label>
                                        <input 
                                            type="password" 
                                            placeholder="sk-..."
                                            defaultValue={user.deepSeekApiKey || ''}
                                            onBlur={(e) => onUpdateProfile({...user, deepSeekApiKey: e.target.value})}
                                            className="w-full p-3 bg-white rounded-xl text-sm border-0 ring-1 ring-gray-200"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">自定义 Gemini 代理地址</label>
                                        <input 
                                            type="text" 
                                            placeholder="https://..."
                                            defaultValue={user.apiBaseUrl || ''}
                                            onBlur={(e) => onUpdateProfile({...user, apiBaseUrl: e.target.value})}
                                            className="w-full p-3 bg-white rounded-xl text-sm border-0 ring-1 ring-gray-200"
                                        />
                                    </div>
                                )}
                            </div>
                         )}
                    </div>
                </div>
            </section>
      
            <button onClick={onLogout} className="w-full py-4 text-red-500 font-medium bg-red-50 rounded-2xl mt-4 mb-8 active:scale-95 transition">
              退出登录
            </button>
            </div>
        )}

      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-safe pt-2 px-6 shadow-lg z-50 animate-slide-up">
        <div className="flex justify-between items-center max-w-lg mx-auto h-16">
          <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'overview' ? theme.primaryText : 'text-gray-400'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">概览</span>
          </button>
          <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'stats' ? theme.primaryText : 'text-gray-400'}`}>
            <BarChart2 className="w-6 h-6" />
            <span className="text-[10px] font-medium">统计</span>
          </button>
          
          <div className="-mt-8">
            <button 
              onClick={() => setActiveTab('add')}
              className={`w-14 h-14 rounded-full ${theme.primary} text-white shadow-xl flex items-center justify-center transform transition active:scale-95 ring-4 ring-white hover:scale-105`}
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'settings' ? theme.primaryText : 'text-gray-400'}`}>
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">设置</span>
          </button>
           <button className={`flex flex-col items-center gap-1 text-gray-400 opacity-0 pointer-events-none`}>
             <User className="w-6 h-6" />
          </button>
        </div>
      </div>
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
      `}</style>
    </div>
  );
};

export default Dashboard;