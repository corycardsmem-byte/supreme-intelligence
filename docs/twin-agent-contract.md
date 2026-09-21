# Twin Agent Contract

## Request

```json
{
  "protocol_version": "1.0",
  "request_id": "uuid",
  "subject_id": "user-or-workspace-id",
  "operation": "plan|draft|query|propose",
  "input": "user-provided request",
  "context_refs": ["memory-ref"],
  "requested_tools": [],
  "impact": "read_only|reversible|consequential|value_bearing",
  "consent_token": "explicit-consent-reference"
}
```

## Plan result

```json
{
  "request_id": "uuid",
  "status": "draft|approval_required|denied|completed",
  "plan": [],
  "confidence": 0.0,
  "uncertainties": [],
  "policy_decision": "allow|review|deny",
  "proposal_ref": null,
  "audit_ref": "audit-record-ref"
}
```

## Non-negotiable rules

1. A twin response is not an authorization.
2. A plan is not an execution.
3. A model output is not a policy decision.
4. Value-bearing operations require a vault proposal and explicit approval policy.
5. Private keys and signing secrets never enter the twin runtime.
6. Durable memory changes require user-visible consent and provenance.
7. Denied actions must be recorded with a reason without exposing sensitive data.
8. Every request and tool call receives a correlation ID.

## Approval state machine

```text
received
  -> evaluated
  -> draft
  -> approval_required
  -> approved | denied | expired
  -> submitted_to_vault
  -> executed | failed
```

A twin can transition a request through `received`, `evaluated`, and `draft`. It can request `approval_required`. Only the policy-controlled vault may authorize `submitted_to_vault` and execution.
