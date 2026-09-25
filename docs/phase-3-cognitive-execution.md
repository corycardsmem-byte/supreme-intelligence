# Phase 3: Declarative Cognitive Execution

## Objective

Turn structured intent into an adaptive, typed, auditable cognitive workflow that executes natively on the CRA mesh. Phase 3 is not prompt-chain assembly; it is compilation of cognitive work into verifiable state transitions.

## Compiler pipeline

```text
Intent
→ normalize and validate
→ compile immutable execution plan
→ select typed agent roles
→ execute bounded stages
→ collect observations and provenance
→ produce hypotheses and candidate transitions
→ verify with CRA rule engine / SMT solver
→ commit proof and state artifacts
→ propagate revisions to affected descendants
```

## Core contracts

### Intent

An intent declares objective, constraints, evidence requirements, provenance requirements, causal boundary, allowable transformations, tool requirements, stopping conditions, uncertainty policy, resource limits, and optimization objectives.

### Plan

A plan is content-addressed and immutable. It contains the normalized intent hash, agent roles, stages, resource constraints, stopping conditions, and verification obligations. Compilation may optimize routing, but it cannot alter CRA semantics.

### Agent node

Agents are typed workers with explicit input and output contracts. Every output is classified as an observation, source, tool result, hypothesis, assertion, evaluation, or proof-related artifact. Model output alone is never authoritative.

### Verification gate

Candidate transitions enter the verification gate with their input hash, applicable boundary, dependencies, and evidence lineage. Results are `SAT`, `UNSAT`, or `UNKNOWN`. Only verified artifacts may authorize an epistemic state commit.

## Agent graph

Initial roles:

- `researcher`: decomposes objectives and identifies evidence needs
- `retriever`: acquires candidate sources
- `provenance`: records source identity and lineage
- `analyst`: constructs bounded interpretations
- `causal-analyst`: checks intervention and boundary compatibility
- `formal-verifier`: submits transitions to CRA verification
- `contradiction-analyst`: identifies incompatible evidence or states
- `auditor`: checks anti-upgrade and completeness obligations
- `evaluator`: measures reliability and execution quality
- `synthesizer`: produces source-aware output without promoting `UNKNOWN`

Edges are explicit: `DEPENDS_ON`, `GENERATES`, `OUTPUT_OF`, `SUPPORTS`, `CONTRADICTS`, `TRIGGERS`, `VERIFIED_BY`, and `SUPERSEDES`.

## Reactive propagation

A changed upstream node invalidates neither history nor unrelated branches. The runtime traverses the dependency frontier, marks affected descendants stale, re-runs required stages, and creates successor states. The prior graph remains recoverable.

## Phase 3 implementation sequence

1. Stabilize node and edge schemas.
2. Add execution-plan, agent-assertion, observation, source, tool-result, and evaluation schemas.
3. Implement a deterministic compiler and role router.
4. Add a real verification adapter around `verifyTransition` and the SMT solver.
5. Implement bounded agent execution with provenance-preserving artifacts.
6. Add descendant frontier calculation and re-evaluation events.
7. Add persistent content-addressed storage and replay.
8. Add conformance, property, adversarial, and regression tests.

## Non-goals

Phase 3 does not authorize autonomous epistemic promotion, erase uncertainty, mutate prior states, or allow optimization to redefine CRA state semantics.
