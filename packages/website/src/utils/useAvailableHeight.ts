import { startTransition, useEffect, useRef, useState } from "react";

// This gets all of the available height on the page, starting from the top of the element.
// This is useful for having a div fill up the rest of the page.
export const useAvailableHeight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>();

  useEffect(() => {
    const updateHeight = () => {
      // Inner component might be wrapped in Suspense, and lack of startTransition causes this React error:
      // "This Suspense boundary received an update before it finished hydrating. This caused the boundary to switch to client rendering."
      startTransition(() => {
        if (ref.current) {
          setHeight(window.innerHeight - ref.current.offsetTop);
        }
      });
    };

    // Call it right away
    updateHeight();

    // Call it when window resizes
    window.addEventListener("resize", updateHeight);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []); // Empty array means this effect runs once when the component mounts

  return { ref, height };
};
