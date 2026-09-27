import { acknowledgeAlertParamsSchema } from "../../../modules/iot/model";
import { IoTService } from "../../../modules/iot/service";
import { adminGuard } from "../../../utils/guard";
import { getValidatedRouterParamsSafe } from "../../../utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const { id } = await getValidatedRouterParamsSafe(event, acknowledgeAlertParamsSchema);
  return IoTService.acknowledgeAlert(id);
});
