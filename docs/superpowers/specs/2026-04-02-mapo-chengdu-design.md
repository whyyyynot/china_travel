# MAPO Chengdu — MVP Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Target:** 2–3 day demo build

---

## 1. Product Overview

**MAPO** is a mobile-first HTML web app for foreign tourists in Chengdu who have no local phone number, no local social connections, and are overwhelmed by information overload.

**Core value:** Turn "too much information" into "certain execution." Provide verified routes and survival basics (food ordering, toilets, navigation) through a Vertical Slice model — go deep on a few districts rather than shallow on everything.

**Target user:** International visitors in Chengdu, typically without WeChat Pay, Meituan accounts, or Mandarin literacy.

---

## 2. Technical Stack

**Approach:** Single self-contained HTML file — no build system, no server, no external dependencies.

```
china_travel/
└── mapo.html   # Entire app — CSS, JS, data, and SVG all inline
```

**Why single file:** Users (tourists and testers) can open the app by receiving `mapo.html` via AirDrop, WeChat, WhatsApp, or email and tapping it directly in their mobile browser — no server, no install, no URL required. Works on iOS Safari and Android Chrome via `file://` protocol.

**Page navigation:** JavaScript `show/hide` simulates multi-page navigation. Each "screen" is a `<div>` with a unique `id`. The active screen is shown; all others are `display:none`. The back button and nav bar toggle screens by calling `showScreen(id)`.

**Screen IDs:**
- `screen-hub-map` — Hub: Map tab
- `screen-hub-services` — Hub: Services tab
- `screen-district-wenshuyuan` — 文殊院 district
- `screen-district-peoples-park` — 人民公园 district
- `screen-district-jiuyanqiao` — 九眼桥 district
- `screen-unlock-popup` — Unlock modal (overlaid, not a full screen)

**Data:** All POI data, contact info, and district metadata hardcoded as JS object literals in a single `<script>` block inside `mapo.html`. Defined as `const DATA = { contact: {...}, districts: [...] }`.

**Contact info placeholders** (must fill before sharing with users):
- `DATA.contact.whatsapp` — WhatsApp number in international format (e.g. `+8613800000000`)
- `DATA.contact.wechat_id` — WeChat ID string

**Deployment:** Optional. Can also be hosted on GitHub Pages or Netlify for sharing via URL. Both methods work — file and URL.

**Behavior tracking:** Google Analytics 4 (`gtag.js`) loaded via `<script>` tag. Fires custom events on locked district taps and service CTA clicks. Gracefully skips if offline (no errors).

---

## 3. Design System

**Visual language:** Duolingo — exact token values extracted from reference implementation.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary green | `#58cc02` | Active elements, unlocked districts, CTA buttons |
| Primary green dark | `#46a302` | Button bottom border (press shadow) |
| Gold | `#ffc800` | Completed nodes, streak indicator |
| Gold dark | `#e5b400` | Gold button bottom border |
| Orange | `#ff9600` | Food service card, chest nodes |
| Orange dark | `#e58700` | Orange button bottom border |
| Blue | `#1cb0f6` | Active nav tab highlight |
| Blue bg | `#eff8ff` | Active nav tab background |
| Locked gray | `#e5e5e5` | Locked district fill |
| Locked gray border | `#cecece` | Locked district border |
| Text gray | `#4b4b4b` | Body text |
| Border gray | `#e5e5e5` | Dividers, card borders |
| WhatsApp green | `#25D366` | WhatsApp button |
| WeChat green | `#07C160` | WeChat button |

### Typography

| Role | Weight | Notes |
|---|---|---|
| App title / node labels | `800–900` (extrabold/black) | All caps or sentence case |
| Section headers | `700` (bold) | |
| Body / subtitles | `400–600` | Opacity 90% on colored backgrounds |
| Nav labels | `700` | Active: `#1cb0f6`, Inactive: `#afafaf` |

### Button Press Effect

All primary action buttons use the Duolingo "press" illusion — a bottom border that collapses on tap:

```css
.btn-primary {
  border-bottom: 6px solid <dark-variant>;
  transition: all 150ms;
}
.btn-primary:active {
  border-bottom: 0px;
  transform: translateY(6px);
}
```

Apply to: district map nodes, service card CTAs, route start button.

### Cards

Cards have a colored left border (4px) indicating category — no drop shadow, just `border: 1.5px solid <light-variant>` + `border-left: 4px solid <accent>`. Border radius `16px`. Background `#ffffff`.

| Category | Left border | Background tint |
|---|---|---|
| Concierge | `#58cc02` | `#f7fff0` |
| Food ordering | `#ff9600` | `#fff5e6` |
| Custom tour | `#1677FF` | `#eef5ff` |
| Toilet | `#1cb0f6` | `#eff8ff` |
| Restaurant | `#ff4757` | `#fff5f5` |
| Navigation | `#ff9600` | `#fff5e6` |

