# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

### Database
- Start PostgreSQL (Docker): `docker-compose up -d`

### Backend (Kotlin/Spring Boot)
- Run API: `cd backend` then `./gradlew bootRun`
- Run all tests: `cd backend` then `./gradlew test`
- Run a single test class or method (Gradle):  
  `cd backend` then `./gradlew test --tests "com.travelcompanion.YourTestClass"`  
  or `./gradlew test --tests "com.travelcompanion.YourTestClass.yourTestMethod"`

### Frontend (React/Vite)
- Install deps: `cd frontend` then `npm install`
- Run dev server: `cd frontend` then `npm run dev`
- Build: `cd frontend` then `npm run build`
- Lint: `cd frontend` then `npm run lint`
- Run all tests (Vitest): `cd frontend` then `npm run test:run`
- Run a single test (Vitest):  
  `cd frontend` then `npm run test -- --run path/to/test-file.test.tsx`  
  or `npm run test -- -t "test name"`

## High-Level Architecture

- Monorepo with `backend/` (Kotlin Spring Boot) and `frontend/` (React/Vite).
- Backend follows a DDD-style layering under `backend/src/main/kotlin/com/travelcompanion/`:
  - `domain/`: aggregates, value objects, repository interfaces.
  - `application/`: use cases.
  - `infrastructure/`: persistence (JPA), auth, external integrations.
  - `interfaces/`: REST controllers and API layer.
- Frontend is a mobile-first React app using Vite, TypeScript, Tailwind CSS, TanStack Query, and Zustand.
- Vite dev server proxies `/auth` and `/trips` to the backend API.

## Configuration Notes

- Local overrides go in `backend/src/main/resources/application-local.yml` (not committed). Example includes DB connection and `app.jwt.secret`.
- Production expects `JWT_SECRET` and HTTPS for auth.
