export interface UserPreferencesPermissions {
  location?: boolean;
  weather?: boolean;
  music?: boolean;
  calendar?: boolean;
  timeOfDay?: boolean;
  gallery?: boolean;
}

export interface UserPreferencesData {
  subjects?: string[];
  styles?: string[];
  colors?: string[];
  mood?: string;
  complexity?: number;
  permissions?: UserPreferencesPermissions;
  onboardingComplete?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  provider: "local" | "google";
  google_id: string | null;
  preferences: UserPreferencesData | null;
  created_at: string;
  updated_at: string;
}
