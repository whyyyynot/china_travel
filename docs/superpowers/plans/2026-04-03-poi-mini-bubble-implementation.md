# POI Mini Bubble Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight map-local mini bubble for district-page POI markers so users can tap visible POI icons and see only the minimum essential information, with the bubble tied to the existing POI layer toggle.

**Architecture:** Extend the existing district map layer state with a transient `selectedPoiId`, enrich `map.pois` data with short bubble metadata, render the mini bubble inside the map frame only when `POI` is on, and wire map click handling in `assets/app.js` so POI taps open/replace/close the bubble without affecting the lower POI cards.

**Tech Stack:** Static HTML, vanilla ES modules, CSS, Node `--test`

---

## Planned File Structure

- Modify: `assets/app.js`
- Modify: `assets/data.js`
- Modify: `assets/render.js`
- Modify: `assets/site.css`
- Modify: `tests/render.test.mjs`

### Task 1: Extend District Map State For POI Selection

**Files:**
- Modify: `assets/app.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing tests for POI selection state**

```js
import {
  createDistrictMapLayerState,
  toggleDistrictMapLayer,
  toggleSelectedDistrictPoi,
} from '../assets/app.js';

test('createDistrictMapLayerState defaults selectedPoiId to null', () => {
  assert.deepEqual(createDistrictMapLayerState(), {
    showRoute: false,
    showPoi: false,
    selectedPoiId: null,
  });
});

test('toggleSelectedDistrictPoi selects a poi id and toggles it off when clicked again', () => {
  const selected = toggleSelectedDistrictPoi(
    { showRoute: false, showPoi: true, selectedPoiId: null },
    'toilet-east-gate',
  );
  assert.equal(selected.selectedPoiId, 'toilet-east-gate');

  const cleared = toggleSelectedDistrictPoi(selected, 'toilet-east-gate');
  assert.equal(cleared.selectedPoiId, null);
});

