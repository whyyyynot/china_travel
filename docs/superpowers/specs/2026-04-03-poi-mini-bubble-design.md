# MAPO District POI Mini Bubble

**Date:** 2026-04-03  
**Status:** Approved  
**Scope:** District page map POI interaction only

---

## 1. Goal

Add a lightweight POI mini bubble on district maps so users can tap a visible POI icon and immediately see the most essential identifying information without scrolling to the full POI cards below.

This is intentionally smaller and lighter than the homepage point popup. It is only a quick map-level identification layer.

---

## 2. In Scope

- District page map only
- POI icon click behavior
- A single small anchored mini bubble
- Conditional visibility tied to the existing `POI` layer toggle

---

## 3. Out Of Scope

- Homepage map
- Full-screen modal behavior
- Long-form POI descriptions
- New buttons inside the bubble
- Changes to the full POI card list below the map

---

## 4. Core Interaction

The mini bubble behaves like a map annotation.

- It only exists when the `POI` layer is enabled
- Tapping a visible POI icon opens a small bubble anchored near that point
- The bubble shows only the minimum useful information
- Tapping the map background closes the bubble
- Tapping a different POI closes the old bubble and opens the new one
- Turning `POI` off closes the bubble immediately
- Only one bubble may be open at a time

---

## 5. Content Rules

The bubble always contains:

1. A title
2. One short “must-know” line

No extra copy beyond that unless a category absolutely requires it.

### 5.1 Toilet

Show:

- toilet name
- toilet type: `Sit-down` or `Squat`

### 5.2 Restaurant

Show:

- restaurant name
- one key note such as:
  - `Cash only`
  - `Vegetarian option`
  - `Card accepted`

### 5.3 ATM

Show:

- ATM label
- bank name

### 5.4 Photo Spot

Show:

- photo spot name
- one short hint

### 5.5 Bench

Show:

- bench label
- one short hint

---

## 6. Visual Behavior

The mini bubble is a map-local white card, visually anchored to the selected POI point.

Requirements:

- smaller than the homepage popup
- no image
- no buttons
- no multi-paragraph text
- no dimmed full-screen backdrop
- should not overpower the map

It should feel like a lightweight tooltip/card hybrid rather than a modal dialog.

---

## 7. State Model

District pages need a small piece of transient POI selection state in addition to the existing map layer toggle state.

Suggested logical state:

- selected POI id: `null` when no bubble is open

Behavior:

- initial state: `null`
- clicking a POI point sets the selected POI id
- clicking the map background resets it to `null`
- turning POI layer off resets it to `null`
- switching to another POI replaces the selected id

---

## 8. Rendering Model

The district map should treat the mini bubble as part of the POI layer behavior.

- Base map layer remains independent
- Route layer remains independent
- POI icon layer remains independent
- Legend remains tied to POI visibility
- Mini bubble is only meaningful when POI icons are visible

This means:

- `POI off` ⇒ no icons, no legend, no bubble
- `POI on` ⇒ icons visible, legend visible, bubble available

---

## 9. Data Strategy

Each map POI needs enough structured data to build both:

- the map icon marker
- the one-line mini bubble detail

The bubble should reuse district data already present in `assets/data.js`.

For categories where current data is too sparse, add one compact field rather than inventing a second disconnected POI content source.

Examples:

- toilet: `type`
- restaurant: `quickNote`
- ATM: `bank`
- photo spot: `quickNote`
- bench: `quickNote`

---

## 10. Testing Requirements

Implementation must verify at least these behaviors:

1. No bubble renders when no POI is selected
2. A selected toilet bubble shows the correct toilet type
3. Only one bubble is rendered at a time
4. Turning `POI` off removes the bubble
5. Clicking one POI then another replaces the visible bubble content

---

## 11. Acceptance Criteria

This enhancement is complete when:

- POI icons can open a mini bubble on district pages
- the bubble shows only short essential info
- bubble behavior is tied to POI layer visibility
- clicking empty map area closes the bubble
- turning POI off closes the bubble
- only one bubble is visible at a time
- the bubble remains visually lightweight and map-local
