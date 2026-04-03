# District Map Layer Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two independent district-map layer toggle buttons below each district map so users can turn the recommended route layer and POI icon layer on and off, with both layers off by default and the legend only visible when POI is on.

**Architecture:** Keep the district page as a single render path, but split the map into independent visible layers inside `assets/render.js`: base map, route overlay, POI overlay, and legend. Drive runtime state from `assets/app.js` with a small pure layer-state helper that toggles `showRoute` and `showPoi`, then re-render the district page with the updated layer state.

**Tech Stack:** Static HTML, vanilla ES modules, CSS, Node `--test`

---

## Planned File Structure

- Modify: `assets/app.js`
- Modify: `assets/render.js`
- Modify: `assets/site.css`
- Modify: `tests/render.test.mjs`

### Task 1: Add Pure District Layer State Helpers

**Files:**
- Modify: `assets/app.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing tests for the map layer state model**

```js
import {
  createDistrictMapLayerState,
  toggleDistrictMapLayer,
} from '../assets/app.js';

test('createDistrictMapLayerState defaults both map layers to off', () => {
  assert.deepEqual(createDistrictMapLayerState(), {
    showRoute: false,
    showPoi: false,
  });
});

test('toggleDistrictMapLayer flips route without changing poi', () => {
  const next = toggleDistrictMapLayer(
    { showRoute: false, showPoi: true },
    'route',
  );

  assert.deepEqual(next, {
    showRoute: true,
    showPoi: true,
  });
});

