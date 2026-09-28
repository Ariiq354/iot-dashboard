import type { z } from "zod";
import type { createDeviceSchema } from "./model";
/* eslint antfu/consistent-chaining: off */
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { dataState, OFFLINE_MS } from "../../../shared/iot";
import { db } from "../../database";
import { alert, device, deviceThreshold, telemetry } from "../../database/schema/iot";

async function ingestTelemetry(input: {
  deviceId: number;
  nilai: number;
  source: "simulator" | "device";
}, transaction?: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
  const ingest = async (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => {
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
        nilai: String(input.nilai),
        namaNilai: currentDevice.namaNilai,
        satuanNilai: currentDevice.satuanNilai,
        source: input.source,
        receivedAt,
      })
      .returning();

    await tx
      .update(device)
      .set({ lastSeen: receivedAt })
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
      const value = input.nilai;
      const violating = value > Number(threshold.maximum);
      const type = "VALUE_HIGH";

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
              severity: "medium",
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
  };
  return transaction ? ingest(transaction) : db.transaction(ingest);
}

export const IoTService = {
  async createDevice(input: z.infer<typeof createDeviceSchema>) {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(device).values({
        name: input.name,
        location: input.location || null,
        namaNilai: input.namaNilai,
        satuanNilai: input.satuanNilai,
      }).returning();
      await tx.insert(deviceThreshold).values({ deviceId: created!.id, maximum: String(input.threshold) });
      if (input.nilai !== undefined)
        await ingestTelemetry({ deviceId: created!.id, nilai: input.nilai, source: "device" }, tx);
      return created!;
    });
  },

  async syncOfflineAlerts() {
    await db.transaction(async (tx) => {
      const now = Date.now();
      const devices = await tx.select().from(device).where(and(
        sql`coalesce(${device.lastSeen}, ${device.createdAt}) < ${new Date(now - OFFLINE_MS).toISOString()}::timestamptz`,
        sql`not exists (select 1 from ${alert} where ${alert.deviceId} = ${device.id} and ${alert.type} = 'DEVICE_OFFLINE' and ${alert.status} <> 'resolved')`,
      )).orderBy(device.id).for("update");
      for (const item of devices) {
        const since = item.lastSeen ?? item.createdAt;
        if (now - since.getTime() <= OFFLINE_MS)
          continue;
        await tx.insert(alert).values({
          deviceId: item.id,
          type: "DEVICE_OFFLINE",
          severity: "high",
          openedAt: new Date(since.getTime() + OFFLINE_MS),
        }).onConflictDoNothing();
      }
    });
  },

  async listDevices() {
    const items = await db
      .select({ device, maximum: deviceThreshold.maximum })
      .from(device)
      .leftJoin(deviceThreshold, eq(deviceThreshold.deviceId, device.id))
      .orderBy(device.name);
    return items.map(item => ({ ...item.device, threshold: item.maximum, ...dataState(item.device.lastSeen) }));
  },

  async getOverview() {
    await this.syncOfflineAlerts();
    const devices = await this.listDevices();

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
      return { ...item, latestTelemetry: latest ?? null };
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
    await this.syncOfflineAlerts();
    const filters = [
      query.status ? eq(alert.status, query.status) : undefined,
      query.type ? eq(alert.type, query.type) : undefined,
      query.deviceId === undefined ? undefined : eq(alert.deviceId, query.deviceId),
    ].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;

    const [items, [total]] = await Promise.all([
      db
        .select({ alert, namaNilai: device.namaNilai, satuanNilai: device.satuanNilai, threshold: deviceThreshold.maximum })
        .from(alert)
        .innerJoin(device, eq(device.id, alert.deviceId))
        .leftJoin(deviceThreshold, eq(deviceThreshold.deviceId, device.id))
        .where(where)
        .orderBy(desc(alert.openedAt), desc(alert.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ value: count() })
        .from(alert)
        .where(where),
    ]);

    return { items: items.map(({ alert: item, ...metadata }) => ({ ...item, ...metadata })), total: total?.value ?? 0, page: query.page, limit: query.limit };
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
    const devices = await this.listDevices();
    const anomalyDevice = devices.find(item => item.threshold !== null && Number(item.threshold) < 99_999_999.99);
    if (mode === "anomaly" && !anomalyDevice)
      throw createError({ statusCode: 409, statusMessage: "Tidak ada perangkat dengan threshold yang dapat disimulasikan" });
    const results = [];
    for (const item of devices) {
      const maximum = Number(item.threshold ?? 60);
      const span = Math.max(Math.abs(maximum) * 0.5, 10);
      const value = mode === "anomaly" && item.id === anomalyDevice?.id
        ? maximum + Math.max(0.01, Math.random() * span)
        : maximum - Math.random() * span + (mode === "random" ? span / 2 : 0);
      const reading = await ingestTelemetry({
        deviceId: item.id,
        nilai: Number(Math.max(-99_999_999.99, Math.min(99_999_999.99, value)).toFixed(2)),
        source: "simulator",
      });
      results.push({ deviceId: item.id, outcome: "telemetry", reading });
    }
    return { mode, results };
  },
};
