# Execution Protocol - Parallel Agents (Backend + Frontend)

## Objective
Run multiple coding agents in parallel with safe boundaries, while keeping merge authority with the repository owner.

## Core Rules
1. Agents may create branches, commits, and PRs.
2. Agents must not merge PRs unless explicitly authorized by the owner in that thread.
3. The owner performs final review and merge.

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

## Agent Self-Review (Mandatory for Agent-Opened PRs)
Before handing a PR to the owner, the agent must run and report:
1. Required checks for touched areas (backend/frontend commands listed below).
2. Diff review for regressions, permission/security risks, and contract drift.
3. File hygiene verification (no unintended generated files, secrets, or unrelated edits).
4. PR metadata verification (linked issue, scope, risks, rollback notes).
5. Explicit handoff statement: "Ready for owner review and manual merge."

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

```
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

## Escalation Rules
1. If blocked by missing requirements, stop and ask explicit clarifying questions.
2. If blocked by permissions/tooling, report exact failing command and next action.
3. Do not bypass governance rules.