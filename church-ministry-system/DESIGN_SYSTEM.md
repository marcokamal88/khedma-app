# Khedma App — Design System & Style Guide (Reference)

## 1. Overview & Philosophy
The **Khedma (خدمة) Ministry System** is an Arabic-first church ministry management platform. Its visual identity balances warm, paper-like warmth (Lovable-inspired cream canvas) with dignified church heritage (deep navy and warm liturgical gold).

Key principles:
1. **Arabic-First (RTL)**: Every component naturally flows from Right to Left.
2. **Compact & Information-Dense**: Maximum usable screen space without unnecessary visual bloat.
3. **Paper & Ink Hierarchy**: Warm cream background, clean off-white card surfaces, charcoal ink, and subtle 1px border lines rather than heavy drop shadows.

---

## 2. Color Palette & Tokens

### Primary Theme Colors
| Token | Hex | Usage |
|---|---|---|
| `NAVY` | `#192f5f` | Brand signature, AppHeader background, active drawer, primary buttons, avatars |
| `GOLD` | `#d4a843` | Secondary action highlights, "+" add buttons, award badges, switch buttons |
| `CREAM` | `#f7f4ed` | App root canvas, screen backgrounds, scroll view surfaces |
| `OFF_WHITE` | `#fcfbf8` / `#ffffff` | Content cards, bottom sheets, modal dialogs, input backgrounds |
| `BORDER` | `#eceae4` | 1px card outlines, list item dividers, modal separators |
| `CHARCOAL` | `#1c1c1c` | Primary text, titles, headlines, high-emphasis icons |
| `MUTED` | `#5f5f5d` / `#8c8a84` | Subtitles, meta tags, timestamps, disabled labels |
| `CRIMSON` | `#9b1b30` / `#c62828` | Logout button, delete actions, rejection notices |
| `GREEN` / `LIGHT_GREEN` | `#2e7d32` / `#E6F5EE` | Taio points badge, 80%+ attendance pill, success states |
| `WARN_ORANGE` / `WARN_BG` | `#e65100` / `#fff3e0` | 60%-79% attendance warning, pending/draft status |

---

## 3. Typography Scale & Fonts

The app relies on the platform native typography with explicit Arabic rendering properties:
- **Android**: Roboto / Noto Sans Arabic
- **iOS**: San Francisco / Apple Arabic

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `displayHero` | 32px | 700 (Bold) | 36px | Main screen titles, hero metrics |
| `sectionHeading` | 20px - 22px | 700 (Bold) | 26px | Section headers ("آخر جلسات الحضور", "المخدومين") |
| `cardTitle` | 16px - 17px | 600 (Semibold) | 22px | Student names, lesson titles, list headers |
| `body` | 14px - 15px | 400 - 500 | 20px | Standard text, list items, description |
| `button` | 15px | 600 (Semibold) | 20px | Main buttons, modal actions |
| `buttonSmall` | 13px | 600 (Semibold) | 18px | Chip filters, compact action buttons |
| `caption` | 12px - 13px | 400 (Regular) | 16px | Subtitles, class meta, timestamps |
| `overline` | 11px | 600 (Semibold) | 14px | Micro badges, category labels, drawer group titles |

> [!IMPORTANT]
> **Arabic Text Rules**:
> - Never apply `letterSpacing` to Arabic text (it disrupts cursive glyph connections).
> - Always specify `textAlign: "right"` and `writingDirection: "rtl"` for RTL text nodes.

---

## 4. Layout Architecture & Arabic (RTL) Guidelines

### A. RTL Flow in React Native
The application forces RTL layout at startup via:
```tsx
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}
```

### B. Horizontal List Rows (Avatar + Name + Badges)
In standard RTL flex rows (`flexDirection: "row"`), children naturally flow from **Right (Start) to Left (End)**.

**The Golden Pattern for Member/Student Rows**:
```tsx
<TouchableOpacity style={styles.row}>
  <View style={styles.rowRight}>
    {/* 1. Avatar at the far right */}
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>

    {/* 2. Name immediately next to the avatar (no flex: 1 on the Text) */}
    <Text style={styles.name} numberOfLines={1}>
      {fullName}
    </Text>

    {/* 3. Flexible spacer to push trailing badges to the left */}
    <View style={{ flex: 1 }} />

    {/* 4. Badges and actions on the far left */}
    <View style={styles.pointsBadge}>...</View>
    <View style={styles.statusBadge}>...</View>
  </View>
  <Text style={styles.actionIcon}>✎</Text>
</TouchableOpacity>
```

