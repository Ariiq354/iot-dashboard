import { z } from "zod";
import { sensorNumber } from "../../../shared/schemas/iot";
import { paginationSchema } from "../../utils/schema";

export { createDeviceSchema } from "../../../shared/schemas/iot";

export const telemetryInputSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  nilai: sensorNumber,
});

export const telemetryHistoryQuerySchema = paginationSchema.extend({
  deviceId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
}).refine(
  query => !query.from || !query.to || query.from <= query.to,
  { message: "from must be before or equal to to", path: ["from"] },
);

export const alertsQuerySchema = paginationSchema.extend({
  status: z.enum(["active", "acknowledged", "resolved"]).optional(),
  type: z.string().trim().min(1).optional(),
  deviceId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
});

export const acknowledgeAlertParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const generateTelemetryBodySchema = z.object({
  mode: z.enum(["normal", "random", "anomaly"]),
});
