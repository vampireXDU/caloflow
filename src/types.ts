export interface UserProfile {
  id: string;
  username: string;
  heightCm: number;
  currentWeightKg: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  targetWeightKg?: number; 
  targetDays?: number;     
  bmr: number;
  tdee: number;
  apiBaseUrl?: string;
  aiProvider?: 'gemini' | 'deepseek';
  deepSeekApiKey?: string;
}
export type ThemeName = 'vitality' | 'midnight' | 'rose' | 'ocean';
export interface ThemeConfig { name: string; bg: string; card: string; text: string; textSec: string; primary: string; primaryText: string; accent: string; border: string; chartFill: string; }
export interface FoodItem { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; timestamp: number; }
export interface ExerciseItem { id: string; name: string; caloriesBurned: number; durationMinutes: number; timestamp: number; }
export interface WeightEntry { date: string; weight: number; }
export interface DayLog { date: string; foods: FoodItem[]; exercises: ExerciseItem[]; waterIntakeCups: number; notes?: string; }
export enum ActivityMultiplier { sedentary = 1.2, light = 1.375, moderate = 1.55, active = 1.725, very_active = 1.9 }