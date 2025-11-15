import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

const TIME_TRACKING_KEY = '@snapnow_time_tracking';
const DAILY_LIMIT_KEY = '@snapnow_daily_limit';
const SLEEP_MODE_KEY = '@snapnow_sleep_mode';

export interface DailyUsage {
  date: string; // YYYY-MM-DD format
  minutes: number;
}

export interface WeeklyUsage {
  [date: string]: number; // date -> minutes
}

export interface SleepModeConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  selectedDays: boolean[];
}

let sessionStartTime: number | null = null;
let currentDate: string = '';

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

// Initialize time tracking
export const initTimeTracking = () => {
  currentDate = getTodayDate();
  sessionStartTime = Date.now();

  // Listen to app state changes
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  
  return () => {
    subscription.remove();
  };
};

// Handle app state changes (foreground/background)
const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  if (nextAppState === 'active') {
    // App comes to foreground
    sessionStartTime = Date.now();
    currentDate = getTodayDate();
  } else if (nextAppState === 'background' || nextAppState === 'inactive') {
    // App goes to background
    await saveCurrentSession();
  }
};

// Save current session time
const saveCurrentSession = async () => {
  if (sessionStartTime === null) return;

  const sessionEnd = Date.now();
  const sessionDuration = Math.floor((sessionEnd - sessionStartTime) / 1000 / 60); // in minutes

  if (sessionDuration > 0) {
    await addTimeToToday(sessionDuration);
  }

  sessionStartTime = null;
};

// Add time to today's usage
export const addTimeToToday = async (minutes: number) => {
  try {
    const today = getTodayDate();
    const weeklyData = await getWeeklyUsage();
    
    weeklyData[today] = (weeklyData[today] || 0) + minutes;
    
    await AsyncStorage.setItem(TIME_TRACKING_KEY, JSON.stringify(weeklyData));
  } catch (error) {
    console.error('Error adding time:', error);
  }
};

// Get weekly usage data (last 7 days)
export const getWeeklyUsage = async (): Promise<WeeklyUsage> => {
  try {
    const data = await AsyncStorage.getItem(TIME_TRACKING_KEY);
    const allData: WeeklyUsage = data ? JSON.parse(data) : {};
    
    // Clean up old data (keep only last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const cleanedData: WeeklyUsage = {};
    Object.keys(allData).forEach(date => {
      if (date >= cutoffDate) {
        cleanedData[date] = allData[date];
      }
    });
    
    // Save cleaned data if it changed
    if (Object.keys(cleanedData).length !== Object.keys(allData).length) {
      await AsyncStorage.setItem(TIME_TRACKING_KEY, JSON.stringify(cleanedData));
    }
    
    return cleanedData;
  } catch (error) {
    console.error('Error getting weekly usage:', error);
    return {};
  }
};

// Get last 7 days of data for chart
export const getLast7DaysUsage = async (): Promise<DailyUsage[]> => {
  const weeklyData = await getWeeklyUsage();
  const today = getTodayDate();
  const result: DailyUsage[] = [];
  
  // Calculate current session time
  let currentSessionMinutes = 0;
  if (sessionStartTime !== null) {
    const currentSessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    currentSessionMinutes = Math.max(0, currentSessionDuration);
  }
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    let minutes = weeklyData[dateStr] || 0;
    
    // Add current session time if it's today
    if (dateStr === today) {
      minutes += currentSessionMinutes;
    }
    
    result.push({
      date: dateStr,
      minutes: minutes,
    });
  }
  
  return result;
};

// Get today's usage
export const getTodayUsage = async (): Promise<number> => {
  const today = getTodayDate();
  const weeklyData = await getWeeklyUsage();
  const storedMinutes = weeklyData[today] || 0;
  
  // Add current session time if active
  let currentSessionMinutes = 0;
  if (sessionStartTime !== null) {
    const currentSessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    currentSessionMinutes = Math.max(0, currentSessionDuration);
  }
  
  return storedMinutes + currentSessionMinutes;
};

// Get weekly average
export const getWeeklyAverage = async (): Promise<number> => {
  const last7Days = await getLast7DaysUsage();
  const total = last7Days.reduce((sum, day) => sum + day.minutes, 0);
  return Math.round(total / 7);
};

// Daily limit functions
export const setDailyLimit = async (hours: number | null) => {
  try {
    if (hours === null) {
      await AsyncStorage.removeItem(DAILY_LIMIT_KEY);
    } else {
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, hours.toString());
    }
  } catch (error) {
    console.error('Error setting daily limit:', error);
  }
};

export const getDailyLimit = async (): Promise<number | null> => {
  try {
    const limit = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
    return limit ? parseInt(limit) : null;
  } catch (error) {
    console.error('Error getting daily limit:', error);
    return null;
  }
};

// Check if daily limit is exceeded
export const isDailyLimitExceeded = async (): Promise<boolean> => {
  const limit = await getDailyLimit();
  if (!limit) return false;
  
  const todayMinutes = await getTodayUsage();
  return todayMinutes >= limit * 60;
};

// Sleep mode functions
export const setSleepMode = async (config: SleepModeConfig) => {
  try {
    await AsyncStorage.setItem(SLEEP_MODE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error setting sleep mode:', error);
  }
};

export const getSleepMode = async (): Promise<SleepModeConfig | null> => {
  try {
    const data = await AsyncStorage.getItem(SLEEP_MODE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting sleep mode:', error);
    return null;
  }
};

// Force save current session (call before app closes or when viewing time management)
export const forceUpdateSession = async () => {
  // Just ensure session is started if not already
  if (sessionStartTime === null) {
    sessionStartTime = Date.now();
    currentDate = getTodayDate();
  }
};
