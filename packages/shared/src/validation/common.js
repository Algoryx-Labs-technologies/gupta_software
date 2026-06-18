"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectIdSchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.objectIdSchema = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
//# sourceMappingURL=common.js.map