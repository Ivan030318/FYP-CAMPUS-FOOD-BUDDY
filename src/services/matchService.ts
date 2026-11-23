import type { PublicUserProfile, UserProfile } from '../types';

export interface MatchCandidate {
  profile: PublicUserProfile;
  /** Explainable 0–100 compatibility score. */
  score: number;
  sharedFoodPreferences: string[];
  sharedMealTimes: string[];
  sameDiningLocation: boolean;
}

/**
 * Explainable rule-based matching. Meal time is weighted most heavily because it is the
 * hardest constraint for arranging a shared meal; food preference and location follow.
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

  const mealTimeScore = current.available_meal_times.length
    ? (sharedMealTimes.length / current.available_meal_times.length) * 50
    : 0;
  const foodPreferenceScore = current.food_preferences.length
    ? (sharedFoodPreferences.length / current.food_preferences.length) * 30
    : 0;
  const locationScore = sameDiningLocation ? 20 : 0;
  const score = Math.round(Math.min(100, mealTimeScore + foodPreferenceScore + locationScore));

  return { profile: candidate, score, sharedFoodPreferences, sharedMealTimes, sameDiningLocation };
}

export function buildMatchList(
  current: UserProfile,
  others: PublicUserProfile[],
  excludedUserIds: string[] = []
): MatchCandidate[] {
  return others
    .filter(
      (user) =>
        user.user_id !== current.user_id &&
        !current.blocked_users.includes(user.user_id) &&
        !excludedUserIds.includes(user.user_id)
    )
    .map((u) => scoreMatch(current, u))
    .filter((candidate) => candidate.score >= 25)
    .sort((a, b) => b.score - a.score);
}
