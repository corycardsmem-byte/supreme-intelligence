export type AuthorityLevel = "user" | "team" | "enterprise" | "system";

export interface AuthorityBoundary {
  actor: string;
  authorityLevel: AuthorityLevel;
  operation: string;
  approved: boolean;
}

export function evaluateAuthorityBoundary(boundary: AuthorityBoundary): boolean {
  if (!boundary.actor || !boundary.operation) return false;
  if (!boundary.approved) return false;
  return boundary.authorityLevel !== "system" || boundary.approved;
}
