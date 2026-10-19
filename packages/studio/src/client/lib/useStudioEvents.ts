import { useEffect, useRef, useState } from "react";

import { type StudioEvent, studioEventSchema } from "../../shared/api.js";

// Subscribes to the server's file-change stream (Server-Sent Events).
// EventSource reconnects automatically if the server restarts.
// Returns whether the stream is currently connected.
export function useStudioEvents(
  onEvent: (event: StudioEvent) => void
): boolean {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
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

  return connected;
}
