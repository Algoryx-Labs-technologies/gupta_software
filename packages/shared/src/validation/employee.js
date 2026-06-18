"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenderExpenseFilterSchema = exports.updateEmployeeDaysSchema = exports.unassignEmployeeSchema = exports.changeEmployeeTenderSchema = exports.assignEmployeeSchema = exports.employeeFilterSchema = exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
const common_js_1 = require("./common.js");
exports.createEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    phone: zod_1.z.string().min(1, 'Phone is required').max(20),
    employeeId: zod_1.z.string().min(1, 'Employee ID is required').max(50),
    salary: zod_1.z.coerce.number().min(0, 'Salary must be 0 or more'),
});
exports.updateEmployeeSchema = exports.createEmployeeSchema.partial();
exports.employeeFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    status: zod_1.z.enum(['unassigned', 'assigned', 'changed']).optional(),
    tender: common_js_1.objectIdSchema.optional(),
});
exports.assignEmployeeSchema = zod_1.z.object({
    tender: common_js_1.objectIdSchema,
});
exports.changeEmployeeTenderSchema = zod_1.z.object({
    tender: common_js_1.objectIdSchema,
    daysWorkedOnCurrent: zod_1.z.coerce.number().int().min(0, 'Days must be 0 or more'),
});
exports.unassignEmployeeSchema = zod_1.z.object({
    daysWorkedOnCurrent: zod_1.z.coerce.number().int().min(0, 'Days must be 0 or more').optional(),
});
exports.updateEmployeeDaysSchema = zod_1.z.object({
    daysWorked: zod_1.z.coerce.number().int().min(0, 'Days must be 0 or more'),
});
exports.tenderExpenseFilterSchema = zod_1.z.object({
    tender: common_js_1.objectIdSchema.optional(),
});
//# sourceMappingURL=employee.js.map