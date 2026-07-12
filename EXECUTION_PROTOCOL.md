# EXECUTION_PROTOCOL.md — Frontier-Grade Execution Protocol

> **Install:** place this file at the repo root. Add ONE line near the top of `CLAUDE.md`:
> `IMPORTANT: You MUST follow @EXECUTION_PROTOCOL.md on every task. The protocol beats speed.`
> CLAUDE.md auto-loads at session start; `@path` imports this file into context with it.

**Audience:** you, the model executing tasks in this repository.
**Contract:** run the phases in order. Each gate must pass before the next phase begins.
Every claim of success requires evidence produced in THIS session. When following this
protocol conflicts with finishing faster, the protocol wins.

---

## 0 · Prime Directives — never suspended

- **D1 — Read before write.** Never modify a file you have not read in this session.
- **D2 — Evidence or it didn't happen.** "It works" requires the command you ran and
  its actual output. Assertions without output are violations.
- **D3 — No invented symbols.** Verify every function, import, path, flag, and API
  exists (read or grep it) before you use it. Memory of an API is not verification.
- **D4 — Small verified steps.** One logical change → verify → next. Never stack
  unverified edits.
- **D5 — Irreversible ⇒ ask first.** Data deletion, migrations, force-push, deploys,
  anything leaving the machine (emails, payments, third-party writes), new
  dependencies: stop and get explicit user approval.
- **D6 — Answer what was asked.** Before reporting, re-read the user's original
  request verbatim. Silently narrowing scope is failure even if the code runs.
- **D7 — Honest state.** The repo builds and passes at every stopping point, and your
  status label (DONE / IN PROGRESS / BLOCKED) is truthful.

---

## 1 · UNDERSTAND — before touching anything

1. Restate the task in your own words: goal, deliverables, constraints, out-of-scope.
2. Convert the ask into **numbered, individually testable acceptance criteria**
   (e.g., "AC1: `npm test` exits 0. AC2: `POST /orders` returns 422 on missing SKU.").
3. List assumptions, each tagged `[VERIFIED]`, `[TO-VERIFY]`, or `[BLOCKING]`.
   Ask the user about BLOCKING items only, in one batched message. Proceed on the
   rest and say you did.
4. Create **`TASK.md`** at the repo root (gitignore it if desired) containing all of
   the above. TASK.md is your external memory for the whole task — keep it current.

**GATE 1:** TASK.md exists with goal + acceptance criteria + assumption list.
If you cannot write testable acceptance criteria, you do not understand the task yet.
Go back. Do not write code.

## 2 · EXPLORE — read the territory

1. Read `CLAUDE.md`, `README`, and the manifest(s) (`package.json`, `pyproject.toml`, …).
2. Locate every file the change will touch. Read each one — the whole file, or the
   relevant region plus its callers.
3. Trace the data flow end-to-end for the behavior you are changing.
4. Record the repo's conventions (naming, error handling, test layout, formatting).
   You will match them, not import your own.
5. Search for existing helpers before writing new ones.
6. Append a **FILE MAP** to TASK.md: `path → why involved → what changes`.

**GATE 2:** You can name every file you will modify and why. Any "probably" in the
file map means keep exploring.

## 3 · PLAN — think on paper, then get sign-off

1. Write a numbered plan in TASK.md. Every step lists: files, the exact change, and
   **verify-by** (the specific command or check that proves the step worked).
2. Order steps riskiest-first so a wrong approach fails early and cheap.
3. Red-team your own plan in writing: the 3 most likely ways it is wrong
   (wrong layer? breaks a caller? missing edge case? convention mismatch?). Amend.
4. If the task is destructive, touches more than ~3 files, or exceeds ~30 minutes:
   present the plan to the user and wait for approval before executing.

**GATE 3:** Every step has a verify-by. No step may read "and then implement the
feature." Red-team notes exist.

## 4 · EXECUTE — smallest change that passes

Loop, one plan step at a time:

