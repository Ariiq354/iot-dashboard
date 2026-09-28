import { telemetryInputSchema } from "../../modules/iot/model";
import { IoTService } from "../../modules/iot/service";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const input = await readValidatedBodySafe(event, telemetryInputSchema);
  return IoTService.ingestTelemetry({ ...input, source: "device" });
});
