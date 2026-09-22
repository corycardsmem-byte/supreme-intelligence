export type EvidenceClassification =
  | "fact"
  | "inference"
  | "hypothesis"
  | "user_principle"
  | "uncertain";

export type PolicyDecision = "allow" | "review" | "reject";

export interface SourceEvidence {
  id: string;
  source: string;
  retrievedAt: string;
  contentHash?: string;
  classification: EvidenceClassification;
  confidence: number;
  attribution?: string;
}

export interface TruthAssessment {
  claimId: string;
  evidence: SourceEvidence[];
  classification: EvidenceClassification;
  confidence: number;
  decision: PolicyDecision;
  notes: string[];
}

export function evaluateTruth(claimId: string, evidence: SourceEvidence[]): TruthAssessment {
  const aggregatedConfidence = evidence.length
    ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
    : 0;

  const decision: PolicyDecision =
    evidence.length === 0
      ? "review"
      : aggregatedConfidence >= 0.8
        ? "allow"
        : "review";

  return {
    claimId,
    evidence,
    classification: evidence.some((e) => e.classification === "fact") ? "fact" : "inference",
    confidence: aggregatedConfidence,
    decision,
    notes: [
      "Evidence-based claim evaluation",
      "Source provenance required to support operational claims",
      "Uncertainty must be surfaced when confidence is low",
    ],
  };
}
