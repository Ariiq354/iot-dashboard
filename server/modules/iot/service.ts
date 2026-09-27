/* eslint antfu/consistent-chaining: off */
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../database";
import { alert, device, deviceThreshold, telemetry } from "../../database/schema/iot";

const metricAlert = {
  temperature: "TEMPERATURE_HIGH",
  humidity: "HUMIDITY_HIGH",
  co2: "CO2_HIGH",
} as const;

function severityFor(metric: keyof typeof metricAlert) {
  return metric === "co2" ? "high" as const : "medium" as const;
}

async function ingestTelemetry(input: {
  deviceId: number;
  temperature?: number;
  humidity?: number;
  co2?: number;
  source: "simulator" | "device";
}) {
  return db.transaction(async (tx) => {
    const [currentDevice] = await tx
      .select()
      .from(device)
      .where(eq(device.id, input.deviceId))
      .for("update");
    if (!currentDevice) {
      throw createError({ statusCode: 404, statusMessage: "Perangkat tidak ditemukan" });
    }

    const receivedAt = new Date();
    const [reading] = await tx
      .insert(telemetry)
      .values({
        deviceId: input.deviceId,
        temperature: input.temperature === undefined ? undefined : String(input.temperature),
        humidity: input.humidity === undefined ? undefined : String(input.humidity),
        co2: input.co2 === undefined ? undefined : String(input.co2),
        source: input.source,
        receivedAt,
      })
      .returning();

    await tx
      .update(device)
      .set({ status: "online", lastSeen: receivedAt })
      .where(eq(device.id, input.deviceId));

    await tx
      .update(alert)
      .set({ status: "resolved", resolvedAt: receivedAt })
      .where(and(
        eq(alert.deviceId, input.deviceId),
        eq(alert.type, "DEVICE_OFFLINE"),
        sql`${alert.status} <> 'resolved'`,
      ));

    const thresholds = await tx
      .select()
      .from(deviceThreshold)
      .where(eq(deviceThreshold.deviceId, input.deviceId));
    for (const threshold of thresholds) {
      const value = input[threshold.metric];
      if (value === undefined)
        continue;

      const violating = (
        threshold.minimum !== null && value < Number(threshold.minimum)
      ) || (
        threshold.maximum !== null && value > Number(threshold.maximum)
      );
      const type = metricAlert[threshold.metric];
      if (violating) {
        const [existing] = await tx
          .select({ id: alert.id })
          .from(alert)
          .where(and(
            eq(alert.deviceId, input.deviceId),
            eq(alert.type, type),
            sql`${alert.status} <> 'resolved'`,
          ))
          .limit(1);
        if (existing) {
          await tx
            .update(alert)
            .set({ lastValue: String(value) })
            .where(eq(alert.id, existing.id));
        }
        else {
          await tx
            .insert(alert)
            .values({
              deviceId: input.deviceId,
              type,
              severity: severityFor(threshold.metric),
              lastValue: String(value),
            })
            .onConflictDoNothing();
        }
      }
      else {
        await tx
          .update(alert)
          .set({ status: "resolved", resolvedAt: receivedAt })
          .where(and(
            eq(alert.deviceId, input.deviceId),
            eq(alert.type, type),
            sql`${alert.status} <> 'resolved'`,
          ));
      }
    }

    return reading;
  });
}

