export type Impact =
  | "read_only"
  | "reversible"
  | "consequential"
  | "value_bearing";

export type PolicyDecision = "allow" | "review" | "deny";
export type TwinStatus =
  | "draft"
  | "approval_required"
  | "denied"
  | "completed";

export interface TwinRequest {
  protocolVersion: "1.0";
  requestId: string;
  subjectId: string;
  operation: "plan" | "draft" | "query" | "propose";
  input: string;
  contextRefs: string[];
  requestedTools: string[];
  impact: Impact;
  consentToken?: string;
}

export interface TwinPlan {
  requestId: string;
  status: TwinStatus;
  steps: Array<{ id: string; description: string; tool?: string }>;
  confidence: number;
  uncertainties: string[];
  policyDecision: PolicyDecision;
  proposalRef?: string;
  auditRef: string;
}

/**
 * A deliberately fail-closed policy boundary.
 * This scaffold never signs, broadcasts, or handles private keys.
 */
export function evaluateTwinRequest(request: TwinRequest): PolicyDecision {
  if (!request.requestId || !request.subjectId || !request.input) return "deny";
  if (request.impact === "value_bearing") return "review";
  if (request.requestedTools.some((tool) => !ALLOWED_TOOLS.has(tool))) return "deny";
  if (request.operation === "propose" && !request.consentToken) return "review";
  return "allow";
}

const ALLOWED_TOOLS = new Set(["read_context", "draft_text", "query_provenance"]);
