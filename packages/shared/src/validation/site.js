"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSiteSchema = exports.createSiteSchema = void 0;
const zod_1 = require("zod");
exports.createSiteSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Site name is required'),
    code: zod_1.z.string().min(1, 'Site code is required'),
    location: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateSiteSchema = exports.createSiteSchema.partial();
//# sourceMappingURL=site.js.map