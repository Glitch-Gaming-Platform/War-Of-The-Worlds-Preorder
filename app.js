(() => {
  const TITLE_ID = 'ad467bbb-ca91-44e9-8016-5067cdce954c';
  const STEAM_SKU = 'steam-early-access';
  const GLITCH_SKU = 'glitch-preorder';
  const CATALOG_URL = 'https://api.glitch.fun/api/titles/' + TITLE_ID + '/preorders';
  const GAME_URL = 'https://www.glitch.fun/games/' + TITLE_ID;
  const DEFAULT_STEAM = { sku: STEAM_SKU, state: 'sold_out', status: 'active', limit_total: 100, remaining: 0, sold: 0, prices: [{ currency: 'USD', amount_minor: 2199 }] };
  const DEFAULT_GLITCH = { sku: GLITCH_SKU, state: 'available', status: 'active', limit_total: 100, remaining: 100, sold: 0, prices: [{ currency: 'USD', amount_minor: 1599 }] };
  const all = (selector) => [...document.querySelectorAll(selector)];

  const formatMoney = (offer, fallback) => {
    const row = Array.isArray(offer?.prices) ? offer.prices.find((x) => x.currency === 'USD') || offer.prices[0] : null;
    if (!row) return fallback;
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency || 'USD', minimumFractionDigits: 2 }).format(row.amount_minor / 100); }
    catch { return '$' + (row.amount_minor / 100).toFixed(2); }
  };

  const steamStateText = (offer) => {
    const total = Number.isFinite(offer?.limit_total) ? offer.limit_total : 100;
    const remaining = Number.isFinite(offer?.remaining) ? offer.remaining : 0;
    const sold = Number.isFinite(offer?.sold) ? offer.sold : 0;
    if (offer?.state === 'available' && remaining > 0) return `${remaining} of ${total} Steam keys available`;
    if (sold >= total && total > 0) return 'Steam Founding Team allocation claimed';
    return 'Steam key inventory currently unavailable';
  };

  const glitchStateText = (offer) => {
    const total = Number.isFinite(offer?.limit_total) ? offer.limit_total : 100;
    const remaining = Number.isFinite(offer?.remaining) ? offer.remaining : 100;
    if (offer?.state === 'available' && remaining > 0) return `${remaining} of ${total} Glitch-license spots available`;
    return 'Glitch-license preorder currently unavailable';
  };

  const linkAll = () => {
    all('[data-steam-cta],[data-glitch-cta]').forEach((link) => {
      link.href = GAME_URL;
      link.addEventListener('click', () => {
        const sku = link.hasAttribute('data-steam-cta') ? STEAM_SKU : GLITCH_SKU;
        try { sessionStorage.setItem('wotw_preorder_referrer', 'glitch_hosting_founders'); } catch {}
        try {
          window.GameAnalyticsTracker?.trackEvent('preorder', 'checkout_click', { sku, destination: 'glitch_title_page' }, false);
          window.GameAnalyticsTracker?.flush?.();
        } catch {}
      });
    });
  };

  const paint = (steam, glitch) => {
    const steamPrice = formatMoney(steam, '$21.99');
    const glitchPrice = formatMoney(glitch, '$15.99');
    const steamText = steamStateText(steam);
    const glitchText = glitchStateText(glitch);
    const steamAvailable = steam?.state === 'available' && Number(steam?.remaining) > 0;

    ['steamPriceHero','steamPriceBand','steamPriceOffer'].forEach((id) => { const n=document.getElementById(id); if(n) n.textContent=steamPrice; });
    ['glitchPriceBand','glitchPriceOffer'].forEach((id) => { const n=document.getElementById(id); if(n) n.textContent=glitchPrice; });
    ['steamStatusBand','steamStatusOffer'].forEach((id) => { const n=document.getElementById(id); if(n) n.textContent=steamText; });
    ['glitchStatusBand','glitchStatusOffer'].forEach((id) => { const n=document.getElementById(id); if(n) n.textContent=glitchText; });

    const heroStatus=document.getElementById('steamStatusHero'); if(heroStatus) heroStatus.textContent=steamAvailable ? 'Available' : 'Unavailable';
    const heroInventory=document.getElementById('steamInventoryHero'); if(heroInventory) heroInventory.textContent=steamText;
    const nav=document.getElementById('navOfferStatus'); if(nav) nav.textContent=steamAvailable ? 'Steam Founding Team keys available' : 'Steam preorder: check key availability';
    const steamCtaPrice=document.getElementById('steamCtaPrice'); if(steamCtaPrice) steamCtaPrice.textContent=`${steamPrice} through Glitch`;
    const steamCtaBottom=document.getElementById('steamCtaBottom'); if(steamCtaBottom) steamCtaBottom.textContent=`${steamPrice} through Glitch`;
    const glitchCtaPrice=document.getElementById('glitchCtaPrice'); if(glitchCtaPrice) glitchCtaPrice.textContent=glitchPrice;
    const glitchCtaBottom=document.getElementById('glitchCtaBottom'); if(glitchCtaBottom) glitchCtaBottom.textContent=glitchPrice;

    all('[data-steam-cta]').forEach((link) => {
      link.classList.toggle('sold-out', !steamAvailable);
      const label=link.querySelector('span');
      const text=steamAvailable ? 'Pre-order Steam key' : 'Check Steam preorder';
      if(label) label.textContent=text; else link.textContent=text;
      link.setAttribute('aria-label', steamAvailable ? `Pre-order Steam key for ${steamPrice} on Glitch` : 'Check current Steam preorder availability on Glitch');
    });
  };

  linkAll();
  paint(DEFAULT_STEAM, DEFAULT_GLITCH);
  fetch(CATALOG_URL, { headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error('catalog unavailable'); return r.json(); })
    .then((json) => {
      const offers = Array.isArray(json?.data?.offers) ? json.data.offers : [];
      const steam = offers.find((x) => x?.sku === STEAM_SKU && x?.platform_code === 'steam') || DEFAULT_STEAM;
      const glitch = offers.find((x) => x?.sku === GLITCH_SKU && x?.fulfillment_type === 'glitch_license') || DEFAULT_GLITCH;
      paint(steam, glitch);
    })
    .catch(() => {});
})();
