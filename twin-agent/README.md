# Twin Agent Implementation Notes

## Initial implementation scope

The first implementation is intentionally bounded:

1. accept a typed request
2. authenticate the subject outside the model
3. retrieve only consented context
4. produce an inspectable plan
5. evaluate the plan with deterministic policy
6. return a draft, review request, or denial
7. write an audit event

## Explicitly out of scope

- autonomous signing
- direct wallet access
- unrestricted shell or browser tools
- silent profile mutation
- unsupervised value-bearing execution
- claiming that a model is the user's legal or personal identity

## Adapter boundary

The future vault adapter should accept only a fully evaluated proposal containing:

- request ID
- authenticated subject
- policy decision
- approval reference
- exact operation details
- expiry
- idempotency key

The adapter must reject requests that do not contain a valid approval reference. It must never accept raw model text as an execution command.

## Testing priorities

- deny missing identity and request IDs
- require review for value-bearing impact
- deny tools outside the allowlist
- reject expired or reused consent tokens
- verify memory deletion and export behavior
- verify every decision creates an audit record
- test prompt injection and tool-output injection
