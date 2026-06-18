"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardSummaryQuerySchema = void 0;
const zod_1 = require("zod");
const common_js_1 = require("./common.js");
exports.dashboardSummaryQuerySchema = zod_1.z.object({
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
    tender: common_js_1.objectIdSchema.optional(),
});
//# sourceMappingURL=dashboard.js.map