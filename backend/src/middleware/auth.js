import jwt from 'jsonwebtoken';

/**
 * Verifies the Bearer token and attaches `req.user = { id, username, roles, shop_id }`.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Returns true if the user holds at least one of the given roles.
 */
export function hasRole(user, ...roles) {
  return user?.roles?.some(r => roles.includes(r)) ?? false;
}

/**
 * Factory: restrict access to users holding at least one of the specified roles.
 * Usage: requireRole('admin', 'organiser')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!hasRole(req.user, ...roles)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
