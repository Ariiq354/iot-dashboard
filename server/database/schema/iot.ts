import { sql } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdUpdated } from "./common";

export const deviceStatus = pgEnum("device_status", ["online", "offline"]);
export const telemetrySource = pgEnum("telemetry_source", ["simulator", "device"]);
export const alertSeverity = pgEnum("alert_severity", ["low", "medium", "high", "critical"]);
export const alertStatus = pgEnum("alert_status", ["active", "acknowledged", "resolved"]);
export const thresholdMetric = pgEnum("threshold_metric", ["temperature", "humidity", "co2"]);

export const device = snakeCase.table("device", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  name: text().notNull(),
  location: text(),
  status: deviceStatus().notNull().default("offline"),
  lastSeen: timestamp({ withTimezone: true }),
  ...createdUpdated,
});

export const telemetry = snakeCase.table("telemetry", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  deviceId: integer().notNull().references(() => device.id, { onDelete: "cascade" }),
  temperature: numeric({ precision: 6, scale: 2 }),
  humidity: numeric({ precision: 6, scale: 2 }),
  co2: numeric({ precision: 8, scale: 2 }),
  receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  source: telemetrySource().notNull().default("simulator"),
}, table => [
  index("telemetry_device_received_at_idx").on(table.deviceId, table.receivedAt),
]);

export const alert = snakeCase.table("alert", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  deviceId: integer().notNull().references(() => device.id, { onDelete: "cascade" }),
  type: text().notNull(),
  severity: alertSeverity().notNull(),
  status: alertStatus().notNull().default("active"),
  openedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp({ withTimezone: true }),
  resolvedAt: timestamp({ withTimezone: true }),
  lastValue: numeric({ precision: 10, scale: 2 }),
}, table => [
  index("alert_device_status_idx").on(table.deviceId, table.status),
  uniqueIndex("alert_one_unresolved_per_device_type_idx")
    .on(table.deviceId, table.type)
    .where(sql`${table.status} <> 'resolved'`),
]);

export const deviceThreshold = snakeCase.table("device_threshold", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  deviceId: integer().notNull().references(() => device.id, { onDelete: "cascade" }),
  metric: thresholdMetric().notNull(),
  minimum: numeric({ precision: 10, scale: 2 }),
  maximum: numeric({ precision: 10, scale: 2 }),
  unit: text().notNull(),
  ...createdUpdated,
}, table => [
  unique("device_threshold_device_metric_unique").on(table.deviceId, table.metric),
]);
