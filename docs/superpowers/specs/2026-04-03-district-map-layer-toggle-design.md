# MAPO District Map Layer Toggle

**Date:** 2026-04-03  
**Status:** Approved  
**Scope:** District page map interaction only

---

## 1. Goal

Simplify the district map so it opens with only the base map visible, then let the user reveal the recommended route layer and the POI icon layer through two explicit toggle buttons placed below the map.

This reduces visual clutter on first load while still letting the user progressively reveal guidance.

---

## 2. In Scope

- District detail pages only
- The map section above the POI cards
- Two toggle buttons directly below the map
- Conditional visibility for:
  - recommended route overlay
  - POI icon points
  - map legend

---

## 3. Out Of Scope

- Hub page changes
- POI card list behavior
- Route card text content
- New map layers beyond route and POI
- Redesign of the full district page

---

## 4. Default Map State

When the user opens a district page:

- show the base map only
- hide the recommended route overlay
- hide all POI icon points
- hide the legend

The map should feel quiet and readable before the user requests additional guidance.

---

## 5. Controls

Place exactly two buttons below the district map, styled as a small tool bar:

- `Route`
- `POI`

Rules:

- both buttons are independent toggles
- both buttons start in the `off` state
- clicking a button flips it between `on` and `off`
- no third button, no submenu, no layer drawer

---

## 6. Toggle Behavior

### 6.1 Route Button

When `Route` is `on`:

- show the recommended route overlay on the map

When `Route` is `off`:

- hide the recommended route overlay

### 6.2 POI Button

When `POI` is `on`:

- show POI icon points on the map
- show the legend

When `POI` is `off`:

- hide POI icon points
- hide the legend

---

## 7. Combined States

The two toggles are additive, not mutually exclusive.

Allowed states:

1. `Route off` + `POI off`
   - base map only
2. `Route on` + `POI off`
   - base map + route overlay
3. `Route off` + `POI on`
   - base map + POI icons + legend
4. `Route on` + `POI on`
   - base map + route overlay + POI icons + legend

---

## 8. Visual Behavior

The toolbar sits directly below the map, not floating over it.

Each button must visually communicate state through active/inactive styling, such as:

- active fill color
- active border
- stronger label color
- optional active indicator

The buttons should read like compact map controls, not like primary call-to-action buttons.

---

## 9. Rendering Model

The district map renderer should treat these as independent layers:

- base map layer
- route overlay layer
- POI icon layer
- legend layer

Only the base map layer is always visible.

The route overlay and POI icon layer must be individually controllable without rebuilding the whole district page or navigating away.

---

## 10. Testing Requirements

Implementation must verify at least these behaviors:

1. Default district map state renders without route overlay, POI icons, or legend
2. Turning `Route` on shows the route overlay only
3. Turning `POI` on shows POI icons and legend
4. Turning both on shows both layers together
5. Turning `POI` off hides the legend again

---

## 11. Acceptance Criteria

This enhancement is complete when:

- district pages open with a clean base map
- the map toolbar shows exactly two toggle buttons below the map
- `Route` independently controls the route overlay
- `POI` independently controls POI icons
- legend visibility is tied to the POI layer
- both layers can be on at the same time
- no extra layer menu or drawer is introduced
