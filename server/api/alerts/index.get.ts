import { alertsQuerySchema } from "../../modules/iot/model";
import { IoTService } from "../../modules/iot/service";
import { authGuard } from "../../utils/guard";
import { getValidatedQuerySafe } from "../../utils/validator";

export default defineEventHandler(async (event) => {
  authGuard(event);
  const query = await getValidatedQuerySafe(event, alertsQuerySchema);
  return IoTService.listAlerts(query);
});
