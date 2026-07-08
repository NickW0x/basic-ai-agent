import { eveChannel } from "eve/channels/eve";
import { localDev, none } from "eve/channels/auth";

// Browser chat uses the eve HTTP channel. Local dev is open; production allows
// anonymous access until real auth is wired (matches auth-stub behavior).
export default eveChannel({
  auth: [localDev(), none()],
});
