# Khedma App — Design System (Lovable-Inspired)

## Philosophy
Warm, paper-like, human-first. Cream canvas, charcoal ink, opacity-driven grays. Borders contain, shadows are reserved for interactive feedback. Arabic-first with English support.

---

## 1. Colors

### Core Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | `#f7f4ed` | Page background, card surfaces, elevated panels |
| `charcoal` | `#1c1c1c` | Primary text, headings, dark button backgrounds |
| `offWhite` | `#fcfbf8` | Text on dark backgrounds, subtle highlights |
| `lightCream` | `#eceae4` | Borders, dividers, card outlines, input strokes |
| `mutedGray` | `#5f5f5d` | Secondary text, descriptions, captions, placeholders |
| `ink` | `#030303` | Highest-emphasis text (hero headlines) |

### Opacity-Driven Grays
| Token | Value | Usage |
|-------|-------|-------|
| `charcoal83` | `rgba(28,28,28,0.83)` | Strong secondary text |
| `charcoal82` | `rgba(28,28,28,0.82)` | Body copy |
| `charcoal40` | `rgba(28,28,28,0.4)` | Interactive borders, button outlines |
| `charcoal4` | `rgba(28,28,28,0.04)` | Subtle hover backgrounds, micro-tints |
| `charcoal3` | `rgba(28,28,28,0.03)` | Barely-visible overlays |

### Functional Colors
| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#2e7d32` | Approved, present, earned, positive |
| `error` | `#c62828` | Rejected, absent, errors, negative |
| `warning` | `#e65100` | Pending, draft, in-progress |
| `info` | `#1565c0` | Info, link, interactive accent |
| `focusRing` | `rgba(59,130,246,0.5)` | Focus state ring |

---

## 2. Typography

### Font Family
- **Display**: `System` (San Francisco on iOS, Roboto on Android) — `fontFamily` not explicitly set; uses system default
- **Weights**: `400` (regular, body), `500` (medium, emphasis), `600` (semibold, headings), `700` (bold, display)

### Type Scale
| Role | Size | Weight | Line Height | Letter Spacing | Style Name |
|------|------|--------|-------------|----------------|------------|
| Display Hero | 36px (2.25rem) | 700 | 1.10 | -0.9px | `displayHero` |
| Section Heading | 28px (1.75rem) | 600 | 1.15 | -0.5px | `sectionHeading` |
| Sub Heading | 22px (1.375rem) | 600 | 1.20 | -0.3px | `subHeading` |
| Card Title | 18px (1.125rem) | 600 | 1.25 | normal | `cardTitle` |
| Body Large | 17px (1.063rem) | 400 | 1.40 | normal | `bodyLarge` |
| Body | 15px (0.938rem) | 400 | 1.50 | normal | `body` |
| Button | 15px (0.938rem) | 500 | 1.00 | 0.3px | `button` |
| Button Small | 13px (0.813rem) | 500 | 1.00 | 0.2px | `buttonSmall` |
| Caption | 13px (0.813rem) | 400 | 1.40 | normal | `caption` |
| Overline | 11px (0.688rem) | 600 | 1.30 | 1.0px | `overline` |

### Arabic Considerations
- Arabic script reads at same sizes; letter-spacing is not applied to Arabic text
- Line heights may be slightly tighter for Arabic

---

## 3. Spacing

| Token | Pixels | Rem |
|-------|--------|-----|
| `xxs` | 4 | 0.25 |
| `xs` | 8 | 0.5 |
| `sm` | 12 | 0.75 |
| `md` | 16 | 1.0 |
| `lg` | 20 | 1.25 |
| `xl` | 24 | 1.5 |
| `xxl` | 32 | 2.0 |
| `xxxl` | 40 | 2.5 |
| `xxxxl` | 56 | 3.5 |

---

## 4. Border Radius

