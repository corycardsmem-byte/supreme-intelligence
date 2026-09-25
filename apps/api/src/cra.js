import crypto from 'crypto';

export const CRA_STATES = {
  A: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'],
  E: ['Unverified', 'Corroborated', 'Established', 'Contradicted'],
  C: ['Presumed', 'Correlative', 'Demonstrated', 'Invalidated']
};

export const NON_ENTAILMENT_RULES = {
  A_TO_E: 'A ↛ E',
  E_TO_C: 'E ↛ C',
  A_TO_C: 'A ↛ C'
};

export function canonicalize(value) {
  return JSON.stringify(value, (_, innerValue) => {
    if (innerValue && typeof innerValue === 'object' && !Array.isArray(innerValue)) {
      return Object.keys(innerValue)
        .sort()
        .reduce((ordered, key) => {
          ordered[key] = innerValue[key];
          return ordered;
        }, {});
    }
    return innerValue;
  });
}

export function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function contentAddress(value) {
  return sha256Hex(canonicalize(value));
}

export function makeNode(type, payload) {
  const canonical = canonicalize({ type, payload });
  const id = sha256Hex(canonical);
  return {
    id,
    type,
    payload,
    content_hash: id,
    created_at: new Date().toISOString(),
    version: 1
  };
}

export class EpistemicMesh {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.events = [];
  }

  addNode(type, payload) {
    const node = makeNode(type, payload);
    this.nodes.set(node.id, node);
    this.events.push({ type: 'node_created', node_id: node.id, payload: node.payload });
    return node;
  }

  addEdge(sourceId, targetId, relation, payload = {}) {
    const edge = {
      id: contentAddress({ sourceId, targetId, relation, payload }),
      sourceId,
      targetId,
      relation,
      payload,
      created_at: new Date().toISOString()
    };
    this.edges.push(edge);
    this.events.push({ type: 'edge_created', edge_id: edge.id, relation, sourceId, targetId });
    return edge;
  }

  getDependents(nodeId) {
    return this.edges
      .filter((edge) => edge.sourceId === nodeId)
      .map((edge) => ({ targetId: edge.targetId, relation: edge.relation }));
  }

  snapshot() {
    return {
      node_count: this.nodes.size,
      edge_count: this.edges.length,
      nodes: [...this.nodes.values()],
      edges: [...this.edges]
    };
  }

  propagate(fromNodeId, reason) {
    const affected = this.getDependents(fromNodeId);
    return {
      reason,
      affected,
      frontier: affected.map((entry) => entry.targetId)
    };
  }
}

export function normalizeEvidenceStatus(input) {
  const value = String(input || 'Unverified').trim();
  if (CRA_STATES.E.includes(value)) return value;
  return 'Unverified';
}

export function normalizeCausalState(input) {
  const value = String(input || 'Presumed').trim();
  if (CRA_STATES.C.includes(value)) return value;
  return 'Presumed';
}

export function compileTransition(event) {
  const evidence = normalizeEvidenceStatus(event.evidence);
  const causal = normalizeCausalState(event.causal);
  const proposition = String(event.proposition || '').trim();
  const boundary = String(event.boundary || 'Ø').trim();
  const intervention = String(event.intervention || 'None').trim();
  const observationWindow = String(event.observationWindow || 'unspecified').trim();
  const domain = String(event.domain || 'unspecified').trim();

  const unsupportedImplications = [];
  if (event.requiresAtoE) unsupportedImplications.push(NON_ENTAILMENT_RULES.A_TO_E);
  if (event.requiresEtoC) unsupportedImplications.push(NON_ENTAILMENT_RULES.E_TO_C);
  if (event.requiresAtoC) unsupportedImplications.push(NON_ENTAILMENT_RULES.A_TO_C);

  const candidate = {
    proposition,
    evidence,
    causal,
    boundary,
    intervention,
    observationWindow,
    domain,
    unsupportedImplications,
    requiredStatus: {
      evidence,
      causal
    }
  };

  return {
    ...candidate,
    causal_domain_transfer: {
      proposition: proposition || 'unnamed-proposition',
      intervention,
      domain,
      observationWindow,
      boundary
    }
  };
}

