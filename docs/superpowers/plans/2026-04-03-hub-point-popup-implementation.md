# Hub Point Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared homepage hub-point popup so unlocked points open an overlay with image, intro, copyable location, and `Enter`, while locked points keep the unlock CTA but gain the same image and intro content.

**Architecture:** Keep one modal root on `index.html` and drive both unlocked and locked point popups from the shared district data in `assets/data.js`. Extend the pure rendering/model layer in `assets/render.js` first, then wire the new click flow in `assets/app.js`, and finish with CSS updates for the overlay layout and placeholder media treatment.

**Tech Stack:** Static HTML, vanilla ES modules, shared JS data models, CSS, Node `--test`

---

## Planned File Structure

- Modify: `assets/data.js`
- Modify: `assets/render.js`
- Modify: `assets/app.js`
- Modify: `assets/site.css`
- Modify: `tests/render.test.mjs`
- Optional small touch only if needed: `index.html`

### Task 1: Extend Shared District Data For Homepage Popup Content

**Files:**
- Modify: `assets/data.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Write the failing test for popup data fields and copy text format**

```js
import { buildHubPointModalModel } from '../assets/render.js';

test('buildHubPointModalModel returns popup data for an unlocked point', () => {
  const model = buildHubPointModalModel(DISTRICTS, CONTACT, 'wenshuyuan');
  assert.equal(model.slug, 'wenshuyuan');
  assert.equal(model.isUnlocked, true);
  assert.equal(model.titleEn, 'Wenshu Monastery');
  assert.equal(
    model.copyLocationText,
    'Wenshu Monastery / 文殊院\nPlaceholder Chinese address for taxi and map apps',
  );
  assert.equal(model.primaryAction.label, 'Enter');
});

