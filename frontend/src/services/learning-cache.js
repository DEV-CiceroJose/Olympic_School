const CACHE_PREFIX = "olympic-school.learning";

export const LEGACY_LEARNING_CACHE_KEYS = [
  "biodoraia.learning.attempts",
  "biodoraia.learning.mastery",
  "biodoraia.learning.events",
];

export function learningCacheKeys(uid) {
  if (!uid) throw new Error("UID_REQUIRED_FOR_LEARNING_CACHE");
  return {
    attempts: `${CACHE_PREFIX}.${uid}.attempts`,
    mastery: `${CACHE_PREFIX}.${uid}.mastery`,
    events: `${CACHE_PREFIX}.${uid}.events`,
  };
}

export function hasLegacyLearningCache(storage) {
  return LEGACY_LEARNING_CACHE_KEYS.some((key) => storage?.getItem(key) !== null);
}
