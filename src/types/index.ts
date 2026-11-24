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

export interface PublicUserProfile {
  user_id: string;
  display_name: string;
  profile_photo_url: string | null;
  food_preferences: string[];
  available_meal_times: string[];
  dining_location: string;
  created_at: number;
}

export interface PrivateUserData {
  university_email: string;
  blocked_users: string[];
}

/** The signed-in user's combined public + private profile. */
export interface UserProfile extends PublicUserProfile, PrivateUserData {}

export interface FoodBuddyRequest {
  request_id: string;
  /** Lexicographically ordered, immutable IDs used to enforce one request per pair. */
  participant_ids: string[];
  requester_id: string;
  recipient_id: string;
  status: RequestStatus;
  created_at: number;
  /** Set by the recipient when they accept or reject the request. */
  responded_at?: number;
}

export interface Chat {
  chat_id: string;
  request_id: string;
  user_ids: string[];
  last_message_preview: string;
  last_message_time: number;
  /** Empty for the initial match message; set for every user-sent message. */
  last_message_sender_id?: string;
  /** Per-user timestamps used to calculate unread chat activity. */
  last_read_at?: Record<string, number>;
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
  resolved_at?: number;
  resolved_by?: string;
}

export interface AccountSuspension {
  user_id: string;
  reason: string;
  suspended_at: number;
  suspended_by: string;
}
