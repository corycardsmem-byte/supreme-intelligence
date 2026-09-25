import { CRA_SPEC, canonicalHash } from '@supreme-intelligence/epistemic-mesh';

export const CRA_ATTRIBUTION = Object.freeze({
  brand: 'Containment Reflexion Audit',
  abbreviation: 'CRA',
  trademark: 'Containment Reflexion Audit™',
  owner: 'Cory Miller',
  role: 'Founder and Architect',
  canonical_specification: CRA_SPEC.version,
  architectural_role: 'formal epistemic and causal verification authority'
});

export const MATURITY = Object.freeze(['PROPOSED','IMPLEMENTED','INTEGRATED','TESTED','VERIFIED','PRODUCTION_READY']);
export const INTENT_FIELDS = Object.freeze(['objective','constraints','requiredEvidence','provenanceRequirements','causalBoundary','allowableTransformations','verificationRequirements','toolRequirements','stoppingConditions','uncertaintyPolicy','resourceConstraints','optimizationObjectives']);

const freeze = (value) => { if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value; Object.freeze(value); Object.values(value).forEach(freeze); return value; };
const list = (value) => Array.isArray(value) ? value.map(String).sort() : [];

export function defineIntent(input = {}) {
  if (typeof input.objective !== 'string' || !input.objective.trim()) throw new TypeError('Intent objective is required.');
  const intent = {
    schema: 'cra-declarative-intent-1',
    specification: CRA_SPEC.version,
    objective: input.objective.trim(),
    constraints: input.constraints ?? {},
    requiredEvidence: list(input.requiredEvidence),
    provenanceRequirements: input.provenanceRequirements ?? {},
    causalBoundary: input.causalBoundary ?? 'Ø',
    allowableTransformations: list(input.allowableTransformations),
    verificationRequirements: list(input.verificationRequirements),
    toolRequirements: list(input.toolRequirements),
    stoppingConditions: input.stoppingConditions ?? {},
    uncertaintyPolicy: input.uncertaintyPolicy ?? 'preserve-unknown',
    resourceConstraints: input.resourceConstraints ?? {},
    optimizationObjectives: list(input.optimizationObjectives)
  };
  return freeze({ ...intent, contentHash: canonicalHash(intent) });
}

export function routeIntent(intent) {
  const routes = new Set(['researcher','provenance','verifier','auditor']);
  if (intent.requiredEvidence.length) routes.add('retriever');
  if (intent.causalBoundary !== 'Ø') routes.add('causal-analyst');
  if (intent.verificationRequirements.length) routes.add('formal-verifier');
  if (intent.constraints.code || intent.toolRequirements.includes('code-execution')) routes.add('programmer');
  if (intent.optimizationObjectives.length) routes.add('evaluator');
  return [...routes].sort();
}

export function compileIntent(intent) {
  const normalized = defineIntent(intent);
  const plan = {
    schema: 'cra-execution-plan-1',
    specification: CRA_SPEC.version,
    intentHash: normalized.contentHash,
    objective: normalized.objective,
    agentRoles: routeIntent(normalized),
    stages: [
      { name: 'collect', requires: normalized.requiredEvidence },
      { name: 'provenance', requires: Object.keys(normalized.provenanceRequirements) },
      { name: 'analyze', transformations: normalized.allowableTransformations },
      { name: 'verify', requirements: normalized.verificationRequirements },
      { name: 'audit', policy: normalized.uncertaintyPolicy }
    ],
    stoppingConditions: normalized.stoppingConditions,
    resourceConstraints: normalized.resourceConstraints,
    optimizationObjectives: normalized.optimizationObjectives,
    maturity: 'PROPOSED'
  };
  return freeze({ ...plan, contentHash: canonicalHash(plan) });
}

export function executionResult(plan, output = {}) {
  const result = {
    schema: 'cra-execution-result-1',
    planHash: plan.contentHash,
    output,
    verification: output.verification ?? { result: 'UNKNOWN', reason: 'No verification artifact supplied.' },
    provenance: output.provenance ?? [],
    maturity: output.maturity ?? 'PROPOSED'
  };
  return freeze({ ...result, contentHash: canonicalHash(result) });
}

export function capabilityRecord({ capability, implementation, sourceRepository = 'supreme-intelligence', sourceCommit = null, maturity = 'PROPOSED', tests = [], integrationStatus = 'unintegrated' }) {
  if (!MATURITY.includes(maturity)) throw new TypeError(`Invalid maturity: ${maturity}`);
  return freeze({ schema: 'cra-capability-record-1', capability, implementation, sourceRepository, sourceCommit, maturity, tests: list(tests), integrationStatus, contentHash: canonicalHash({ capability, implementation, sourceRepository, sourceCommit, maturity, tests: list(tests), integrationStatus }) });
}
