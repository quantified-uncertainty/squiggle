import {
  FC,
  Suspense,
} from 'react';

import Skeleton from 'react-loading-skeleton';

import { Card } from '@/web/common/Card';
import { QuestionFragment } from '@/web/fragments.generated';
import { getUrqlRscClient } from '@/web/urql';

import { SearchQuery } from './common';
import {
  FrontpageDocument,
  SearchDocument,
} from './queries.generated';
import { QuestionCardsList } from './QuestionCardsList';
import { ShowMore } from './ShowMore';

type SearchResult = {
  results: QuestionFragment[];
  hasMore: boolean;
};

async function getResults(searchQuery: SearchQuery): Promise<SearchResult> {
  const client = getUrqlRscClient();

  const withLimit = (results: QuestionFragment[]) => ({
    results: results.slice(0, searchQuery.limit),
    hasMore: results.length > searchQuery.limit,
  });

  if (searchQuery.query) {
    // search

    const response = await client.query(SearchDocument, {
      input: {
        ...searchQuery,
        limit: searchQuery.limit + 1,
      },
    });
    if (!response.data) {
      throw new Error(`GraphQL query failed: ${response.error}`);
    }
    return withLimit(response.data.result);
  } else {
    // default front page, possibly with platform and stars filters

    // this is necessary because FrontpageDocument does not support filtering, and SearchDocument requires a text query
    const filterManually = (results: QuestionFragment[]) => {
      let filteredResults = [...results];
      if (
        searchQuery.forecastingPlatforms &&
        searchQuery.forecastingPlatforms.length > 0
      ) {
        filteredResults = filteredResults.filter((result) =>
          searchQuery.forecastingPlatforms.includes(result.platform.id)
        );
      }
      if (searchQuery.starsThreshold === 4) {
        filteredResults = filteredResults.filter(
          (result) => result.qualityIndicators.stars >= 4
        );
      }
      if (searchQuery.forecastsThreshold) {
        // TODO / FIXME / remove?
      }
      return filteredResults;
    };

    const response = await client.query(FrontpageDocument, {});
    if (!response.data) {
      throw new Error(`GraphQL query failed: ${response.error}`);
    }
    return withLimit(filterManually(response.data.result));
  }
}

const LoadingSearchResultsList: FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(9)].map((_, index) => (
        <Card key={index}>
          <Skeleton count={5} />
        </Card>
      ))}
    </div>
  );
};

const SearchResultsList: FC<SearchResult> = ({ results, hasMore }) => {
  const { length } = results;

  const roundedLength =
    length % 3 !== 0 ? length + (3 - (Math.round(length) % 3)) : length;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuestionCardsList results={results.slice(0, roundedLength)} />
      </div>

      {!results || hasMore ? (
        <div>
          <p className="my-4">
            {"Can't find what you were looking for?"}
            <ShowMore />
            {" or "}
            <a
              href="https://www.metaculus.com/questions/create/"
              className="cursor-pointer text-blue-800 no-underline"
              target="_blank"
            >
              suggest a question on Metaculus
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
};

const InnerSearchScreen: FC<{ query: SearchQuery }> = async ({ query }) => {
  const { results, hasMore } = await getResults(query);

  return <SearchResultsList results={results} hasMore={hasMore} />;
};

export const SearchScreen: FC<{ query: SearchQuery }> = async ({ query }) => {
  return (
    <Suspense fallback={<LoadingSearchResultsList />}>
      <InnerSearchScreen query={query} />
    </Suspense>
  );
};
