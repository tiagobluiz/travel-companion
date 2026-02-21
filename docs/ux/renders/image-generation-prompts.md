# Image Generation Prompts (High-Fidelity UX Renders)

Use these prompts in ChatGPT image generation.  
Goal: premium restrained, modern web app UI, Wanderlog competitor direction, web-first with mobile excellence.

## Global Style Prefix (prepend to every prompt)
High-fidelity product UI mockup for a modern travel planning web app. Premium restrained aesthetic, not flashy. Material 3-inspired patterns, icon-led UI, rich visual hierarchy, clear spacing rhythm, polished cards/chips/tabs, subtle depth, no purple-dominant palette. Primary color blue/cyan family, neutral slate backgrounds, soft gradients. Use realistic labels/content (no lorem ipsum). Use modern icons similar to Material Symbols. Accessibility-aware contrast (WCAG AA intent). Do not produce code, only UI render.

## Prompt 1: Discovery/Auth Desktop
Create a desktop web app screen (1440x900) for "Discover public trips" in a travel planning product.  
Layout:
- Sticky top nav with brand, tabs: Discover (active), Sign in, Sign up.
- Hero section with aspirational but concise copy.
- Search bar + filter chips + sort control.
- Grid of public trip cards with cover thumbnails, metadata chips (Public, Updated), and icon buttons.
- Right-side panel showing auth-gate modal design for "Copy this trip".
- Use icons prominently, not text-only buttons.
- Include one strong primary CTA and secondary actions.
- Visual mood: premium, modern SaaS/travel blend.

## Prompt 2: Discovery/Auth Mobile
Create a mobile web screen (430x932) for public trip discovery.  
Layout:
- Compact top bar with brand and search icon.
- Search field, filter chips row, stacked trip cards with image headers.
- Bottom-sheet auth gate example triggered by "Copy this trip".
- Bottom navigation with icons: Home, Discover (active), Bell, Profile.
- Clear thumb-friendly spacing and touch targets.
- Premium restrained design, subtle gradients, icon-led actions.

## Prompt 3: Dashboard Desktop (Post-login) 
Layout:
- Global nav: Home (active), Discover, Notifications, Profile.
- Inner tabs: My Trips (active), Shared With Me, Public Feed.
- Default sorting control "Recently edited".
- Trip cards showing: trip image, dates, role badge (Owner/Editor/Viewer), visibility badge (Public/Private), quick actions.
- Right column: "Create trip" card and "Pending invites" summary.
- Include tasteful iconography and modern card components.

## Prompt 4: Dashboard Mobile
Create a mobile dashboard render (430x932).  
Layout:
- Header with greeting and profile avatar.
- Segmented control tabs for My Trips / Shared / Feed.
- Scrollable trip cards with role + visibility badges.
- Floating action button for New Trip.
- Bottom nav icons with Home active.
- Strong hierarchy and clean spacing, modern travel productivity feel.

## Prompt 5: Trip Planning Desktop (Core)
Create a desktop trip planning screen (1440x900), the most important flow.  
Layout:
- Trip header with title, date range, collaborator avatars, visibility chip.
- Subnav tabs: Itinerary (active), Collaborators, Expenses, Settings.
- Main split view:
  - Left: itinerary board with Day 1..Day N sections + "Places To Visit" backlog.
  - Cards include place name, notes preview, drag handle icon, quick action icons.
  - Clear add-item CTA.
  - Show relative ordering affordances.
  - Right: interactive-style map panel mock with pins and route hints.
- Must look like a modern flagship product screen.

## Prompt 6: Trip Planning Mobile (Hybrid Move UX)
Create a mobile trip planning screen (430x932) showing hybrid reorder UX.  
Layout:
- Day sections and Places To Visit list.
- Item cards with drag handle icon + overflow menu for fallback actions (Move, Edit, Delete).
- Sticky "Add item" action.
- Secondary map toggle button.
- Bottom nav visible.
- Show polished micro-interaction cues (drag state preview and insertion target line).

## Prompt 7: Collaborators Management
Create a desktop collaborators management tab render (1440x900).  
Layout:
- Members table/cards with avatar, role chip, status.
- Invite form (single email + role selector).
- Pending/declined invites with actions (Accept/Decline/Revoke for proper actors).
- Clear permission-aware UI states (disabled/hide patterns).
- Include audit-friendly activity snippet panel on the side.
- Premium, structured, icon-supported design.

## Prompt 8: Public Trip Detail (Read-only)
Create a desktop public trip detail screen (1440x900), read-only mode.  
Layout:
- Public badge and creator identity header.
- Full itinerary visible by day and Places To Visit.
- No edit controls shown.
- Primary CTA: "Copy this trip".
- Secondary CTA: "Sign in to collaborate".
- Include trust signals (last updated, completeness, collaborators count).

## Prompt 9: Full Profile (Phased MVP-first)
Create a desktop profile screen (1440x900) for travel app user account.  
Layout:
- Hero profile block with avatar, display name, bio, home city, travel identity.
- Active/upcoming trips module first.
- Stats row (trips, countries, saved places).
- Activity feed preview block.
- Account/security shortcuts on right.
- Visual style consistent with the rest of the app.

## Prompt 10: System States Board
Create a UI state board render (1600x1000) with multiple panels of the same product style:
- Loading state
- Empty state
- Validation error state
- Forbidden permission state
- Success confirmation toast state
Use the trip planning context and keep visual consistency with the product.

## Negative Prompt Suffix (append to all prompts)
No dribbble fantasy art, no glassmorphism overload, no neon cyberpunk, no dark-only design, no purple-dominant palette, no lorem ipsum blocks, no generic wireframe, no plain text-only buttons.

## Output Guidance
For each flow generate:
1. Desktop primary
2. Mobile primary
3. One key error/empty state variant
