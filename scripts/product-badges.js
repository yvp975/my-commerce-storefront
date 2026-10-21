// Merchandisers maintain this Commerce product attribute; each selected value becomes a badge.
export const PROMO_BADGE_ATTRIBUTE = 'promo_badges';
export const LOW_STOCK_BADGE = 'Low Stock';

/**
 * Reads merchandiser badges from Catalog Service attributes, plus Low Stock from inventory.
 * @param {{ attributes?: Array<{ id?: string, name?: string, value?: unknown }>,
 *   promoBadges?: unknown, inStock?: boolean, lowStock?: boolean }} product
 * @returns {string[]}
 */
export function getProductBadges({
  attributes, promoBadges, inStock, lowStock,
} = {}) {
  const promoValue = promoBadges ?? attributes?.find(
    ({ id, name }) => (name ?? id) === PROMO_BADGE_ATTRIBUTE,
  )?.value;
  let values = [];
  if (promoValue) {
    values = Array.isArray(promoValue) ? promoValue : String(promoValue).split(',');
  }

  const badges = new Set(values.map((value) => String(value).trim()).filter(Boolean));
  if (lowStock && inStock !== false) badges.add(LOW_STOCK_BADGE);
  return [...badges];
}

/**
 * Creates an accessible badge list; returns null when there is nothing to show.
 * @param {string[]} badges
 * @param {{ lowStockLabel?: string }} [options] Admin-configured low-stock text,
 *   styled as low stock.
 * @returns {HTMLUListElement|null}
 */
export function createProductBadges(badges, { lowStockLabel = LOW_STOCK_BADGE } = {}) {
  if (!badges.length) return null;

  const list = document.createElement('ul');
  list.className = 'product-badges';
  list.setAttribute('aria-label', 'Promotions');

  badges.forEach((badge) => {
    const item = document.createElement('li');
    const modifier = badge === lowStockLabel
      ? 'low-stock'
      : badge.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    item.className = `product-badge product-badge--${modifier}`;
    item.textContent = badge;
    list.append(item);
  });

  return list;
}

/**
 * Fetches event-persisted badge state from the get-product-badges Runtime action.
 * @param {string} endpoint
 * @param {string} sku
 * @returns {Promise<{ badges: string[], source: string, eventId: string|null,
 *   correlationId: string|null, lowStockLabel?: string }|null>} null when unavailable,
 *   so callers keep their fallback.
 */
export async function fetchBadgeState(endpoint, sku) {
  if (!endpoint || !sku) return null;
  try {
    const url = new URL(endpoint);
    url.searchParams.set('sku', sku);
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = await response.json();
    const item = data?.items?.[0];
    if (!item?.found || !Array.isArray(item.badges)) return null;
    return { ...item, lowStockLabel: data.rules?.lowStockLabel };
  } catch (error) {
    console.warn('Badge service unavailable; using catalog badges.', error);
    return null;
  }
}
