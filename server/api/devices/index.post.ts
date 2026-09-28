import { createDeviceSchema } from "../../modules/iot/model";
import { IoTService } from "../../modules/iot/service";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const input = await readValidatedBodySafe(event, createDeviceSchema);
  const result = await IoTService.createDevice(input);
  setResponseStatus(event, 201);
  return result;
});
