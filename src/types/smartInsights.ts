
export interface UserPreferences {
  interests: string[];
  lastInteractionDate: Date | null;
}

export interface QuestionData {
  question: string;
  options: string[];
}