test('buildHubPointModalModel keeps unlock CTA for a locked point', () => {
  const model = buildHubPointModalModel(DISTRICTS, CONTACT, 'taikooli');
  assert.equal(model.isUnlocked, false);
  assert.equal(model.primaryAction.label, 'Unlock via WhatsApp');
  assert.match(model.summaryEn, /open-air retail district/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL with `buildHubPointModalModel` missing from `assets/render.js`

- [ ] **Step 3: Add homepage popup fields to every district record**

```js
function districtBase({
  slug,
  nameZh,
  nameEn,
  unlocked,
  icon,
  summary,
  hubPopup = {},
  walkTime = '',
  route = null,
  toilets = [],
  restaurants = [],
  dropoff = null,
}) {
  return {
    slug,
    nameZh,
    nameEn,
    unlocked,
    icon,
    summary,
    hubPopup: {
      heroImage: hubPopup.heroImage || `assets/placeholders/${slug}.png`,
      summaryEn: hubPopup.summaryEn || summary,
      addressZh:
        hubPopup.addressZh || 'Placeholder Chinese address for taxi and map apps',
    },
    walkTime,
    route,
    toilets,
    restaurants,
    dropoff,
    hub: HUB_POSITIONS[slug],
    legend: LEGEND,
    map: MAP_TEMPLATES[slug] || null,
  };
}
```

```js
districtBase({
  slug: 'wenshuyuan',
  nameZh: '文殊院',
  nameEn: 'Wenshu Monastery',
  unlocked: true,
  icon: '🏯',
  summary: 'Temple lanes, noodle stops, and quick recovery points around Wenshu Monastery.',
  hubPopup: {
    heroImage: 'assets/placeholders/wenshu-monastery.png',
    summaryEn:
      'A calm Buddhist monastery district known for temple courtyards, teahouse lanes, and easy first-time Chengdu walking routes.',
    addressZh: 'Placeholder Chinese address for taxi and map apps',
  },
  walkTime: '~2hr walk',
```

```js
districtBase({
  slug: 'taikooli',
  nameZh: '太古里',
  nameEn: 'Taikoo Li Chengdu',
  unlocked: false,
  icon: '👜',
  summary: 'Luxury retail maze with fast-demand unlock intent from first-time visitors.',
  hubPopup: {
    heroImage: 'assets/placeholders/taikoo-li-chengdu.png',
    summaryEn:
      'Chengdu’s flagship open-air retail district, mixing designer storefronts, temple-adjacent lanes, and high-footfall city-center energy.',
    addressZh: 'Placeholder Chinese address for taxi and map apps',
  },
}),
```

- [ ] **Step 4: Run test to verify the new data shape still loads**

Run: `node --test tests/render.test.mjs`
Expected: FAIL only on missing `buildHubPointModalModel`; no syntax or import errors from `assets/data.js`

- [ ] **Step 5: Commit the shared popup data**

```bash
git add assets/data.js tests/render.test.mjs
git commit -m "feat: add hub point popup content data"
```

### Task 2: Build The Shared Hub Popup Model And Markup

**Files:**
- Modify: `assets/render.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Expand the failing tests to cover marker behavior and popup markup**

```js
test('renderHubMapSvg uses popup triggers for unlocked points instead of direct links', () => {
  const html = renderHubMapSvg(buildHubMapModel(DISTRICTS));
  assert.match(html, /data-hub-slug="wenshuyuan"/);
  assert.doesNotMatch(html, /href="districts\/wenshuyuan\.html"/);
});

test('renderHubPointModal outputs image, location copy, and enter button for unlocked points', () => {
  const html = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'wenshuyuan'),
  );
  assert.match(html, /Image Placeholder/);
  assert.match(html, /Copy Location/);
  assert.match(html, />Enter</);
});

test('renderHubPointModal keeps unlock CTA for locked points', () => {
  const html = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'taikooli'),
  );
  assert.match(html, /Unlock via WhatsApp/);
  assert.doesNotMatch(html, />Enter</);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL with `renderHubPointModal` missing and the old unlocked marker `href` still present

- [ ] **Step 3: Add a pure popup model builder and shared popup renderer**

```js
export function buildHubPointModalModel(districts, contact, slug) {
  const district = getDistrictBySlug(districts, slug);
  const copyLocationText = `${district.nameEn} / ${district.nameZh}\n${district.hubPopup.addressZh}`;

  if (district.unlocked) {
    return {
      slug: district.slug,
      isUnlocked: true,
      titleEn: district.nameEn,
      titleZh: district.nameZh,
      summaryEn: district.hubPopup.summaryEn,
      heroImage: district.hubPopup.heroImage,
      addressZh: district.hubPopup.addressZh,
      copyLocationText,
      primaryAction: {
        kind: 'enter',
        label: 'Enter',
        href: `districts/${district.slug}.html`,
      },
    };
  }

  return {
    slug: district.slug,
    isUnlocked: false,
    titleEn: district.nameEn,
    titleZh: district.nameZh,
    summaryEn: district.hubPopup.summaryEn,
    heroImage: district.hubPopup.heroImage,
    addressZh: district.hubPopup.addressZh,
    copyLocationText,
    primaryAction: {
      kind: 'unlock',
      label: 'Unlock via WhatsApp',
      href: buildWhatsAppUrl(
        contact.whatsapp,
        `Hi MAPO, please unlock ${district.nameEn} for me.`,
      ),
    },
  };
}
```

```js
export function renderHubPointModal(model) {
  const headerClass = model.isUnlocked
    ? 'hub-point-modal__header hub-point-modal__header--open'
    : 'hub-point-modal__header hub-point-modal__header--locked';
  const primaryClass = model.isUnlocked ? 'btn btn--green' : 'btn btn--whatsapp';

  return `
    <div class="unlock-modal__backdrop" data-close-modal="true"></div>
    <div class="hub-point-modal" role="dialog" aria-modal="true" aria-labelledby="hub-point-title">
      <div class="${headerClass}">
        <div>
          <div class="hub-point-modal__eyebrow">${model.isUnlocked ? 'MAP POINT' : 'LOCKED POINT'}</div>
          <h2 id="hub-point-title">${escapeHtml(model.titleEn)}</h2>
          <p class="hub-point-modal__subtitle">${escapeHtml(model.titleZh)}</p>
        </div>
        <button class="hub-point-modal__close" type="button" data-close-modal="true" aria-label="Close">×</button>
      </div>
      <div class="hub-point-modal__body">
        <div class="hub-point-modal__image">Image Placeholder</div>
        <p class="hub-point-modal__summary">${escapeHtml(model.summaryEn)}</p>
        <div class="hub-point-modal__location">
          <div class="hub-point-modal__location-label">LOCATION</div>
          <div>${escapeHtml(model.titleEn)} / ${escapeHtml(model.titleZh)}<br>${escapeHtml(model.addressZh)}</div>
        </div>
        <button class="btn btn--gold" type="button" data-copy="${escapeHtml(model.copyLocationText)}" data-copy-label="Location">Copy Location</button>
        <a class="${primaryClass}" href="${escapeHtml(model.primaryAction.href)}"${model.isUnlocked ? ' data-enter-slug="' + escapeHtml(model.slug) + '"' : ' target="_blank" rel="noreferrer" data-analytics-event="unlock_cta_click" data-analytics-district="' + escapeHtml(model.slug) + '"'}>${escapeHtml(model.primaryAction.label)}</a>
      </div>
    </div>
  `;
}
```

- [ ] **Step 4: Change hub markers to trigger popup open for unlocked points**

```js
if (district.unlocked) {
  return `
    <button class="${classes}" type="button" data-hub-slug="${district.slug}" ${style} aria-label="${escapeHtml(district.nameEn)}">
      <span class="hub-marker__pin" aria-hidden="true"></span>
      <span class="hub-marker__label">${escapeHtml(district.nameEn)}</span>
    </button>
  `;
}
```

- [ ] **Step 5: Run test to verify the pure model and markup pass**

Run: `node --test tests/render.test.mjs`
Expected: PASS for popup data, popup markup, and map marker behavior tests

- [ ] **Step 6: Commit the popup render layer**

```bash
git add assets/render.js tests/render.test.mjs
git commit -m "feat: add shared hub point popup renderer"
```

### Task 3: Wire Homepage Click Flow To Open The Popup Before Navigation

**Files:**
- Modify: `assets/app.js`
- Modify: `tests/render.test.mjs`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Add the failing test for the unlocked popup primary action**

```js
test('buildHubPointModalModel uses district page href for unlocked enter action', () => {
  const model = buildHubPointModalModel(DISTRICTS, CONTACT, 'jiuyanqiao');
  assert.deepEqual(model.primaryAction, {
    kind: 'enter',
    label: 'Enter',
    href: 'districts/jiuyanqiao.html',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.mjs`
Expected: FAIL on `primaryAction` shape mismatch or missing `kind`

- [ ] **Step 3: Update the homepage controller to open the shared popup for any map point**

```js
import {
  buildDistrictPageModel,
  buildHubMapModel,
  buildHubPointModalModel,
  renderDistrictPage,
  renderHubMapSvg,
  renderHubPointModal,
  renderServiceCards,
  trackEvent,
} from './render.js';
```

```js
function openHubPointModal(slug) {
  const root = document.querySelector('#unlock-modal-root');
  if (!root) {
    return;
  }

  const model = buildHubPointModalModel(DISTRICTS, CONTACT, slug);
  root.innerHTML = renderHubPointModal(model);
  root.hidden = false;
  document.body.classList.add('modal-open');

  if (!model.isUnlocked) {
    trackEvent(window.gtag, 'unlock_intent', {
      district_name: slug,
    });
  }
}
```

```js
const hubPoint = target.closest('[data-hub-slug], [data-locked-slug]');
if (hubPoint) {
  event.preventDefault();
  openHubPointModal(hubPoint.dataset.hubSlug || hubPoint.dataset.lockedSlug);
  return;
}
```

- [ ] **Step 4: Run test to verify the flow contract passes**

Run: `node --test tests/render.test.mjs`
Expected: PASS with the unlocked `primaryAction` test green and no regressions

- [ ] **Step 5: Commit the homepage interaction change**

```bash
git add assets/app.js assets/render.js tests/render.test.mjs
git commit -m "feat: open hub popup before unlocked district navigation"
```

### Task 4: Style The Overlay Popup And Placeholder Media

**Files:**
- Modify: `assets/site.css`
- Test: `tests/render.test.mjs`

- [ ] **Step 1: Add the failing popup markup test for modal-specific classes**

```js
test('renderHubPointModal includes the modal shell classes used by the overlay styles', () => {
  const html = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'wenshuyuan'),
  );
  assert.match(html, /hub-point-modal/);
  assert.match(html, /hub-point-modal__image/);
  assert.match(html, /hub-point-modal__close/);
});
```

- [ ] **Step 2: Run test to verify it fails if those classes are missing**

Run: `node --test tests/render.test.mjs`
Expected: FAIL on missing modal shell class names

- [ ] **Step 3: Add the modal overlay styles**

```css
.hub-point-modal {
  position: absolute;
  inset: 50% 16px auto;
  transform: translateY(-50%);
  width: calc(100% - 32px);
  max-width: 360px;
  margin: 0 auto;
  border-radius: 26px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 22px 48px rgba(31, 45, 63, 0.28);
}

.hub-point-modal__header--open {
  background: linear-gradient(135deg, #58cc02 0%, #38b825 100%);
  color: white;
}

.hub-point-modal__header--locked {
  background: linear-gradient(135deg, #d6dbe1 0%, #bfc7d0 100%);
  color: #3e4a56;
}

.btn--gold {
  color: #5d4300;
  background: #ffc800;
  border-bottom-color: #e5b400;
}

.btn--whatsapp {
  color: white;
  background: #25d366;
  border-bottom-color: #1fa851;
}

.hub-point-modal__image {
  height: 124px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed #9fce73;
  background: linear-gradient(135deg, #d8f1c0 0%, #f7fff0 100%);
}
```

- [ ] **Step 4: Run test to verify popup markup still passes**

Run: `node --test tests/render.test.mjs`
Expected: PASS with popup shell tests and all earlier tests green

- [ ] **Step 5: Commit the popup styling**

```bash
git add assets/site.css tests/render.test.mjs
git commit -m "feat: style homepage hub point popup overlay"
```

### Task 5: Final Verification And Manual Smoke Check

**Files:**
- Modify: `assets/app.js`
- Modify: `assets/render.js`
- Modify: `assets/site.css`
- Modify: `assets/data.js`
- Modify: `tests/render.test.mjs`

- [ ] **Step 1: Run the full automated test suite**

Run: `node --test tests/render.test.mjs`
Expected: PASS with all tests green and `0 fail`

- [ ] **Step 2: Run a local static preview**

Run: `python3 -m http.server 4175 --bind 127.0.0.1`
Expected: Server starts cleanly from the project root

- [ ] **Step 3: Manually verify homepage popup behavior**

Check:
- Tapping `Wenshu Monastery` opens the popup instead of navigating immediately
- `Copy Location` shows a success toast
- `Enter` from the unlocked popup navigates to `districts/wenshuyuan.html`
- Tapping `Taikoo Li Chengdu` opens the same popup shell with `Unlock via WhatsApp`
- Backdrop and close button both dismiss the popup

- [ ] **Step 4: Commit the verified feature**

```bash
git add assets/data.js assets/render.js assets/app.js assets/site.css tests/render.test.mjs
git commit -m "feat: add homepage hub point popup details"
```
