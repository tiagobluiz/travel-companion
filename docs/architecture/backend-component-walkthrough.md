# Backend Component Walkthrough

## Document Metadata
- Status: Active backend architecture walkthrough
- Reviewed on: 2026-02-22
- Scope: Backend (`backend/**`)

## Package Map
```mermaid
flowchart TB
    subgraph Interfaces["interfaces/rest"]
      C1[AuthController]
      C2[TripController]
      C3[ItineraryController]
      C4[ExpenseController]
      C5[TripCollaboratorController]
      C6[AuditController]
      EH[GlobalExceptionHandler]
    end

    subgraph Application["application/*"]
      U1[RegisterUserService]
      U2[LoginService]
      T1[Trip CRUD Services]
      T2[ItineraryV2Service]
      T3[ManageTripMembershipService]
      T4[LinkPendingInvitesOnRegistrationService]
      E1[Expense Services]
    end

    subgraph Domain["domain/*"]
      D1[Trip Aggregate]
      D2[Expense Entity]
      D3[User Entity]
      Ports[Repository Interfaces]
    end

    subgraph Infra["infrastructure/*"]
      I1[JpaTripRepository]
      I2[JpaExpenseRepository]
      I3[JpaUserRepository]
      I4[JwtAuthenticationFilter + JwtService]
      I5[AuditEventWriter + AuditQueryService]
    end

    Interfaces --> Application --> Domain
    Application --> Ports --> Infra
```

## Component Responsibilities
- `domain.trip.Trip`:
  - enforces trip invariants, itinerary mutation logic, and role-based membership rules.
- `application.trip.*`:
  - orchestration/use-cases; delegates invariant checks to domain and persistence to repositories.
- `infrastructure.persistence.JpaTripRepository`:
  - maps aggregate to relational model (`trips`, `trip_memberships`, `trip_invites`) and emits audit events.
- `infrastructure.auth.*`:
  - token creation and request authentication context.
- `interfaces.rest.*`:
  - HTTP contract, request validation, and mapping to application services.

## Persistence Model
```mermaid
erDiagram
    USERS ||--o{ TRIPS : "owns (owner_id)"
    TRIPS ||--o{ TRIP_MEMBERSHIPS : "has"
    TRIPS ||--o{ TRIP_INVITES : "has"
    TRIPS ||--o{ EXPENSES : "has"
    AUDIT_EVENTS }o--|| USERS : "actor_id (nullable)"

    USERS {
      uuid id PK
      string email
      string password_hash
      string display_name
      instant created_at
    }
    TRIPS {
      uuid id PK
      uuid owner_id FK
      string name
      date start_date
      date end_date
      string visibility
      jsonb itinerary_items
      instant created_at
    }
    TRIP_MEMBERSHIPS {
      uuid trip_id PK,FK
      uuid user_id PK,FK
      string role
      instant created_at
    }
    TRIP_INVITES {
      uuid id PK
      uuid trip_id FK
      string email
      string role
      string status
      instant created_at
    }
    EXPENSES {
      uuid id PK
      uuid trip_id FK
      uuid user_id FK
      decimal amount
      string currency
      string description
      date date
      instant created_at
    }
```

## API Surface (Backend)
- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Trips:
  - `POST /trips`
  - `GET /trips`
  - `GET /trips/{id}`
  - `PUT /trips/{id}`
  - `DELETE /trips/{id}`
- Itinerary:
  - `GET /trips/{tripId}/itinerary/v2`
  - `POST /trips/{tripId}/itinerary/v2/items`
  - `PUT /trips/{tripId}/itinerary/v2/items/{itemId}`
  - `POST /trips/{tripId}/itinerary/v2/items/{itemId}/move`
  - `DELETE /trips/{tripId}/itinerary/v2/items/{itemId}`
- Expenses:
  - `POST /trips/{tripId}/expenses`
  - `GET /trips/{tripId}/expenses`
  - `PUT /trips/{tripId}/expenses/{expenseId}`
  - `DELETE /trips/{tripId}/expenses/{expenseId}`
- Collaboration:
  - `/trips/{tripId}/collaborators`, `/invites`, `/members`, role endpoints.
- Audit:
  - `GET /audit/events`

## Current Architectural Shape
- Strengths:
  - clear DDD-style package boundaries,
  - aggregate-level invariants are strongly encoded,
  - integration tests cover major user journeys.
- Main systemic weaknesses:
  - inconsistent authorization contract handling,
  - heavy repository-level write strategy for aggregate children,
  - repeated controller plumbing and repeated test helper logic.
