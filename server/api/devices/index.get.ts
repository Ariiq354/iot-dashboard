import { IoTService } from "../../modules/iot/service";
import { authGuard } from "../../utils/guard";

export default defineEventHandler((event) => {
  authGuard(event);
  return IoTService.listDevices();
});
