# Content and i18n Guidelines

## Content Style
1. Use concise, action-first labels.
2. Keep error copy specific and recoverable.
3. Mix practical and aspirational tone without long marketing paragraphs.

## English-First Rules
1. Ship English copy first.
2. Avoid hard-coded concatenated strings in UI components.
3. Use key-based message catalog strategy for future localization.

## Localization-Ready Constraints
1. Avoid fixed-width text containers for labels.
2. Support 30-40% text expansion without layout break.
3. Keep date and number formatting locale-aware.

## Controlled Vocabulary
1. Use "Trip", "Itinerary", "Day", "Places To Visit", "Collaborators" consistently.
2. Avoid synonym drift across screens and API surfaces.

## Error Message Pattern
1. What happened.
2. Why it happened (when safe).
3. What user can do next.

Example:
"You cannot edit this trip because your role is Viewer. Ask an owner for Editor access."

