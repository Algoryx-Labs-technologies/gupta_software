"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorSchema = exports.createVendorSchema = void 0;
const zod_1 = require("zod");
exports.createVendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Vendor name is required'),
    contactPerson: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    gstin: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateVendorSchema = exports.createVendorSchema.partial();
//# sourceMappingURL=vendor.js.map