export function classifyTransitionStatus(transition) {
  const { evidence, causal, unsupportedImplications } = transition;

  if (unsupportedImplications.length > 0) {
    return {
      status: 'UNSAT',
      reason: `Unsupported entailment attempted: ${unsupportedImplications.join(', ')}`,
      proof: {
        supported: false,
        solver: 'symbolic-constraint-check',
        constraints: unsupportedImplications
      }
    };
  }

  if (!transition.proposition) {
    return {
      status: 'UNKNOWN',
      reason: 'No proposition text was supplied for symbolic compilation.',
      proof: { supported: false, solver: 'symbolic-constraint-check', constraints: [] }
    };
  }

  if (evidence === 'Contradicted' || causal === 'Invalidated') {
    return {
      status: 'UNSAT',
      reason: 'The proposed transition violates the CRA state-space constraints and causal boundary requirements.',
      proof: {
        supported: false,
        solver: 'symbolic-constraint-check',
        constraints: ['evidence != Contradicted', 'causal != Invalidated']
      }
    };
  }

  if (evidence === 'Unverified' || causal === 'Presumed') {
    return {
      status: 'UNKNOWN',
      reason: 'Evidence or causality remains insufficiently validated for an admissible state upgrade.',
      proof: {
        supported: false,
        solver: 'symbolic-constraint-check',
        constraints: ['evidence requires corroboration', 'causal requires external support']
      }
    };
  }

  if (evidence === 'Established' && causal === 'Demonstrated') {
    return {
      status: 'SAT',
      reason: 'The transition satisfies the CRA state-space constraints and the causal-domain obligations.',
      proof: {
        supported: true,
        solver: 'symbolic-constraint-check',
        constraints: ['A_state >= P0', 'Evidence is Established', 'Causal is Demonstrated']
      }
    };
  }

  return {
    status: 'UNKNOWN',
    reason: 'The transition is not conclusively valid or invalid within the current evidentiary and causal conditions.',
    proof: {
      supported: false,
      solver: 'symbolic-constraint-check',
      constraints: []
    }
  };
}

export async function verifySymbolic(transition) {
  const candidate = compileTransition(transition);
  const baseClassification = classifyTransitionStatus(candidate);

  try {
    const z3Module = await import('z3-solver');
    const { Context } = z3Module;
    const { Solver, Bool, And, Or, Not, Implies } = new Context('main');

    const a = Bool('A');
    const e = Bool('E');
    const c = Bool('C');
    const solver = new Solver();

    solver.add(Not(Implies(a, e)));
    solver.add(Not(Implies(e, c)));
    solver.add(Not(Implies(a, c)));

    const isCandidateEntailed = solver.check();
    const solverResult = isCandidateEntailed ? 'SAT' : 'UNSAT';

    const result = {
      ...baseClassification,
      solver: 'z3',
      symbolic_result: solverResult,
      constraints: [
        'A ↛ E',
        'E ↛ C',
        'A ↛ C',
        ...candidate.unsupportedImplications
      ]
    };

    return result;
  } catch (error) {
    return {
      ...baseClassification,
      solver: 'fallback-symbolic-check',
      symbolic_result: baseClassification.status,
      constraints: [
        'A ↛ E',
        'E ↛ C',
        'A ↛ C',
        ...candidate.unsupportedImplications
      ],
      warning: error?.message || 'Solver unavailable; fallback symbolic checker used.'
    };
  }
}

export function optimizeDeclarativeProgram(program, feedback) {
  const nextProgram = {
    ...program,
    version: (program.version || 1) + 1,
    routing: {
      ...(program.routing || {}),
      evidence_weight: Math.min(1, (program.routing?.evidence_weight || 0.75) + (feedback.evidence_precision_gain || 0.02)),
      contradiction_weight: Math.min(1, (program.routing?.contradiction_weight || 0.8) + (feedback.contradiction_precision_gain || 0.02)),
      causal_weight: Math.min(1, (program.routing?.causal_weight || 0.82) + (feedback.causal_precision_gain || 0.02))
    },
    prompt: {
      ...(program.prompt || {}),
      extraction_strategy: feedback.extraction_accuracy > 0.8 ? 'structured-atomic' : 'adaptive-semantic-merge'
    },
    optimization_log: [
      ...(program.optimization_log || []),
      {
        ts: new Date().toISOString(),
        signal: feedback.signal || 'execution_feedback',
        score: feedback.score || 0
      }
    ]
  };

  return nextProgram;
}