test('toggleDistrictMapLayer flips poi without changing route', () => {
  const next = toggleDistrictMapLayer(
    { showRoute: true, showPoi: false },
    'poi',
  );

  assert.deepEqual(next, {
    showRoute: true,
    showPoi: true,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `assets/app.js` does not export `createDistrictMapLayerState` or `toggleDistrictMapLayer`

- [ ] **Step 3: Add the minimal pure state helpers in `assets/app.js`**

```js
export function createDistrictMapLayerState(overrides = {}) {
  return {
    showRoute: false,
    showPoi: false,
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
    return {
      ...state,
      showPoi: !state.showPoi,
    };
  }

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the 3 new layer-state tests and all existing tests

- [ ] **Step 5: Commit the pure layer state helpers**

```bash
git add assets/app.js tests/render.test.mjs
git commit -m "feat: add district map layer state helpers"
```

### Task 2: Render Base Map, Route Layer, POI Layer, Legend, And Toolbar Separately

**Files:**
- Modify: `assets/render.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing rendering tests for all 4 layer combinations**

```js
test('district page defaults to base map only with both toggles off', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { layerState: { showRoute: false, showPoi: false } },
  );

  assert.match(html, /data-layer-toggle="route"/);
  assert.match(html, /data-layer-toggle="poi"/);
  assert.doesNotMatch(html, /district-map-layer--route/);
  assert.doesNotMatch(html, /district-map-layer--poi/);
  assert.doesNotMatch(html, /map-legend/);
});

test('district page shows route overlay only when route is on', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { layerState: { showRoute: true, showPoi: false } },
  );

  assert.match(html, /district-map-layer--route/);
  assert.doesNotMatch(html, /district-map-layer--poi/);
  assert.doesNotMatch(html, /map-legend/);
});

test('district page shows poi icons and legend only when poi is on', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { layerState: { showRoute: false, showPoi: true } },
  );

  assert.doesNotMatch(html, /district-map-layer--route/);
  assert.match(html, /district-map-layer--poi/);
  assert.match(html, /map-legend/);
});

test('district page shows route and poi layers together when both toggles are on', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { layerState: { showRoute: true, showPoi: true } },
  );

  assert.match(html, /district-map-layer--route/);
  assert.match(html, /district-map-layer--poi/);
  assert.match(html, /map-legend/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `renderDistrictPage` currently always renders route, POI icons, and legend

- [ ] **Step 3: Add a small layer normalizer and conditional layer rendering in `assets/render.js`**

```js
function normalizeDistrictMapLayerState(layerState = {}) {
  return {
    showRoute: Boolean(layerState.showRoute),
    showPoi: Boolean(layerState.showPoi),
  };
}
```

```js
function renderDistrictMapControls(layerState) {
  return `
    <div class="district-map-controls" role="toolbar" aria-label="Map layers">
      <button
        class="district-map-toggle${layerState.showRoute ? ' district-map-toggle--active' : ''}"
        type="button"
        data-layer-toggle="route"
        aria-pressed="${layerState.showRoute}"
      >
        Route
      </button>
      <button
        class="district-map-toggle${layerState.showPoi ? ' district-map-toggle--active' : ''}"
        type="button"
        data-layer-toggle="poi"
        aria-pressed="${layerState.showPoi}"
      >
        POI
      </button>
    </div>
  `;
}
```

```js
function renderDistrictMap(model, layerState) {
  const layers = normalizeDistrictMapLayerState(layerState);
  const routeLayer = layers.showRoute
    ? `
      <g class="district-map-layer district-map-layer--route">
        <path d="${map.routePath}" fill="none" stroke="#58cc02" stroke-width="2.5" stroke-dasharray="5,3" stroke-linecap="round" stroke-linejoin="round"></path>
        <circle cx="${map.start.x}" cy="${map.start.y}" r="7" fill="#58cc02" stroke="white" stroke-width="1.5"></circle>
        <text x="${map.start.x}" y="${map.start.y + 3}" text-anchor="middle" font-size="6" fill="white" font-weight="900">S</text>
      </g>
    `
    : '';
  const poiLayer = layers.showPoi
    ? `<g class="district-map-layer district-map-layer--poi">${pois}</g>`
    : '';
  const legend = layers.showPoi
    ? `<div class="map-legend">${legendItems}</div>`
    : '';

  return `
    <section class="district-map-card">
      <div class="district-map-card__frame">
        <svg ...>
          <rect width="184" height="240" fill="#f2efe9"></rect>
          ${streets}
          ${blocks}
          ${landmarks}
          ${routeLayer}
          ${poiLayer}
          ${labels}
        </svg>
        ${legend}
      </div>
      ${renderDistrictMapControls(layers)}
      <div class="district-map-card__hint">↓ Scroll down for POI cards</div>
    </section>
  `;
}
```

- [ ] **Step 4: Update `renderDistrictPage` to accept map layer state**

```js
export function renderDistrictPage(model, options = {}) {
  const layerState = options.layerState || {
    showRoute: false,
    showPoi: false,
  };

  return `
    <header class="district-hero">...</header>
    ${renderDistrictMap(model, layerState)}
    <div class="district-content">...</div>
  `;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the new base/route/poi/both rendering tests and all existing tests

- [ ] **Step 6: Commit the district map layer renderer**

```bash
git add assets/render.js tests/render.test.mjs
git commit -m "feat: render district map layers independently"
```

### Task 3: Wire District Page Toolbar Toggles In The Runtime Controller

**Files:**
- Modify: `assets/app.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Add the failing test for unknown layer names returning the current state unchanged**

```js
test('toggleDistrictMapLayer ignores unknown layer names', () => {
  const current = { showRoute: true, showPoi: false };
  assert.deepEqual(toggleDistrictMapLayer(current, 'unknown'), current);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `toggleDistrictMapLayer` does not yet preserve unknown values exactly

- [ ] **Step 3: Add district page layer state and runtime toggle handling in `assets/app.js`**

```js
let districtMapLayerState = createDistrictMapLayerState();
```

```js
function renderDistrict() {
  const slug = document.body.dataset.districtSlug;
  const root = document.querySelector('#district-root');

  if (!slug || !root) {
    return;
  }

  const model = buildDistrictPageModel(DISTRICTS, CONTACT, slug);
  root.innerHTML = renderDistrictPage(model, {
    layerState: districtMapLayerState,
  });
  document.title = `${model.nameEn} | MAPO Chengdu`;

  trackEvent(window.gtag, 'district_open', {
    district_name: model.slug,
  });
}
```

```js
const layerToggle = target.closest('[data-layer-toggle]');
if (layerToggle && document.body.dataset.page === 'district') {
  event.preventDefault();
  districtMapLayerState = toggleDistrictMapLayer(
    districtMapLayerState,
    layerToggle.dataset.layerToggle,
  );
  renderDistrict();
  return;
}
```

```js
if (document.body.dataset.page === 'district') {
  districtMapLayerState = createDistrictMapLayerState();
  renderDistrict();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the unknown-layer test and all existing tests

- [ ] **Step 5: Commit the runtime district toggle flow**

```bash
git add assets/app.js tests/render.test.mjs
git commit -m "feat: wire district map layer toggles"
```

### Task 4: Style The District Map Toolbar And Hidden Layers

**Files:**
- Modify: `assets/site.css`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Add the failing test for toolbar class hooks**

```js
test('district page exposes the map toolbar hooks below the map', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan'),
    { layerState: { showRoute: false, showPoi: false } },
  );

  assert.match(html, /district-map-controls/);
  assert.match(html, /district-map-toggle/);
  assert.match(html, /aria-pressed="false"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because the toolbar classes/hooks are not yet present in the rendered HTML

- [ ] **Step 3: Add the toolbar styles in `assets/site.css`**

```css
.district-map-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}

.district-map-toggle {
  min-height: 42px;
  border-radius: 14px;
  border: 1.5px solid #d8e2ec;
  background: #edf3f8;
  color: #5f6f80;
  font-size: 0.82rem;
  font-weight: 800;
}

.district-map-toggle--active {
  border-color: #bee4f8;
  background: #eff8ff;
  color: #1cb0f6;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS for the toolbar hook test and all existing tests

- [ ] **Step 5: Commit the district map toolbar styling**

```bash
git add assets/site.css tests/render.test.mjs
git commit -m "feat: style district map toggle toolbar"
```

### Task 5: Final Verification And Manual Layer-State Smoke Test

**Files:**
- Modify: `assets/app.js`
- Modify: `assets/render.js`
- Modify: `assets/site.css`
- Modify: `tests/render.test.mjs`

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: PASS with all tests green and `0 fail`

- [ ] **Step 2: Start a local static preview**

Run: `python3 -m http.server 4175 --bind 127.0.0.1`
Expected: Local preview server starts successfully from the project root

- [ ] **Step 3: Manually verify all 4 map states on a district page**

Open: `http://127.0.0.1:4175/districts/wenshuyuan.html`

Check:
- First load shows base map only, with no route, no POI icons, and no legend
- Clicking `Route` shows only the route overlay
- Clicking `POI` from default shows POI icons and the legend
- Clicking both shows route + POI + legend together
- Turning `POI` back off hides the legend again

- [ ] **Step 4: Commit the verified feature**

```bash
git add assets/app.js assets/render.js assets/site.css tests/render.test.mjs
git commit -m "feat: add district map layer toggles"
```
