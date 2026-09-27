import { z } from "zod";
import { paginationSchema } from "../../utils/schema";

export const telemetryInputSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  temperature: z.number().finite().optional(),
  humidity: z.number().finite().min(0).max(100).optional(),
  co2: z.number().finite().min(0).optional(),
  source: z.enum(["simulator", "device"]).default("device"),
}).refine(
  input => input.temperature !== undefined || input.humidity !== undefined || input.co2 !== undefined,
  "At least one sensor value is required",
);

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
