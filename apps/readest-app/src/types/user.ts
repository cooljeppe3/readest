/**
 * @description Represents the storage quota for different user plans.
 * Each plan (free, plus, pro) has a corresponding storage limit (in bytes).
 */
export type UserStorageQuota = {
  free: number; // Storage quota for free users (in bytes).
  plus: number; // Storage quota for "plus" plan users (in bytes).
  pro: number; // Storage quota for "pro" plan users (in bytes).
};

/**
 * @description Defines the available user plans, derived from the keys of UserStorageQuota.
 * Each plan represents a specific subscription level with its own storage quota.
 */
export type UserPlan = keyof UserStorageQuota;

/**
 * @description Represents the storage usage data for a user, including name, tooltip,
 * used storage, total storage, and the unit of measurement.
 */
export type QuotaType = {
  name: string; // The name or label of the quota.
  tooltip: string; // A tooltip message providing additional details about the quota.
  used: number; // The amount of storage currently used by the user.
  total: number; // The total storage available to the user based on their plan.
  unit: string; // The unit of measurement for the storage (e.g., "GB", "MB").
};
