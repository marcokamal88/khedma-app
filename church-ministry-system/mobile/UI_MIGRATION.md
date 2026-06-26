# UI Migration Summary

This document records the current screen-level UI state, design differences, and the migration approach for the Khedma mobile app.

## Current screen issues

- Many screens already use shared components, but the app still relied on platform tab bars instead of the reusable `AppTabBar` design.
- Screen-level layout relied on custom `StyleSheet` wrappers instead of a single shared navigation pattern.
- There was no centralized documentation for theme tokens and reusable component behavior.
- Empty state and loading patterns were implemented in places, but a consistent system was not clearly documented.

## Design differences

- Navigation should be driven by the design system using `AppTabBar` rather than default bottom-tab rendering.
- Theme values such as `colors.cream`, `spacing.md`, `borderRadius.lg`, and typography tokens must be the source of truth.
- Cards, badges, inputs, and buttons should share the same surface styles across role flows.
- Empty and loading states should use `AppEmptyState` and built-in `ActivityIndicator` conventions.

## Migration actions

- Added `CustomTabBar` to wire the bottom tab navigator to the reusable `AppTabBar` component.
- Updated servant, served-member, and leader bottom-tab stacks to use the shared `CustomTabBar`.
- Improved UI component prop typing and style flexibility in the design system components.
- Added `DESIGN_SYSTEM.md` to document colors, typography, spacing, shadows, component patterns, and navigation conventions.

## Screen-level notes

### Auth screens

- Current state: login and signup forms already use `AppInput` and `AppButton`.
- Improvement: preserve existing form workflow and use theme tokens for spacing.

### Dashboard and list screens

- Current state: `AppCard`, `AppBadge`, `AppEmptyState`, and `AppButton` are already in use.
- Improvement: centralize navigation styling with `AppTabBar` and keep list spacing consistent.

### Content and detail screens

- Current state: nested screens use cards and badge components effectively.
- Improvement: maintain existing business logic and surface layout while aligning each screen to the shared theme.

## What changed

- `mobile/tsconfig.json`: restricted compile types to React and React Native to improve toolchain consistency.
- `mobile/src/components/ui/*`: strengthened style prop typings across reusable components.
- `mobile/src/navigation/CustomTabBar.tsx`: new shared tab bar adapter for the design system.
- `mobile/src/navigation/stacks/*`: bottom-tab navigators now render the reusable `AppTabBar`.
- `mobile/DESIGN_SYSTEM.md`: documented the extracted design language for the product.

## Next steps

- Continue migrating any remaining custom screen wrappers toward shared layout patterns.
- Use `AppHeader` where a custom page header is required.
- Add automated visual regression checks or storybook stories for component validation.