test('toggleDistrictMapLayer clears selectedPoiId when poi is turned off', () => {
  const next = toggleDistrictMapLayer(
    { showRoute: true, showPoi: true, selectedPoiId: 'toilet-east-gate' },
    'poi',
  );
  assert.deepEqual(next, {
    showRoute: true,
    showPoi: false,
    selectedPoiId: null,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `selectedPoiId` is not part of the current state shape and `toggleSelectedDistrictPoi` does not exist yet

- [ ] **Step 3: Add the minimal POI selection helpers in `assets/app.js`**

```js
export function createDistrictMapLayerState(overrides = {}) {
  return {
    showRoute: false,
    showPoi: false,
    selectedPoiId: null,
    ...overrides,
  };
}

export function toggleDistrictMapLayer(state, layer) {
  if (layer === 'route') {
    return {
      ...state,
      showRoute: !state.showRoute,
    };
  }

  if (layer === 'poi') {
    const nextShowPoi = !state.showPoi;
    return {
      ...state,
      showPoi: nextShowPoi,
      selectedPoiId: nextShowPoi ? state.selectedPoiId : null,
    };
  }

  return state;
}

export function toggleSelectedDistrictPoi(state, poiId) {
  return {
    ...state,
    selectedPoiId: state.selectedPoiId === poiId ? null : poiId,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the new POI state tests and all existing tests

- [ ] **Step 5: Commit the state helper changes**

```bash
git add assets/app.js tests/render.test.mjs
git commit -m "feat: add district poi bubble state helpers"
```

### Task 2: Enrich Map POI Data And Render The Mini Bubble

**Files:**
- Modify: `assets/data.js`
- Modify: `assets/render.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing render tests for POI bubble behavior**

```js
test('renderDistrictPage does not render a poi bubble when no poi is selected', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { showRoute: false, showPoi: true, selectedPoiId: null },
  );

  assert.doesNotMatch(html, /district-poi-bubble/);
});

test('renderDistrictPage renders a toilet bubble with the toilet type', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { showRoute: false, showPoi: true, selectedPoiId: 'toilet-east-gate' },
  );

  assert.match(html, /district-poi-bubble/);
  assert.match(html, /Temple East Gate/);
  assert.match(html, /Sit-down/);
});

test('renderDistrictPage renders a placeholder quick note when a poi detail is missing', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { showRoute: false, showPoi: true, selectedPoiId: 'photo-north-wall' },
  );

  assert.match(html, /district-poi-bubble/);
  assert.match(html, /Photo Wall/);
  assert.match(html, /Short note coming soon/);
});

test('renderDistrictPage hides the bubble when poi layer is off even if a poi id is selected', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { showRoute: false, showPoi: false, selectedPoiId: 'toilet-east-gate' },
  );

  assert.doesNotMatch(html, /district-poi-bubble/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the current map POI data has no bubble metadata and no bubble is rendered

- [ ] **Step 3: Enrich `map.pois` entries with bubble metadata in `assets/data.js`**

```js
pois: [
  {
    id: 'toilet-east-gate',
    x: 40,
    y: 88,
    emoji: '🚻',
    color: 'blue',
    kind: 'toilet',
    title: 'Temple East Gate',
    detail: 'Sit-down',
    bubbleDx: 12,
    bubbleDy: -56,
  },
  {
    id: 'toilet-north-street',
    x: 144,
    y: 135,
    emoji: '🚻',
    color: 'blue',
    kind: 'toilet',
    title: 'North Street Public',
    detail: 'Squat',
    bubbleDx: -126,
    bubbleDy: -54,
  },
  {
    id: 'atm-boc',
    x: 155,
    y: 60,
    emoji: '💰',
    color: 'orange',
    kind: 'atm',
    title: 'ATM',
    detail: 'Bank of China',
    bubbleDx: -118,
    bubbleDy: -46,
  },
  {
    id: 'bench-park-edge',
    x: 40,
    y: 135,
    emoji: '🪑',
    color: 'purple',
    kind: 'bench',
    title: 'Park Edge Bench',
    detail: 'Quiet rest stop',
    bubbleDx: 12,
    bubbleDy: -56,
  },
  {
    id: 'restaurant-zhangji',
    x: 92,
    y: 135,
    emoji: '🍜',
    color: 'red',
    kind: 'restaurant',
    title: 'Zhangji Noodles',
    detail: 'Cash only',
    bubbleDx: -46,
    bubbleDy: -56,
  },
  {
    id: 'restaurant-palace-pastry',
    x: 144,
    y: 88,
    emoji: '🍜',
    color: 'red',
    kind: 'restaurant',
    title: 'Palace Pastry',
    detail: 'Card accepted',
    bubbleDx: -118,
    bubbleDy: -46,
  },
  {
    id: 'photo-north-wall',
    x: 68,
    y: 60,
    emoji: '📸',
    color: 'pink',
    kind: 'photo',
    title: 'Photo Wall',
    detail: 'Short note coming soon',
    bubbleDx: 12,
    bubbleDy: -52,
  },
],
```

Apply the same shape to the other district `map.pois` arrays, using compact real values where available and short placeholders where needed.

- [ ] **Step 4: Add a small selected-POI helper and bubble renderer in `assets/render.js`**

```js
function getSelectedPoi(map, selectedPoiId) {
  if (!map || !Array.isArray(map.pois) || !selectedPoiId) {
    return null;
  }

  return map.pois.find((poi) => poi.id === selectedPoiId) || null;
}

function renderDistrictPoiBubble(poi, map) {
  if (!poi) {
    return '';
  }

  return `
    <div
      class="district-poi-bubble"
      data-poi-bubble="${escapeHtml(poi.id)}"
      style="--bubble-x:${formatMapPercent(poi.x, 184)};--bubble-y:${formatMapPercent(poi.y, 240)};--bubble-dx:${poi.bubbleDx || 12}px;--bubble-dy:${poi.bubbleDy || -52}px;"
    >
      <div class="district-poi-bubble__title">${escapeHtml(poi.title)}</div>
      <div class="district-poi-bubble__detail">${escapeHtml(poi.detail)}</div>
    </div>
  `;
}
```

- [ ] **Step 5: Make POI markers clickable and render the bubble only when POI is on**

```js
function renderSvgPoi(poi) {
  const fill = COLOR_BY_ACCENT[poi.color];

  return `
    <g class="district-poi-marker" data-poi-id="${escapeHtml(poi.id)}" tabindex="0" role="button" aria-label="${escapeHtml(poi.title)}">
      <circle cx="${poi.x}" cy="${poi.y}" r="7" fill="${fill}" stroke="white" stroke-width="1.5"></circle>
      <text x="${poi.x}" y="${poi.y + 3}" text-anchor="middle" font-size="7">${poi.emoji}</text>
    </g>
  `;
}
```

```js
const selectedPoi = layers.showPoi
  ? getSelectedPoi(map, layers.selectedPoiId)
  : null;
const poiBubbleMarkup = renderDistrictPoiBubble(selectedPoi, map);
```

```js
      <div class="district-map-card__frame" data-map-surface="district">
        <svg ...>
          ...
          ${poiMarkup}
          ${labels}
        </svg>
        ${legendMarkup}
        ${poiBubbleMarkup}
      </div>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the new POI bubble rendering tests and all existing tests

- [ ] **Step 7: Commit the POI bubble render layer**

```bash
git add assets/data.js assets/render.js tests/render.test.mjs
git commit -m "feat: render district poi mini bubbles"
```

### Task 3: Wire POI Bubble Interaction In The District Controller

**Files:**
- Modify: `assets/app.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing tests for selecting and re-clicking the same POI**

```js
test('toggleSelectedDistrictPoi replaces the selected poi when another poi is clicked', () => {
  const next = toggleSelectedDistrictPoi(
    { showRoute: false, showPoi: true, selectedPoiId: 'toilet-east-gate' },
    'atm-boc',
  );
  assert.equal(next.selectedPoiId, 'atm-boc');
});

test('toggleDistrictMapLayer clears the selected poi when POI is turned off', () => {
  const next = toggleDistrictMapLayer(
    { showRoute: true, showPoi: true, selectedPoiId: 'atm-boc' },
    'poi',
  );
  assert.equal(next.selectedPoiId, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `toggleSelectedDistrictPoi` does not exist yet or the `poi` toggle clearing behavior is incomplete

- [ ] **Step 3: Update `assets/app.js` to handle POI marker clicks and map-surface dismissal**

```js
const poiBubble = target.closest('[data-poi-bubble]');
if (poiBubble && document.body.dataset.page === 'district') {
  return;
}

const poiMarker = target.closest('[data-poi-id]');
if (poiMarker && document.body.dataset.page === 'district') {
  event.preventDefault();
  districtMapLayerState = toggleSelectedDistrictPoi(
    districtMapLayerState,
    poiMarker.dataset.poiId,
  );
  renderDistrict();
  return;
}

const mapSurface = target.closest('[data-map-surface="district"]');
if (
  mapSurface &&
  document.body.dataset.page === 'district' &&
  districtMapLayerState.selectedPoiId !== null
) {
  districtMapLayerState = {
    ...districtMapLayerState,
    selectedPoiId: null,
  };
  renderDistrict();
  return;
}
```

When POI is turned off via the existing layer toggle handler, keep relying on `toggleDistrictMapLayer()` to clear `selectedPoiId`.

- [ ] **Step 4: Reset selected POI on district first render**

```js
if (document.body.dataset.page === 'district') {
  districtMapLayerState = createDistrictMapLayerState();
  resetDistrictOpenAnalytics();
  renderDistrict();
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the POI selection tests and all existing tests

- [ ] **Step 6: Commit the POI interaction wiring**

```bash
git add assets/app.js tests/render.test.mjs
git commit -m "feat: wire district poi bubble interactions"
```

### Task 4: Style The Mini Bubble As A Lightweight Map Annotation

**Files:**
- Modify: `assets/site.css`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Add the failing shell-class test for the bubble**

```js
test('renderDistrictPage exposes the mini bubble class hooks', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { showRoute: false, showPoi: true, selectedPoiId: 'toilet-east-gate' },
  );

  assert.match(html, /district-poi-bubble/);
  assert.match(html, /district-poi-bubble__title/);
  assert.match(html, /district-poi-bubble__detail/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the new bubble shell hooks are not yet present

- [ ] **Step 3: Add the bubble styling in `assets/site.css`**

```css
.district-poi-bubble {
  position: absolute;
  left: var(--bubble-x);
  top: var(--bubble-y);
  transform: translate(
    calc(-50% + var(--bubble-dx)),
    calc(-50% + var(--bubble-dy))
  );
  min-width: 108px;
  max-width: 148px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(35, 53, 74, 0.12);
  box-shadow: 0 10px 22px rgba(40, 54, 71, 0.14);
  z-index: 2;
}

.district-poi-bubble__title {
  font-size: 0.76rem;
  font-weight: 900;
  color: #1f2d3d;
}

.district-poi-bubble__detail {
  margin-top: 4px;
  font-size: 0.72rem;
  line-height: 1.35;
  color: #627180;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the bubble shell test and all existing tests

- [ ] **Step 5: Commit the bubble styling**

```bash
git add assets/site.css tests/render.test.mjs
git commit -m "feat: style district poi mini bubble"
```

### Task 5: Final Verification And Manual Smoke Test

**Files:**
- Modify: `assets/app.js`
- Modify: `assets/data.js`
- Modify: `assets/render.js`
- Modify: `assets/site.css`
- Modify: `tests/render.test.mjs`

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: PASS with all tests green and `0 fail`

- [ ] **Step 2: Start a local static preview**

Run: `python3 -m http.server 4175 --bind 127.0.0.1`
Expected: Local preview server starts successfully from the project root

- [ ] **Step 3: Manually verify bubble behavior on a district page**

Open: `http://127.0.0.1:4175/districts/wenshuyuan.html`

Check:
- With `POI` off, no bubble is visible
- With `POI` on, tapping a toilet point opens a bubble with the toilet type
- Tapping the same POI again closes the bubble
- Tapping another POI replaces the bubble content
- Tapping empty map area closes the bubble
- Turning `POI` off closes the bubble and hides legend together

- [ ] **Step 4: Commit the verified feature**

```bash
git add assets/app.js assets/data.js assets/render.js assets/site.css tests/render.test.mjs
git commit -m "feat: add district poi mini bubbles"
```
