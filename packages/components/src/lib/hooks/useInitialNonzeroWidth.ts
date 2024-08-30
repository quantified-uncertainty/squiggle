import { useEffect, useRef, useState } from "react";

// This hook is used to get the initial width of a component.
// It's useful for getting the initial width of a component that is not rendered immediately.
// For example, the playground uses this to get the initial width of the container.
export function useInitialNonzeroWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>();

  useEffect(() => {
    if (!ref.current) return;

    const updateWidth = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setWidth(entry.contentRect.width);
      }
    };

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { ref, width };
}