### District Map Nodes (Hub page)

Circular buttons, 64×64px, `border-radius: 50%`, using the press effect:

- **Unlocked:** `#58cc02` fill, `#46a302` bottom border, white icon + label
- **Completed:** `#ffc800` fill, `#e5b400` bottom border, white checkmark
- **Locked:** `#e5e5e5` fill, `#cecece` bottom border, gray lock icon

### Top App Bar

Matches Duolingo header: white background, `border-bottom: 2px solid #e5e5e5`, items spaced across full width:
- Left: flag/language indicator (placeholder for MVP)
- Center-left: 🔥 Streak count (orange, bold)
- Center-right: 💎 Gem count (blue, bold)
- Right: ❤️ Lives count (red, bold)

For MAPO MVP: replace with **MAPO wordmark** (left) + `"X / 12 unlocked"` badge (right), green background.

### Bottom Nav Bar

Two tabs (Map, Services). Active state: icon + label turn `#1cb0f6`, background `#eff8ff`, `border: 2px solid #bee4f8`. Inactive: `#afafaf`. Border radius on tab container `12px`. Height `56px` + safe-area inset padding.

---

## 4. Page Architecture

The app has two root pages: **Hub** (`index.html`) and **District** (one file per district). Both share the same bottom nav bar.

### Bottom Nav Bar

Two tabs, always visible:

| Tab | Icon | Active state |
|---|---|---|
| Map | 🗺️ | Green top border + green label |
| Services | ⭐ | Green top border + green label |

**Navigation behavior:**
- On Hub (`index.html`): tapping Map/Services switches between the two tabs in-page.
- On a District page: tapping Map navigates to `index.html` (Map tab active). Tapping Services navigates to `index.html#services` (Services tab active). The district page itself has no tab concept — it is always "under" the Map tab.

---

## 5. Hub Page (`index.html`)

### 5a. Map Tab

**Header bar** (green background):
- Left: MAPO wordmark (white, bold) + "Chengdu · 成都" subtitle
- Right: pill badge showing "3 / 12 unlocked"

**Map area** (fills remaining screen height):
- SVG-based 2D abstract map of Chengdu
- Visual elements: two ring-road dashed ellipses for spatial reference, 锦江 river as a blue wavy line
- North indicator (top-right)
- 12 district ellipses plotted at approximate real geographic positions:
  - **3 unlocked** (文殊院, 人民公园, 九眼桥): `#58CC02` fill, white label, tappable → navigate to district page
  - **9 locked** (太古里, 锦里, 宽窄巷子, 东郊记忆, 玉林, 青羊宫, 春熙路, 天府广场, 川大): `#CACACA` fill, gray label, tappable → unlock popup
- Floating hint at bottom of map: `"🔒 Tap locked area to unlock"`

**Unlock popup** (triggered by tapping any locked district):
- Modal card overlaid on dimmed map
- Lock emoji + district name + short description
- Body text: `"Contact us on WhatsApp to unlock — usually within minutes."`
- Primary CTA: `"💬 Unlock via WhatsApp"` → opens `https://wa.me/<number>`
- Secondary: `"Maybe later"` → dismisses modal
- Analytics event fired on popup open: `{ event: "unlock_intent", district: "<name>" }`

### 5b. Services Tab

Three service cards stacked vertically on a `#F8F8F8` background.

