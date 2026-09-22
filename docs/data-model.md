# Data Model

## Core entities

### User
- id
- email
- name
- created_at
- tier
- status

### Workspace
- id
- user_id
- name
- created_at

### Conversation
- id
- workspace_id
- user_id
- created_at
- updated_at

### Message
- id
- conversation_id
- role
- content
- metadata_json
- created_at

### SourceDocument
- id
- source_url
- title
- content_hash
- content_text
- metadata_json
- ingested_at

### EvidenceRecord
- id
- claim_id
- source_id
- confidence
- classification
- retrieved_at
- metadata_json

### ScorecardResult
- id
- claim_id
- dimensions_json
- overall_score
- decision
- created_at

### PolicyDecision
- id
- entity_type
- entity_id
- decision
- reason
- created_at

### BillingAccount
- id
- user_id
- plan
- status
- stripe_customer_id

## Relationship rules
- every claim or output should be linked to evidence
- every decision should be linked to policy and scorecard results
- every user action should be auditable
