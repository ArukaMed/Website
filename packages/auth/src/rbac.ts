import { UserRole, type UserRoleType, type UserSession, ISO_ROLE_DEFINITIONS } from "@aegis/types";

export interface PermissionCheckOptions {
  user: UserSession;
  targetTenantId?: string;
  allowedRoles?: UserRoleType[];
}

export function canAccessTenant(user: UserSession, targetTenantId?: string): boolean {
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.FOUNDER) return true;
  if (!targetTenantId) return true;
  return user.tenantId === targetTenantId;
}

export function hasRequiredRole(user: UserSession, allowedRoles: UserRoleType[]): boolean {
  // Founder and Super Admin hold root authority across portals
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.FOUNDER) return true;
  return allowedRoles.includes(user.role);
}

export function canEditEmployeeHR(role: UserRoleType): boolean {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.FOUNDER || role === UserRole.BRAND_ADMIN) return true;
  return Boolean(ISO_ROLE_DEFINITIONS[role]?.canEditHR);
}

export function canViewAuditLogs(role: UserRoleType): boolean {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.FOUNDER) return true;
  return Boolean(ISO_ROLE_DEFINITIONS[role]?.canAccessAuditLogs);
}

export function assertAuthorized({ user, targetTenantId, allowedRoles }: PermissionCheckOptions): void {
  if (!canAccessTenant(user, targetTenantId)) {
    throw new Error("Unauthorized: Cross-tenant access denied");
  }
  if (allowedRoles && !hasRequiredRole(user, allowedRoles)) {
    throw new Error(`Unauthorized: Role '${user.role}' lacks required permissions`);
  }
}
