import { defineRelations } from "drizzle-orm";
import * as authSchema from "./schema/auth";
import * as iotSchema from "./schema/iot";

export const relations = defineRelations({
  ...authSchema,
  ...iotSchema,
}, r => ({
  device: {
    telemetry: r.many.telemetry({
      from: r.device.id,
      to: r.telemetry.deviceId,
    }),
    alerts: r.many.alert({
      from: r.device.id,
      to: r.alert.deviceId,
    }),
    thresholds: r.many.deviceThreshold({
      from: r.device.id,
      to: r.deviceThreshold.deviceId,
    }),
  },
  telemetry: {
    device: r.one.device({
      from: r.telemetry.deviceId,
      to: r.device.id,
    }),
  },
  alert: {
    device: r.one.device({
      from: r.alert.deviceId,
      to: r.device.id,
    }),
  },
  deviceThreshold: {
    device: r.one.device({
      from: r.deviceThreshold.deviceId,
      to: r.device.id,
    }),
  },
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
}));
