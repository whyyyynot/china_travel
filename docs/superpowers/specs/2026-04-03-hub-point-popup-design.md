# MAPO Hub Point Popup Enhancement

**Date:** 2026-04-03  
**Status:** Approved  
**Scope:** Homepage map interaction only

---

## 1. Goal

Change the first-screen hub map so unlocked points no longer jump directly into district pages. Instead, tapping a map point opens a popup window above the map with enough context for the user to decide whether to enter.

The popup must also improve locked points by adding the same image and intro content while keeping the existing unlock behavior.

---

## 2. In Scope

- Homepage map point interaction on `index.html`
- A single reusable popup component for both unlocked and locked points
- Per-point summary content, placeholder image, and copyable location text
- Preserving the existing district pages and the existing locked-point unlock CTA

---

## 3. Out Of Scope

- District page layout changes
- Real image assets
- Real Chinese addresses
- New analytics events
- Changes to the service tab

---

## 4. Interaction Model

### 4.1 Unlocked Points

When the user taps an unlocked point on the homepage map:

1. Do **not** navigate immediately
2. Open a centered popup above the current map screen
3. Show the following content in this order:
   - English title
   - Chinese name
   - Image placeholder
   - English summary
   - Copyable location block
   - Primary `Enter` button

The popup closes when the user:

- taps the backdrop
- taps the close button
- taps `Enter` and navigation begins

### 4.2 Locked Points

When the user taps a locked point on the homepage map:

1. Keep the current unlock flow model
2. Open the same popup shell
3. Show the same upper content structure:
   - English title
   - Chinese name
   - Image placeholder
   - English summary
   - Copyable location block
4. Keep the bottom action as the existing unlock CTA

The locked popup must still use `Unlock via WhatsApp` as its primary action.

---

## 5. Visual Behavior

The popup is a real overlay window, not a full replacement page.

- The homepage map remains visible behind it
- The popup is centered above a dimmed backdrop
- The popup has its own close affordance in the top-right corner
- The unlocked and locked versions share the same layout shell
- Only the header styling and final action area vary by point state

This should feel like one modal component with two action modes, not two unrelated screens.

---

## 6. Popup Content Structure

Each point needs the following homepage popup data:

- `nameEn`
- `nameZh`
- `summaryEn`
- `addressZh`
- `heroImage`
- `copyLocationText`

### 6.1 Summary

- English only
- Short, scan-friendly, tourism-oriented
- One compact paragraph

### 6.2 Image

- Use placeholder image data for now
- Final implementation must support per-point PNG replacement later without changing popup structure

### 6.3 Copyable Location

The copy button copies this exact text format:

```text
<English Name> / <Chinese Name>
<Chinese Address Placeholder>
```

Example:

```text
Wenshu Monastery / 文殊院
Placeholder Chinese address for taxi and map apps
```

The button label should remain `Copy Location`.

---

## 7. Button Rules

### 7.1 Unlocked Popup

- Secondary utility area: location copy
- Primary action: `Enter`
- `Enter` navigates to the corresponding district page

### 7.2 Locked Popup

- Secondary utility area: location copy
- Primary action: `Unlock via WhatsApp`
- Existing unlock link behavior remains unchanged

---

## 8. Data Strategy

The hub-point popup must be driven from the shared district data already used by the homepage and district pages.

Implementation should extend existing district records instead of creating a second disconnected content source.

Each district record should carry the homepage popup content needed for:

- visible popup title content
- placeholder image reference
- English intro
- Chinese address placeholder
- generated copy text

This keeps later content replacement limited to data updates rather than component rewrites.

---

## 9. Testing Requirements

Implementation must cover at least these behaviors:

1. Tapping an unlocked point opens popup data instead of navigating immediately
2. The popup model for unlocked points contains `Enter`
3. The popup model for locked points contains `Unlock via WhatsApp`
4. Copy text follows the agreed two-line format
5. Closing the popup does not change page state unexpectedly

---

## 10. Acceptance Criteria

This enhancement is complete when:

- unlocked map points open a popup first
- locked points still keep unlock behavior
- both states show image placeholder, English intro, and copyable location
- `Enter` is only shown for unlocked points
- the popup behaves like an overlay window above the map
- placeholder assets and addresses can be swapped later without component redesign
