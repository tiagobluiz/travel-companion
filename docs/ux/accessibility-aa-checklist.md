# WCAG AA Checklist

## Global
1. Color contrast meets AA minimums.
2. Interactive controls have visible focus styles.
3. Touch targets are at least 44x44 px.
4. All forms have explicit labels and error associations.
5. Semantic headings follow hierarchical order.

## Navigation
1. Keyboard navigation reaches all primary nav items.
2. Active state is exposed visually and programmatically.
3. Skip-to-content link is available on desktop and mobile.

## Forms
1. Required fields are conveyed with text, not color alone.
2. Validation errors are actionable and attached to fields.
3. Submission busy state has accessible loading text.

## Itinerary Interaction
1. Drag interaction has keyboard-equivalent move controls.
2. Reorder outcomes are announced with accessible status messages.
3. Move destination context (day/backlog) is explicit in labels.

## Public Discovery
1. Card actions are keyboard accessible.
2. Filter controls are screen-reader friendly.
3. Modal auth prompts trap focus and restore focus after close.

## Pre-Release Audit
1. Run axe or equivalent checks on P0 routes.
2. Manual keyboard traversal for all P0 actions.
3. Mobile screen reader smoke test on at least one iOS and one Android browser.
