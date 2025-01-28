import React from 'react';

import {
  getPlatforms,
  getPlatformsConfig,
} from '@/backend/platforms/registry';

import { searchParamsToQuery } from './common';
import { SearchForm } from './SearchForm';
import { SearchScreen } from './SearchScreen';
import { SearchUIProvider } from './SearchUIProvider';

export default async function IndexPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;
  const searchQuery = searchParamsToQuery(
    searchParams,
    getPlatforms().map((platform) => platform.name)
  );

  return (
    <SearchUIProvider>
      <SearchForm platformsConfig={getPlatformsConfig()} />
      <SearchScreen query={searchQuery} />
    </SearchUIProvider>
  );
}
