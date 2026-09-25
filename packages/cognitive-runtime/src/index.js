import { defineIntent, compileIntent, executionResult, capabilityRecord, CRA_ATTRIBUTION, MATURITY } from '@supreme-intelligence/core';
import { NODE_TYPES, createNode, canonicalHash } from '@supreme-intelligence/epistemic-mesh';

export { defineIntent, compileIntent, executionResult, capabilityRecord, CRA_ATTRIBUTION, MATURITY };

export function planNode(intent) {
  const plan = compileIntent(intent);
  return createNode(NODE_TYPES.EXECUTION_PLAN, { ...plan, contentHash: canonicalHash(plan) });
}

export function resultNode(plan, output) {
  const result = executionResult(plan.payload ?? plan, output);
  return createNode(NODE_TYPES.EXECUTION_RESULT, result, [plan.id ?? plan.contentHash]);
}

export function buildExecution(intent) {
  const plan = compileIntent(intent);
  return { intent: defineIntent(intent), plan, roles: plan.agentRoles, status: 'PROPOSED' };
}