| Token | Pixels | Usage |
|-------|--------|-------|
| `sm` | 4 | Micro elements, tags, badges |
| `md` | 6 | Buttons, inputs, compact elements |
| `lg` | 8 | Cards, containers |
| `xl` | 12 | Modals, bottom sheets |
| `full` | 9999 | Pills, avatars, circular elements |

---

## 5. Shadows & Elevation

| Level | Style | Usage |
|-------|-------|-------|
| 0 (Flat) | None | Page background, cream surfaces |
| 1 (Bordered) | `1px solid #eceae4` | Cards, containers, panels |
| 2 (Inset) | `inset 0 1px 0 rgba(255,255,255,0.2)` + `inset 0 -1px 0 rgba(0,0,0,0.05)` | Dark buttons (pressed look) |
| 3 (Focus) | `0 0 0 3px rgba(59,130,246,0.5)` | Focus ring |

In React Native:
- **Shadow token**: `{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }` for card depth
- **No shadow**: Flat cards use border only (Lovable default)

---

## 6. Components

### AppButton
| Variant | Background | Text Color | Border | Shadow |
|---------|-----------|------------|--------|--------|
| `primary` | `#1c1c1c` | `#fcfbf8` | None | Inset |
| `secondary` | Transparent | `#1c1c1c` | `1px rgba(28,28,28,0.4)` | None |
| `ghost` | Transparent | `#1c1c1c` | None | None |
| `danger` | `#c62828` | `#fcfbf8` | None | Inset |
| `success` | `#2e7d32` | `#fcfbf8` | None | Inset |

### AppCard
- Background: `#f7f4ed` (cream)
- Border: `1px solid #eceae4`
- Radius: `8px` (lg)
- Padding: `16px`
- No shadow (flat)

### AppInput
- Border: `1px solid #eceae4`
- Focus border: `rgba(28,28,28,0.4)`
- Focus ring: `rgba(59,130,246,0.5)`
- Background: `#f7f4ed`
- Radius: `6px` (md)
- Padding: `12px 14px`
- Placeholder color: `#5f5f5d`

### AppHeader
- Background: `#f7f4ed`
- Border-bottom: `1px solid #eceae4`
- Title: Section Heading (28px, 600)
- Back button: charcoal 40% outline or ghost

---

## 7. Navigation (Bottom Tabs)

- Background: `#f7f4ed` (cream)
- Top border: `1px solid #eceae4`
- Active tab: charcoal icon + label
- Inactive tab: muted gray icon + label
- Label style: Caption (13px, 400)

---

## 8. Icons

- Use `@expo/vector-icons` (Ionicons)
- Size: `20px` inline, `24px` prominent
- Color: `#1c1c1c` default, `#5f5f5d` muted
- Line thickness: consistent 2px feel (Ionicons default)

---

## 9. Empty States

- Icon: Large (48px), muted gray (`#5f5f5d`)
- Title: Body Large (17px, 600), charcoal
- Description: Body (15px, 400), muted gray
- Centered layout with `xxl` (24px) gap between elements

---

## 10. Loading States

- Full-screen: Centered `ActivityIndicator`, charcoal color
- Inline: Small `ActivityIndicator` + caption text
- Skeleton: Not used (prefer spinner + message)

---

## 11. Badge / Status Indicator

| Variant | Background | Text Color |
|---------|-----------|------------|
| Active/Success | `#2e7d32` | `#fcfbf8` |
| Draft/Pending/Warning | `#e65100` | `#fcfbf8` |
| Inactive/Error | `#c62828` | `#fcfbf8` |
| Info/Neutral | `rgba(28,28,28,0.4)` | `#fcfbf8` |

---

## 12. RTL Support

- All horizontal margins/paddings use `marginStart`/`paddingStart` or `I18nManager.isRTL` conditional
- Arrows flip direction
- Input text aligns to natural start
- Border positions mirror in RTL
- Tab bar items maintain order (left-to-right in LTR, right-to-left in RTL)
