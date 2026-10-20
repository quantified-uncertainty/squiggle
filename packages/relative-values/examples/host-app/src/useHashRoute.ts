import { useCallback, useEffect, useState } from "react";

// A tiny hash router, to keep the example dependency-free. Routes look like
// `#/s5?rv.view=grid`: a path, and optional query params (used for URL state).

const HASH_EVENT = "acme-hashchange";

function readHash(): { path: string; query: string } {
  const hash = window.location.hash.slice(1);
  const index = hash.indexOf("?");
  return index === -1
    ? { path: hash, query: "" }
    : { path: hash.slice(0, index), query: hash.slice(index + 1) };
}

function useHash() {
  const [hash, setHash] = useState(readHash);
  useEffect(() => {
    const onChange = () => setHash(readHash());
    // `popstate`: Back and Forward between entries added with pushState.
    for (const event of ["hashchange", "popstate", HASH_EVENT]) {
      window.addEventListener(event, onChange);
    }
    return () => {
      for (const event of ["hashchange", "popstate", HASH_EVENT]) {
        window.removeEventListener(event, onChange);
      }
    };
  }, []);
  return hash;
}

export function useHashRoute(): string {
  return useHash().path || "/live";
}

export function navigate(route: string) {
  window.location.hash = route;
}

/**
 * Query params of the hash (`#/path?a=1`), e.g. for state that should be in
 * the URL. `setParams` pushes a history entry (or replaces the current one),
 * so Back and Forward work.
 */
export function useHashQuery(): [
  URLSearchParams,
  (params: URLSearchParams, options?: { replace?: boolean }) => void,
] {
  const { path, query } = useHash();
  const [params, setParamsState] = useState(() => new URLSearchParams(query));
  useEffect(() => {
    setParamsState(new URLSearchParams(query));
  }, [query]);
  const setParams = useCallback(
    (next: URLSearchParams, options: { replace?: boolean } = {}) => {
      const search = next.toString();
      const hash = `#${path}${search ? `?${search}` : ""}`;
      if (hash === window.location.hash) {
        return;
      }
      if (options.replace) {
        window.history.replaceState(null, "", hash);
      } else {
        window.history.pushState(null, "", hash);
      }
      window.dispatchEvent(new Event(HASH_EVENT));
    },
    [path]
  );
  return [params, setParams];
}
