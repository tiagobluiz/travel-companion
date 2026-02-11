# Expenses V2 Contract (Scope Definition)

Issue: #8  
Status: Contract defined, implementation intentionally deferred.

## Goal

Define how expenses will reference trip participants when participants can be:
- accepted members
- pending invitees
- declined invitees (historical records only)

No runtime implementation is included in this phase.

## Current model (v1)

- `Expense` stores a single `userId` as creator.
- No split model.
- No participant references by invite status.

## Target model (v2 contract)

### Participant reference

All expense participant fields will use a stable participant reference:

- `participantType`: `MEMBER` | `INVITEE`
- `participantKey`:
  - for `MEMBER`: user id (UUID)
  - for `INVITEE`: normalized email (lowercase exact email, no alias normalization)

### Expense ownership and authorship

- `createdBy` remains the authenticated actor user id.
- Expense participants are independent from creator.
- Creator does not need to be a participant.

### Split lines

Future split representation:

- `amount`: decimal >= 0
- `currency`: ISO-4217 uppercase
- `participantRef`: (`participantType`, `participantKey`)
- `statusSnapshot`: `PENDING` | `ACCEPTED` | `DECLINED` at write time

### Invite lifecycle compatibility

- If an invitee accepts later and becomes a member, historical split lines must preserve original participant reference and status snapshot.
- Reporting views may provide a derived "linked member" mapping, but stored split records remain immutable.

### Validation rules (future)

- Participant references must belong to the same trip context.
- Duplicate participant refs within a single split set are rejected.
- Sum of splits must equal expense total (subject to rounding strategy defined in implementation story).

## API contract direction (future)

These fields are expected in future DTOs/endpoints:

- `participants[]` with participant refs
- `splits[]` with participant refs and amounts
- response expansion fields:
  - `participantDisplayName` (nullable)
  - `inviteStatus` snapshot

## Non-goals for this phase

- No database migration.
- No endpoint or domain behavior changes.
- No backfill.

## Follow-up implementation stories

- Implement participant reference storage and split schema migration.
- Implement invite/member linkage and write-time validation.
- Implement expense query projections for mixed member/invitee splits.

