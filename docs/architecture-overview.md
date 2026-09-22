# Architecture Overview

## High-level runtime flow

```text
User request
  -> workspace / app layer
  -> policy context
  -> retrieval + memory
  -> model reasoning
  -> truth-gate evaluation
  -> scorecard governance
  -> output assembly
  -> evidence ledger entry
  -> response to user
```

## System components

### Application layer
- workspace UI
- chat / prompts
- user profile
- billing and account management

### Intelligence layer
- model adapters
- planning and reasoning
- synthesis and summarization

### Retrieval layer
- corpus ingestion
- vector indexing
- source grounding
- citation generation

### Governance layer
- truth gate
- scorecard engine
- policy checks
- review and approval

### Execution layer
- tool adapters
- API integrations
- restricted actions
- approval gates

### Evidence layer
- ledger entries
- provenance records
- operational audit trail

## Design principle

The system is not “AI with restrictions bolted on.” It is a frontier product whose governance layer is a native part of the architecture.
