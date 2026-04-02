import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveHubTabFromHash } from '../assets/app.js';
import { CONTACT, DISTRICTS } from '../assets/data.js';
import {
  buildDistrictPageModel,
  buildHubMapModel,
  buildUnlockModalModel,
  buildWhatsAppUrl,
  getDistrictBySlug,
  getUnlockedDistricts,
  renderDistrictPage,
  renderHubMapSvg,
  renderServiceCards,
  trackEvent,
} from '../assets/render.js';

test('getDistrictBySlug returns the requested district model', () => {
  const district = getDistrictBySlug(DISTRICTS, 'wenshuyuan');
  assert.equal(district.slug, 'wenshuyuan');
  assert.equal(district.nameZh, '文殊院');
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

test('renderHubMapSvg outputs links for unlocked districts and buttons for locked districts', () => {
  const html = renderHubMapSvg(buildHubMapModel(DISTRICTS));
  assert.match(html, /href="districts\/wenshuyuan\.html"/);
  assert.match(html, /data-locked-slug="taikooli"/);
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
