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
  bio: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  website: string | null;
  followers_count: number;
  following_count: number;
  public_generations_count: number;
  is_verified: boolean;
  is_private_account: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
