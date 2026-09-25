# CRA runtime

The CRA runtime is an incremental content-addressed mesh exposed by the API:

- `POST /cra/events` accepts streaming semantic events and commits immutable proposition, evidence, boundary, proof, state, and audit nodes.
- `POST /cra/mutations` commits an immutable state version and recursively emits re-audit derivations for affected descendants.
- `GET /cra/health` exposes runtime status and declarative program version.

The formal protocol is fixed by `CRA_SPEC`: `|Ω| = 9 × 4 × 4 = 144`, causal `Ø` remains external, and `A↛E`, `E↛C`, and `A↛C` are symbolic constraints. Optimization changes execution-program telemetry and routing only; it does not change CRA semantics.

Start the API with `npm install && npm run dev:api`.
