export type ScorecardDimension =
  | "evidence_integrity"
  | "source_attribution"
  | "reasoning_quality"
  | "uncertainty_calibration"
  | "policy_alignment"
  | "reproducibility"
  | "operational_reliability";

export interface ScorecardResult {
  dimensions: Record<ScorecardDimension, number>;
  overall: number;
  decision: "pass" | "review" | "fail";
}

export function scoreMillerStandard(dimensions: Record<ScorecardDimension, number>): ScorecardResult {
  const values = Object.values(dimensions);
  const overall = values.reduce((sum, value) => sum + value, 0) / values.length;

  let decision: "pass" | "review" | "fail" = "review";
  if (overall >= 0.85) decision = "pass";
  else if (overall < 0.5) decision = "fail";

  return { dimensions, overall, decision };
}
