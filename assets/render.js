import { CONTACT, SERVICES } from './data.js';

const COLOR_BY_ACCENT = {
  green: '#58cc02',
  orange: '#ff9600',
  blue: '#1677ff',
  red: '#ff4757',
  pink: '#ff6b9d',
  purple: '#9b59b6',
};

const DARK_BY_ACCENT = {
  green: '#46a302',
  orange: '#e58700',
  blue: '#125dca',
  red: '#d63847',
  pink: '#d9487f',
  purple: '#7a3c9c',
};

const TINT_BY_ACCENT = {
  green: '#f7fff0',
  orange: '#fff5e6',
  blue: '#eef5ff',
  red: '#fff5f5',
  pink: '#fff0f6',
  purple: '#f6efff',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function actionHref(contact, action) {
  if (action.kind === 'whatsapp') {
    return buildWhatsAppUrl(contact.whatsapp, action.message);
  }

  return '#wechat';
}

function buttonClass(kind, accent) {
  if (kind === 'wechat') {
    return 'btn btn--wechat';
  }

  if (accent === 'orange') {
    return 'btn btn--orange';
  }

  if (accent === 'blue') {
    return 'btn btn--blue';
  }

  return 'btn btn--green';
}

function renderServiceAction(contact, service, action) {
  const href = actionHref(contact, action);
  const copyAttr =
    action.kind === 'wechat'
      ? ` data-copy="${escapeHtml(contact.wechatId)}" data-copy-label="WeChat ID"`
      : '';
  const analyticsAttr = ` data-analytics-event="service_cta_click" data-analytics-service="${escapeHtml(service.title)}"`;
  const relAttr = action.kind === 'whatsapp' ? ' rel="noreferrer"' : '';
  const targetAttr = action.kind === 'whatsapp' ? ' target="_blank"' : '';

  return `<a class="${buttonClass(action.kind, service.accent)}" href="${escapeHtml(href)}"${copyAttr}${analyticsAttr}${relAttr}${targetAttr}>${escapeHtml(action.label)}</a>`;
}

function renderSvgLabel(label) {
  const transform = label.rotate ? ` transform="${label.rotate}"` : '';
  return `<text x="${label.x}" y="${label.y}" text-anchor="middle" font-size="${label.size}" fill="#7a7a7a"${transform}>${escapeHtml(label.text)}</text>`;
}

function renderSvgPoi(poi) {
  const fill = COLOR_BY_ACCENT[poi.color];

  return `
    <circle cx="${poi.x}" cy="${poi.y}" r="7" fill="${fill}" stroke="white" stroke-width="1.5"></circle>
    <text x="${poi.x}" y="${poi.y + 3}" text-anchor="middle" font-size="7">${poi.emoji}</text>
  `;
}

function renderBlock(block) {
  return `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" rx="3" fill="#e8e0d4" stroke="#ccc" stroke-width="0.5"></rect>`;
}

function renderLandmark(landmark) {
  const zhY = landmark.nameEn ? landmark.y + 14 : landmark.y + 20;
  const enText = landmark.nameEn
    ? `<text x="${landmark.x + landmark.width / 2}" y="${landmark.y + 24}" text-anchor="middle" font-size="5.5" fill="${landmark.stroke}">${escapeHtml(landmark.nameEn)}</text>`
    : '';

  return `
    <rect x="${landmark.x}" y="${landmark.y}" width="${landmark.width}" height="${landmark.height}" rx="4" fill="${landmark.fill}" stroke="${landmark.stroke}" stroke-width="1.5"></rect>
    <text x="${landmark.x + landmark.width / 2}" y="${zhY}" text-anchor="middle" font-size="7" fill="#2d6a00" font-weight="800">${escapeHtml(landmark.nameZh)}</text>
    ${enText}
  `;
}

function renderDistrictMap(model) {
  const map = model.map;
  if (!map) {
    return '';
  }

  const streets = map.streets
    .map(
      (street) =>
        `<line x1="${street.x1}" y1="${street.y1}" x2="${street.x2}" y2="${street.y2}" stroke="#ffffff" stroke-width="${street.width}"></line>`,
    )
    .join('');
  const blocks = map.blocks.map(renderBlock).join('');
  const landmarks = map.landmarks.map(renderLandmark).join('');
  const pois = map.pois.map(renderSvgPoi).join('');
  const labels = map.labels.map(renderSvgLabel).join('');
  const legend = model.legend
    .map(
      (item) =>
        `<div class="legend__item"><span>${item.emoji}</span><span>${escapeHtml(item.label)}</span></div>`,
    )
    .join('');

  return `
    <section class="district-map-card">
      <div class="district-map-card__frame">
        <svg viewBox="${map.viewBox}" xmlns="http://www.w3.org/2000/svg" class="district-map-card__svg">
          <rect width="184" height="240" fill="#f2efe9"></rect>
          ${streets}
          ${blocks}
          ${landmarks}
          <path d="${map.routePath}" fill="none" stroke="#58cc02" stroke-width="2.5" stroke-dasharray="5,3" stroke-linecap="round" stroke-linejoin="round"></path>
          <circle cx="${map.start.x}" cy="${map.start.y}" r="7" fill="#58cc02" stroke="white" stroke-width="1.5"></circle>
          <text x="${map.start.x}" y="${map.start.y + 3}" text-anchor="middle" font-size="6" fill="white" font-weight="900">S</text>
          ${pois}
          ${labels}
        </svg>
        <div class="map-legend">${legend}</div>
      </div>
      <div class="district-map-card__hint">↓ Scroll down for POI cards</div>
    </section>
  `;
}

function renderRouteCard(route) {
  const steps = route.steps
    .map(
      (step, index) =>
        `<li><span class="route-step__index">0${index + 1}</span><span>${escapeHtml(step.stop)}</span><span class="route-step__time">${escapeHtml(step.duration)}</span></li>`,
    )
    .join('');

  return `
    <section class="content-section">
      <div class="section-label">RECOMMENDED ROUTE</div>
      <article class="info-card info-card--green">
        <div class="route-pill">${escapeHtml(route.name)} · ${escapeHtml(route.totalTime)}</div>
        <ol class="route-steps">${steps}</ol>
      </article>
    </section>
  `;
}

function renderToiletCard(toilet) {
  const typeClass = toilet.type === 'Sit-down' ? 'tag tag--blue' : 'tag tag--orange';
  const typeIcon = toilet.type === 'Sit-down' ? '🪑' : '🦵';

  return `
    <article class="info-card info-card--blue">
      <div class="card-title-row">
        <h3>${escapeHtml(toilet.name)}</h3>
        <span class="${typeClass}">${typeIcon} ${escapeHtml(toilet.type)}</span>
      </div>
      <p>${escapeHtml(toilet.directions)}</p>
    </article>
  `;
}

function renderRestaurantCard(restaurant) {
  const dishes = restaurant.dishes
    .map((dish) => {
      const dietary = dish.dietary.length
        ? `<div class="dish-meta">${dish.dietary.map(escapeHtml).join(' · ')}</div>`
        : '';

      return `
        <div class="dish-row">
          <div>
            <div class="dish-title">${escapeHtml(dish.nameEn)} <span>${escapeHtml(dish.nameZh)}</span></div>
            <div class="dish-meta">${escapeHtml(dish.description)} · ${escapeHtml(dish.spice)}</div>
            ${dietary}
          </div>
          <div class="dish-price">${escapeHtml(dish.price)}</div>
        </div>
      `;
    })
    .join('');

  return `
    <article class="info-card info-card--red">
      <h3>${escapeHtml(restaurant.nameZh)} · ${escapeHtml(restaurant.nameEn)}</h3>
      <p>${escapeHtml(restaurant.subtitle)}</p>
      <div class="dish-list">${dishes}</div>
    </article>
  `;
}

function renderDropoffCard(dropoff) {
  return `
    <article class="info-card info-card--orange">
      <h3>📍 ${escapeHtml(dropoff.label)}</h3>
      <p>${escapeHtml(dropoff.driverText)}</p>
      <div class="button-row">
        <a class="btn btn--orange" href="${escapeHtml(dropoff.mapsUrl)}" target="_blank" rel="noreferrer">Open in Maps</a>
        <a class="btn btn--orange btn--orange-dark" href="${escapeHtml(dropoff.didiUrl)}">Open Didi 🚕</a>
      </div>
    </article>
  `;
}

export function getDistrictBySlug(districts, slug) {
  const district = districts.find((item) => item.slug === slug);

  if (!district) {
    throw new Error(`Unknown district: ${slug}`);
  }

  return district;
}

export function getUnlockedDistricts(districts) {
  return districts.filter((item) => item.unlocked);
}

export function buildWhatsAppUrl(phoneNumber, text) {
  const normalized = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function buildHubMapModel(districts) {
  const unlocked = districts.filter((item) => item.unlocked);
  const locked = districts.filter((item) => !item.unlocked);

  return {
    unlocked,
    locked,
    all: districts,
    unlockBadge: `${unlocked.length} / ${districts.length} unlocked`,
  };
}

export function buildUnlockModalModel(districts, contact, slug) {
  const district = getDistrictBySlug(districts, slug);

  return {
    slug: district.slug,
    title: `${district.nameZh} · ${district.nameEn}`,
    summary: district.summary,
    description: 'Contact us on WhatsApp to unlock — usually within minutes.',
    ctaLabel: '💬 Unlock via WhatsApp',
    ctaHref: buildWhatsAppUrl(
      contact.whatsapp,
      `Hi MAPO, please unlock ${district.nameEn} for me.`,
    ),
  };
}

export function buildDistrictPageModel(districts, contact, slug) {
  const district = getDistrictBySlug(districts, slug);

  if (!district.unlocked) {
    throw new Error(`District is locked: ${slug}`);
  }

  return {
    ...district,
    routeBadge: `🗺 ${district.route.name}`,
    whatsappHref: buildWhatsAppUrl(
      contact.whatsapp,
      `Hi MAPO, I need help in ${district.nameEn}.`,
    ),
    servicesHref: '../index.html#services',
    mapHref: '../index.html',
    contact,
  };
}

export function renderHubMapSvg(model) {
  const nodes = model.all
    .map((district) => {
      const style = `style="left:${district.hub.x}px;top:${district.hub.y}px;"`;
      const classes = district.unlocked
        ? 'district-chip district-chip--open'
        : 'district-chip district-chip--locked';

      if (district.unlocked) {
        return `
          <a class="${classes}" href="districts/${district.slug}.html" ${style}>
            <span class="district-chip__icon">${escapeHtml(district.icon)}</span>
            <span class="district-chip__label">${escapeHtml(district.nameZh)}</span>
          </a>
        `;
      }

      return `
        <button class="${classes}" type="button" data-locked-slug="${district.slug}" ${style}>
          <span class="district-chip__icon">🔒</span>
          <span class="district-chip__label">${escapeHtml(district.nameZh)}</span>
        </button>
      `;
    })
    .join('');

  return `
    <section class="hub-map-card">
      <div class="hub-map-card__caption">
        <div>
          <strong>Tap a district to explore</strong>
          <span>${escapeHtml(model.unlockBadge)}</span>
        </div>
        <span class="hint-pill">🔒 Tap locked area to unlock</span>
      </div>
      <div class="hub-map-graphic">
        <svg viewBox="0 0 180 170" class="hub-map-graphic__svg" xmlns="http://www.w3.org/2000/svg">
          <rect width="180" height="170" rx="24" fill="#f5f8fb"></rect>
          <ellipse cx="88" cy="86" rx="62" ry="44" fill="none" stroke="#d7dee8" stroke-width="2" stroke-dasharray="6 5"></ellipse>
          <ellipse cx="95" cy="88" rx="88" ry="63" fill="none" stroke="#e5ebf1" stroke-width="2" stroke-dasharray="8 6"></ellipse>
          <path d="M20 135 C50 116, 82 92, 120 98 C145 101, 156 118, 170 128" fill="none" stroke="#67c7ff" stroke-width="6" stroke-linecap="round"></path>
          <text x="149" y="28" font-size="10" fill="#607080" font-weight="700">N ↑</text>
        </svg>
        ${nodes}
      </div>
    </section>
  `;
}

export function renderServiceCards(contact = CONTACT) {
  return SERVICES.map((service) => {
    const accentColor = COLOR_BY_ACCENT[service.accent];
    const tintColor = TINT_BY_ACCENT[service.accent];
    const actions = service.actions
      .map((action) => renderServiceAction(contact, service, action))
      .join('');

    return `
      <article class="service-card" style="--service-accent:${accentColor};--service-accent-dark:${DARK_BY_ACCENT[service.accent]};--service-tint:${tintColor};">
        <div class="service-card__header">
          <div class="service-card__icon">${service.icon}</div>
          <div>
            <h3>${escapeHtml(service.title)}</h3>
            <p>${escapeHtml(service.subtitle)}</p>
          </div>
        </div>
        <p class="service-card__body">${escapeHtml(service.body)}</p>
        <div class="button-row">${actions}</div>
      </article>
    `;
  }).join('');
}

export function renderUnlockModal(model) {
  return `
    <div class="unlock-modal__backdrop" data-close-modal="true"></div>
    <div class="unlock-modal__card" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
      <div class="unlock-modal__eyebrow">🔒 Locked district</div>
      <h2 id="unlock-title">${escapeHtml(model.title)}</h2>
      <p class="unlock-modal__summary">${escapeHtml(model.summary)}</p>
      <p>${escapeHtml(model.description)}</p>
      <div class="button-stack">
        <a class="btn btn--green" href="${escapeHtml(model.ctaHref)}" target="_blank" rel="noreferrer" data-analytics-event="unlock_cta_click" data-analytics-district="${escapeHtml(model.slug)}">${escapeHtml(model.ctaLabel)}</a>
        <button class="btn btn--ghost" type="button" data-close-modal="true">Maybe later</button>
      </div>
    </div>
  `;
}

export function renderDistrictPage(model) {
  const toilets = model.toilets.map(renderToiletCard).join('');
  const restaurants = model.restaurants.map(renderRestaurantCard).join('');

  return `
    <header class="district-hero">
      <a class="district-hero__back" href="${escapeHtml(model.mapHref)}">←</a>
      <div class="district-hero__copy">
        <h1>${escapeHtml(model.nameZh)}</h1>
        <p>${escapeHtml(model.nameEn)} · ${escapeHtml(model.walkTime)}</p>
      </div>
      <span class="route-pill route-pill--ghost">${escapeHtml(model.routeBadge)}</span>
    </header>
    ${renderDistrictMap(model)}
    <div class="district-content">
      ${renderRouteCard(model.route)}
      <section class="content-section">
        <div class="section-label">TOILETS</div>
        ${toilets}
      </section>
      <section class="content-section">
        <div class="section-label">RESTAURANTS</div>
        ${restaurants}
      </section>
      <section class="content-section">
        <div class="section-label">NAVIGATION</div>
        ${renderDropoffCard(model.dropoff)}
      </section>
      <section class="content-section">
        <div class="section-label">HELP NOW</div>
        <article class="info-card info-card--green">
          <h3>Need live help?</h3>
          <p>MAPO can handle live concierge, food ordering, and route rescue while you are already outside.</p>
          <div class="button-row">
            <a class="btn btn--green" href="${escapeHtml(model.whatsappHref)}" target="_blank" rel="noreferrer" data-analytics-event="service_cta_click" data-analytics-service="District Concierge">WhatsApp MAPO</a>
            <a class="btn btn--wechat" href="#wechat" data-copy="${escapeHtml(model.contact.wechatId)}" data-copy-label="WeChat ID">Copy WeChat ID</a>
          </div>
        </article>
      </section>
    </div>
    <nav class="bottom-nav">
      <a class="bottom-nav__item bottom-nav__item--active" href="${escapeHtml(model.mapHref)}">
        <span>🗺️</span>
        <span>Map</span>
      </a>
      <a class="bottom-nav__item" href="${escapeHtml(model.servicesHref)}">
        <span>⭐</span>
        <span>Services</span>
      </a>
    </nav>
  `;
}

export function trackEvent(gtagFn, eventName, params) {
  if (typeof gtagFn !== 'function') {
    return false;
  }

  gtagFn('event', eventName, params);
  return true;
}
