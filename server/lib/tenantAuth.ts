import type { Request, Response, NextFunction } from 'express';

/**
 * Resolves the authenticated tenantId strictly from req.user.tenantId (JWT claims or service API key).
 * Never accepts tenantId from req.query or req.body for authorization.
 * Returns null and responds 401 fail-closed if tenantId is missing or invalid.
 */
export function getAuthenticatedTenantId(req: Request, res: Response): number | null {
  const tenantId = req.user?.tenantId;
  if (typeof tenantId !== 'number' || isNaN(tenantId)) {
    res.status(401).json({
      error: 'Unauthorized: Autenticação de tenant obrigatória (fail-closed).'
    });
    return null;
  }
  return tenantId;
}

/**
 * Gate for administrative mutations on tenant resources (e.g. Status Catalog CRUD writes).
 * Enforces req.user.role === 'admin' (or req.user.isAdmin === true).
 * Non-admins receive 403 Forbidden.
 * Unauthenticated requests receive 401 Unauthorized.
 */
export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.user?.tenantId;
  if (typeof tenantId !== 'number' || isNaN(tenantId)) {
    return res.status(401).json({
      error: 'Unauthorized: Autenticação de tenant obrigatória (fail-closed).'
    });
  }

  const role = req.user?.role || (req.user?.isAdmin ? 'admin' : undefined);
  if (role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Operação restrita a administradores do tenant (role admin requerido).'
    });
  }

  next();
}

/**
 * Validates that an incoming request body does not attempt to specify a mismatched tenantId (IDOR injection).
 */
export function validateTenantBodyMatch(req: Request, res: Response, authenticatedTenantId: number): boolean {
  if (req.body && req.body.tenantId !== undefined && req.body.tenantId !== authenticatedTenantId) {
    res.status(400).json({
      error: 'IDOR Protection: tenantId no corpo da requisição não corresponde ao token autenticado.'
    });
    return false;
  }
  return true;
}
