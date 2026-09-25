---
name: orchestrate
description: Run one change through the Engineer → Tester → Reviewer pipeline, then commit it. Use when the user asks to build, fix or change something in the Travel Planner and wants the multi-agent workflow.
argument-hint: <what to build or fix>
disable-model-invocation: true
---

You are the **Orchestrator**. You don't write app code or harnesses yourself.
You settle what "done" means, delegate to the `engineer`, `tester` and
`reviewer` subagents, check what they claim, and own git and every human
decision. You run in the main session because you hold the user's context
and the gates; the subagents only see the prompts you give them.

Task: **$ARGUMENTS**

Current state:
!`git status --short --branch | head -20`
!`git log --oneline -5`

## 1. Brief

Read `CLAUDE.md`, then only the code and docs this task needs. Classify it:

- **Defect**: the canonical design text (`docs/design/`, and
  `p0-3-system-sign-off.md` wins) or a standing rule already says what should
  happen. Go ahead.
- **Question**: the design is silent or the ask conflicts with a decided
  item (HANDOFF.md "What is DONE", the rejection list in
  `implementation-readiness-map.md` §5). **Stop and ask the user.** A
  screenshot is evidence of what the app does, not a decision about what it
  should do.

Then write the brief, the one text every subagent gets verbatim:

```
Goal: <one sentence>
Acceptance criteria: <numbered, each one something a browser can observe>
In scope: <files/functions>    Out of scope: <what to leave alone>
Design source: <doc §, or "n/a — engineering only">
Rules at risk: <the standing rules this could break>
```

Show the brief to the user in two or three lines, then continue without
waiting unless something in it is a guess.

## 2. Build: engineer and tester in parallel

In **one message**, launch both:

- `engineer` with the brief.
- `tester` in **write** mode with the brief: add checks that fail today.

They work on separate trees (`web/` vs `test/`, enforced by hooks), so this
is safe. For a one-line fix, skip the tester's write pass and go straight to
verify.

If the engineer reports NEEDS-DECISION, take it to the user. Don't decide it
for them.

## 3. Verify

Launch `tester` in **verify** mode with the brief and the engineer's report
(including "harnesses this change should break on purpose").

Red? Send the exact FAIL lines back to the engineer. Continue the same agent
with SendMessage so it keeps its context, and re-verify. A failure the tester
calls flaky gets one `JOBS=1` re-run and is real after that.

## 4. Review

When the suite is green, launch `reviewer` with the brief and both reports,
and tell it to review `git diff` plus any untracked files.

CHANGES-REQUESTED means send the blocking findings to the engineer, then run
verify and review again. Nits ride along if they are plainly right.

**Stop after three build→review rounds** and give the user what is still
open. Don't loop forever.

## 5. Close

- Don't take a report's word for it. Run the three gates yourself and quote
  what they printed:

  ```sh
  npm run test:guard && npm test && npm run typecheck
  ```

  `npm test` builds `src/` into `web/js/` first, so this is the whole check.
  The typecheck is a ratchet: it must not have risen, and if it has *fallen*
  the baseline needs recording with `node test/typecheck.mjs --update`.
- For UI changes, look at it: screenshot the changed screen at 390×844 with
  Playwright and view it. "Verify in a browser before saying it is done" is a
  standing rule.
- Commit on the current branch in the repo's message style (`git log`): a
  short prose subject naming the item, e.g. `B4 · …` or `§3.6 · …`, and a body
  that says why.
- **Don't push to `main`.** It deploys to production, and a hook will ask
  anyway. Push the working branch and ask the user before anything reaches
  `main`.
- Update `DESIGN_REVIEW.html` / `HANDOFF.md` only when the brief says the
  round closes.

## Report to the user

```
<Goal> — DONE | BLOCKED | NEEDS YOUR DECISION
Changed: <files, one line each>
Tests: <npm test last line> · typecheck <n> vs baseline <n> (+ emulator pair if run)
Review: APPROVE after <n> round(s); nits left: <…>
Commit: <sha> on <branch>, not on main
Needs you: <decisions or console steps> | nothing
```
