# Critical Flows

## P0 Flows

## 1) Discovery to Conversion (Anonymous)
Goal: Let users evaluate value before login and convert with context.

Sequence:
1. User opens landing page.
2. User uses Discover tab and applies filters.
3. User opens public trip detail.
4. User taps Copy this trip.
5. Auth modal appears with Google and email options.
6. After auth, copy action resumes and creates user-owned copy.

Edge cases:
1. Public trip becomes private between list and detail.
2. Anonymous user opens stale deep link.
3. Auth succeeds but copy fails due to backend validation.

## 2) Signup to First Trip
Goal: Reach first value in under 2 minutes.

Sequence:
1. User signs up by email or Google.
2. User enters onboarding wizard.
3. Wizard requests trip name, dates, visibility.
4. User lands in newly created trip.
5. First CTA highlights Add itinerary item.

Edge cases:
1. Invalid date range.
2. Duplicate rapid submit.
3. Session timeout between steps.

## 3) Itinerary Planning (Board + Day Lists + Places To Visit)
Goal: Plan quickly across day lists and backlog.

Sequence:
1. User opens trip itinerary.
2. User adds item to day or places list.
3. User reorders via drag.
4. User falls back to move controls on mobile if needed.
5. User edits notes/day and deletes when needed.

Edge cases:
1. Drag collision failure.
2. Concurrent edits from another collaborator.
3. Invalid move anchor (before/after item not found).

## 4) Collaboration Management
Goal: Owners control invitations and roles with minimal confusion.

Sequence:
1. Owner opens collaborators tab.
2. Owner sends single invite with role.
3. Invitee accepts or declines.
4. Owner updates role or revokes invite.
5. Member leaves trip via self-remove action.

Edge cases:
1. Invite email case-insensitive exact matching rules.
2. Last owner leave protection.
3. Forbidden actions by non-owner.

## P1 Flows
1. Profile view and edit (phased implementation).
2. Notification placeholder navigation and empty state.
3. Dashboard discovery loop between owned and public trips.

## Critical Path Definitions
Each flow must define:
1. Entry points.
2. Preconditions.
3. User intents.
4. Success event.
5. Failure states.
6. Recovery actions.
