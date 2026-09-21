# Twin Agent Security Model

## Threats

- prompt injection causing unauthorized tool use
- poisoned or stale memories
- impersonation of the user
- overconfident recommendations
- hidden changes to the twin profile
- replayed approval requests
- tool output treated as trusted instruction
- accidental disclosure of private context

## Controls

### Identity

Bind every request to an authenticated subject and workspace. Consent must be scoped to the operation, resource, and expiration time.

### Memory

Treat retrieved memory as untrusted context, not as executable instruction. Store source, timestamp, confidence, sensitivity, and retention policy for each memory item.

### Planning

Plans must be typed, bounded, and inspectable. Tool calls require an allowlist, argument validation, timeout, and result isolation.

### Policy

Evaluate the requested operation independently from the model's explanation. Default to review or denial when impact, identity, recipient, or intent is ambiguous.

### Approval

Use fresh, non-replayable approval records. Display the exact consequential operation to the approver, including asset, network, amount, recipient, and expiry.

### Vault boundary

The twin has no private-key access and no signing capability. The only supported path for value-bearing execution is a policy-approved proposal sent to the Sovereign Safe vault.

### Audit

Record request ID, subject, model/provider metadata, memory references, tool calls, policy result, approval event, proposal reference, and final outcome. Redact secrets and minimize personal data.

## Launch gates

Do not enable real-value operations until all of the following exist:

- threat-model review
- adversarial prompt-injection tests
- memory poisoning tests
- approval replay protection
- authorization tests
- vault adapter tests
- audit verification
- independent security review
