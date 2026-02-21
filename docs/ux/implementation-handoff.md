# UX to FE Handoff

## Branch/Lane Strategy
1. `lane/ux-foundation` for docs/tokens/renders only.
2. `lane/discovery-auth`
3. `lane/dashboard-nav`
4. `lane/trip-planning`
5. `lane/collaboration-profile`
6. `lane/final-integration`

## Merge Order
1. Discovery/Auth shell and public discovery.
2. Dashboard IA and tab model.
3. Trip detail planning UX upgrades.
4. Collaboration hybrid IA.
5. Profile phased implementation and notification placeholder.
6. Final integration and regression pass.

## Conflict Controls
1. Single lane owns each primary file domain.
2. Shared interfaces are frozen in contract issues first.
3. Rebase lane branches on target daily.
4. Avoid parallel edits to same component roots.

## Ticket Readiness Checklist
1. Flow doc approved.
2. State matrix complete.
3. Accessibility checklist complete.
4. Responsive behavior complete.
5. Render references attached.
6. Acceptance criteria measurable.

## Required Validation for FE PRs
1. `npm run lint`
2. `npm run test:run`
3. `npm run build`

