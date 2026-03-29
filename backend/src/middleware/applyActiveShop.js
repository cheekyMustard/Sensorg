const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * If the client sends an X-Shop-Id header (set from the login-page shop picker),
 * override req.user.shop_id so all downstream scoping uses the selected shop
 * rather than the admin-assigned one.
 *
 * Only admin and organiser are allowed to switch shops — all other roles are
 * locked to their assigned shop_id to prevent cross-shop data access.
 *
 * Mutates shop_id in place — do NOT replace the whole req.user object, as that
 * can drop non-enumerable properties from the jwt.verify result and break role checks.
 */
export function applyActiveShop(req, _res, next) {
  const shopId = req.headers['x-shop-id'];
  const canSwitchShop = req.user?.roles?.some(r => ['admin', 'organiser'].includes(r));
  if (shopId && UUID_RE.test(shopId) && canSwitchShop) {
    req.user.shop_id = shopId;
  }
  next();
}
