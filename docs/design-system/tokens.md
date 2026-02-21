# Design Tokens

## Purpose
Define reusable visual constants so implementation is consistent and scalable.

## Core Tokens

## Color
- `--color-primary-50` to `--color-primary-900`
- `--color-slate-50` to `--color-slate-900`
- `--color-success-*`
- `--color-warning-*`
- `--color-danger-*`

## Typography
- Font families:
  - `--font-sans-base`: "Plus Jakarta Sans", "Segoe UI", sans-serif
  - `--font-sans-display`: "Manrope", "Segoe UI", sans-serif
- Sizes:
  - `--text-xs` 12
  - `--text-sm` 14
  - `--text-md` 16
  - `--text-lg` 18
  - `--text-xl` 24
  - `--text-2xl` 32

## Spacing
- 4-point scale:
  - `--space-1` 4
  - `--space-2` 8
  - `--space-3` 12
  - `--space-4` 16
  - `--space-5` 20
  - `--space-6` 24
  - `--space-8` 32

## Radius
- `--radius-sm` 8
- `--radius-md` 12
- `--radius-lg` 16
- `--radius-xl` 24

## Elevation
- `--elevation-1`: subtle card shadow
- `--elevation-2`: raised container
- `--elevation-3`: modal/sheet

## Semantic Tokens

## Text
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--text-inverse`

## Surface
- `--surface-base`
- `--surface-subtle`
- `--surface-raised`
- `--surface-overlay`

## Border
- `--border-default`
- `--border-strong`
- `--border-focus`
- `--border-danger`

## Status
- `--status-success-bg` / `--status-success-fg`
- `--status-warning-bg` / `--status-warning-fg`
- `--status-danger-bg` / `--status-danger-fg`
- `--status-info-bg` / `--status-info-fg`

## Implementation Note
Map these tokens to Tailwind theme extension in FE lane before component restyling.

