import crypto from 'node:crypto';

export const CRA_SPEC = Object.freeze({
  version: 'cra-symbolic-1.0',
  stateSpace: Object.freeze({
    A: Object.freeze(['P0','P1','P2','P3','P4','P5','P6','P7','P8']),
    E: Object.freeze(['Unverified','Corroborated','Established','Contradicted']),
    C: Object.freeze(['Presumed','Correlative','Demonstrated','Invalidated'])
  }),
  nonEntailment: Object.freeze({ A_TO_E: 'A ↛ E', E_TO_C: 'E ↛ C', A_TO_C: 'A ↛ C' }),
  causalNotApplicable: 'Ø'
});

export const CRA_STATE_COUNT = CRA_SPEC.stateSpace.A.length * CRA_SPEC.stateSpace.E.length * CRA_SPEC.stateSpace.C.length;

export function canonicalize(value) {
  return JSON.stringify(value, (_, inner) => {
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return Object.fromEntries(Object.keys(inner).sort().map((key) => [key, inner[key]]));
    }
    return inner;
  });
}

export function canonicalHash(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : canonicalize(value)).digest('hex');
}

const evidenceIndex = Object.freeze({ Unverified: 0, Corroborated: 1, Established: 2, Contradicted: 3 });
const causalIndex = Object.freeze({ Presumed: 0, Correlative: 1, Demonstrated: 2, Invalidated: 3 });

export function normalizeTransition(input = {}) {
  const provenance = CRA_SPEC.stateSpace.A.includes(input.provenance) ? input.provenance : 'P0';
  const evidence = CRA_SPEC.stateSpace.E.includes(input.evidence) ? input.evidence : 'Unverified';
  const causal = CRA_SPEC.stateSpace.C.includes(input.causal) ? input.causal : 'Presumed';
  const boundary = input.boundary == null ? 'Ø' : String(input.boundary);
  return Object.freeze({
    proposition: String(input.proposition ?? '').trim(),
    provenance,
    evidence,
    causal,
    boundary,
    causalApplicable: input.causalApplicable !== false,
    hasIndependentEvidence: input.hasIndependentEvidence === true,
    hasCausalBoundary: input.hasCausalBoundary === true,
    requires: Object.freeze([...(input.requires ?? [])]),
    intervention: input.intervention ?? null,
    domain: input.domain ?? null,
    population: input.population ?? null,
    observationWindow: input.observationWindow ?? null,
    conditions: Object.freeze({ ...(input.conditions ?? {}) })
  });
}

export function buildConstraints(input) {
  const t = normalizeTransition(input);
  const p = CRA_SPEC.stateSpace.A.indexOf(t.provenance);
  const e = evidenceIndex[t.evidence];
  const c = causalIndex[t.causal];
  const rules = [
    { rule: CRA_SPEC.nonEntailment.A_TO_E, valid: !(p >= 7 && e > 0 && !t.hasIndependentEvidence), reason: 'Provenance does not entail evidence.' },
    { rule: CRA_SPEC.nonEntailment.E_TO_C, valid: !(e >= 2 && c > 0 && !t.hasCausalBoundary), reason: 'Evidence does not entail causality.' },
    { rule: CRA_SPEC.nonEntailment.A_TO_C, valid: !(p >= 7 && c > 0 && !t.hasCausalBoundary), reason: 'Provenance does not entail causality.' }
  ];
  if (t.boundary === 'Ø' && t.causalApplicable && c > 0) {
    rules.push({ rule: 'Ø', valid: false, reason: 'Causal non-applicability is external to C and cannot encode a causal state.' });
  }
  for (const required of t.requires) {
    if (Object.values(CRA_SPEC.nonEntailment).includes(required)) rules.push({ rule: required, valid: false, reason: 'The transition explicitly requires a forbidden entailment.' });
  }
  return { transition: t, rules, valid: rules.every((rule) => rule.valid), stateSpaceSize: CRA_STATE_COUNT };
}

export function evaluateCausalTransfer(input = {}) {
  const same = ['intervention','domain','population','observationWindow'].every((key) => input[`${key}From`] != null && input[`${key}From`] === input[`${key}To`]);
  if (same && input.conditionsMatch === true) return { outcome: 'PROVABLE_TRANSFER', reason: 'All causal boundary dimensions and conditions match.' };
  if (input.contradicted === true) return { outcome: 'CONTRADICTED_TRANSFER', reason: 'The supplied premises contradict the requested transfer.' };
  if (!same) return { outcome: 'UNPROVABLE_TRANSFER', reason: 'Intervention, domain, population, or observation window differs.' };
  return { outcome: 'UNKNOWN_TRANSFER', reason: 'The premises do not establish equivalent causal conditions.' };
}

export async function verifyTransition(input = {}) {
  const model = buildConstraints(input);
  const t = model.transition;
  const proof = {
    specification: CRA_SPEC.version,
    stateSpaceSize: CRA_STATE_COUNT,
    normalizedTransition: t,
    constraints: model.rules,
    inputHash: canonicalHash(t)
  };
  try {
    const { init } = await import('z3-solver');
    const { Context } = await init();
    const { Solver, Int, Bool } = Context('cra');
    const solver = new Solver();
    const p = Int.const('provenance');
    const e = Int.const('evidence');
    const c = Int.const('causal');
    solver.add(p.ge(0), p.le(8), e.ge(0), e.le(3), c.ge(0), c.le(3));
    solver.add(p.eq(CRA_SPEC.stateSpace.A.indexOf(t.provenance)));
    solver.add(e.eq(evidenceIndex[t.evidence]));
    solver.add(c.eq(causalIndex[t.causal]));
    solver.add(Bool.val(model.valid && Boolean(t.proposition)));
    const raw = String(solver.check()).toUpperCase();
    const result = raw.includes('UNSAT') ? 'UNSAT' : raw.includes('SAT') ? 'SAT' : 'UNKNOWN';
    return { ...proof, solver: 'z3', result, proofHash: canonicalHash({ ...proof, result }) };
  } catch (error) {
    return { ...proof, solver: 'unavailable', result: 'UNKNOWN', error: error.message, proofHash: canonicalHash(proof) };
  }
}

export const formalModel = Object.freeze({ CRA_SPEC, CRA_STATE_COUNT, canonicalHash, buildConstraints, evaluateCausalTransfer, verifyTransition });
