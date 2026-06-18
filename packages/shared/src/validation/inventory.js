"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryLedgerFilterSchema = exports.consumeStockSchema = exports.allocateStockSchema = void 0;
const zod_1 = require("zod");
const common_js_1 = require("./common.js");
const inventoryItemRefSchema = zod_1.z.object({
    itemId: common_js_1.objectIdSchema.optional(),
    itemDescription: zod_1.z.string().min(1, 'Item description is required'),
    unit: zod_1.z.string().optional(),
});
exports.allocateStockSchema = inventoryItemRefSchema
    .extend({
    fromSiteId: common_js_1.objectIdSchema,
    toSiteId: common_js_1.objectIdSchema.optional(),
    toSiteName: zod_1.z.string().trim().optional(),
    quantity: zod_1.z.coerce.number().positive('Quantity must be greater than zero'),
    notes: zod_1.z.string().optional(),
})
    .superRefine((data, ctx) => {
    if (!data.toSiteId && !data.toSiteName) {
        ctx.addIssue({
            code: 'custom',
            message: 'Destination site is required',
            path: ['toSiteId'],
        });
    }
});
exports.consumeStockSchema = inventoryItemRefSchema.extend({
    siteId: common_js_1.objectIdSchema,
    quantity: zod_1.z.coerce.number().positive('Quantity must be greater than zero'),
    notes: zod_1.z.string().optional(),
});
exports.inventoryLedgerFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    site: common_js_1.objectIdSchema.optional(),
    itemId: common_js_1.objectIdSchema.optional(),
    movementType: zod_1.z.string().optional(),
});
//# sourceMappingURL=inventory.js.map