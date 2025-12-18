import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProfileSetup from './components/ProfileSetup';
import { getProfile, getStoredTheme, saveStoredTheme } from './services/storageService';
import { UserProfile, ThemeName, ThemeConfig } from './types';

// Theme Definitions
const themes: Record<ThemeName, ThemeConfig> = {
  vitality: {
    name: '活力绿',
    bg: 'bg-gray-50',
    card: 'bg-white',
    text: 'text-gray-800',
    textSec: 'text-gray-500',
    primary: 'bg-emerald-600',
    primaryText: 'text-emerald-600',
    accent: 'emerald',
    border: 'border-gray-100',
    chartFill: '#059669'
  },
  midnight: {
    name: '暗夜黑',
    bg: 'bg-slate-950',
    card: 'bg-slate-900',
    text: 'text-white',
    textSec: 'text-slate-400',
    primary: 'bg-indigo-600',
    primaryText: 'text-indigo-400',
    accent: 'indigo',
    border: 'border-slate-800',
    chartFill: '#6366f1'
  },
  rose: {
    name: '玫瑰粉',
    bg: 'bg-stone-50',
    card: 'bg-white',
    text: 'text-stone-800',
    textSec: 'text-stone-500',
    primary: 'bg-rose-500',
    primaryText: 'text-rose-500',
    accent: 'rose',
    border: 'border-rose-100',
    chartFill: '#f43f5e'
  },
  ocean: {
    name: '深海蓝',
    bg: 'bg-sky-50',
    card: 'bg-white',
    text: 'text-slate-800',
    textSec: 'text-slate-500',
    primary: 'bg-blue-600',
    primaryText: 'text-blue-600',
    accent: 'blue',
    border: 'border-blue-100',
    chartFill: '#2563eb'
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'auth' | 'setup' | 'dashboard'>('auth');
  const [themeName, setThemeName] = useState<ThemeName>('vitality');

  useEffect(() => {
    // Attempt auto-login if user was present
    const lastUser = localStorage.getItem('cp_last_user');
    // Note: We force login in this demo for security, but could restore here.
  }, []);

  const handleLogin = (username: string) => {
    setUser(username);
    localStorage.setItem('cp_last_user', username);
    
    // Load theme
    const savedTheme = getStoredTheme(username);
    setThemeName(savedTheme);

    // Check if profile exists
    const existingProfile = getProfile(username);
    if (existingProfile) {
      setProfile(existingProfile);
      setView('dashboard');
    } else {
      setView('setup');
    }
  };

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setView('dashboard');
  };

  const handleEditProfile = () => {
    setView('setup');
  };

  const handleCancelEdit = () => {
    // If cancelling edit, go back to dashboard if profile exists, else auth
    if (profile) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setView('auth');
    localStorage.removeItem('cp_last_user');
  };

  const handleThemeChange = (newTheme: ThemeName) => {
    setThemeName(newTheme);
    if (user) saveStoredTheme(user, newTheme);
  };

  // Apply body background based on theme to prevent white flashes
  useEffect(() => {
     if (view === 'dashboard') {
         document.body.className = themes[themeName].bg;
     } else {
         document.body.className = 'bg-gray-100';
     }
  }, [themeName, view]);

  if (view === 'auth') {
    return <Auth onLogin={handleLogin} />;
  }

  if (view === 'setup' && user) {
    return (
      <ProfileSetup 
        username={user} 
        existingProfile={profile} 
        onComplete={handleProfileComplete} 
        onCancel={profile ? handleCancelEdit : undefined}
      />
    );
  }

  if (view === 'dashboard' && profile) {
    return (
      <Dashboard 
        user={profile} 
        currentTheme={themeName}
        theme={themes[themeName]}
        onLogout={handleLogout} 
        onUpdateProfile={setProfile}
        onUpdateTheme={handleThemeChange}
        onEditProfile={handleEditProfile}
      />
    );
  }

  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600"/></div>;
};

// Simple loader component import
import { Loader2 } from 'lucide-react';

export default App;