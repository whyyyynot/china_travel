import { CONTACT, DISTRICTS } from './data.js';
import {
  buildDistrictPageModel,
  buildHubMapModel,
  buildUnlockModalModel,
  renderDistrictPage,
  renderHubMapSvg,
  renderServiceCards,
  renderUnlockModal,
  trackEvent,
} from './render.js';

let toastTimer = null;

export function resolveHubTabFromHash(hash) {
  return hash === '#services' ? 'services' : 'map';
}

function showToast(message) {
  const toast = document.querySelector('#app-toast');
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.hidden = false;

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

async function copyText(value, label) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied`);
      return;
    }
  } catch {
    // Fall through to the visible fallback below.
  }

  showToast(`${label}: ${value}`);
}

function analyticsParamsFromTarget(target) {
  if (target.dataset.analyticsDistrict) {
    return { district_name: target.dataset.analyticsDistrict };
  }

  if (target.dataset.analyticsService) {
    return { service_name: target.dataset.analyticsService };
  }

  return {};
}

function initAnalytics() {
  const gaId =
    document.querySelector('meta[name="mapo-ga-id"]')?.content?.trim() || '';

  if (!gaId || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (typeof window.gtag === 'function') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args) => {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', gaId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  script.referrerPolicy = 'origin';
  document.head.append(script);
}

function setHubTab(tab) {
  const mapPanel = document.querySelector('#hub-map-panel');
  const servicesPanel = document.querySelector('#hub-services-panel');
  const tabButtons = document.querySelectorAll('[data-tab-target]');

  if (!mapPanel || !servicesPanel || !tabButtons.length) {
    return;
  }

  const showServices = tab === 'services';
  mapPanel.hidden = showServices;
  servicesPanel.hidden = !showServices;

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tabTarget === tab;
    button.classList.toggle('bottom-nav__item--active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderHubPage() {
  const mapPanel = document.querySelector('#hub-map-panel');
  const servicesPanel = document.querySelector('#hub-services-panel');
  const badge = document.querySelector('#unlock-badge');

  if (!mapPanel || !servicesPanel) {
    return;
  }

  const hubModel = buildHubMapModel(DISTRICTS);
  mapPanel.innerHTML = renderHubMapSvg(hubModel);
  servicesPanel.innerHTML = `<section class="service-stack">${renderServiceCards(
    CONTACT,
  )}</section>`;

  if (badge) {
    badge.textContent = hubModel.unlockBadge;
  }

  setHubTab(resolveHubTabFromHash(window.location.hash));
}

function openUnlockModal(slug) {
  const root = document.querySelector('#unlock-modal-root');
  if (!root) {
    return;
  }

  const model = buildUnlockModalModel(DISTRICTS, CONTACT, slug);
  root.innerHTML = renderUnlockModal(model);
  root.hidden = false;
  document.body.classList.add('modal-open');

  trackEvent(window.gtag, 'unlock_intent', {
    district_name: slug,
  });
}

function closeUnlockModal() {
  const root = document.querySelector('#unlock-modal-root');
  if (!root) {
    return;
  }

  root.hidden = true;
  root.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function renderDistrict() {
  const slug = document.body.dataset.districtSlug;
  const root = document.querySelector('#district-root');

  if (!slug || !root) {
    return;
  }

  const model = buildDistrictPageModel(DISTRICTS, CONTACT, slug);
  root.innerHTML = renderDistrictPage(model);
  document.title = `${model.nameEn} | MAPO Chengdu`;

  trackEvent(window.gtag, 'district_open', {
    district_name: model.slug,
  });
}

function handleDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const analyticsTarget = target.closest('[data-analytics-event]');
  if (analyticsTarget) {
    trackEvent(
      window.gtag,
      analyticsTarget.dataset.analyticsEvent,
      analyticsParamsFromTarget(analyticsTarget),
    );
  }

  const tabTarget = target.closest('[data-tab-target]');
  if (tabTarget instanceof HTMLButtonElement) {
    const tab = tabTarget.dataset.tabTarget;
    window.location.hash = tab === 'services' ? 'services' : 'map';
    setHubTab(tab);
    return;
  }

  const lockedDistrict = target.closest('[data-locked-slug]');
  if (lockedDistrict) {
    event.preventDefault();
    openUnlockModal(lockedDistrict.dataset.lockedSlug);
    return;
  }

  const closeTarget = target.closest('[data-close-modal]');
  if (closeTarget) {
    event.preventDefault();
    closeUnlockModal();
    return;
  }

  const copyTarget = target.closest('[data-copy]');
  if (copyTarget) {
    event.preventDefault();
    copyText(copyTarget.dataset.copy, copyTarget.dataset.copyLabel || 'Copied');
  }
}

function initPage() {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }

  initAnalytics();

  document.addEventListener('click', handleDocumentClick);

  if (document.body.dataset.page === 'hub') {
    renderHubPage();
    window.addEventListener('hashchange', () => {
      setHubTab(resolveHubTabFromHash(window.location.hash));
    });
    return;
  }

  if (document.body.dataset.page === 'district') {
    renderDistrict();
  }
}

if (typeof document !== 'undefined') {
  initPage();
}
