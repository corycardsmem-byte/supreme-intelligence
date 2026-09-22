# Provenance and Evidence Chain

This document defines the evidence architecture for the Supreme Intelligence system.

## Core rule

Every significant claim, action, or recommendation must be linked to its source evidence and associated evaluation result.

## Evidence chain

```text
Source artifact
  -> retrieval event
  -> claim extraction
  -> classification
  -> confidence assessment
  -> output generation
  -> evidence record
  -> auditable ledger entry
```

## Required metadata

Every evidence item must include:

- source URL or canonical path
- retrieval timestamp
- author or source metadata when available
- content hash or checksum
- classification
- confidence or uncertainty rating
- associated claim or output id

## Product value

This supports:

- trustworthiness
- auditable reasoning
- source-grounded AI outputs
- professional-grade documentation
- enterprise reviews and compliance checks

## Enforcement

A claim with missing provenance should be treated as provisional and review-required rather than authoritative.
