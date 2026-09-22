export interface EvidenceRecord {
  id: string;
  source: string;
  retrievedAt: string;
  contentHash?: string;
  classification: string;
  confidence: number;
  claimId?: string;
}

export function createEvidenceLedgerEntry(record: EvidenceRecord): Record<string, unknown> {
  return {
    id: record.id,
    source: record.source,
    retrievedAt: record.retrievedAt,
    contentHash: record.contentHash ?? null,
    classification: record.classification,
    confidence: record.confidence,
    claimId: record.claimId ?? null,
    status: "recorded",
  };
}
