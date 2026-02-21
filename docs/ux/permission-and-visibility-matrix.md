# Permission and Visibility Matrix

## Roles
1. Anonymous: not authenticated.
2. Viewer: member with view-only rights.
3. Editor: member with planning edit rights.
4. Owner: full trip administration rights.
5. Pending invitee: invited user with pending status; can participate in planning/expenses by business rule.

## Visibility Rules
1. Public trip detail is readable by anonymous users.
2. Private trips are only readable by members.
3. Mutations always require authenticated role checks.

## Capability Matrix

| Capability | Anonymous | Viewer | Pending Invitee | Editor | Owner |
|---|---|---|---|---|---|
| View public trip | Yes | Yes | Yes | Yes | Yes |
| View private member trip | No | Yes | Yes | Yes | Yes |
| Add/edit/delete itinerary | No | No | Yes | Yes | Yes |
| Reorder/move itinerary | No | No | Yes | Yes | Yes |
| Manage collaborators | No | No | No | No | Yes |
| Edit trip details | No | No | No | Yes | Yes |
| Edit trip privacy | No | No | No | No | Yes |
| Manage expenses | No | No | Yes | Yes | Yes |
| Delete trip | No | No | No | No | Yes |

## UI Requirements
1. Hide unavailable actions when role cannot execute them.
2. Keep view-only content visible where policy allows.
3. Show reason text for disabled/hid actions on role-sensitive surfaces.

## Error Handling Requirements
1. 401: prompt auth.
2. 403: show role/permission message.
3. 404 on private resources for unauthorized visibility should not leak details.

