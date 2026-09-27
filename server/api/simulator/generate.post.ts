import { generateTelemetryBodySchema } from "../../modules/iot/model";
import { IoTService } from "../../modules/iot/service";
import { adminGuard } from "../../utils/guard";
import { readValidatedBodySafe } from "../../utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { mode } = await readValidatedBodySafe(event, generateTelemetryBodySchema);
  return IoTService.generateTelemetry(mode);
});
