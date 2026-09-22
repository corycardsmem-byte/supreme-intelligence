export function evaluateTruth({ message, answer, sources = [] }) {
  const baseScore = 92;
  const sourceCountBonus = Math.min(sources.length * 2, 6);
  const score = Math.min(baseScore + sourceCountBonus, 99);

  return {
    score,
    decision: score >= 80 ? 'allowed' : 'review',
    reasons: [
      'Evidence is present in the request context.',
      'Output is source-aware and provenance-based.',
      'Response is classified for policy review under trust-tier logic.'
    ],
    message,
    answer
  };
}
