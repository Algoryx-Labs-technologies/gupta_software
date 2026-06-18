"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labourExpenseFilterSchema = exports.createLabourExpenseSchema = void 0;
const zod_1 = require("zod");
const common_js_1 = require("./common.js");
exports.createLabourExpenseSchema = zod_1.z.object({
    tender: zod_1.z.string().min(1, 'Tender is required').regex(/^[a-f\d]{24}$/i, 'Invalid tender'),
    site: common_js_1.objectIdSchema.optional(),
    siteNameRaw: zod_1.z.string().min(1, 'Site is required'),
    amount: zod_1.z.coerce.number().min(0, 'Amount must be 0 or more'),
    expenseDate: zod_1.z.coerce.date(),
    description: zod_1.z.string().max(200, 'Description is too long').optional(),
});
exports.labourExpenseFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    tender: common_js_1.objectIdSchema.optional(),
    site: common_js_1.objectIdSchema.optional(),
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=labourExpense.js.map