export const IoTService = {
  async listDevices() {
    return db
      .select()
      .from(device)
      .orderBy(device.name);
  },

  async getOverview() {
    const devices = await db
      .select()
      .from(device)
      .orderBy(device.name);

    const activeAlertCount = await db
      .select({ value: count() })
      .from(alert)
      .where(sql`${alert.status} <> 'resolved'`);

    const latestTelemetry = await Promise.all(devices.map(async (item) => {
      const [latest] = await db
        .select()
        .from(telemetry)
        .where(eq(telemetry.deviceId, item.id))
        .orderBy(desc(telemetry.receivedAt), desc(telemetry.id))
        .limit(1);
      return { ...item, latestTelemetry: latest ?? null, stale: item.status === "offline" };
    }));
    return { devices: latestTelemetry, activeAlertCount: activeAlertCount[0]?.value ?? 0 };
  },

  async getTelemetryHistory(query: {
    page: number;
    limit: number;
    deviceId?: number;
    from?: Date;
    to?: Date;
  }) {
    const filters = [
      query.deviceId === undefined ? undefined : eq(telemetry.deviceId, query.deviceId),
      query.from ? gte(telemetry.receivedAt, query.from) : undefined,
      query.to ? lte(telemetry.receivedAt, query.to) : undefined,
    ].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;
    const [items, [total]] = await Promise.all([
      db
        .select()
        .from(telemetry)
        .where(where)
        .orderBy(desc(telemetry.receivedAt), desc(telemetry.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ value: count() })
        .from(telemetry)
        .where(where),
    ]);
    return { items, total: total?.value ?? 0, page: query.page, limit: query.limit };
  },

  async listAlerts(query: {
    page: number;
    limit: number;
    status?: "active" | "acknowledged" | "resolved";
    type?: string;
    deviceId?: number;
  }) {
    const filters = [
      query.status ? eq(alert.status, query.status) : undefined,
      query.type ? eq(alert.type, query.type) : undefined,
      query.deviceId === undefined ? undefined : eq(alert.deviceId, query.deviceId),
    ].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;
    const [items, [total]] = await Promise.all([
      db
        .select()
        .from(alert)
        .where(where)
        .orderBy(desc(alert.openedAt), desc(alert.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ value: count() })
        .from(alert)
        .where(where),
    ]);
    return { items, total: total?.value ?? 0, page: query.page, limit: query.limit };
  },

  ingestTelemetry,

  async acknowledgeAlert(id: number) {
    const [updated] = await db
      .update(alert)
      .set({ status: "acknowledged", acknowledgedAt: new Date() })
      .where(and(eq(alert.id, id), eq(alert.status, "active")))
      .returning();
    if (updated)
      return updated;
    const [existing] = await db
      .select()
      .from(alert)
      .where(eq(alert.id, id));
    if (!existing)
      throw createError({ statusCode: 404, statusMessage: "Peringatan tidak ditemukan" });
    return existing;
  },

  async generateTelemetry(mode: "normal" | "random" | "anomaly") {
    const devices = await db
      .select()
      .from(device)
      .orderBy(device.id);
    const results = [];
    let anomalyAssigned = false;

    for (const item of devices) {
      if (mode === "random" && item.status === "online" && Math.random() < 0.1) {
        await db.transaction(async (tx) => {
          await tx
            .update(device)
            .set({ status: "offline" })
            .where(eq(device.id, item.id));
          await tx
            .insert(alert)
            .values({
              deviceId: item.id,
              type: "DEVICE_OFFLINE",
              severity: "high",
            })
            .onConflictDoNothing();
        });
        results.push({ deviceId: item.id, outcome: "offline" });
        continue;
      }
      if (mode === "random" && item.status === "offline" && Math.random() >= 0.5) {
        results.push({ deviceId: item.id, outcome: "offline" });
        continue;
      }

      const [threshold] = await db
        .select()
        .from(deviceThreshold)
        .where(and(
          eq(deviceThreshold.deviceId, item.id),
          eq(deviceThreshold.metric, "temperature"),
        ))
        .limit(1);
      const temperature = mode === "anomaly" && !anomalyAssigned && threshold?.maximum
        ? Number(threshold.maximum) + 5
        : 20 + Math.random() * 8;
      if (mode === "anomaly" && !anomalyAssigned)
        anomalyAssigned = true;

      const reading = await ingestTelemetry({
        deviceId: item.id,
        temperature: Number(temperature.toFixed(2)),
        humidity: Number((40 + Math.random() * 30).toFixed(2)),
        co2: Math.round(400 + Math.random() * 400),
        source: "simulator",
      });
      results.push({ deviceId: item.id, outcome: "telemetry", reading });
    }

    if (mode === "anomaly" && !anomalyAssigned) {
      throw createError({ statusCode: 409, statusMessage: "No devices are available for anomaly simulation" });
    }
    return { mode, results };
  },
};
