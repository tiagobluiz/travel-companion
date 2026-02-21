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
7. FE stack requirements acknowledged in issue scope.

## Design Interpretation Rule
Reference images are layout and intent guides, not pixel-locked constraints.
1. Engineers are encouraged to improve visual quality and interaction patterns.
2. Improvements must be justified with UX arguments (clarity, accessibility, conversion, reduced friction, consistency).
3. Any meaningful deviation from a reference image must be documented in PR notes with rationale.

## Consistency Enforcement Rule (Top Priority)
The entire product UX must remain consistent to the smallest detail. This rule takes precedence over individual screen preferences.
1. New UI must use shared tokens, component patterns, and interaction rules.
2. Local optimizations that break system consistency are not allowed.
3. PRs must include a short "consistency check" note describing how the change aligns with product-wide UX language.
4. If a new pattern is introduced, it must be generalized and documented before reuse.

## FE Stack Requirements
Use modern production-grade FE tooling by default:
1. Material UI (MUI) for component foundation and theming.
2. React Hook Form for form state and submission handling.
3. Zod for schema-based validation and typed form contracts.
4. Additional state-of-the-art libraries are allowed and encouraged when they provide clear UX/maintainability gains.

## Required Validation for FE PRs
1. `npm run lint`
2. `npm run test:run`
3. `npm run build`
