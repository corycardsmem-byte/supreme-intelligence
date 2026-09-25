import express from 'express';
import { orchestrateRequest } from '@supreme-intelligence/core';
import { evaluateTruth } from '@supreme-intelligence/governance';
import { createEvidenceRecord } from '@supreme-intelligence/provenance';
import { billingRouter, stripeWebhookHandler } from './billing.js';
import { craRouter } from './cra.js';

const app = express();
const PORT = process.env.PORT || 3001;
app.post('/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
app.use(express.json({ limit: '2mb' }));
app.use('/billing', billingRouter);
app.use('/cra', craRouter);
app.get('/health', (_, res) => res.json({ ok: true, service: 'supreme-intelligence-api' }));
app.post('/chat', async (req, res) => {
  try {
    const { message = '' } = req.body || {};
    if (!message.trim()) return res.status(400).json({ error: 'Message is required.' });
    const sources = [{ source: 'swervincurvin.blogspot.com', type: 'blog-corpus' }];
    const response = await orchestrateRequest({ message, source: sources });
    const governance = evaluateTruth({ message, answer: response.answer, sources });
    return res.json({ ...response, governance, evidence: createEvidenceRecord({ answer: response.answer, sources, score: governance.score }) });
  } catch (error) { return res.status(500).json({ error: 'Unable to process request.', detail: error.message }); }
});
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
