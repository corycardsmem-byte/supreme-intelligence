# Advanced Twin Agent

The Advanced Twin Agent is a bounded digital-twin layer for Supreme Intelligence. It models user-approved preferences, context, working style, and decision patterns so it can plan and explain work without becoming an unrestricted autonomous authority.

## Boundary

The twin may:

- understand and retrieve approved context
- model preferences and decision patterns
- plan and simulate actions
- draft outputs and tool requests
- report confidence and uncertainty
- request approval for consequential operations

The twin may not:

- access private keys
- sign transactions
- bypass policy
- silently change durable identity or preference data
- execute value-bearing operations without the vault's authorization

## Runtime flow

```text
Input
  -> identity and consent check
  -> memory retrieval
  -> reasoning and planning
  -> risk and confidence evaluation
  -> policy gateway
  -> proposal or response
  -> optional human approval
  -> Sovereign Safe vault
  -> audit and provenance record
```

## Components

- **Twin profile:** approved preferences, goals, boundaries, and operating style
- **Memory service:** scoped, inspectable, deletable context with provenance
- **Planner:** produces typed plans and tool proposals
- **Policy gateway:** rejects unsafe, unauthorized, or ambiguous actions
- **Approval broker:** obtains explicit approval for consequential actions
- **Vault adapter:** sends approved proposals to Sovereign Safe; never handles keys
- **Audit writer:** records inputs, decisions, approvals, and outcomes

## Consent and data controls

Twin data must be:

- explicitly opted in
- scoped by purpose
- visible to the user
- exportable and deletable
- versioned when changed
- separated from credentials and signing material

## Status

This is the initial architecture and contract scaffold. It is not a claim of production autonomy or production security. Real-value execution remains disabled until the policy gateway, approval flow, vault adapter, and independent security review are complete.
