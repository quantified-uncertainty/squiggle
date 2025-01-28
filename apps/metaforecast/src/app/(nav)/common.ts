// code that can be used both on frontend and backend
export const defaultLimit = 21;

export type SearchQuery = {
  limit: number;
  query: string;
  starsThreshold: number;
  forecastsThreshold: number;
  forecastingPlatforms: string[]; // platform names
};

// it's not possible to use `forecastingPlatforms` on the frontend, because it relies on the backend code
export const defaultSearchQuery: Omit<SearchQuery, "forecastingPlatforms"> = {
  limit: 21,
  query: "",
  starsThreshold: 2,
  forecastsThreshold: 0,
};

export function searchParamsToQuery(
  searchParams: {
    [key: string]: string | string[] | undefined;
  },
  defaultForecastingPlatforms: string[]
): SearchQuery {
  // TODO - validate with zod
  const searchQuery: SearchQuery = {
    ...defaultSearchQuery,
    forecastingPlatforms: defaultForecastingPlatforms,
  };

  if (searchParams.query) {
    searchQuery.query = String(searchParams.query);
  }
  if (searchParams.starsThreshold) {
    searchQuery.starsThreshold = Number(searchParams.starsThreshold);
  }
  if (searchParams.forecastsThreshold !== undefined) {
    searchQuery.forecastsThreshold = Number(searchParams.forecastsThreshold);
  }
  if (searchParams.forecastingPlatforms !== undefined) {
    searchQuery.forecastingPlatforms = String(
      searchParams.forecastingPlatforms
    ).split("|");
  }

  if (searchParams.limit) {
    searchQuery.limit = Number(searchParams.limit);
  }

  return searchQuery;
}
