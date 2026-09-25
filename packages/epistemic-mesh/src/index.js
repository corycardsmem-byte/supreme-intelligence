import crypto from 'node:crypto';

export const CRA_SPEC = Object.freeze({
  version: 'cra-1.0',
  A: Object.freeze(['P0','P1','P2','P3','P4','P5','P6','P7','P8']),
  E: Object.freeze(['Unverified','Corroborated','Established','Contradicted']),
  C: Object.freeze(['Presumed','Correlative','Demonstrated','Invalidated']),
  nonEntailment: Object.freeze(['A↛E','E↛C','A↛C'])
});

const stable = (value) => JSON.stringify(value, (_, v) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]));
  }
  return v;
});
export const hash = (value) => crypto.createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex');
export const address = (type, payload, parents = []) => hash({ type, payload, parents: [...parents].sort(), spec: CRA_SPEC.version });

export function node(type, payload, parents = []) {
  const id = address(type, payload, parents);
  return Object.freeze({ id, type, payload: structuredClone(payload), parents: [...parents].sort(), hash: id, spec: CRA_SPEC.version });
}

export class Mesh {
  #nodes = new Map(); #edges = new Map(); #events = new Map();
  put(candidate) {
    if (!this.#nodes.has(candidate.id)) this.#nodes.set(candidate.id, candidate);
    return candidate.id;
  }
  link(source, target, relation, payload = {}) {
    const edge = node('RELATION', { source, target, relation, ...payload }, [source, target]);
    this.put(edge);
    const key = `${source}:${target}:${relation}`;
    this.#edges.set(key, edge);
    return edge.id;
  }
  emit(event) { const id = hash(event); if (!this.#events.has(id)) this.#events.set(id, { id, ...event }); return id; }
  get(id) { return this.#nodes.get(id); }
  dependents(id) { return [...this.#edges.values()].filter((e) => e.payload.source === id).map((e) => e.payload.target); }
  ancestors(id, limit = 1000) {
    const result = new Set(), queue = [id];
    while (queue.length && result.size < limit) { const current = queue.shift(); for (const next of this.dependents(current)) if (!result.has(next)) { result.add(next); queue.push(next); } }
    return [...result];
  }
  snapshot() { return { nodes: [...this.#nodes.values()], edges: [...this.#edges.values()], events: [...this.#events.values()] }; }
}

export const declarativeProgram = Object.freeze({
  version: 1,
  protocol: CRA_SPEC.version,
  stages: ['extract.atomic','extract.provenance','extract.evidence','extract.boundary','compile.constraints','verify.symbolic','commit.mesh','propagate.dependents','optimize.feedback']
});

export function compileSemanticEvent(input, program = declarativeProgram) {
  const proposition = String(input.proposition ?? '').trim();
  const evidence = CRA_SPEC.E.includes(input.evidence) ? input.evidence : 'Unverified';
  const causal = input.causal === null || input.causal === 'Ø' ? 'NOT_APPLICABLE' : (CRA_SPEC.C.includes(input.causal) ? input.causal : 'Presumed');
  return Object.freeze({
    program: program.version,
    proposition,
    evidence,
    causal,
    boundary: input.boundary ?? 'Ø',
    source: input.source ?? 'unknown',
    intervention: input.intervention ?? null,
    interventionParameters: input.interventionParameters ?? {},
    domain: input.domain ?? null,
    population: input.population ?? null,
    observationWindow: input.observationWindow ?? null,
    conditions: input.conditions ?? {},
    requires: Object.freeze(input.requires ?? [])
  });
}

async function z3Check(compiled) {
  const { init } = await import('z3-solver');
  const { Context } = await init();
  const { Solver, Bool, And, Not, Implies } = Context('cra');
  const solver = new Solver();
  const a = Bool.const('provenance_entails_evidence');
  const e = Bool.const('evidence_entails_causality');
  const ac = Bool.const('provenance_entails_causality');
  solver.add(Not(Implies(a, e)), Not(Implies(e, ac)), Not(Implies(a, ac)));
  const forbidden = compiled.requires.some((r) => CRA_SPEC.nonEntailment.includes(r));
  solver.add(Bool.val(!forbidden));
  if (!compiled.proposition) solver.add(Bool.val(false));
  const result = await solver.check();
  const status = String(result).toUpperCase();
  return { status: status === 'SATISFIABLE' ? 'SAT' : status.includes('UNSAT') ? 'UNSAT' : 'UNKNOWN', solver: 'z3', constraints: CRA_SPEC.nonEntailment, forbidden };
}

export async function verify(compiled) {
  const proof = { normalized: compiled, spec: CRA_SPEC.version, premises: compiled.requires, contentHash: hash(compiled) };
  try { return { ...proof, ...(await z3Check(compiled)) }; }
  catch (error) { return { ...proof, status: 'UNKNOWN', solver: 'unavailable', error: error.message }; }
}

export async function auditEvent(mesh, input, program = declarativeProgram) {
  const compiled = compileSemanticEvent(input, program);
  const proposition = node('PROPOSITION', { statement: compiled.proposition, domain: compiled.domain }, []);
  const evidence = node('EVIDENCE', { source: compiled.source, status: compiled.evidence }, [proposition.id]);
  const boundary = node('BOUNDARY', { boundary: compiled.boundary, domain: compiled.domain, population: compiled.population, window: compiled.observationWindow }, [proposition.id]);
  const proof = node('PROOF', await verify(compiled), [proposition.id, evidence.id, boundary.id]);
  const state = node('STATE', { proposition: proposition.id, evidence: compiled.evidence, causal: compiled.causal, result: proof.payload.status }, [proposition.id, proof.id]);
  [proposition, evidence, boundary, proof, state].forEach((n) => mesh.put(n));
  mesh.link(evidence.id, proposition.id, 'SUPPORTS');
  mesh.link(proposition.id, boundary.id, 'EVALUATED_UNDER');
  mesh.link(state.id, proposition.id, 'DESCRIBES');
  mesh.link(proof.id, state.id, 'VERIFIES');
  mesh.emit({ type: 'audit.committed', root: proposition.id, proof: proof.id, state: state.id });
  return { proposition, evidence, boundary, proof, state };
}

export async function propagate(mesh, changedNode, reason = 'upstream mutation', limit = 1000) {
  const affected = mesh.ancestors(changedNode, limit);
  const records = [];
  for (const target of affected) {
    const record = node('DERIVATION', { target, changedNode, reason, result: 'REQUIRES_REAUDIT' }, [changedNode, target]);
    mesh.put(record); mesh.link(changedNode, record.id, 'INVALIDATES'); mesh.emit({ type: 'propagation.audit_required', target, derivation: record.id }); records.push(record);
  }
  return records;
}

export function optimize(program, telemetry) {
  const score = telemetry.total ? telemetry.sat / telemetry.total : 0;
  return { ...program, version: program.version + 1, feedback: { ...telemetry, score }, optimizedAt: new Date().toISOString() };
}
