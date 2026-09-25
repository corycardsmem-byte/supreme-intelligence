import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecution, defineIntent, compileIntent, CRA_ATTRIBUTION } from '../src/index.js';

test('declarative intent compiles to adaptive execution plan', () => {
  const intent = defineIntent({ objective: 'Investigate claim', requiredEvidence: ['citation'], causalBoundary: 'Ø', verificationRequirements: ['cra'] });
  const plan = compileIntent(intent);
  assert.equal(plan.specification, 'cra-symbolic-1.0');
  assert.ok(plan.agentRoles.includes('retriever'));
  assert.ok(plan.agentRoles.includes('formal-verifier'));
  assert.equal(plan.maturity, 'PROPOSED');
});

test('execution remains proposal until evidence and verification are supplied', () => {
  const execution = buildExecution({ objective: 'Test a hypothesis' });
  assert.equal(execution.status, 'PROPOSED');
  assert.equal(CRA_ATTRIBUTION.owner, 'Cory Miller');
  assert.throws(() => defineIntent({ objective: '' }));
});
