# Travel Companion

A mobile-first travel planning and expense tracking web application.

## Tech Stack

- **Backend**: Kotlin 2.2, Spring Boot 3.5.x, Java 21, PostgreSQL 17
- **Frontend**: React 19, Vite 6, TypeScript, Tailwind CSS, TanStack Query, Zustand
- **Auth**: Spring Security, BCrypt, JWT

## Prerequisites

- Java 21+
- Node.js 22+
- Docker (for PostgreSQL)
- Gradle (or use the wrapper after `gradle wrapper` is run once)

## Quick Start

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend

# If gradle-wrapper.jar is missing, run once (requires Gradle installed):
# gradle wrapper

./gradlew bootRun
```

The API runs at http://localhost:8080.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173. The Vite dev server proxies `/auth` and `/trips` to the backend.

### 4. Run Tests

**Backend:**
```bash
cd backend
./gradlew test
```

**Frontend:**
```bash
cd frontend
npm run test:run
```

## Project Structure

```
tra/
├── backend/          # Kotlin Spring Boot (DDD)
│   └── src/main/kotlin/com/travelcompanion/
│       ├── domain/       # Aggregates, value objects, repository interfaces
│       ├── application/  # Use cases
│       ├── infrastructure/ # JPA, auth, persistence
│       └── interfaces/   # REST controllers
├── frontend/         # React Vite
└── docker-compose.yml
```

## Environment

Create `backend/src/main/resources/application-local.yml` to override settings:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/travel_companion
    username: postgres
    password: postgres

app:
  jwt:
    secret: your-256-bit-secret-key-at-least-32-characters-long
```

For production, set `JWT_SECRET` and use HTTPS.