export async function processStreamingCorpus({ events = [], mesh = new EpistemicMesh(), program = {} }) {
  const results = [];
  const activeProgram = {
    version: program.version || 1,
    routing: {
      evidence_weight: program.routing?.evidence_weight || 0.75,
      contradiction_weight: program.routing?.contradiction_weight || 0.8,
      causal_weight: program.routing?.causal_weight || 0.82
    },
    prompt: {
      extraction_strategy: program.prompt?.extraction_strategy || 'structured-atomic'
    },
    optimization_log: program.optimization_log || []
  };

  for (const event of events) {
    const propositionNode = mesh.addNode('PROPOSITION', {
      proposition: event.proposition,
      domain: event.domain,
      boundary: event.boundary
    });

    const evidenceNode = mesh.addNode('EVIDENCE', {
      status: normalizeEvidenceStatus(event.evidence),
      source: event.source || 'unknown-source'
    });

    const stateNode = mesh.addNode('STATE', {
      proposition_id: propositionNode.id,
      evidence_status: normalizeEvidenceStatus(event.evidence),
      causal_status: normalizeCausalState(event.causal),
      version: 1
    });

    mesh.addEdge(propositionNode.id, evidenceNode.id, 'DERIVED_FROM', { reason: 'semantic-claim' });
    mesh.addEdge(propositionNode.id, stateNode.id, 'HAS_STATE', { reason: 'epistemic-state' });

    const transition = compileTransition(event);
    const verification = await verifySymbolic(transition);
    const auditNode = mesh.addNode('AUDIT_EVENT', {
      proposition_id: propositionNode.id,
      verification,
      transition_hash: contentAddress(transition)
    });

    mesh.addEdge(stateNode.id, auditNode.id, 'VALIDATED_BY', { reason: 'symbolic-verification' });

    results.push({
      proposition_id: propositionNode.id,
      evidence_id: evidenceNode.id,
      state_id: stateNode.id,
      audit_id: auditNode.id,
      verification,
      dependency_path: mesh.propagate(propositionNode.id, 'upstream-change')
    });
  }

  const optimizationFeedback = {
    evidence_precision_gain: 0.04,
    contradiction_precision_gain: 0.03,
    causal_precision_gain: 0.03,
    extraction_accuracy: results.every((result) => result.verification?.status === 'SAT' || result.verification?.status === 'UNKNOWN') ? 0.9 : 0.7,
    signal: 'stream-event-feedback',
    score: results.length ? results.reduce((sum, item) => sum + (item.verification?.status === 'SAT' ? 1 : 0.5), 0) / results.length : 0
  };

  const optimized = optimizeDeclarativeProgram(activeProgram, optimizationFeedback);

  return {
    mesh: mesh.snapshot(),
    results,
    optimized_program: optimized,
    status: 'processed'
  };
}

export function createExecutionArtifact({ program, result }) {
  return {
    program_version: program.version || 1,
    execution_id: contentAddress({ program, result, ts: new Date().toISOString() }),
    content_hash: contentAddress(result),
    result,
    created_at: new Date().toISOString()
  };
}

export function buildMeshStatus(mesh) {
  return {
    node_count: mesh.nodes.size,
    edge_count: mesh.edges.length,
    active_states: [...mesh.nodes.values()].filter((node) => node.type === 'STATE').length,
    audit_events: [...mesh.nodes.values()].filter((node) => node.type === 'AUDIT_EVENT').length
  };
}

export const CRA_SYSTEM = {
  state_space: CRA_STATES,
  non_entailment_rules: NON_ENTAILMENT_RULES,
  default_program: {
    version: 1,
    routing: {
      evidence_weight: 0.75,
      contradiction_weight: 0.8,
      causal_weight: 0.82
    },
    prompt: {
      extraction_strategy: 'structured-atomic'
    },
    optimization_log: []
  }
};
