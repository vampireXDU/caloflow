import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProfileSetup from './components/ProfileSetup';
import { getProfile, getStoredTheme, saveStoredTheme } from './services/storageService';
import { UserProfile, ThemeName, ThemeConfig } from './types';
import { Loader2 } from 'lucide-react';

const themes: Record<ThemeName, ThemeConfig> = {
  vitality: { name: '活力绿', bg: 'bg-gray-50', card: 'bg-white', text: 'text-gray-800', textSec: 'text-gray-500', primary: 'bg-emerald-600', primaryText: 'text-emerald-600', accent: 'emerald', border: 'border-gray-100', chartFill: '#059669' },
  midnight: { name: '暗夜黑', bg: 'bg-slate-950', card: 'bg-slate-900', text: 'text-white', textSec: 'text-slate-400', primary: 'bg-indigo-600', primaryText: 'text-indigo-400', accent: 'indigo', border: 'border-slate-800', chartFill: '#6366f1' },
  rose: { name: '玫瑰粉', bg: 'bg-stone-50', card: 'bg-white', text: 'text-stone-800', textSec: 'text-stone-500', primary: 'bg-rose-500', primaryText: 'text-rose-500', accent: 'rose', border: 'border-rose-100', chartFill: '#f43f5e' },
  ocean: { name: '深海蓝', bg: 'bg-sky-50', card: 'bg-white', text: 'text-slate-800', textSec: 'text-slate-500', primary: 'bg-blue-600', primaryText: 'text-blue-600', accent: 'blue', border: 'border-blue-100', chartFill: '#2563eb' }
};

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState('auth');
  const [tn, setTn] = useState<ThemeName>('vitality');

  const handleLogin = (u: string) => { setUser(u); setTn(getStoredTheme(u)); const p = getProfile(u); if(p){setProfile(p);setView('dashboard');}else setView('setup'); };
  
  useEffect(() => { if(view==='dashboard') document.body.className = themes[tn].bg; else document.body.className = 'bg-gray-100'; }, [tn, view]);

  if (view === 'auth') return <Auth onLogin={handleLogin} />;
  if (view === 'setup' && user) return <ProfileSetup username={user} existingProfile={profile} onComplete={(p)=>{setProfile(p);setView('dashboard');}} onCancel={profile?()=>setView('dashboard'):undefined} />;
  if (view === 'dashboard' && profile) return <Dashboard user={profile} currentTheme={tn} theme={themes[tn]} onLogout={()=>{setUser(null);setProfile(null);setView('auth');}} onUpdateProfile={setProfile} onUpdateTheme={(t)=>{setTn(t);if(user)saveStoredTheme(user,t);}} onEditProfile={()=>setView('setup')} />;
  return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>;
};
export default App;