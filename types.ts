
export interface Interest {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface Lesson {
  id: string;
  date: string;
  title: string;
  category: string;
  categoryRef: string; // The ID of the primary interest this lesson belongs to
  content: string;
  practicalApplication: string;
  connectionToPrevious: string;
  sourceMaterial?: string;
  pointsEarned?: number;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

export interface UserProfile {
  interests: string[];
  customInterests: string[];
  history: Lesson[];
  streak: number;
  lastLessonDate?: string;
  totalPoints: number;
  unlockedAchievements: string[];
  categoryProgress: Record<string, number>; // Mapping interest ID to total XP earned in that category
}
