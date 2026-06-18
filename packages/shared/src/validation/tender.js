"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenderFilterSchema = exports.updateTenderSchema = exports.createTenderSchema = exports.tenderSiteSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../enums.js");
const common_js_1 = require("./common.js");
exports.tenderSiteSchema = zod_1.z.object({
    site: common_js_1.objectIdSchema.optional(),
    siteNameRaw: zod_1.z.string().min(1, 'Site name is required'),
});
exports.createTenderSchema = zod_1.z.object({
    tenderName: zod_1.z.string().min(1, 'Tender name is required'),
    tenderNo: zod_1.z.string().min(1, 'Tender number is required'),
    orderValue: zod_1.z.coerce.number().min(0).default(0),
    emd: zod_1.z.coerce.number().min(0).default(0),
    pg: zod_1.z.coerce.number().min(0).default(0),
    sdFromBill: zod_1.z.coerce.number().min(0).default(0),
    paymentReceivedTillDate: zod_1.z.coerce.number().min(0).default(0),
    paymentOutstanding: zod_1.z.coerce.number().min(0).default(0),
    executionPending: zod_1.z.coerce.number().min(0).default(0),
    workCompleted: zod_1.z.coerce.number().min(0).default(0),
    bgNumber: zod_1.z.string().optional(),
    bgExpiryDate: zod_1.z.coerce.date().optional(),
    status: zod_1.z.nativeEnum(enums_js_1.TenderStatus).default(enums_js_1.TenderStatus.PENDING),
    sites: zod_1.z.array(exports.tenderSiteSchema).min(1, 'At least one site is required'),
    notes: zod_1.z.string().optional(),
});
exports.updateTenderSchema = exports.createTenderSchema.partial();
exports.tenderFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(enums_js_1.TenderStatus).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=tender.js.map