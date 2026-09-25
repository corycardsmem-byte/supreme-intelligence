import {
  EpistemicMesh,
  processStreamingCorpus,
  createExecutionArtifact,
  buildMeshStatus,
  CRA_SYSTEM
} from '@supreme-intelligence/epistemic-mesh';

export async function handleCRARequest(req, res) {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : [];
    const mesh = new EpistemicMesh();

    if (events.length === 0) {
      return res.status(400).json({
        error: 'At least one corpus event is required.',
        required_shape: {
          events: [{ proposition: 'string', evidence: 'Established', causal: 'Demonstrated', boundary: 'domain-boundary', domain: 'example-domain', intervention: 'I1', observationWindow: 'W1' }]
        }
      });
    }

    const execution = await processStreamingCorpus({
      events,
      mesh,
      program: CRA_SYSTEM.default_program
    });

    const artifact = createExecutionArtifact({
      program: CRA_SYSTEM.default_program,
      result: execution
    });

    return res.json({
      ok: true,
      artifact,
      status: buildMeshStatus(mesh),
      system: {
        state_space: CRA_SYSTEM.state_space,
        non_entailment_rules: CRA_SYSTEM.non_entailment_rules
      },
      execution
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'CRA execution failed.',
      detail: error.message
    });
  }
}

export async function handleCRAHealth(req, res) {
  return res.json({
    ok: true,
    service: 'cra-epistemic-runtime',
    status: 'operational',
    state_space: CRA_SYSTEM.state_space,
    non_entailment_rules: CRA_SYSTEM.non_entailment_rules
  });
}
