# System Architecture

## High level

```text
Client (Web App)
  -> API Gateway
  -> Auth + User Service
  -> Workspace Service
  -> Retrieval + Knowledge Service
  -> Model Orchestration Service
  -> Governance Service
  -> Evidence Ledger Service
  -> Billing / Usage Service
```

## Services

### App / Web
- workspace UI
- chat interface
- onboarding and account screens
- settings and billing screens

### API
- REST or GraphQL endpoints for chat, workspace, account, policy, and billing

### Core runtime
- orchestration layer combining retrieval, reasoning, and policy checks
- prompt templates and conversation orchestration
- tool invocation layer locked behind policy checks

### Governance runtime
- truth-gate evaluation
- scorecard engine
- policy checks
- review / approval routing

### Provenance / Evidence
- evidence capture
- source metadata
- ledger export
- audit trail API

### Infra
- Postgres
- Redis
- vector database
- object storage
- message queue if needed
- container orchestration / app server

## Production principles
- every substantive response must be provenance-aware
- action execution requires policy and approval
- audit logs are attached to important operations
- user data and evidence are exportable