**Why this pattern is mandatory**:
If `flex: 1` is applied directly to the `<Text style={styles.name}>` element, Android's text engine stretches the text box across the entire row and aligns the text against the trailing badges, creating an unwanted empty gap between the avatar and the student name. Using a dedicated `<View style={{ flex: 1 }} />` after the name guarantees that the name starts immediately next to the avatar on all platforms.

---

## 5. Key Reusable Components

### A. Compact `AppHeader`
The signature Navy header provides greeting, context, and notification bell in a space-saving compact footprint:
- **Padding**: `paddingTop: 36` (Android) / `44` (iOS), `paddingHorizontal: 20`, `paddingBottom: 10`, `marginBottom: 10`.
- **Wave Accent**: Bottom curved container (`height: 14`, `borderBottomLeftRadius: 24`, `borderBottomRightRadius: 24`).
- **Notification Bell**: 38x38 circular icon button (`backgroundColor: 'rgba(255,255,255,0.12)'`) with crimson unread badge.
- **Embedded Context Card**:
  - `backgroundColor: "rgba(255,255,255,0.10)"`
  - `borderRadius: 12`, `padding: 10px`
  - 34x34 icon container (`backgroundColor: 'rgba(255,255,255,0.15)'`)

### B. Global Side Menu Drawer (`GlobalDrawer`)
- **Docked Side**: Anchored to the **RIGHT** side of the screen in RTL mode.
- **Width**: `Math.min(SCREEN_WIDTH * 0.85, 380)`
- **Cross-Platform Positioning**:
  ```tsx
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: NAVY,
    zIndex: 1001,
    elevation: 10,
    ...(Platform.OS === 'web'
      ? { right: 0 }
      : (I18nManager.isRTL ? { left: 0 } : { right: 0 })),
  }
  ```
  *(Note: In React Native on Android Hermes, `I18nManager.isRTL` swaps `left` and `right`. Therefore, setting `left: 0` maps to the physical right edge of the screen).*
- **Animation**: `translateX` transitions between `+DRAWER_WIDTH` (hidden to the right) and `0` (open on the right).

### C. Standard Cards (`AppCard` / `RowCard`)
- `backgroundColor`: `OFF_WHITE` (`#fcfbf8` or `#ffffff`)
- `borderRadius`: `14px` - `16px`
- `borderWidth`: `1px`
- `borderColor`: `BORDER` (`#eceae4`)
- `padding`: `14px`
- Shadow: Flat or subtle elevation 1 (`shadowOpacity: 0.05`, `shadowRadius: 2`, `elevation: 1`)

### D. Action Buttons
- **Primary Navy Button**: `backgroundColor: NAVY`, text `#ffffff`, `borderRadius: 14`, `paddingVertical: 14`.
- **Add / Accent Gold Button**: `backgroundColor: GOLD`, text `CHARCOAL` or `#ffffff`, `borderRadius: 14` / `20`.
- **Destructive Crimson Button**: `backgroundColor: CRIMSON`, text `#ffffff`, `borderRadius: 14`.

### E. Scroll Clearance Rule
Every screen with a scrollable view (`ScrollView` or `FlatList`) that renders above the bottom navigation bar must have:
```tsx
contentContainerStyle={{ paddingBottom: 110 }}
```
This guarantees that the last card and any bottom buttons remain fully visible and clickable above the bottom tab bar.

---

## 6. Preparation Module Standards

### A. Streamlined Creation Form
The preparation creation workflow is focused and distraction-free:
1. **Title**: Subject of the lesson (`title`).
2. **Date Input**: Interactive touchable date pill linked to `<CalendarPicker>`, eliminating manual date string typing.
3. **Notes**: Freeform rich notes/explanation (`notes` / `description`).
4. **Direct File Attachments**: Servants can attach PDF, Word, PowerPoint, or image files directly inside the creation modal, which are automatically uploaded upon saving the preparation.
*Key points and verses inputs have been removed to keep preparation swift and natural.*

### B. Submission & Leader Notifications
- When a servant taps **"تقديم للمراجعة"** (Submit for Review), the app presents a clear confirmation modal.
- Upon submission:
  1. Status updates to `submitted`.
  2. The servant receives a prompt: *"تم إرسال التحضير إلى أمناء الخدمة للمراجعة والاعتماد، وتم إرسال إشعار لهم."*
  3. The backend dispatches notifications (with Expo Push) to all active service leaders and assistant service leaders.

### C. Confirmed / Approved Lock Rule
- Once a service leader confirms/approves (`status === 'approved'`), the preparation becomes **read-only** for the servant:
  - An approved green badge (`تم اعتماد التحضير من قبل أمين الخدمة ومغلق للتعديل`) is displayed.
  - Updating fields, uploading files, or deleting files are completely disabled in the UI and enforced with `ForbiddenException` in the backend API.
