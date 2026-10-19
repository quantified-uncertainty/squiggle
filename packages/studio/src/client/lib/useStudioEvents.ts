import { useEffect, useRef } from "react";

import { type StudioEvent, studioEventSchema } from "../../shared/api.js";

// Subscribes to the server's file-change stream (Server-Sent Events).
// EventSource reconnects automatically if the server restarts.
export function useStudioEvents(onEvent: (event: StudioEvent) => void): void {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (message: MessageEvent<string>) => {
      let json: unknown;
      try {
        json = JSON.parse(message.data);
      } catch {
        return;
      }
      const parsed = studioEventSchema.safeParse(json);
      if (parsed.success) handlerRef.current(parsed.data);
    };
    return () => source.close();
  }, []);
}
