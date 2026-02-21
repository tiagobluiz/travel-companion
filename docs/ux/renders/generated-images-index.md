# Generated Images Index

This file maps timestamped generated images to stable flow-based names so FE can implement against deterministic references.

## Source Directory
`docs/ux/renders/`

## Timestamp -> Stable Name Mapping

| Original File | Stable File |
|---|---|
| `ChatGPT Image Feb 21, 2026, 08_45_33 PM.png` | `discovery-auth-desktop-v1.png` |
| `ChatGPT Image Feb 21, 2026, 09_19_17 PM.png` | `discovery-auth-mobile-v1.png` |
| `ChatGPT Image Feb 21, 2026, 10_33_52 PM.png` | `dashboard-desktop-v1.png` |
| `ChatGPT Image Feb 21, 2026, 08_56_11 PM.png` | `dashboard-mobile-v1.png` |
| `ChatGPT Image Feb 21, 2026, 10_37_03 PM.png` | `trip-planning-desktop-v1.png` |
| `ChatGPT Image Feb 21, 2026, 10_41_57 PM.png` | `trip-planning-mobile-v1.png` |
| `ChatGPT Image Feb 21, 2026, 10_48_10 PM.png` | `collaborators-desktop-v1.png` |
| `ChatGPT Image Feb 21, 2026, 10_50_43 PM.png` | `public-trip-detail-desktop-v1.png` |
| `ChatGPT Image Feb 21, 2026, 10_55_37 PM.png` | `profile-desktop-v1.png` |
| `ChatGPT Image Feb 21, 2026, 10_53_51 PM.png` | `system-states-board-v1.png` |

## Flow Assignment

| Stable File | Flow | Device | State | Quality Notes | FE Ticket |
|---|---|---|---|---|---|
| `discovery-auth-desktop-v1.png` | Discovery/Auth shell + public discover | Desktop | Primary | Strong hierarchy and conversion modal; keep copy concise in implementation | #106 |
| `discovery-auth-mobile-v1.png` | Discovery/Auth shell + public discover | Mobile | Primary | Good mobile nav and gate sheet, maintain touch target sizes | #106 |
| `dashboard-desktop-v1.png` | Dashboard tabs + metadata + sorting | Desktop | Primary | Strong card density and right-side utility rail | #107 |
| `dashboard-mobile-v1.png` | Dashboard tabs + metadata + sorting | Mobile | Primary | Good tab clarity and FAB pattern | #107 |
| `trip-planning-desktop-v1.png` | Trip planning board + map split | Desktop | Primary | Use as main itinerary target for web | #108 |
| `trip-planning-mobile-v1.png` | Trip planning board hybrid move UX | Mobile | Primary | Shows fallback action menu; keep drag/fallback parity | #108 |
| `collaborators-desktop-v1.png` | Collaboration hybrid IA | Desktop | Primary | Good invite/member split and side activity context | #109 |
| `public-trip-detail-desktop-v1.png` | Public trip detail read-only | Desktop | Primary | Good CTA hierarchy (`Copy this trip`) | #106 |
| `profile-desktop-v1.png` | Full profile phased MVP | Desktop | Primary | Use as profile IA reference; implement phased modules | #110 |
| `system-states-board-v1.png` | Global state board | Mixed | System states | Use for loading/empty/error/forbidden/success visual consistency | #111 |

## How To Use
1. Use stable `*-v1.png` files in issue/PR descriptions.
2. Keep timestamped originals for provenance.
3. Document justified deviations in implementation PRs.
4. Treat these as guidance references; not pixel-perfect legal constraints.
