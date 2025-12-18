import { UserProfile, DayLog, WeightEntry, ActivityMultiplier, ThemeName } from "../types";

export const calculateStats = (weight: number, height: number, age: number, gender: 'male'|'female', activity: string) => {
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;
  const multiplier = ActivityMultiplier[activity as keyof typeof ActivityMultiplier] || 1.2;
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * multiplier) };
};

export const getStoredUsers = (): Record<string, string> => JSON.parse(localStorage.getItem('cp_users') || '{}');
export const saveUserAuth = (username: string, pin: string): boolean => {
  const users = getStoredUsers();
  if (users[username]) return false;
  users[username] = pin;
  localStorage.setItem('cp_users', JSON.stringify(users));
  return true;
};
export const verifyUser = (username: string, pin: string): boolean => getStoredUsers()[username] === pin;

const getUserKey = (u: string, k: string) => `cp_${u}_${k}`;
export const getStoredTheme = (u: string): ThemeName => (localStorage.getItem(getUserKey(u, 'theme')) as ThemeName) || 'vitality';
export const saveStoredTheme = (u: string, t: ThemeName) => localStorage.setItem(getUserKey(u, 'theme'), t);

export const getProfile = (u: string): UserProfile | null => {
  const data = localStorage.getItem(getUserKey(u, 'profile'));
  return data ? JSON.parse(data) : null;
};
export const saveProfile = (u: string, p: UserProfile) => {
  const { bmr, tdee } = calculateStats(p.currentWeightKg, p.heightCm, p.age, p.gender, p.activityLevel);
  const updated = { ...p, bmr, tdee };
  localStorage.setItem(getUserKey(u, 'profile'), JSON.stringify(updated));
  addWeightEntry(u, { date: new Date().toISOString().split('T')[0], weight: p.currentWeightKg });
  return updated;
};

export const getDayLog = (u: string, date: string): DayLog => {
  const data = localStorage.getItem(getUserKey(u, `log_${date}`));
  return data ? JSON.parse(data) : { date, foods: [], exercises: [], waterIntakeCups: 0 };
};
export const saveDayLog = (u: string, log: DayLog) => localStorage.setItem(getUserKey(u, `log_${log.date}`), JSON.stringify(log));

export const getWeightHistory = (u: string): WeightEntry[] => JSON.parse(localStorage.getItem(getUserKey(u, 'weight_history')) || '[]');
export const addWeightEntry = (u: string, entry: WeightEntry) => {
  const h = getWeightHistory(u).filter(x => x.date !== entry.date);
  h.push(entry);
  h.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  localStorage.setItem(getUserKey(u, 'weight_history'), JSON.stringify(h));
};