# Execution Protocol - Parallel Agents (Backend + Frontend)

## Objective
Run multiple coding agents in parallel with safe boundaries, while keeping merge authority with the repository owner.

## Core Rules
1. Agents may create branches, commits, and PRs.
2. Agents may merge PRs automatically when approval and required checks conditions are satisfied.
3. Owner review remains recommended for high-risk changes, but merge authority is delegated to automation by default.

## Work Partitioning
1. One issue per branch: `feat/issue-<id>-<short-name>`.
2. Backend agent scope: `backend/**` only.
3. Frontend agent scope: `frontend/**` only.
4. Cross-cutting DTO/API contract changes require a dedicated contract issue first.

## PR Contract (Required)
Each PR must include:
1. Linked issue (`Closes #<id>` or `Refs #<id>`).
2. Scope summary (what changed, what did not).
3. Test evidence (exact commands + result summary).
4. Risk notes and rollback notes.

## Mandatory Checks Before Merge
- Backend PRs:
1. `cd backend`
2. `./gradlew test`

- Frontend PRs:
1. `cd frontend`
2. `npm run lint`
3. `npm run test:run`
4. `npm run build`

## Frontend UX Governance (Mandatory)
1. Product UX consistency is the top-priority rule across all FE deliveries.
2. Reference images are guidance for structure/intent, not pixel-locked constraints.
3. FE agents are encouraged to improve UX/UI with explicit rationale in PR notes.
4. FE stack baseline for this workstream:
   - Material UI (MUI)
   - React Hook Form
   - Zod for form validation
5. State-of-the-art production libraries are allowed and encouraged when they improve quality, accessibility, and maintainability.

## UX Source of Truth (Frontend)
Frontend queue must always reference these files before implementing any UI flow/page:
1. `docs/ux/product-principles.md`
2. `docs/ux/information-architecture.md`
3. `docs/ux/critical-flows.md`
4. `docs/ux/permission-and-visibility-matrix.md`
5. `docs/ux/accessibility-aa-checklist.md`
6. `docs/ux/mobile-responsiveness-rules.md`
7. `docs/ux/content-and-i18n-guidelines.md`
8. `docs/ux/implementation-handoff.md`
9. `docs/design-system/tokens.md`
10. `docs/design-system/components.md`
11. `docs/design-system/motion.md`
12. `docs/design-system/layout-and-grid.md`
13. `docs/ux/renders/README.md`
14. `docs/ux/renders/generated-images-index.md`

Hard rule:
If a target page/flow is not covered by approved guidance in these sources, stop and prompt the user with an explicit list of missing guidance.

## Frontend Stack Policy (Layered, Non-Conflicting)
This protocol separates FE stack by layer to avoid false conflicts:
1. Core platform (mandatory): TypeScript + React + Vite.
2. Data/state baseline: TanStack Query + Zustand.
3. UI/form baseline for this workstream: Material UI (MUI) + React Hook Form + Zod.
4. Styling rule: MUI-first for component theming; utility CSS (including Tailwind) is allowed where it improves delivery and does not break UX consistency.
5. Adding MUI/RHF/Zod does not replace TypeScript/React/Vite.

## Daily Sync Rules
1. Rebase branch on `main` at least daily.
2. If API contract changes, frontend PR must reference backend PR/commit.
3. Keep PRs small; avoid long-lived drift.

## VS Code Operating Pattern
1. Open one chat session per branch/issue.
2. Start each session with constraints:
   - "Issue #<id> only"
   - "Do not edit outside <allowed paths>"
   - "Do not merge PR"
3. Require final output to include:
   - Changed files
   - Test commands executed
   - PR title/body draft

## Suggested Prompt Template
Use this when starting an agent task:

```text
Work on issue #<id>.
Branch: feat/issue-<id>-<slug>
Scope: <backend only|frontend only|specific paths>
Constraints:
- Do not edit files outside scope.
- Run required tests for this scope.
- Open a PR but do not merge.
Deliver:
- Summary of changes
- Files changed
- Test evidence
- PR link
```

## Queue Mode Prompt (Backend)
Use this when you want the backend agent to continuously pick work from the backlog.

