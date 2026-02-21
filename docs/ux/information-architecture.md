# Information Architecture

## Anonymous IA
Single-shell landing page with tabs:
1. Discover
2. Sign in
3. Sign up

Anonymous users can:
1. Browse public trips.
2. Search and filter public trips.
3. Open public trip detail in read-only mode.

Gated actions (copy/save) use modal auth prompts, not hard redirects.

## Authenticated IA
Primary destinations:
1. Home
2. Discover
3. Notifications (soft placeholder)
4. Profile

Trip detail sub-navigation:
1. Itinerary
2. Collaborators
3. Expenses
4. Settings

## Responsive Navigation
1. Desktop/tablet:
- top nav with contextual secondary tabs for trip sub-areas.
2. Mobile:
- bottom nav for primary destinations.
- in-page tabs for trip sub-navigation.

## Home IA
Home tabs:
1. My Trips
2. Shared With Me
3. Public Feed

Defaults:
1. My Trips sorted by recently edited.
2. Trip cards show dates, role, visibility.

## Collaboration IA
Hybrid model:
1. Inline summary in trip context (members count, pending invites).
2. Dedicated management tab for invite and role operations.

