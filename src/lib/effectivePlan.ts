type OverrideLike = {
  is_active?: boolean | null;
  ends_at?: string | null;
  override_plan_slug?: string | null;
};

export function hasActivePlanOverride(override?: OverrideLike | null) {
  if (!override?.is_active || !override.override_plan_slug) return false;
  if (!override.ends_at) return true;
  return new Date(override.ends_at) > new Date();
}

export function getEffectivePlanId(basePlanId: string, override?: OverrideLike | null) {
  return hasActivePlanOverride(override) ? override?.override_plan_slug ?? basePlanId : basePlanId;
}