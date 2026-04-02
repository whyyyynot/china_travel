# MAPO MVP Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MAPO Chengdu MVP as a mobile-first static website in the current workspace, with a hub page, three district pages, service CTAs, unlock modal behavior, and lightweight verification.

**Architecture:** Implement a multi-file static site with shared CSS and browser-side JavaScript, but keep all content in a shared `assets/data.js` module instead of fetched JSON so the site still works when opened from local files. Use a small pure rendering/model layer that can be tested with Node's built-in test runner before wiring it into the browser pages.

**Tech Stack:** Static HTML, CSS, vanilla ES modules, inline SVG generation, Node `--test`

---

## Planned File Structure

- Create: `index.html`
- Create: `districts/wenshuyuan.html`
- Create: `districts/peoples-park.html`
- Create: `districts/jiuyanqiao.html`
- Create: `assets/site.css`
- Create: `assets/data.js`
- Create: `assets/render.js`
- Create: `assets/app.js`
- Create: `package.json`
- Create: `tests/render.test.mjs`

### Task 1: Scaffold The Static Site And Test Harness

**Files:**
- Create: `package.json`
- Create: `tests/render.test.mjs`
- Create: `assets/data.js`
- Create: `assets/render.js`

- [ ] **Step 1: Write the failing test for core data lookups and CTA URL generation**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTACT, DISTRICTS } from '../assets/data.js';
import { buildWhatsAppUrl, getDistrictBySlug, getUnlockedDistricts } from '../assets/render.js';

test('getDistrictBySlug returns the requested district model', () => {
  const district = getDistrictBySlug(DISTRICTS, 'wenshuyuan');
  assert.equal(district.slug, 'wenshuyuan');
  assert.equal(district.nameZh, '文殊院');
});

test('getUnlockedDistricts returns the three launch districts', () => {
  const districts = getUnlockedDistricts(DISTRICTS);
  assert.deepEqual(districts.map((item) => item.slug), ['wenshuyuan', 'peoples-park', 'jiuyanqiao']);
});

