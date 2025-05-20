
import { UserPreferences } from "@/types/smartInsights";

// Store preferences in localStorage
export const saveUserPreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem('xtech_user_preferences', JSON.stringify(preferences));
  } catch (e) {
    console.error("Error storing preferences:", e);
  }
};

// Retrieve preferences from localStorage
export const loadUserPreferences = (): UserPreferences | null => {
  const storedPrefs = localStorage.getItem('xtech_user_preferences');
  if (storedPrefs) {
    try {
      return JSON.parse(storedPrefs) as UserPreferences;
    } catch (e) {
      console.error("Error parsing stored preferences:", e);
      return null;
    }
  }
  return null;
};

// Check if user has interacted recently (within the provided time)
export const hasRecentInteraction = (
  preferences: UserPreferences | null, 
  timeThresholdMs: number = 3600000
): boolean => {
  if (!preferences || !preferences.lastInteractionDate) return false;
  
  const lastInteraction = new Date(preferences.lastInteractionDate);
  const now = new Date();
  
  return now.getTime() - lastInteraction.getTime() < timeThresholdMs;
};
