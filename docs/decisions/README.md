# Decision register — structure and rules (BX-001)

**This file records no decision.** It defines how BLACK X decisions will
be recorded once the responsible party actually makes them, so that
approvals become permanent, traceable records instead of edits buried
inside draft documents. Creating this structure does not approve,
pre-approve, or imply approval of anything.

## 1. Two layers — do not mix them

| Layer | Where it lives | What it means |
|---|---|---|
| **Open registers** (what still needs deciding) | API contract §9 (`PO-*`, `DB-*`, `TECH-*`) and requirements §10/§12 — see [`../README.md`](../README.md) §3. | An item listed there is **undecided**. Its presence authorizes nothing. |
| **Decision records** (what was decided, by whom, when) | This folder, one file per decision, created from [`0000-template.md`](./0000-template.md). | A record exists **only after** the responsible party has decided. It is evidence of a decision, never a substitute for making one. |

When a decision is made, both layers move together in the same
(authorized) change: add the decision record here, then update the open
register entry to point at it. If those two ever disagree, the signed
decision record wins and the register is corrected to match.

## 2. Who may decide what

- `PO-*` — company owner / management (business scope, roles,
  commercial and financial policy, customer visibility, launch gates).
- `DB-*` — database colleague (engine, ORM/driver, schema, migrations,
  test databases, backups, storage ownership). Env-var **names** may be
  recorded; values never.
- `TECH-*` — engineering (Arena/ChatGPT proposes; recorded here once
  chosen at the relevant kickoff, and revisited if a `PO-*`/`DB-*`
  decision constrains it).
- `BX-*` backlog task authorizations — company owner, per batch, naming
  the exact task IDs in scope (authorization for some tasks is never
  authorization for the whole project).

A decision record names its decider(s) by role. Records written by
anyone else on their behalf must cite how the decision was communicated
(e.g. signed checklist, meeting date) — inference is not a source.

## 3. Record conventions

- **Filename:** `NNNN-short-kebab-slug.md`, `NNNN` allocated
  sequentially from `0001`, never reused. `0000-template.md` is the
  template, not a decision.
- **One decision per record.** If it needs the word "and" between two
  independent choices, it is two records.
- **Status vocabulary:** `proposed` (written up, awaiting the decider —
  still authorizes nothing) · `accepted` (decided; date + decider
  required) · `superseded by NNNN` (replaced; link the successor) ·
  `deprecated` (no longer applies, no successor).
- **Immutability:** an `accepted` record is never edited to change its
  meaning. Corrections of fact (typos, broken links) are fine; a change
  of decision is a new record that supersedes the old one. History must
  stay readable.
- **Traceability:** every record links the register IDs it resolves
  (`PO-*`/`DB-*`/`TECH-*`), the backlog tasks it unblocks (`BX-*`), and
  the documents it requires revising. Acceptance criteria/tests that
  will prove the decision was honored belong in the record or its
  linked tasks.
- **No secrets, ever:** no credentials, tokens, connection strings,
  private customer data, or env-var values (names only).

## 4. Index

No decisions have been recorded yet. Approved management inputs that
predate this register are already listed in the requirements document
§1 and are referenced from [`../README.md`](../README.md) §3 rather
than duplicated here; they may be back-recorded as `accepted` records
citing that source if the owner wants a single chronological log.

| ID | Decision | Status | Date | Resolves | Unblocks |
|---|---|---|---|---|---|
| — | _(none recorded)_ | — | — | — | — |

## 5. What belongs elsewhere

- **Drafting proposals** (options analysis, recommendations) stay in the
  requirements/API documents until decided; a `proposed` record may
  summarize them but must link, not fork, the analysis.
- **Implementation authorizations** are given per batch by the owner;
  the resulting work cites the authorization in its handoff report.
  This register does not grant implementation permission by itself.
- **Production/launch approvals** additionally require the release
  gates in the plans (security, persistence, authorization, audit,
  backup/restore, acceptance) — a decision record alone never lifts
  the production block.
