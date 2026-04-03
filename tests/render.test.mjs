import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveHubTabFromHash,
  createDistrictMapLayerState,
  toggleDistrictMapLayer,
} from '../assets/app.js';
import { CONTACT, DISTRICTS } from '../assets/data.js';
import * as render from '../assets/render.js';

const {
  buildDistrictPageModel,
  buildHubMapModel,
  buildHubPointModalModel,
  buildUnlockModalModel,
  buildWhatsAppUrl,
  getDistrictBySlug,
  getUnlockedDistricts,
  renderDistrictPage,
  renderHubMapSvg,
  renderHubPointModal,
  renderServiceCards,
  trackEvent,
} = render;

test('getDistrictBySlug returns the requested district model', () => {
  const district = getDistrictBySlug(DISTRICTS, 'wenshuyuan');
  assert.equal(district.slug, 'wenshuyuan');
  assert.equal(district.nameZh, '文殊院');
  assert.equal(district.nameEn, 'Wenshu Monastery');
});

test('getUnlockedDistricts returns the three launch districts', () => {
  const districts = getUnlockedDistricts(DISTRICTS);
  assert.deepEqual(districts.map((item) => item.slug), [
    'wenshuyuan',
    'peoples-park',
    'jiuyanqiao',
  ]);
});

test('buildWhatsAppUrl produces a wa.me link with encoded text', () => {
  const url = buildWhatsAppUrl(CONTACT.whatsapp, 'Unlock Jiuyanqiao');
  assert.equal(
    url,
    'https://wa.me/8613800000000?text=Unlock%20Jiuyanqiao',
  );
});

test('buildHubMapModel returns unlocked and locked district groups', () => {
  const model = buildHubMapModel(DISTRICTS);
  assert.equal(model.unlocked.length, 3);
  assert.equal(model.locked.length, 9);
  assert.equal(model.unlockBadge, '3 / 12 unlocked');
});

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

test('buildHubPointModalModel exposes copy location lines for clipboard usage', () => {
  const model = buildHubPointModalModel(DISTRICTS, CONTACT, 'wenshuyuan');
  assert.ok(Array.isArray(model.copyLocationLines));
  assert.equal(model.copyLocationLines.length, 2);
  assert.equal(
    model.copyLocationLines[0],
    'Wenshu Monastery / 文殊院',
  );
  assert.equal(
    model.copyLocationLines[1],
    'Placeholder Chinese address for taxi and map apps',
  );
});

test('buildHubPointModalModel uses district page href for unlocked enter action', () => {
  const model = buildHubPointModalModel(DISTRICTS, CONTACT, 'jiuyanqiao');
  assert.deepEqual(model.primaryAction, {
    kind: 'enter',
    label: 'Enter',
    href: 'districts/jiuyanqiao.html',
  });
});

test('buildHubPointModalModel keeps unlock CTA for a locked point', () => {
  const model = buildHubPointModalModel(DISTRICTS, CONTACT, 'taikooli');
  assert.equal(model.isUnlocked, false);
  assert.equal(model.primaryAction.label, 'Unlock via WhatsApp');
  assert.match(model.summaryEn, /open-air retail district/i);
});

test('renderHubMapSvg uses popup triggers for unlocked points instead of direct links', () => {
  const html = renderHubMapSvg(buildHubMapModel(DISTRICTS));
  assert.match(html, /data-hub-slug="wenshuyuan"/);
  assert.doesNotMatch(html, /href="districts\/wenshuyuan\.html"/);
});

test('renderHubPointModal builds the shared shell with content in the required order for unlocked points', () => {
  const html = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'wenshuyuan'),
  );
  assert.match(html, /unlock-modal__backdrop/);
  assert.match(html, /hub-point-modal/);
  assert.match(html, /hub-point-modal__header/);
  assert.match(html, /hub-point-modal__body/);
  assert.match(html, /hub-point-modal__close/);
  assert.match(html, /hub-point-modal__image/);
  assert.match(html, /hub-point-modal__summary/);
  assert.match(html, /hub-point-modal__location/);
  assert.match(html, /Copy Location/);
  assert.match(html, />Enter</);

  const indexes = {
    titleEn: html.indexOf('Wenshu Monastery'),
    titleZh: html.indexOf('文殊院'),
    image: html.indexOf('hub-point-modal__image'),
    summary: html.indexOf('hub-point-modal__summary'),
    location: html.indexOf('hub-point-modal__location'),
    copy: html.indexOf('Copy Location'),
    action: html.indexOf('>Enter'),
  };

  assert.ok(indexes.titleEn >= 0);
  assert.ok(indexes.titleZh >= 0);
  assert.ok(indexes.image >= 0);
  assert.ok(indexes.summary >= 0);
  assert.ok(indexes.location >= 0);
  assert.ok(indexes.copy >= 0);
  assert.ok(indexes.action >= 0);

  assert.ok(indexes.titleEn < indexes.titleZh);
  assert.ok(indexes.titleZh < indexes.image);
  assert.ok(indexes.image < indexes.summary);
  assert.ok(indexes.summary < indexes.location);
  assert.ok(indexes.location < indexes.copy);
  assert.ok(indexes.copy < indexes.action);
});

