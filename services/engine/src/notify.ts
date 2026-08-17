import fetch from "node-fetch";
import { NotifyPayload } from "@minus1days/shared";

export function notifySubscribers(subscriberUrls: string[], payload: NotifyPayload) {
  for (const url of subscriberUrls) {
    fetch(`${url.replace(/\/$/, "")}/internal/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => console.error(`[engine] notify failed for ${url}:`, err.message));
  }
}
