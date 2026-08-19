import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ProfileMenuItem } from "@taruvi/navkit";

// Helpdesk destination for the "Report an issue" item. Change here if the
// support URL moves. Do NOT move this to an env var — it is the same for all apps.
const SUPPORT_TICKET_URL = "https://support.taruvi.app/";

/**
 * Custom entries for the Navkit profile menu (avatar dropdown).
 * Items appear after Dark Mode and before Logout (which Navkit renders itself).
 *
 * "Report an issue" ships by default for internal Taruvi apps — don't remove
 * it without confirming the app doesn't need it. Add more items to the
 * returned array as needed; each needs a unique `title`, an `icon`, and a
 * `callBackFunc`.
 */
export function useNavkitProfileMenuItems(): ProfileMenuItem[] {
  return useMemo(
    () => [
      {
        title: "Report an issue",
        // `fas`/`far` are registered globally by Navkit, so the string form works.
        icon: <FontAwesomeIcon icon={["fas", "comments"]} />,
        callBackFunc: () => {
          window.open(SUPPORT_TICKET_URL, "_blank", "noopener,noreferrer");
        },
      },
    ],
    [],
  );
}
