
import { UserPreferences } from "@/types/smartInsights";

// Store preferences in localStorage
export const saveUserPreferences = (preferences: UserPreferences): void => {
  try {
    // Ensure the date is stored as a string
    const prefsToStore = {
      ...preferences,
      lastInteractionDate: preferences.lastInteractionDate ? preferences.lastInteractionDate.toISOString() : null
    };
    localStorage.setItem('xtech_user_preferences', JSON.stringify(prefsToStore));
    console.log("Preferences saved successfully");
  } catch (e) {
    console.error("Error storing preferences:", e);
  }
};

// Retrieve preferences from localStorage
export const loadUserPreferences = (): UserPreferences | null => {
  try {
    const storedPrefs = localStorage.getItem('xtech_user_preferences');
    if (!storedPrefs) return null;
    
    const parsedPrefs = JSON.parse(storedPrefs);
    
    // Convert the date string back to Date object
    return {
      ...parsedPrefs,
      lastInteractionDate: parsedPrefs.lastInteractionDate ? new Date(parsedPrefs.lastInteractionDate) : null
    };
  } catch (e) {
    console.error("Error parsing stored preferences:", e);
    return null;
  }
};

// Check if user has interacted recently (within the provided time)
export const hasRecentInteraction = (
  preferences: UserPreferences | null, 
  timeThresholdMs: number = 3600000 // Default: 1 hour
): boolean => {
  if (!preferences || !preferences.lastInteractionDate) return false;
  
  const lastInteraction = new Date(preferences.lastInteractionDate);
  const now = new Date();
  
  const timeDiff = now.getTime() - lastInteraction.getTime();
  console.log("Time since last interaction (ms):", timeDiff, "Threshold:", timeThresholdMs);
  
  return timeDiff < timeThresholdMs;
};
