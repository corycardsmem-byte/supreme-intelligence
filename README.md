# Supreme Intelligence

> **A sovereign, evidence-governed, content-addressed intelligence system.**

A frontier intelligence platform built around source-grounded reasoning, provenance, formal verification, and trustworthy execution. Supreme Intelligence is designed to investigate, reason, propose, and synthesize while preserving uncertainty and historical accountability.

## Governing charter

The system operates under the [Supreme Intelligence Cognitive Charter](docs/COGNITIVE_CHARTER.md) and the versioned Containment Reflexion Audit specification, `cra-symbolic-1.0`.

Containment Reflexion Audit™ (CRA) is a proprietary brand and protocol owned by Cory Miller, founder and architect of Supreme Intelligence. Ownership governs product intent and architectural direction; technical validity is established independently through formal semantics, proof artifacts, tests, deterministic content addresses, and verified execution.

## Architectural laws

- Capability is not truth; agents propose and verification disposes.
- The state space is `A × E × C = 9 × 4 × 4 = 144`.
- `A ↛ E`, `E ↛ C`, and `A ↛ C` are non-entailment constraints.
- `Ø` is external non-applicability, never a fifth causal state.
- `UNKNOWN` is a valid epistemic result.
- History is immutable and content-addressed.
- Contradictions and revisions create new states linked through typed edges.
- Governance, implementation, and evidence status remain separate.

## Architecture

- `apps/web`: user-facing product experience
- `apps/api`: application interface and backend orchestration
- `packages/core`: declarative intent and orchestration logic
- `packages/epistemic-mesh`: CRA symbolic specification and immutable mesh substrate
- `packages/cognitive-runtime`: Phase 3 execution-plan and agent-runtime foundation
- `packages/governance`: truth-gate, scorecard, and policy evaluation
- `packages/provenance`: evidence and ledger services
- `packages/auth`: login, sessions, and permissions
- `packages/billing`: plans and subscription management
- `docs`: product, charter, architecture, and capability documentation
- `infra`: deployment and platform configuration

## Execution model

```text
Intent
→ declarative cognitive program
→ adaptive execution compiler
→ typed agent graph
→ evidence and tool artifacts
→ CRA verification
→ content-addressed mesh commit
→ evaluation and reactive re-evaluation
```

## Phase 3

Phase 3 design is documented in [the compiler and agent graph architecture](docs/phase-3-cognitive-execution.md). Cross-repository capability findings are recorded in [the workspace inventory](docs/cross-repository-capability-inventory.md).

## Development posture

This is a long-horizon AI platform, not a prompt wrapper. The repository must be evaluated by invariant preservation, evidence lineage, formal verification, reproducibility, and recovery from contradiction—not by fluency alone.
