# Motion Guidelines

## Motion Philosophy
Motion should clarify state changes, not entertain. Keep transitions subtle, fast, and predictable.

## Defaults
1. Duration:
- micro: 100-140ms
- standard: 160-220ms
- emphasis: 240-320ms
2. Easing:
- standard: ease-out cubic-bezier(0.2, 0.8, 0.2, 1)
- exit: ease-in cubic-bezier(0.4, 0, 1, 1)

## Allowed Motions
1. Page section fade/slide-in on entry.
2. Card hover lift on desktop only.
3. Modal and bottom-sheet transitions.
4. Drag feedback for itinerary item pickup/drop.

## Avoid
1. Long parallax or scroll-jacking behavior.
2. Repetitive bouncing loops.
3. Heavy blur and GPU-expensive effects on mobile.

## Reduced Motion
When `prefers-reduced-motion` is active:
1. Remove non-essential transforms.
2. Keep only instant or low-duration opacity transitions.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

