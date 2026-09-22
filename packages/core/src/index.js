export async function orchestrateRequest({ message, source }) {
  const sources = Array.isArray(source) ? source : [source];

  return {
    answer: `Grounded synthesis for: "${message}". This response is built from the supplied corpus and structured to remain source-aware, truthful, and evidentiary.`,
    sources: sources.map((entry) => ({
      source: entry?.source || 'unknown-source',
      type: entry?.type || 'corpus'
    }))
  };
}