test('buildWhatsAppUrl produces a wa.me link with encoded text', () => {
  const url = buildWhatsAppUrl(CONTACT.whatsapp, 'Unlock Jiuyanqiao');
  assert.equal(url, 'https://wa.me/8613800000000?text=Unlock%20Jiuyanqiao');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL with module export errors because `assets/data.js` and `assets/render.js` do not exist yet

- [ ] **Step 3: Write the minimal shared data and render helpers**

```js
export const CONTACT = {
  whatsapp: '+8613800000000',
  wechatId: 'mapochengdu',
};

export const DISTRICTS = [
  { slug: 'wenshuyuan', nameZh: '文殊院', unlocked: true },
  { slug: 'peoples-park', nameZh: '人民公园', unlocked: true },
  { slug: 'jiuyanqiao', nameZh: '九眼桥', unlocked: true },
];

export function getDistrictBySlug(districts, slug) {
  const district = districts.find((item) => item.slug === slug);
  if (!district) throw new Error(`Unknown district: ${slug}`);
  return district;
}

export function getUnlockedDistricts(districts) {
  return districts.filter((item) => item.unlocked);
}

export function buildWhatsAppUrl(phoneNumber, text) {
  const normalized = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/render.test.mjs`
Expected: PASS for all three tests

- [ ] **Step 5: Commit scaffold**

```bash
git add package.json tests/render.test.mjs assets/data.js assets/render.js
git commit -m "feat: scaffold mapo static site data model"
```

### Task 2: Build Shared Page Models And HTML Fragments

**Files:**
- Modify: `assets/data.js`
- Modify: `assets/render.js`
- Modify: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing test for hub nodes, unlock modal copy, and district sections**

```js
import { buildHubMapModel, buildUnlockModalModel, buildDistrictPageModel } from '../assets/render.js';

test('buildHubMapModel returns unlocked and locked district cards', () => {
  const model = buildHubMapModel(DISTRICTS);
  assert.equal(model.unlocked.length, 3);
  assert.equal(model.locked.length, 9);
});

test('buildUnlockModalModel includes district-specific CTA copy', () => {
  const model = buildUnlockModalModel(DISTRICTS, CONTACT, 'taikooli');
  assert.match(model.title, /太古里/);
  assert.match(model.ctaHref, /^https:\/\/wa\.me\//);
});

test('buildDistrictPageModel exposes route, poi, and service CTA data', () => {
  const model = buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan');
  assert.equal(model.route.name, 'Route A');
  assert.ok(model.toilets.length >= 1);
  assert.ok(model.restaurants.length >= 1);
  assert.match(model.dropoff.driverText, /文殊院/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL with missing export errors for the new model builders

- [ ] **Step 3: Expand the data file and add pure model builders**

```js
export const DISTRICTS = [
  {
    slug: 'wenshuyuan',
    nameZh: '文殊院',
    nameEn: 'Wenshuyuan',
    unlocked: true,
    walkTime: '~2hr walk',
    route: { name: 'Route A', totalTime: '~2hr', steps: ['Temple main gate', 'Tea street', 'Photo wall', 'Lunch stop'] },
    toilets: [{ name: 'Temple East Gate', type: 'Sit-down', directions: '30m past the red gate, left side' }],
    restaurants: [{ name: '洞子口张记', translit: 'Zhangji Noodles', payment: 'Cash only', dishes: [{ name: 'Plain Noodles', price: '¥12' }] }],
    dropoff: { label: 'Drop-off Point', driverText: '文殊院正门' },
  },
];

export function buildHubMapModel(districts) {
  return {
    unlocked: districts.filter((item) => item.unlocked),
    locked: districts.filter((item) => !item.unlocked),
  };
}

export function buildUnlockModalModel(districts, contact, slug) {
  const district = getDistrictBySlug(districts, slug);
  return {
    title: `Unlock ${district.nameZh}`,
    ctaHref: buildWhatsAppUrl(contact.whatsapp, `Unlock ${district.nameEn}`),
  };
}

export function buildDistrictPageModel(districts, contact, slug) {
  const district = getDistrictBySlug(districts, slug);
  return {
    ...district,
    whatsappHref: buildWhatsAppUrl(contact.whatsapp, `MAPO help for ${district.nameEn}`),
    wechatId: contact.wechatId,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/render.test.mjs`
Expected: PASS for the model-layer tests with all new assertions green

- [ ] **Step 5: Commit the shared page models**

```bash
git add assets/data.js assets/render.js tests/render.test.mjs
git commit -m "feat: add mapo page models and content data"
```

### Task 3: Implement The Hub Page, Tabs, And Unlock Modal

**Files:**
- Create: `index.html`
- Create: `assets/site.css`
- Create: `assets/app.js`
- Modify: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing test for hub HTML fragment generation**

```js
import { renderHubDistrictButtons, renderServiceCards } from '../assets/render.js';

test('renderHubDistrictButtons outputs links for unlocked districts and buttons for locked ones', () => {
  const html = renderHubDistrictButtons(buildHubMapModel(DISTRICTS));
  assert.match(html, /href="districts\/wenshuyuan\.html"/);
  assert.match(html, /data-locked-slug="taikooli"/);
});

test('renderServiceCards outputs the three MAPO service offers', () => {
  const html = renderServiceCards(CONTACT);
  assert.match(html, /1v1 Live Concierge/);
  assert.match(html, /Order Food For You/);
  assert.match(html, /Custom Tour \/ Driver/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL because the render helpers do not exist yet

- [ ] **Step 3: Add the minimal render helpers and browser wiring for the hub**

```js
export function renderHubDistrictButtons(model) {
  const unlocked = model.unlocked.map((item) => `<a class="district-node district-node--open" href="districts/${item.slug}.html">${item.nameZh}</a>`).join('');
  const locked = model.locked.map((item) => `<button class="district-node district-node--locked" type="button" data-locked-slug="${item.slug}">${item.nameZh}</button>`).join('');
  return unlocked + locked;
}

export function renderServiceCards(contact) {
  return `
    <article class="service-card">1v1 Live Concierge</article>
    <article class="service-card">Order Food For You</article>
    <article class="service-card">Custom Tour / Driver</article>
  `;
}
```

```html
<body data-page="hub">
  <main class="app-shell">
    <section id="tab-map"></section>
    <section id="tab-services" hidden></section>
    <dialog id="unlock-modal"></dialog>
  </main>
  <script type="module" src="assets/app.js"></script>
</body>
```

```js
import { CONTACT, DISTRICTS } from './data.js';
import { buildHubMapModel, buildUnlockModalModel, renderHubDistrictButtons, renderServiceCards } from './render.js';

const mapRoot = document.querySelector('#tab-map');
const servicesRoot = document.querySelector('#tab-services');
mapRoot.innerHTML = renderHubDistrictButtons(buildHubMapModel(DISTRICTS));
servicesRoot.innerHTML = renderServiceCards(CONTACT);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/render.test.mjs`
Expected: PASS for the new hub rendering tests and all earlier tests

- [ ] **Step 5: Commit the hub page**

```bash
git add index.html assets/site.css assets/app.js assets/render.js tests/render.test.mjs
git commit -m "feat: build mapo hub page and unlock flow"
```

### Task 4: Implement The District Pages And Shared District Renderer

**Files:**
- Create: `districts/wenshuyuan.html`
- Create: `districts/peoples-park.html`
- Create: `districts/jiuyanqiao.html`
- Modify: `assets/render.js`
- Modify: `assets/app.js`
- Modify: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing test for district page rendering**

```js
import { renderDistrictPage } from '../assets/render.js';

test('renderDistrictPage outputs route, toilets, restaurants, and drop-off sections', () => {
  const html = renderDistrictPage(buildDistrictPageModel(DISTRICTS, CONTACT, 'peoples-park'));
  assert.match(html, /RECOMMENDED ROUTE/);
  assert.match(html, /TOILETS/);
  assert.match(html, /RESTAURANTS/);
  assert.match(html, /Drop-off Point/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL because `renderDistrictPage` does not exist yet

- [ ] **Step 3: Implement the shared district renderer and HTML entry pages**

```js
export function renderDistrictPage(model) {
  return `
    <section class="district-hero">${model.nameZh}</section>
    <section class="district-map">${model.route.name}</section>
    <section class="district-section">RECOMMENDED ROUTE</section>
    <section class="district-section">TOILETS</section>
    <section class="district-section">RESTAURANTS</section>
    <section class="district-section">${model.dropoff.label}</section>
  `;
}
```

```html
<body data-page="district" data-district-slug="wenshuyuan">
  <main class="app-shell district-shell">
    <div id="district-root"></div>
  </main>
  <script type="module" src="../assets/app.js"></script>
</body>
```

```js
const districtRoot = document.querySelector('#district-root');
const slug = document.body.dataset.districtSlug;
if (districtRoot && slug) {
  const model = buildDistrictPageModel(DISTRICTS, CONTACT, slug);
  districtRoot.innerHTML = renderDistrictPage(model);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/render.test.mjs`
Expected: PASS for the district rendering test and all previously passing tests

- [ ] **Step 5: Commit the district pages**

```bash
git add districts assets/app.js assets/render.js tests/render.test.mjs
git commit -m "feat: add district detail pages"
```

### Task 5: Add Analytics Guards, Manual Preview, And Final Verification

**Files:**
- Modify: `assets/app.js`
- Modify: `assets/site.css`

- [ ] **Step 1: Write the failing test for analytics guard behavior**

```js
import { trackEvent } from '../assets/render.js';

test('trackEvent returns false when gtag is unavailable', () => {
  assert.equal(trackEvent(undefined, 'unlock_intent', { district_name: 'Taikooli' }), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL because `trackEvent` does not exist yet

- [ ] **Step 3: Implement the analytics guard and final interaction wiring**

```js
export function trackEvent(gtagFn, eventName, params) {
  if (typeof gtagFn !== 'function') return false;
  gtagFn('event', eventName, params);
  return true;
}
```

```js
window.MAPO = {
  trackEvent: (eventName, params) => trackEvent(globalThis.gtag, eventName, params),
};
```

- [ ] **Step 4: Run automated and manual verification**

Run: `node --test tests/render.test.mjs`
Expected: PASS with `# pass` output and zero failures

Run: `python3 -m http.server 4175`
Expected: Local preview server starts successfully from the project root

Manual checks:
- Open `http://127.0.0.1:4175/index.html`
- Confirm Map / Services tab switching works
- Confirm locked district opens modal and WhatsApp CTA contains the selected district
- Confirm each unlocked district page renders route, POI cards, and back navigation

- [ ] **Step 5: Commit the verification-ready build**

```bash
git add index.html districts assets tests package.json
git commit -m "feat: finish mapo mvp static site"
```
