# Contract-test harness (BX-104) — skeleton and conventions

**Status:** harness + first business suite. The probe files prove that a
single behavior-only suite can run unchanged against interchangeable
adapters; `intake-ports.contract.test.ts` applies the same mechanics to
the real public-intake ports (Batch 2) against the governed in-memory
fake in `src/server/intake/fake-adapter.ts` (§5.4). No database adapter
is registered anywhere yet — the colleague's real adapter must pass the
intake suite unchanged before integration (§5.5).

## Why this exists

The API contract (`docs/api-contract-v1.md` §5, §8) is database-
independent by design: application services will depend on repository
*ports* (DTO-shaped interfaces), the database colleague owns the real
implementation behind them, and conformance is proven *behaviorally* by
running the identical suite against each adapter (CT-PORT). This
skeleton establishes those mechanics now, with a neutral probe port, so
future authorized work adds real ports/suites instead of inventing the
pattern under pressure.

## Layout

| File | Role |
|---|---|
| `harness.ts` | `ContractAdapter<TPort>` interface, env-based adapter selection (`resolveAdapter` / `resolveAdapterFromEnv`), and `describeWithAdapter` (fresh instance per test). |
| `probe-port.ts` | The neutral dummy port (`ProbeStore`) and its observable semantics. No domain meaning; never imported by `src/`. |
| `probe-memory-adapter.ts` | In-memory dummy implementation, registered as `memory-dummy`. Test-only fixture. |
| `probe.contract.test.ts` | The shared probe suite + adapter-selection tests. Discovered by the existing Vitest `include` pattern (`tests/**/*.test.ts`) — no config change was needed. |
| `intake-ports.contract.test.ts` | CT-PORT subset for the public-intake ports (atomicity, idempotency, references, rate limits, append-only audit, reset). Adapter selected via `INTAKE_CONTRACT_ADAPTER` (default `fake-memory`) so it never collides with the probe's `CONTRACT_ADAPTER`. |

## Running

From the repository root (dependencies installed with `npm ci`):

```bash
# Everything, exactly as CI runs it (unit + contract):
npm test

# Only the contract suite:
npm run test:contract

# The contract suite against a named registered adapter:
CONTRACT_ADAPTER=memory-dummy npm run test:contract
```

Notes:

- `CONTRACT_ADAPTER` unset → the registry default (`memory-dummy`) runs.
- `CONTRACT_ADAPTER` naming an **unregistered** adapter fails loudly at
  collection and lists the registered names. There is no silent
  fallback — running against the wrong implementation must never look
  like a pass.
- A future real-adapter run needs the colleague's disposable test
  database (TBD-DB-07) and env-var **names** (TBD-DB-06). Until those
  exist under an authorized task, no real adapter is registered here.
  Select it per suite without cross-talk: `CONTRACT_ADAPTER` for the
  probe, `INTAKE_CONTRACT_ADAPTER` for the intake ports.

## Conventions every adapter and suite must follow

1. **Fresh state per test.** `create()` returns a new, completely empty
   instance; the harness calls it before every test. Tests must never
   share state or depend on execution order.
2. **Explicit reset.** `reset(port)` removes all state and leaves the
   port usable. Suites assert the observable "empty again" behavior;
   the mechanism (map clear today; disposable-DB reset later) belongs
   to the adapter owner.
3. **Cleanup.** `dispose(port)` (optional) releases resources after each
   test. Adapters holding connections/handles must implement it.
4. **Behavior only.** Suites assert observable port behavior through the
   port interface — never SQL, table names, ORM entities, or adapter
   internals. If a behavior cannot be honored by some adapter, it is
   documented as a known limitation of that adapter (per API contract
   §5.4), never silently skipped.
5. **Determinism.** No wall-clock, randomness, network, or ordering
   assumptions beyond what the port contracts. Future suites use
   injected Clock/IdGenerator doubles where time/IDs matter.
6. **Stable names.** Adapter selection names are stable once registered
   (e.g. `memory-dummy`); rename by adding a new name, not by editing
   the old one, so past CI logs stay interpretable.
7. **Registering an adapter** (future, authorized work only): implement
   `ContractAdapter<TPort>`, add it to the suite file's registry array,
   and run the shared suite against it unchanged. Changing the suite to
   make an adapter pass is a contract change — it belongs in the API
   contract document first.
8. **No secrets.** Adapter configuration in tests uses env-var names
   only; never commit credentials, connection strings with passwords,
   or tokens. Disposable test databases hold synthetic data only.

## Relationship to the planned CT suites

`docs/api-contract-v1.md` §8 defines CT-PORT / CT-API / CT-SEC / CT-WF /
CT-NOTIF / CT-E2E. This skeleton is the seed for **CT-PORT mechanics
only**. The business suites themselves (authorization matrices, IDOR
battery, workflow transitions, outbox atomicity) remain blocked on
owner decisions and future authorized tasks — see `docs/README.md` and
the decision registers referenced there.
