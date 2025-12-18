export interface UserProfile {
  id: string;
  username: string;
  heightCm: number;
  currentWeightKg: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  // 新增：具体的减肥目标
  targetWeightKg?: number; 
  targetDays?: number;     
  bmr: number; // 基础代谢率
  tdee: number; // 每日总消耗
  
  // API Configuration
  apiBaseUrl?: string; // Gemini Proxy URL
  aiProvider?: 'gemini' | 'deepseek'; // AI Provider Selection
  deepSeekApiKey?: string; // DeepSeek API Key
}

export type ThemeName = 'vitality' | 'midnight' | 'rose' | 'ocean';

export interface ThemeConfig {
  name: string;
  bg: string;
  card: string;
  text: string;
  textSec: string;
  primary: string; // e.g. 'bg-emerald-600'
  primaryText: string; // e.g. 'text-emerald-600'
  accent: string;
  border: string;
  chartFill: string;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number; // Date.now()
}

export interface ExerciseItem {
  id: string;
  name: string;
  caloriesBurned: number;
  durationMinutes: number;
  timestamp: number;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  foods: FoodItem[];
  exercises: ExerciseItem[];
  waterIntakeCups: number;
  notes?: string;
}

export enum ActivityMultiplier {
  sedentary = 1.2,
  light = 1.375,
  moderate = 1.55,
  active = 1.725,
  very_active = 1.9,
}