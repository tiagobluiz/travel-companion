# Render Artifacts

## Purpose
This folder stores UX render references used by FE implementation tickets.

## Structure
1. `discovery-auth/`
2. `trip-planning/`
3. Root-level generated images (`ChatGPT Image ... .png`) with mapping in `generated-images-index.md`

Each flow folder should include:
1. desktop render.
2. mobile render.
3. state variants when needed (loading, empty, error, forbidden).

## Status Labels
Use filename suffixes:
1. `-draft`
2. `-approved`
3. `-handoff`

Example:
`desktop-handoff.svg`

## Handoff Rules
1. Complex flows require high-fidelity board and coded mock page.
2. Simple flows may use guideline-level visuals with explicit behavior notes.
3. Timestamped generated images must be referenced via `generated-images-index.md` before FE consumption.

## Current Generated Assets
You added root-level generated PNGs on February 21, 2026.
Use this file for traceability:
- `docs/ux/renders/generated-images-index.md`