test('renderHubPointModal wraps content in scrollable container and encodes copy data', () => {
  const html = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'wenshuyuan'),
  );
  assert.match(html, /hub-point-modal__content/);
  assert.match(html, /hub-point-modal__actions/);
  assert.match(html, /data-copy="[^"]+&#10;[^"]+"/);
});

test('renderHubPointModal keeps unlock CTA for locked points', () => {
  const html = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'taikooli'),
  );
  assert.match(html, /Unlock via WhatsApp/);
  assert.doesNotMatch(html, />Enter</);
});

test('district data hubPopup overrides expose hero image, summary, and address', () => {
  const district = DISTRICTS.find((item) => item.slug === 'wenshuyuan');
  assert.ok(district);
  assert.equal(
    district.hubPopup.heroImage,
    'assets/placeholders/wenshu-monastery.png',
  );
  assert.match(
    district.hubPopup.summaryEn,
    /calm Buddhist monastery district known for temple courtyards/,
  );
  assert.equal(
    district.hubPopup.addressZh,
    'Placeholder Chinese address for taxi and map apps',
  );
});

test('district data hubPopup defaults apply for districts without overrides', () => {
  const district = DISTRICTS.find((item) => item.slug === 'jinli');
  assert.ok(district);
  assert.equal(district.hubPopup.heroImage, 'assets/placeholders/jinli.png');
  assert.equal(district.hubPopup.summaryEn, district.summary);
  assert.equal(
    district.hubPopup.addressZh,
    'Placeholder Chinese address for taxi and map apps',
  );
});

test('buildUnlockModalModel creates district-specific CTA content', () => {
  const model = buildUnlockModalModel(DISTRICTS, CONTACT, 'taikooli');
  assert.match(model.title, /太古里/);
  assert.match(model.description, /Contact us on WhatsApp to unlock/i);
  assert.match(model.ctaHref, /^https:\/\/wa\.me\/8613800000000\?text=/);
});

test('buildDistrictPageModel exposes route and poi content for an unlocked district', () => {
  const model = buildDistrictPageModel(DISTRICTS, CONTACT, 'wenshuyuan');
  assert.equal(model.route.name, 'Route A');
  assert.ok(model.toilets.length >= 1);
  assert.ok(model.restaurants.length >= 1);
  assert.match(model.dropoff.driverText, /文殊院/);
});

test('renderHubMapSvg outputs translated labels and percentage-based marker positions', () => {
  const html = renderHubMapSvg(buildHubMapModel(DISTRICTS));
  assert.match(html, /data-hub-slug="wenshuyuan"/);
  assert.match(html, /data-locked-slug="taikooli"/);
  assert.match(html, /Wenshu Monastery/);
  assert.match(html, /Jiuyan Bridge/);
  assert.match(html, /--x:23\.3%;--y:20\.0%/);
  assert.doesNotMatch(html, /style="left:\d+px;top:\d+px;"/);
});

test('renderServiceCards outputs the three MAPO service offers', () => {
  const html = renderServiceCards();
  assert.match(html, /1v1 Live Concierge/);
  assert.match(html, /Order Food For You/);
  assert.match(html, /Custom Tour \/ Driver/);
});

test('renderDistrictPage outputs route, toilets, restaurants, and drop-off sections', () => {
  const html = renderDistrictPage(
    buildDistrictPageModel(DISTRICTS, CONTACT, 'peoples-park'),
  );
  assert.match(html, /RECOMMENDED ROUTE/);
  assert.match(html, /TOILETS/);
  assert.match(html, /RESTAURANTS/);
  assert.match(html, /Drop-off Point/);
});

test('trackEvent returns false when gtag is unavailable', () => {
  assert.equal(
    trackEvent(undefined, 'unlock_intent', { district_name: 'Taikoo Li' }),
    false,
  );
});

test('resolveHubTabFromHash maps the services hash to the services tab', () => {
  assert.equal(resolveHubTabFromHash('#services'), 'services');
  assert.equal(resolveHubTabFromHash('#map'), 'map');
  assert.equal(resolveHubTabFromHash(''), 'map');
});

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

test('renderHubPointModal shell exposes the overlay class hooks', () => {
  const unlockedHtml = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'wenshuyuan'),
  );
  assert.match(unlockedHtml, /<div[^>]*class="[^"]*hub-point-modal[^"]*"/);
  assert.match(unlockedHtml, /<div[^>]*role="dialog"/);
  assert.match(unlockedHtml, /<header[^>]*class="[^"]*hub-point-modal__header[^"]*"/);
  assert.match(unlockedHtml, /hub-point-modal__header--open/);
  assert.match(unlockedHtml, /<div[^>]*class="[^"]*hub-point-modal__body[^"]*"/);
  assert.match(unlockedHtml, /<button[^>]*class="[^"]*hub-point-modal__close[^"]*"/);

  const lockedHtml = renderHubPointModal(
    buildHubPointModalModel(DISTRICTS, CONTACT, 'taikooli'),
  );
  assert.match(
    lockedHtml,
    /<header[^>]*class="[^"]*hub-point-modal__header[^"]*"/,
  );
  assert.match(lockedHtml, /hub-point-modal__header--locked/);
});
