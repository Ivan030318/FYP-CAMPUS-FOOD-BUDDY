export type RequestStatus = 'pending' | 'accepted' | 'rejected';
export type ReportStatus = 'pending' | 'resolved';

export const MEAL_TIMES = [
  'Breakfast',
  'Lunch',
  'Tea Break / Afternoon Snack',
  'Dinner',
] as const;
export type MealTime = (typeof MEAL_TIMES)[number];

export const FOOD_PREFERENCES = [
  'No Specific Preference',
  'Halal Food',
  'Vegetarian Food',
  'Seafood',
  'Western Food',
  'Asian Food',
] as const;
export type FoodPreference = (typeof FOOD_PREFERENCES)[number];

export interface UserProfile {
  user_id: string;
  display_name: string;
  university_email: string;
  profile_photo_url: string | null;
  food_preferences: string[];
  available_meal_times: string[];
  dining_location: string;
  blocked_users: string[];
  created_at: number;
}

export interface FoodBuddyRequest {
  request_id: string;
  requester_id: string;
  recipient_id: string;
  status: RequestStatus;
  created_at: number;
}

export interface Chat {
  chat_id: string;
  request_id: string;
  user_ids: string[];
  last_message_preview: string;
  last_message_time: number;
}

export interface Message {
  message_id: string;
  chat_id: string;
  sender_id: string;
  text_content: string;
  sent_at: number;
}

export interface Report {
  report_id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  status: ReportStatus;
  submitted_at: number;
}
