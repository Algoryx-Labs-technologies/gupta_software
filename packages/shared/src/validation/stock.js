"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockCellSchema = exports.updateStockSchema = exports.createStockSchema = void 0;
const zod_1 = require("zod");
const common_js_1 = require("./common.js");
exports.createStockSchema = zod_1.z.object({
    item: common_js_1.objectIdSchema,
    site: common_js_1.objectIdSchema,
    quantity: zod_1.z.coerce.number().min(0),
    specification: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateStockSchema = exports.createStockSchema.partial();
exports.stockCellSchema = zod_1.z.object({
    itemId: common_js_1.objectIdSchema,
    siteId: common_js_1.objectIdSchema,
    specification: zod_1.z.string().optional().default(''),
    quantity: zod_1.z.coerce.number().min(0),
});
//# sourceMappingURL=stock.js.map