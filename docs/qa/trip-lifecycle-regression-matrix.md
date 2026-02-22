# Trip Lifecycle Regression Matrix (Issue #103)

Date validated: 2026-02-22

## Scope

- Active -> Archived
- Archived -> Restored
- Active/Archived -> Deleted
- Owner-only restrictions
- Dashboard tab correctness
- Cache refresh / invalidation behavior

## Backend validation

| Scenario | Coverage | Evidence |
|---|---|---|
| Active -> Archived | Integration | `TripControllerIntegrationTest#owner can archive and restore trip and list filter defaults to active` |
| Archived -> Restored | Integration | `TripControllerIntegrationTest#owner can archive and restore trip and list filter defaults to active` |
| Active/Archived -> Deleted | Integration | `TripControllerIntegrationTest#owner can delete active and archived trip and editor cannot delete` |
| Owner-only archive/restore | Integration | `TripControllerIntegrationTest#archive and restore are owner only` |
| Owner-only delete | Integration | `TripControllerIntegrationTest#owner can delete active and archived trip and editor cannot delete` |
| List filter ACTIVE/ARCHIVED/ALL + invalid filter | Integration | `TripControllerIntegrationTest#owner can archive and restore...`, `#trip list rejects invalid status filter` |

## Frontend validation

| Scenario | Coverage | Evidence |
|---|---|---|
| Dashboard active tab default + archived tab switch | Component test | `DashboardPage.test.tsx#loads active trips by default and can switch to archived tab` |
| Archived empty state tab correctness | Component test | `DashboardPage.test.tsx#shows archived empty state when archived tab has no trips` |
| Active -> Archived confirmation flow | Component test | `TripDetailPage.test.tsx#requires confirmation before archiving a trip` |
| Archived -> Restored confirmation flow | Component test | `TripDetailPage.test.tsx#shows restore action for archived trips and requires confirmation` |
| Active -> Deleted confirmation flow | Component test | `TripDetailPage.test.tsx#requires confirmation before deleting an active trip` |
| Archived -> Deleted confirmation flow | Component test | `TripDetailPage.test.tsx#allows deleting an archived trip with confirmation` |
| Owner-only destructive actions visibility | Component test | `TripDetailPage.test.tsx#non-owners do not see archive restore or delete actions` |
| Cache refresh after archive/restore/delete | Hook test | `useTripMutations.test.tsx#invalidates trips and calls callback after delete`, `#invalidates trips and calls callback after archive/restore` |

## Execution commands (green target)

- `cd backend && ./gradlew test`
- `cd frontend && npm run lint`
- `cd frontend && npm run test:run`
- `cd frontend && npm run build`
