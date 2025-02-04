import "client-only";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { searchParamsToQuery, SearchQuery } from "./common";

// get a function that allows to update the search query
// used by SearchForm
export function useUpdateSearchQuery() {
  const router = useRouter();

  const currentParams = useSearchParams();
  const pathname = usePathname();

  return (patch: Partial<SearchQuery>) => {
    const params = new URLSearchParams(currentParams);

    for (const [key, value] of Object.entries(patch)) {
      if (key === "forecastingPlatforms") {
        params.set(key, (value as string[]).join("|"));
      } else {
        params.set(key, String(value));
      }
      // TODO - filter out default values?
    }

    router.replace(`${pathname}?${params}`, { scroll: false });
  };
}

export function useSearchQuery(
  defaultForecastingPlatforms: string[]
): SearchQuery {
  const currentParams = useSearchParams();
  return searchParamsToQuery(
    Object.fromEntries(currentParams),
    defaultForecastingPlatforms
  );
}
