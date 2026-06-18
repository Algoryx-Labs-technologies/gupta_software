"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserStatusSchema = exports.resetPasswordSchema = exports.updateUserSchema = exports.createUserSchema = exports.teamRoleSchema = exports.adminLoginSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../enums.js");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
/** Admin portal — credentials validated against apps/api env (not MongoDB). */
exports.adminLoginSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Admin ID is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
/** Roles assignable by admin when creating team members (not admin). */
exports.teamRoleSchema = zod_1.z.enum([enums_js_1.Role.DATA_OPERATOR, enums_js_1.Role.ACCOUNTANT]);
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    role: exports.teamRoleSchema,
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    role: exports.teamRoleSchema.optional(),
});
exports.resetPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
exports.updateUserStatusSchema = zod_1.z.object({
    disabled: zod_1.z.boolean(),
});
//# sourceMappingURL=auth.js.map