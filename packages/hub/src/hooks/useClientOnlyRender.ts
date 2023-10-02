import { useEffect, useState } from "react";

export function useClientOnlyRender() {
  // https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
