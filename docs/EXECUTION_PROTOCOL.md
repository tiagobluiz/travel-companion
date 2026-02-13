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

## Queue Mode Prompt (Backend/Frontend)
Use this when you want the agent to continuously pick work from the backlog.

```text
Queue mode enabled.

Global rules:
- At the beginning of each cycle, check open PRs and auto-merge any PR that:
  - has required approvals; and
  - has all required checks passing; and
  - has no merge conflicts.
- If a PR has merge conflicts (`dirty`/`conflicting`), resolve conflicts automatically:
  - update branch with latest PR target/base branch;
  - resolve conflicts preserving issue intent and current target/base branch invariants;
  - run relevant tests;
  - push the conflict-resolution commit;
  - re-check mergeability/check status.
- At the beginning of each cycle, check open issues and auto-close any issue that is already completed:
  - linked PR is merged and resolves the issue; or
  - acceptance criteria are fully delivered in the issue's delivery branch (normally the default branch) and validated.
- Before picking new work, check all open PRs for unanswered review comments.
- If unanswered comments exist, handle them first in-thread:
  - answer, challenge with rationale, or ask a clarifying follow-up question;
  - if the comment is clear and valid, implement the fix, run relevant tests, and push.
- Do not post self-review comments in PRs (another tool handles self-review).

Issue selection:
- Pick the next available issue in priority order.
- You may group related issues that touch the same topic to increase throughput:
  - target batch size: up to 5 issues;
  - allowed extension when tightly coupled: up to 7 issues total.
- For grouped issues, use one branch and one PR with all linked issues listed.

Execution constraints:
- Respect scope boundaries (`backend/**` for backend queue, `frontend/**` for frontend queue).
- Run required checks for the touched area before opening/updating PR.
- After opening/updating PR, continue to the next eligible issue batch automatically.

Deliver each cycle:
- issues picked
- changes made
- tests run + results
- PR link updated/created
```

## Escalation Rules
1. If blocked by missing requirements, stop and ask explicit clarifying questions.
2. If blocked by permissions/tooling, report exact failing command and next action.
3. Do not bypass governance rules.