**Card 1 — 1v1 Live Concierge** (green left border `#58CC02`)
- Icon: 💬 in green pill background
- Title: `"1v1 Live Concierge"` / Subtitle: `"Real human · Available now"`
- Body: `"Lost? Can't read the menu? Need a toilet ASAP? We've got you in real time."`
- Two equal buttons: `"WhatsApp"` (#25D366) and `"WeChat"` (#07C160)

**Card 2 — Order Food For You** (orange left border `#FF9600`)
- Icon: 🛵 in orange pill background
- Title: `"Order Food For You"` / Subtitle: `"No local phone needed · ¥150 service fee"`
- Body: `"We order Meituan on your behalf. You pick the dish, we handle the rest."`
- One full-width button: `"Book via WhatsApp →"` (#FF9600)

**Card 3 — Custom Tour / Driver** (blue left border `#1677FF`)
- Icon: 🚗 in blue pill background
- Title: `"Custom Tour / Driver"` / Subtitle: `"Half/full-day · from ¥1000"`
- Body: `"Local guide + private car. We plan it, you enjoy it."`
- One full-width button: `"Enquire via WhatsApp →"` (#1677FF)

All WhatsApp buttons open `https://wa.me/<WHATSAPP_NUMBER>` — replace with real number before launch. WeChat button opens `weixin://` deep link or displays WeChat ID as a tappable copy-to-clipboard fallback. Both the WhatsApp number and WeChat ID must be defined in `data.js` as `CONTACT.whatsapp` and `CONTACT.wechat_id` before building.

---

## 6. District Page (`wenshuyuan.html`, `peoples-park.html`, `jiuyanqiao.html`)

### 6a. Header

- Back arrow `←` → returns to `index.html`
- District name (white, bold) + `"~Xhr walk"` estimate
- Right badge: active route selector (e.g., `"🗺 Route A"`)

### 6b. Street Map (upper half of screen)

SVG-based 2D street map drawn at approximate real proportions for the district. Contains:

**Base layer:**
- White lines on warm `#F2EFE9` background representing streets
- Named major streets as small text labels
- Landmark building blocks (temple, park, etc.) as colored filled rectangles with labels

**Route overlay:**
- 1–2 recommended routes as dashed green polylines (`#58CC02`, stroke-dasharray `5,3`)
- Route start marker: green circle with `"S"`

**POI icon layer** (colored circle + emoji, white stroke border):

| Category | Color | Emoji |
|---|---|---|
| Restaurant | `#FF4757` | 🍜 |
| Toilet | `#1677FF` | 🚻 |
| ATM | `#FF9600` | 💰 |
| Photo spot | `#FF6B9D` | 📸 |
| Rest bench | `#9B59B6` | 🪑 |

**Map legend** (bottom-right corner, semi-transparent white card): lists all icon categories.

**Scroll hint** below map: `"↓ Scroll down for POI cards"`

### 6c. POI Cards (scrollable, below map)

Sections separated by small uppercase labels. Each card has a colored left border matching its category.

**Route Card:**
- Badge showing route name + total time
- Ordered list of steps: `① Landmark → Xmin`

**Toilet Cards** (one per toilet, blue left border):
- Title: location name
- Type badge: `"🪑 Sit-down"` (blue bg) or `"🦵 Squat"` (orange bg)
- Body: walking directions in plain English

**Restaurant Cards** (red left border):
- Title: Chinese name + English transliteration
- Subtitle: distance from landmark + payment note (cash/card)
- Menu items (3–5 dishes, hardcoded, human-translated):
  - Dish name (English) + Chinese name
  - Description (flavor profile, main ingredients)
  - Spice level: 🌶 / 🌶🌶 / 🌶🌶🌶 or `"Mild"`
  - Dietary flags: `"🌿 Vegetarian"`, `"🥩 Halal"` where applicable
  - Price in RMB

**Navigation / Drop-off Card** (orange left border):
- Title: `"📍 Drop-off Point"`
- Chinese text for Didi driver (copy-pasteable)
- Two buttons: `"Open in Maps"` (opens Apple/Google Maps with GPS coords) and `"Open Didi 🚕"` (opens Didi app with pre-filled destination)

---

## 7. Content to Collect (Offline Field Research)

For each of the 3 MVP districts, collect:

- [ ] 1–2 walking routes: ordered POI sequence + walking time between each stop
- [ ] Toilet locations: GPS coords, type (sit/squat), walking directions from landmark
- [ ] ATM locations: bank name, GPS coords
- [ ] Rest bench locations: GPS coords, description
- [ ] Didi drop-off GPS coordinates for recommended start point
- [ ] Per recommended restaurant: Chinese name, address, payment method, 3–5 dishes with English names, prices, spice levels, dietary info
- [ ] Photo spots: GPS coords + brief description of what makes it worth shooting
- [ ] Translation cards: pre-written Chinese phrases for vegetarians and Muslim travelers (show to staff)

---

## 8. Behavior Tracking

Using Google Analytics 4 (gtag.js), fire custom events:

| Event | Trigger | Parameters |
|---|---|---|
| `unlock_intent` | Locked district tapped (popup shown) | `district_name` |
| `unlock_cta_click` | "Unlock via WhatsApp" button tapped | `district_name` |
| `service_cta_click` | Any service card CTA tapped | `service_name` |
| `district_open` | District page loaded | `district_name` |

These events validate which locked districts have the most demand, informing the order of future unlocks.

---

## 9. MVP Scope Boundaries

**In scope:**
- Outdoor POI and route guidance only — no indoor navigation
- 3 districts at launch
- Manual unlock via WhatsApp — no payment system
- Static hardcoded content — no CMS

**Out of scope for MVP:**
- Payment / automated unlock
- User accounts or saved favorites
- Real-time data (opening hours API, live availability)
- Building-interior maps
- Native app (iOS/Android)