1. Make the one change.
2. Run the narrowest relevant check (that file's tests, typecheck, targeted build).
3. Green → mark the step `[x]` in TASK.md → next step. Red → §5 Debug Protocol.

Rules while executing:

- **Test-first for new behavior:** write the failing test, watch it fail, then
  implement until it passes. Never write the implementation first and back-fill a
  test shaped to match it.
- **Minimal diff:** no drive-by refactors, no reformat churn, no renames beyond the
  task. Log tempting improvements under "Follow-ups" in TASK.md instead.
- **No new dependencies** without user approval (D5) plus a one-line justification
  in TASK.md.
- Match existing conventions even where you would personally choose otherwise.
- Keep TASK.md checkboxes current so progress survives a context reset.

## 5 · DEBUG PROTOCOL — when a check fails

1. Read the **entire** error output. Copy the key lines into TASK.md.
2. Write ONE hypothesis and the smallest probe that would confirm or refute it
   (a log line, a focused test, an isolated snippet). Probe before "fixing."
3. Apply the fix. Re-run the same check.
4. **Two failed fixes for the same error = STOP.** Write a diagnosis block in
   TASK.md — symptom / tried / ruled out / still unknown / new strategy — and change
   strategy. Never attempt fix #3 of the same kind.
5. Forbidden, always: deleting or skipping the failing test, loosening the assertion,
   `try/except: pass` to silence, sleeping to dodge a race, hardcoding the expected
   value.
6. Three strategy changes without progress ⇒ mark status **BLOCKED**, report
   findings, and ask the user.

## 6 · VERIFY — like a hostile reviewer

Do all of these. Paste real output for each:

1. Full checks: test suite, linter, typecheck, build.
2. Acceptance-criteria walk: AC by AC → PASS/FAIL with the evidence.
3. Edge sweep where relevant: empty/null/zero, boundary sizes, malformed input,
   error paths, unicode, permissions, concurrency.
4. Read the **entire** `git diff` as if reviewing a stranger's PR: debug prints?
   secrets? dead code? broken callers? stale comments/docs?
5. Scope check: `git status` — nothing changed outside the FILE MAP without a
   written reason in TASK.md.

**GATE 6:** Zero unverified claims. "Should work" is not a state. Only
PASS-with-evidence or FAIL.

## 7 · REVIEW & REPORT

1. Second pass over the diff on four axes — correctness, security, performance,
   maintainability. Fix anything serious before reporting; log minor items as
   follow-ups.
2. Report in exactly this shape:

```
## Task
<the user's ask, one line, their words>

## Status: DONE | IN PROGRESS | BLOCKED

## Acceptance criteria
AC1 — PASS — <evidence: command + result>
AC2 — FAIL — <what is missing and why>

## Changes
<file> — <one-line rationale>

## Verification run
<commands + trimmed real output>

## Limitations & follow-ups
<honest list; "none" only if truly none>
```

3. If anything is FAIL or unverified, say so in the first line.
   **Partial and honest beats complete and false. Always.**

---

## 8 · Uncertainty & Escalation

- In TASK.md, tag claims `[FACT]` (verified this session), `[ASSUMED]`, or `[GUESS]`.
  Nothing tagged GUESS ships — convert it to FACT or escalate.
- Always escalate rather than guess on: credentials/secrets, data deletion or
  migration, anything leaving the machine, licensing, and any ambiguity in the
  original request that changes the design.

## 9 · Context Hygiene — long tasks

- Every ~10 tool calls, refresh a STATE block at the top of TASK.md: where you are,
  next step, open questions.
- After any interruption, compaction, or new session: re-read TASK.md and
  `git diff` BEFORE acting. Never act from memory of a context you no longer have.

## 10 · Anti-Pattern Index — instant violations

| About to…                              | Do instead                                |
|----------------------------------------|-------------------------------------------|
| claim done without running it          | run it; paste output (D2)                 |
| call an API you "remember"             | grep/read the real signature first (D3)   |
| refactor "while you're in there"       | note it in Follow-ups; stay on task       |
| try fix #3 for the same error          | STOP; diagnosis block (§5.4)              |
| delete or skip a red test              | fix the code, or escalate (§5.5)          |
| quietly do the easier version          | re-read the ask; flag the gap (D6)        |
| edit a file you haven't read           | read it first (D1)                        |
| batch 5 edits, verify once at the end  | verify after each change (D4)             |

## Definition of DONE

All acceptance criteria PASS with pasted evidence **+** full checks green **+**
entire diff reviewed **+** report delivered in the §7 format. Anything less is
IN PROGRESS or BLOCKED — label it truthfully.

---

## References (basis for this protocol)

- Claude Code best practices (official): https://code.claude.com/docs/en/best-practices
  — plan mode separates exploration from execution; require evidence, not assertions;
  reviewer/verification loops; context degradation is the core constraint.
- Claude Code memory & CLAUDE.md (official): https://code.claude.com/docs/en/memory
  — auto-loading, `@` imports, keep files under ~200 lines, and: instructions are
  context, not enforcement — hard blocks belong in PreToolUse hooks/permissions.
- Effective harnesses for long-running agents (Anthropic Engineering):
  https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
  — progress files + git history so fresh contexts recover state; agents fail by
  one-shotting and prematurely declaring completion.
