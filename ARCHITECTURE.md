# Architecture

## Executive summary

Supreme Intelligence defines the public architecture for a secure AI execution platform. The platform sits between AI systems and value-bearing actions.

The architecture is intentionally simple:

- AI systems may request actions
- policy and identity layers validate those requests
- the vault approves and signs
- the ledger records outcome and provenance
- chain adapters execute approved actions

## System layers

### 1. AI applications and agents
AI clients create requests, reason about context, and produce typed intents.

Examples:
- prepare transfer
- prepare mint
- query balance
- request approval
- inspect provenance

### 2. AI gateway / SDK / API
This layer provides:
- scoped authentication
- typed operations
- request validation
- response envelopes
- version negotiation
- operation metadata

### 3. Identity and capability layer
This layer governs:
- client identity
- allowed operations
- capability scopes
- approval model
- risk classification
- user permissions

### 4. Policy engine
The policy engine decides whether a requested action is permitted.

It may evaluate:
- who requested the action
- what asset is involved
- what chain or network is targeted
- whether approval is required
- whether the action exceeds threshold limits
- whether there is replay risk
- whether the action matches user or organizational policy

### 5. Sovereign Safe vault
The vault is the security boundary.

It is responsible for:
- authorization
- signing
- transaction proposal handling
- recovery and key operations
- execution boundaries
- audit logging

The vault is the only component with direct execution authority.

### 6. Chain adapters
Chain adapters route the approved action to the correct network layer.

Examples:
- EVM
- Bitcoin
- Solana
- CRA
- custom network modules

### 7. Provenance and ledger
Every event should be stored in a durable, verify-able record:
- request ID
- client ID
- policy result
- approval record
- transaction hash
- network
- asset
- result
- timestamp
- audit hash

## Security model

The architecture is designed around one core rule:

AI does not hold direct signing authority.

The model layer may request, prepare, explain, monitor, and propose, but security authority remains in the vault.

## Threat model

Key risks include:
- unauthorized signing
- replayed requests
- policy bypass
- compromised AI clients
- weak approval boundaries
- insecure chain adapter logic
- lack of auditability

Mitigations:
- scoped identities
- signed requests
- replay protection
- approval policies
- least privilege
- auditable logs
- versioned protocol
- testnet-first validation

## Architectural principle

The platform is a policy-controlled execution system, not a custodial AI.

## Production requirement

Real-value execution requires:
- audited signing paths
- hardened key handling
- separated production and test environments
- external review
- traceable policy decisions
- legal and compliance review

## Summary

Supreme Intelligence defines the public architecture of a secure system that allows AI to operate on value without directly owning authority. The vault remains the secure boundary. The protocol remains auditable. The architecture remains interoperable.
