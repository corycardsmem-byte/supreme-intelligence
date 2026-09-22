export function createEvidenceRecord({ answer, sources = [], score = 0 }) {
  const timestamp = new Date().toISOString();

  return {
    recordId: `ev-${Date.now()}`,
    timestamp,
    score,
    answer,
    sources: sources.map((entry) => ({
      source: entry?.source || 'unknown-source',
      type: entry?.type || 'corpus'
    }))
  };
}
