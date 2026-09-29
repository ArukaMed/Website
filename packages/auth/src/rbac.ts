import { UserRole, type UserRoleType, type UserSession } from "@aegis/types";

export interface PermissionCheckOptions {
  user: UserSession;
  targetTenantId?: string;
  allowedRoles?: UserRoleType[];
}

export function canAccessTenant(user: UserSession, targetTenantId?: string): boolean {
  if (user.role === UserRole.SUPER_ADMIN) return true;
  if (!targetTenantId) return true;
  return user.tenantId === targetTenantId;
}

export function hasRequiredRole(user: UserSession, allowedRoles: UserRoleType[]): boolean {
  if (user.role === UserRole.SUPER_ADMIN) return true;
  return allowedRoles.includes(user.role);
}

export function assertAuthorized({ user, targetTenantId, allowedRoles }: PermissionCheckOptions): void {
  if (!canAccessTenant(user, targetTenantId)) {
    throw new Error("Unauthorized: Cross-tenant access denied");
  }
  if (allowedRoles && !hasRequiredRole(user, allowedRoles)) {
    throw new Error(`Unauthorized: Role '${user.role}' lacks required permissions`);
  }
}
