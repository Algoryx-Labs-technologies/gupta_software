"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseFilterSchema = exports.updatePurchaseSchema = exports.createPurchaseSchema = exports.purchaseItemSchema = void 0;
exports.computePurchaseTotals = computePurchaseTotals;
exports.computePurchaseAggregateTotals = computePurchaseAggregateTotals;
exports.buildPurchaseItemsWithTotals = buildPurchaseItemsWithTotals;
const zod_1 = require("zod");
const common_js_1 = require("./common.js");
const optionalNumber = zod_1.z.coerce.number().optional().nullable();
exports.purchaseItemSchema = zod_1.z.object({
    itemDescription: zod_1.z.string().min(1, 'Item description is required'),
    item: common_js_1.objectIdSchema.optional(),
    qty: optionalNumber,
    unit: zod_1.z.string().optional(),
    perRate: optionalNumber,
    freight: zod_1.z.coerce.number().min(0).default(0),
    labour: zod_1.z.coerce.number().min(0).default(0),
    gstPercent: zod_1.z.coerce.number().min(0).max(100).default(18),
    isHmPurchase: zod_1.z.boolean().default(false),
});
exports.createPurchaseSchema = zod_1.z.object({
    vendor: common_js_1.objectIdSchema.optional(),
    vendorNameRaw: zod_1.z.string().min(1, 'Vendor name is required'),
    tender: zod_1.z.string().min(1, 'Tender is required').regex(/^[a-f\d]{24}$/i, 'Invalid tender'),
    billDate: zod_1.z.coerce.date(),
    billNo: zod_1.z.string().min(1, 'Bill number is required'),
    billName: zod_1.z.string().min(1, 'Bill name is required'),
    site: common_js_1.objectIdSchema.optional(),
    siteNameRaw: zod_1.z.string().min(1, 'Site is required'),
    items: zod_1.z.array(exports.purchaseItemSchema).min(1, 'At least one item is required'),
    notes: zod_1.z.string().optional(),
});
exports.updatePurchaseSchema = exports.createPurchaseSchema.partial();
exports.purchaseFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    site: common_js_1.objectIdSchema.optional(),
    vendor: common_js_1.objectIdSchema.optional(),
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
function computePurchaseTotals(input) {
    const qty = input.qty ?? 0;
    const perRate = input.perRate ?? 0;
    const freight = input.freight ?? 0;
    const labour = input.labour ?? 0;
    const gstPercent = input.gstPercent ?? 18;
    const subTotal = Math.round((qty * perRate + freight + labour) * 100) / 100;
    const gstAmount = Math.round(subTotal * (gstPercent / 100) * 100) / 100;
    const grandTotal = Math.round((subTotal + gstAmount) * 100) / 100;
    return { subTotal, gstAmount, grandTotal };
}
function computePurchaseAggregateTotals(items) {
    const subTotal = Math.round(items.reduce((sum, i) => sum + i.subTotal, 0) * 100) / 100;
    const gstAmount = Math.round(items.reduce((sum, i) => sum + i.gstAmount, 0) * 100) / 100;
    const grandTotal = Math.round(items.reduce((sum, i) => sum + i.grandTotal, 0) * 100) / 100;
    return { subTotal, gstAmount, grandTotal };
}
function buildPurchaseItemsWithTotals(items) {
    return items.map((item) => ({
        ...item,
        ...computePurchaseTotals(item),
    }));
}
//# sourceMappingURL=purchase.js.map