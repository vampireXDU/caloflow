import { UserProfile, DayLog, WeightEntry, ActivityMultiplier, ThemeName } from "../types";

// Helper to calculate BMR and TDEE
export const calculateStats = (weight: number, height: number, age: number, gender: 'male'|'female', activity: string) => {
  // Mifflin-St Jeor Equation
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;

  const multiplier = ActivityMultiplier[activity as keyof typeof ActivityMultiplier] || 1.2;
  const tdee = Math.round(bmr * multiplier);
  
  return { bmr: Math.round(bmr), tdee };
};

// --- User Management ---

export const getStoredUsers = (): Record<string, string> => {
  const users = localStorage.getItem('cp_users');
  return users ? JSON.parse(users) : {};
};

export const saveUserAuth = (username: string, pin: string): boolean => {
  const users = getStoredUsers();
  if (users[username]) return false; // Already exists
  users[username] = pin;
  localStorage.setItem('cp_users', JSON.stringify(users));
  return true;
};

export const verifyUser = (username: string, pin: string): boolean => {
  const users = getStoredUsers();
  return users[username] === pin;
};

// --- Preferences ---

export const getStoredTheme = (username: string): ThemeName => {
  return (localStorage.getItem(getUserKey(username, 'theme')) as ThemeName) || 'vitality';
};

export const saveStoredTheme = (username: string, theme: ThemeName) => {
  localStorage.setItem(getUserKey(username, 'theme'), theme);
};

// --- Data Management (Scoped by User) ---

const getUserKey = (username: string, key: string) => `cp_${username}_${key}`;

export const getProfile = (username: string): UserProfile | null => {
  const data = localStorage.getItem(getUserKey(username, 'profile'));
  return data ? JSON.parse(data) : null;
};

export const saveProfile = (username: string, profile: UserProfile) => {
  const { bmr, tdee } = calculateStats(profile.currentWeightKg, profile.heightCm, profile.age, profile.gender, profile.activityLevel);
  const updatedProfile = { ...profile, bmr, tdee };
  localStorage.setItem(getUserKey(username, 'profile'), JSON.stringify(updatedProfile));
  
  // Also add a weight entry for today if profile weight changes
  addWeightEntry(username, { date: new Date().toISOString().split('T')[0], weight: profile.currentWeightKg });
  
  return updatedProfile;
};

export const getDayLog = (username: string, date: string): DayLog => {
  const key = getUserKey(username, `log_${date}`);
  const data = localStorage.getItem(key);
  if (data) return JSON.parse(data);
  return { date, foods: [], exercises: [], waterIntakeCups: 0 };
};

export const saveDayLog = (username: string, log: DayLog) => {
  const key = getUserKey(username, `log_${log.date}`);
  localStorage.setItem(key, JSON.stringify(log));
};

export const getWeightHistory = (username: string): WeightEntry[] => {
  const data = localStorage.getItem(getUserKey(username, 'weight_history'));
  return data ? JSON.parse(data) : [];
};

export const addWeightEntry = (username: string, entry: WeightEntry) => {
  const history = getWeightHistory(username);
  // Remove existing entry for same date if exists
  const filtered = history.filter(h => h.date !== entry.date);
  filtered.push(entry);
  // Sort by date
  filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  localStorage.setItem(getUserKey(username, 'weight_history'), JSON.stringify(filtered));
};

// --- Data Export/Import for Sync ---

export const exportUserData = (username: string): string => {
  const data: any = { username };
  data.profile = getProfile(username);
  data.weightHistory = getWeightHistory(username);
  
  // Get all logs (this is a simple implementation, ideally we iterate dates)
  // For this demo, we will check last 365 days or just dump keys that match
  const allKeys = Object.keys(localStorage);
  const logKeys = allKeys.filter(k => k.startsWith(`cp_${username}_log_`));
  data.logs = logKeys.map(k => JSON.parse(localStorage.getItem(k) || '{}'));
  
  return JSON.stringify(data);
};

export const importUserData = (jsonString: string, currentUsername: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.username) return false;
    
    // We import data into the CURRENT logged in user's slot to allow cross-account sync if desired,
    // or strictly enforce username match. Let's allow import INTO current user.
    
    if (data.profile) saveProfile(currentUsername, { ...data.profile, username: currentUsername });
    
    if (data.weightHistory && Array.isArray(data.weightHistory)) {
        localStorage.setItem(getUserKey(currentUsername, 'weight_history'), JSON.stringify(data.weightHistory));
    }
    
    if (data.logs && Array.isArray(data.logs)) {
      data.logs.forEach((log: DayLog) => {
        saveDayLog(currentUsername, log);
      });
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};