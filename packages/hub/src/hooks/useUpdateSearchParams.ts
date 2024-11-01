import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateSearchParams = useCallback(
    (
      update: (params: URLSearchParams) => void,
      {
        mode = "push",
        scroll = true,
      }: {
        mode?: "push" | "replace";
        scroll?: boolean;
      } = {}
    ) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      update(currentParams);
      const method = mode === "push" ? router.push : router.replace;
      method(`${pathname}?${currentParams}`, { scroll });
    },
    [pathname, searchParams, router]
  );

  return updateSearchParams;
}
