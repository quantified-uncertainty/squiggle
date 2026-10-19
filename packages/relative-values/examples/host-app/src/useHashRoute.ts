import { useEffect, useState } from "react";

// A tiny hash router, to keep the example dependency-free.
export function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.slice(1));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route || "/live";
}

export function navigate(route: string) {
  window.location.hash = route;
}
