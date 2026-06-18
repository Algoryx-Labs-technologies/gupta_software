"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateItemSchema = exports.createItemSchema = void 0;
const zod_1 = require("zod");
exports.createItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Item name is required'),
    category: zod_1.z.string().optional(),
    specification: zod_1.z.string().optional(),
    defaultUnit: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateItemSchema = exports.createItemSchema.partial();
//# sourceMappingURL=item.js.map