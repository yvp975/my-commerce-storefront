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
 * @returns {HTMLUListElement|null}
 */
export function createProductBadges(badges) {
  if (!badges.length) return null;

  const list = document.createElement('ul');
  list.className = 'product-badges';
  list.setAttribute('aria-label', 'Promotions');

  badges.forEach((badge) => {
    const item = document.createElement('li');
    const modifier = badge.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    item.className = `product-badge product-badge--${modifier}`;
    item.textContent = badge;
    list.append(item);
  });

  return list;
}
