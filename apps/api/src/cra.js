import express from 'express';
import { Mesh, auditEvent, propagate, optimize, declarativeProgram, node } from '@supreme-intelligence/epistemic-mesh';

export const craMesh = new Mesh();
export let activeProgram = declarativeProgram;

export async function ingestCRA(req, res) {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    const valid = events.filter((event) => event && typeof event.proposition === 'string');
    if (!valid.length) return res.status(400).json({ error: 'events must contain proposition strings' });
    const audits = [];
    for (const event of valid) audits.push(await auditEvent(craMesh, event, activeProgram));
    const telemetry = { total: audits.length, sat: audits.filter((a) => a.proof.payload.status === 'SAT').length };
    activeProgram = optimize(activeProgram, telemetry);
    return res.status(202).json({ accepted: audits.length, program: activeProgram, audits, mesh: craMesh.snapshot() });
  } catch (error) { return res.status(500).json({ error: 'CRA execution failed', detail: error.message }); }
}

export async function mutateCRA(req, res) {
  const { nodeId, payload, reason } = req.body || {};
  if (!nodeId || !craMesh.get(nodeId)) return res.status(404).json({ error: 'Known nodeId is required' });
  const mutation = node('STATE_VERSION', payload || {}, [nodeId]);
  craMesh.put(mutation); craMesh.link(nodeId, mutation.id, 'SUPERSEDES');
  const records = await propagate(craMesh, nodeId, reason);
  return res.status(202).json({ mutation, reaudits: records, mesh: craMesh.snapshot() });
}

export function craHealth(req, res) { res.json({ ok: true, spec: 'cra-1.0', mode: 'continuous-incremental', program: activeProgram.version }); }

export const craRouter = express.Router();
craRouter.get('/health', craHealth);
craRouter.post('/events', express.json(), ingestCRA);
craRouter.post('/mutations', express.json(), mutateCRA);
