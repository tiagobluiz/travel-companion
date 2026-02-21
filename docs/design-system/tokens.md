# Design Tokens

## Purpose
Define reusable visual constants so implementation is consistent and scalable.

## Core Tokens

### Color
- `--color-primary-50` to `--color-primary-900`
- `--color-slate-50` to `--color-slate-900`
- `--color-success-*`
- `--color-warning-*`
- `--color-danger-*`

### Typography
- Font families:
  - `--font-sans-base`: "Plus Jakarta Sans", "Segoe UI", sans-serif
  - `--font-sans-display`: "Manrope", "Segoe UI", sans-serif
- Sizes:
  - `--text-xs` 12px
  - `--text-sm` 14px
  - `--text-md` 16px
  - `--text-lg` 18px
  - `--text-xl` 24px
  - `--text-2xl` 32px

### Spacing
- 4-point scale:
  - `--space-1` 4px
  - `--space-2` 8px
  - `--space-3` 12px
  - `--space-4` 16px
  - `--space-5` 20px
  - `--space-6` 24px
  - `--space-8` 32px

### Radius
- `--radius-sm` 8px
- `--radius-md` 12px
- `--radius-lg` 16px
- `--radius-xl` 24px

### Elevation
- `--elevation-1`: subtle card shadow
- `--elevation-2`: raised container
- `--elevation-3`: modal/sheet

## Semantic Tokens

### Text
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--text-inverse`

### Surface
- `--surface-base`
- `--surface-subtle`
- `--surface-raised`
- `--surface-overlay`

### Border
- `--border-default`
- `--border-strong`
- `--border-focus`
- `--border-danger`

### Status
- `--status-success-bg` / `--status-success-fg`
- `--status-warning-bg` / `--status-warning-fg`
- `--status-danger-bg` / `--status-danger-fg`
- `--status-info-bg` / `--status-info-fg`

## Implementation Note
Map these tokens to Tailwind theme extension in FE lane before component restyling.

