import { registerModule } from "../registry";
import appointments from "./appointments";
import campaigns from "./campaigns";
import emails from "./emails";
import sms from "./sms";
import whatsapp from "./whatsapp";
import notifications from "./notifications";
import ai from "./ai";
import cleanup from "./cleanup";
import prospecting from "./prospecting";

const allModules = [appointments, campaigns, emails, sms, whatsapp, notifications, ai, cleanup, prospecting];

for (const mod of allModules) {
  registerModule(mod);
}

export { allModules };
