export enum Role {
  ADMIN = 'admin',
  DATA_OPERATOR = 'data_operator',
  ACCOUNTANT = 'accountant',
}

export enum Permission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  MANAGE_PURCHASES = 'MANAGE_PURCHASES',
  MANAGE_TENDERS = 'MANAGE_TENDERS',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  MANAGE_MASTERS = 'MANAGE_MASTERS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_ACTIVITY_LOGS = 'VIEW_ACTIVITY_LOGS',
}

export enum TenderStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PENDING = 'pending',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum InventoryMovementType {
  PURCHASE_IN = 'PURCHASE_IN',
  ALLOCATION = 'ALLOCATION',
  CONSUMPTION = 'CONSUMPTION',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum InventoryDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum EmployeeAssignmentStatus {
  UNASSIGNED = 'unassigned',
  ASSIGNED = 'assigned',
  CHANGED = 'changed',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_PURCHASES,
    Permission.MANAGE_TENDERS,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_MASTERS,
    Permission.EXPORT_REPORTS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ACTIVITY_LOGS,
  ],
  [Role.DATA_OPERATOR]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_PURCHASES,
    Permission.MANAGE_TENDERS,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_MASTERS,
    Permission.EXPORT_REPORTS,
  ],
  [Role.ACCOUNTANT]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_PURCHASES,
    Permission.MANAGE_TENDERS,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_MASTERS,
    Permission.EXPORT_REPORTS,
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.DATA_OPERATOR]: 'Data Operator',
  [Role.ACCOUNTANT]: 'Accountant',
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
