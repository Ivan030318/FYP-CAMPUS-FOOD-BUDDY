import type { PublicUserProfile, UserProfile } from '../types';

export interface MatchCandidate {
  profile: PublicUserProfile;
  score: number;
  sharedFoodPreferences: string[];
  sharedMealTimes: string[];
  sameDiningLocation: boolean;
}

/**
 * Simple rule-based matching (per FYP1 design: meal time, food preference, dining
 * location are the three matching factors). Weighted so shared meal time counts most,
 * since that is the hardest constraint to satisfy for an actual shared meal.
 */
export function scoreMatch(current: UserProfile, candidate: PublicUserProfile): MatchCandidate {
  const sharedFoodPreferences = candidate.food_preferences.filter((p) =>
    current.food_preferences.includes(p)
  );
  const sharedMealTimes = candidate.available_meal_times.filter((t) =>
    current.available_meal_times.includes(t)
  );
  const sameDiningLocation =
    !!current.dining_location &&
    current.dining_location.trim().toLowerCase() === candidate.dining_location.trim().toLowerCase();

  const score =
    sharedMealTimes.length * 3 + sharedFoodPreferences.length * 2 + (sameDiningLocation ? 2 : 0);

  return { profile: candidate, score, sharedFoodPreferences, sharedMealTimes, sameDiningLocation };
}

export function buildMatchList(current: UserProfile, others: PublicUserProfile[]): MatchCandidate[] {
  return others
    .filter((u) => !current.blocked_users.includes(u.user_id))
    .map((u) => scoreMatch(current, u))
    .sort((a, b) => b.score - a.score);
}