```text
Queue mode enabled (Backend).

Objective:
Continuously process backend backlog with minimal supervision and high throughput.

Cycle order (repeat continuously):
1) PR maintenance first
- Check all open PRs in backend scope.
- Auto-merge any PR that:
  - has required approvals;
  - has all required checks passing;
  - has no merge conflicts.
- If a PR has merge conflicts (dirty/conflicting):
  - sync the PR branch with its target/base branch (not hardcoded main);
  - resolve conflicts preserving issue intent and target/base branch invariants;
  - run relevant backend tests;
  - push conflict-resolution commit;
  - re-check mergeability and checks.

2) Issue hygiene
- Check open backend issues.
- Auto-close issues when possible:
  - linked PR is merged and resolves the issue; or
  - acceptance criteria are fully delivered in the issue delivery branch and validated.

3) Comment triage before new work
- Check open backend PRs for unanswered review comments.
- Handle unanswered comments in-thread first:
  - answer, challenge with rationale, or ask clarifying follow-up question.
- If comment is clear and valid:
  - implement fix;
  - run relevant backend tests;
  - push changes.
- Do not post self-review comments (handled by another tool).

4) Pick and execute next work
- Pick next available backend issue(s) by priority/dependencies.
- You may group related issues touching the same topic:
  - target batch size: up to 5;
  - allowed extension when tightly coupled: up to 7 total.
- For grouped issues, use one branch and one PR, linking all issues.
- Scope boundary: edit `backend/**` only.
- If cross-cutting API contract changes are needed, stop and request/linked contract issue before proceeding.

5) Testing depth requirement (mandatory)
- Every change must include thorough tests with a scenario matrix covering:
  - happy paths;
  - edge cases;
  - permission/role variants;
  - validation failures;
  - error paths;
  - regressions.
- Do not consider an issue done without matrix-level backend coverage (unit/integration as applicable).

6) Delivery requirements per cycle
- Implement changes.
- Run required backend checks:
  - `cd backend`
  - `./gradlew test`
- Open/update PR.
- Auto-merge eligible PRs in next cycle.
- Continue to next eligible issue batch automatically.

Governance:
- Merge is allowed automatically only when PR is approved + checks pass + no conflicts.
- If requirements are ambiguous, ask concise clarifying questions and pause only for that blocker.
- Do not stop unless blocked by missing requirements or broken tooling that cannot be self-resolved.

Output after each cycle:
- Issues picked
- Changes made
- Tests run + results
- PR link(s)
- Merge/close actions performed
```

## Queue Mode Prompt (Frontend)
Use this when you want the frontend agent to continuously pick work from the backlog.

```text
Queue mode enabled (Frontend).

Objective:
Continuously process frontend backlog with minimal supervision and high throughput.

Cycle order (repeat continuously):
1) PR maintenance first
- Check all open PRs in frontend scope.
- Auto-merge any PR that:
  - has required approvals;
  - has all required checks passing;
  - has no merge conflicts.
- If a PR has merge conflicts (dirty/conflicting):
  - sync the PR branch with its target/base branch;
  - resolve conflicts preserving issue intent and target/base branch invariants;
  - run relevant frontend checks;
  - push conflict-resolution commit;
  - re-check mergeability and checks.

2) Issue hygiene
- Check open frontend issues.
- Auto-close issues when possible:
  - linked PR is merged and resolves the issue; or
  - acceptance criteria are fully delivered in the issue delivery branch and validated.

3) Comment triage before new work
- Check open frontend PRs for unanswered review comments.
- Handle unanswered comments in-thread first:
  - answer, challenge with rationale, or ask clarifying follow-up question.
- If comment is clear and valid:
  - implement fix;
  - run relevant frontend checks;
  - push changes.
- Do not post self-review comments (handled by another tool).

4) Pick and execute next work
- Pick next available frontend issue(s) by priority/dependencies.
- You may group related issues touching the same topic:
  - target batch size: up to 5;
  - allowed extension when tightly coupled: up to 7 total.
- For grouped issues, use one branch and one PR, linking all issues.
- Scope boundary: edit `frontend/**` only.
- If BE/API contract changes are needed, stop and request/linked contract issue before proceeding.
- First, load and reference the UX Source of Truth file list from this protocol.
- Before implementation, verify that each target page/flow has approved design guidance in docs/renders.
- If any target page/flow has no design guideline, stop and prompt the user with a specific list of missing pages/flows before coding.
- When design guidance exists, treat it as directional and improve where appropriate with UX-argued rationale.
- Enforce FE stack baseline:
  - use MUI components/theming as default UI foundation;
  - use React Hook Form for forms;
  - use Zod schemas for validation.

5) Testing depth requirement (mandatory)
- Every change must include thorough tests with a scenario matrix covering:
  - happy paths;
  - edge cases;
  - permission/role variants (UI access/behavior by user state);
  - validation failures;
  - error/loading/empty states;
  - regressions.
- Do not consider an issue done without matrix-level frontend coverage (component/integration/e2e as applicable).

6) Delivery requirements per cycle
- Implement changes.
- Run required frontend checks:
  - `cd frontend`
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
- Open/update PR.
- Auto-merge eligible PRs in next cycle.
- Continue to next eligible issue batch automatically.

Governance:
- Merge is allowed automatically only when PR is approved + checks pass + no conflicts.
- Apply FE stack by layers, not as mutually exclusive alternatives.
- If requirements are ambiguous, ask concise clarifying questions and pause only for that blocker.
- If design guidance is missing for any implemented page/flow, do not proceed until user provides/approves guidance.
- Do not stop unless blocked by missing requirements or broken tooling that cannot be self-resolved.

Output after each cycle:
- Issues picked
- Changes made
- Tests run + results
- PR link(s)
- Merge/close actions performed
```

## Escalation Rules
1. If blocked by missing requirements, stop and ask explicit clarifying questions.
2. If blocked by permissions/tooling, report exact failing command and next action.
3. Do not bypass governance rules.
