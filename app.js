(() => {
  const TITLE_ID = 'ad467bbb-ca91-44e9-8016-5067cdce954c';
  const SKU = 'glitch-preorder';
  const CATALOG_URL = 'https://api.glitch.fun/api/titles/' + TITLE_ID + '/preorders';
  const GAME_URL = 'https://www.glitch.fun/games/' + TITLE_ID;

  const all = (selector) => [...document.querySelectorAll(selector)];

  all('[data-preorder-link]').forEach((link) => {
    link.href = GAME_URL;
    link.addEventListener('click', () => {
      try {
        sessionStorage.setItem('wotw_preorder_referrer', 'glitch_hosting_founders');
      } catch {
        // Storage is optional. Checkout remains on Glitch.
      }
      try {
        window.GameAnalyticsTracker?.trackEvent(
          'preorder',
          'checkout_click',
          { sku: SKU, destination: 'glitch_title_page' },
          false
        );
        window.GameAnalyticsTracker?.flush?.();
      } catch {
        // Analytics must never block preorder navigation.
      }
    });
  });

  const formatMoney = (minor, currency) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
      }).format(minor / 100);
    } catch {
      return '$' + (minor / 100).toFixed(2);
    }
  };

  const paint = (offer) => {
    const remaining = Number.isFinite(offer?.remaining) ? offer.remaining : 100;
    const total = Number.isFinite(offer?.limit_total) && offer.limit_total > 0 ? offer.limit_total : 100;
    const priceRow = Array.isArray(offer?.prices)
      ? offer.prices.find((row) => row.currency === 'USD') || offer.prices[0]
      : null;
    const price = priceRow ? formatMoney(priceRow.amount_minor, priceRow.currency || 'USD') : '$15.99';
    const claimed = Math.max(0, total - remaining);
    const claimedPct = Math.min(100, Math.max(0, (claimed / total) * 100));

    ['remainingHero', 'remainingOffer', 'remainingFinal'].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = String(remaining);
    });
    ['priceHero', 'priceOffer', 'finalPrice'].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = price;
    });

    const nav = document.getElementById('navRemaining');
    if (nav) nav.textContent = remaining + ' Founding Team spot' + (remaining === 1 ? '' : 's');

    const band = document.getElementById('remainingBand');
    if (band) band.textContent = remaining + ' / ' + total;

    const meter = document.getElementById('availabilityMeter');
    if (meter) meter.style.width = claimedPct + '%';

    const cta = document.getElementById('ctaPrice');
    if (cta) cta.textContent = price + ' • one per account';

    if (offer && (offer.state !== 'available' || remaining < 1)) {
      all('[data-preorder-link]').forEach((link) => {
        link.setAttribute('aria-label', 'View current preorder status on Glitch');
        link.classList.add('sold-out');
        const label = link.querySelector('span');
        if (label) label.textContent = 'View preorder status';
        else link.textContent = 'View preorder status';
      });
    }
  };

  paint(null);

  fetch(CATALOG_URL, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    cache: 'no-store'
  })
    .then((response) => {
      if (!response.ok) throw new Error('catalog unavailable');
      return response.json();
    })
    .then((json) => {
      const offers = json?.data?.offers;
      const offer = Array.isArray(offers)
        ? offers.find((item) => item?.sku === SKU && item?.fulfillment_type === 'glitch_license')
        : null;
      if (offer) paint(offer);
    })
    .catch(() => {
      // Verified build-time fallback remains visible.
    });
})();
