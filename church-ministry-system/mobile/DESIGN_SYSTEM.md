# Khedma Mobile Design System

This document captures the app's reusable design language, theme tokens, component patterns, and layout conventions. It is built from the current mobile app theme and UI library.

## Color palette

- `cream`: #f7f4ed — primary surface/background tone.
- `offWhite`: #fcfbf8 — secondary surface and light fields.
- `lightCream`: #eceae4 — subtle background accent.
- `charcoal`: #1c1c1c — primary text and dark actions.
- `ink`: #030303 — highest contrast text.
- `mutedGray`: #5f5f5d — secondary text and muted labels.

Functional colors:

- `success`: #2e7d32
- `error`: #c62828
- `warning`: #e65100
- `info`: #1565c0
- `focusRing`: rgba(59,130,246,0.5)

Semantic aliases:

- `background`: #f7f4ed
- `surface`: #f7f4ed
- `surfaceAlt`: #fcfbf8
- `border`: #eceae4
- `borderStrong`: rgba(28,28,28,0.4)
- `textPrimary`: #1c1c1c
- `textSecondary`: #5f5f5d
- `tabInactive`: #5f5f5d
- `overlay`: rgba(0,0,0,0.4)

## Typography scale

- `displayHero`: 36 / 700 / 40 (hero headings)
- `sectionHeading`: 28 / 600 / 32
- `subHeading`: 22 / 600 / 26
- `cardTitle`: 18 / 600 / 22
- `bodyLarge`: 17 / 400 / 24
- `body`: 15 / 400 / 22
- `button`: 15 / 500 / 20
- `buttonSmall`: 13 / 500 / 18
- `caption`: 13 / 400 / 18
- `overline`: 11 / 600 / 14

Font family uses the platform system font:

- iOS: `System`
- Android: `Roboto`
- Web/default: `System`

## Font weights

- `700` for bold hero headings
- `600` for section headings, card titles, overlines
- `500` for buttons and emphasized text
- `400` for body copy and captions

## Spacing system

- `xxs`: 4
- `xs`: 8
- `sm`: 12
- `md`: 16
- `lg`: 20
- `xl`: 24
- `xxl`: 32
- `xxxl`: 40
- `xxxxl`: 56

## Border radius values

- `sm`: 4
- `md`: 6
- `lg`: 8
- `xl`: 12
- `full`: 9999

## Shadows

- `none`
- `card`: subtle light shadow for elevated cards (`shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1`)
- `buttonInset`: simulated inset highlight with top/bottom border lines for tactile sections

## Component styles

### AppButton

Variants:

- `primary`: charcoal fill, off-white text
- `secondary`: transparent background with charcoal border
- `ghost`: transparent background and charcoal text
- `danger`: red fill with off-white text
- `success`: green fill with off-white text

Sizes:

- `sm`: height 36
- `md`: height 44
- `lg`: height 52

Loading state: shows an `ActivityIndicator` with a matching text color.

### AppCard

- default `flat` card: cream background, rounded corners, padded content
- `bordered`: adds a 1px border with the theme border color
- `highlighted`: stronger charcoal border for emphasis

### AppInput

- cream fill with soft border
- rounded corners and medium padding
- label sits above the field with caption typography
- error state moves border to error red and shows helper text below

### AppModal

- centered overlay with dark translucent backdrop
- padded surface with rounded corners and action buttons below

### AppHeader

- horizontal header bar with optional back and right actions
- centered title using `subHeading` typography

### AppAvatar

- circular initials avatar with charcoal background and off-white text

### AppBadge

- small pill badges with colored backgrounds and overline typography

### AppTabBar

- bottom tab bar pattern with simple icon + label buttons
- active state uses charcoal; inactive state uses muted gray

### AppBottomSheet

- drag-to-close bottom drawer with handle and title area

### AppListItem

- row item with optional icon, title, subtitle, and right arrow
- uses cream surface and bottom divider line

### AppEmptyState

- centered layout with icon, title, and optional description
- useful for empty lists and zero-data screens

## Navigation patterns

- Auth flow uses a native stack with hidden default header for clean onboarding screens.
- Main app uses bottom tabs for role-based flows and a stack navigator for contextual flows.
- `CustomTabBar` injects the reusable `AppTabBar` component into bottom navigation.

## Layout structure

- Root containers use `backgroundColor: colors.cream` for a warm, approachable app background.
- Screen content is spaced consistently with `spacing.md` / `spacing.xl` gutters.
- Cards and panels use `colors.surface` and `borderRadius.lg`.

## Empty states

- Use `AppEmptyState` for list screens and search/no-result screens.
- Keep messaging concise and center-aligned.

## Loading states

- Use `ActivityIndicator` in a centered full-screen container for data fetch states.
- Use button-level loading states inside `AppButton` for inline actions.

## Implementation guidance

- Prefer theme tokens from `src/theme` rather than hardcoded values.
- Use `AppButton`, `AppCard`, `AppInput`, `AppBadge`, and `AppEmptyState` as foundational building blocks.
- Keep screen-level layout and spacing consistent across role flows.
- Avoid mixing raw color and spacing values when a theme token already exists.
