
export interface UserPreferences {
  interests: string[];
  lastInteractionDate: Date | null;
}

export interface QuestionData {
  question: string;
  options: string[];
}

// Added interface for the SmartInsights component props
export interface SmartInsightsProps {
  initialDelay?: number;
}
