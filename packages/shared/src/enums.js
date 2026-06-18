"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_LABELS = exports.ROLE_PERMISSIONS = exports.EmployeeAssignmentStatus = exports.InventoryDirection = exports.InventoryMovementType = exports.TenderStatus = exports.Permission = exports.Role = void 0;
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
var Role;
(function (Role) {
    Role["ADMIN"] = "admin";
    Role["DATA_OPERATOR"] = "data_operator";
    Role["ACCOUNTANT"] = "accountant";
})(Role || (exports.Role = Role = {}));
var Permission;
(function (Permission) {
    Permission["VIEW_DASHBOARD"] = "VIEW_DASHBOARD";
    Permission["MANAGE_PURCHASES"] = "MANAGE_PURCHASES";
    Permission["MANAGE_TENDERS"] = "MANAGE_TENDERS";
    Permission["MANAGE_INVENTORY"] = "MANAGE_INVENTORY";
    Permission["MANAGE_MASTERS"] = "MANAGE_MASTERS";
    Permission["EXPORT_REPORTS"] = "EXPORT_REPORTS";
    Permission["MANAGE_USERS"] = "MANAGE_USERS";
    Permission["VIEW_ACTIVITY_LOGS"] = "VIEW_ACTIVITY_LOGS";
})(Permission || (exports.Permission = Permission = {}));
var TenderStatus;
(function (TenderStatus) {
    TenderStatus["ACTIVE"] = "active";
    TenderStatus["COMPLETED"] = "completed";
    TenderStatus["PENDING"] = "pending";
    TenderStatus["EXPIRED"] = "expired";
    TenderStatus["CANCELLED"] = "cancelled";
})(TenderStatus || (exports.TenderStatus = TenderStatus = {}));
var InventoryMovementType;
(function (InventoryMovementType) {
    InventoryMovementType["PURCHASE_IN"] = "PURCHASE_IN";
    InventoryMovementType["ALLOCATION"] = "ALLOCATION";
    InventoryMovementType["CONSUMPTION"] = "CONSUMPTION";
    InventoryMovementType["ADJUSTMENT"] = "ADJUSTMENT";
})(InventoryMovementType || (exports.InventoryMovementType = InventoryMovementType = {}));
var InventoryDirection;
(function (InventoryDirection) {
    InventoryDirection["IN"] = "IN";
    InventoryDirection["OUT"] = "OUT";
})(InventoryDirection || (exports.InventoryDirection = InventoryDirection = {}));
var EmployeeAssignmentStatus;
(function (EmployeeAssignmentStatus) {
    EmployeeAssignmentStatus["UNASSIGNED"] = "unassigned";
    EmployeeAssignmentStatus["ASSIGNED"] = "assigned";
    EmployeeAssignmentStatus["CHANGED"] = "changed";
})(EmployeeAssignmentStatus || (exports.EmployeeAssignmentStatus = EmployeeAssignmentStatus = {}));
exports.ROLE_PERMISSIONS = {
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
exports.ROLE_LABELS = {
    [Role.ADMIN]: 'Admin',
    [Role.DATA_OPERATOR]: 'Data Operator',
    [Role.ACCOUNTANT]: 'Accountant',
};
function hasPermission(role, permission) {
    return exports.ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
function hasAnyPermission(role, permissions) {
    return permissions.some((p) => hasPermission(role, p));
}
function hasAllPermissions(role, permissions) {
    return permissions.every((p) => hasPermission(role, p));
}
//# sourceMappingURL=enums.js.map