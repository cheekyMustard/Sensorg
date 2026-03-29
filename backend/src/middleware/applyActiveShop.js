const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * If the client sends an X-Shop-Id header (set from the login-page shop picker),
 * override req.user.shop_id so all downstream scoping uses the selected shop
 * rather than the admin-assigned one.
 *
 * Mutates shop_id in place — do NOT replace the whole req.user object, as that
 * can drop non-enumerable properties from the jwt.verify result and break role checks.
 */
export function applyActiveShop(req, _res, next) {
  const shopId = req.headers['x-shop-id'];
  if (shopId && UUID_RE.test(shopId)) {
    req.user.shop_id = shopId;
  }
  next();
}
