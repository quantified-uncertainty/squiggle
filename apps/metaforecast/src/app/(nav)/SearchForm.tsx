"use client";
import debounce from "lodash/debounce";
import React, { FC, use, useState } from "react";

import { type PlatformConfig } from "@/backend/types";

import { MultiSelectPlatform } from "../../web/common/MultiSelectPlatform";
import { ButtonsForStars } from "../../web/display/ButtonsForStars";
import { SliderElement } from "../../web/display/SliderElement";
import { SearchQuery } from "./common";
import { useSearchQuery, useUpdateSearchQuery } from "./hooks";
import { QueryForm } from "./QueryForm";
import { SearchUIContext } from "./SearchUIProvider";

export type Props = {
  platformsConfig: PlatformConfig[];
};

export const SearchForm: FC<Props> = ({ platformsConfig }) => {
  // This is used _only_ to set the initial values of the form.
  // It shouldn't be used for `updateRoute` calls - the values could be stale because search params update asynchronously.
  // In other words, the form is uncontrolled.
  const searchQuery = useSearchQuery(
    platformsConfig.map((platform) => platform.name)
  );

  /* States */
  const [advancedOptions, showAdvancedOptions] = useState(false);

  const updateSearchQuery = useUpdateSearchQuery();

  const submit = debounce((patch: Partial<SearchQuery>) => {
    updateSearchQuery(patch);
  }, 300);

  const onChangeStars = (value: number) => {
    submit({ starsThreshold: value });
  };

  /* Change the forecast threshold */
  const displayFunctionNumForecasts = (value: number) => {
    return "# Forecasts > " + Math.round(value);
  };
  const onChangeSliderForNumForecasts = (value: number) => {
    submit({
      forecastsThreshold: Math.round(value),
    });
  };

  const onChangeSearchText = (value: string) => {
    submit({
      query: value,
    });
  };

  const onChangeSelectedPlatforms = (value: string[]) => {
    submit({
      forecastingPlatforms: value,
    });
  };

  const { showId, setShowId } = use(SearchUIContext);

  const onChangeShowId = () => setShowId(!showId);

  return (
    <div>
      <label className="mb-4 mt-4 flex flex-row justify-center items-center">
        <div className="w-10/12 mb-2">
          <QueryForm
            defaultValue={searchQuery.query}
            onChange={onChangeSearchText}
            placeholder="Find forecasts about..."
          />
        </div>

        <div className="w-2/12 flex justify-center ml-4 md:ml-2 lg:ml-0">
          <button
            className="text-gray-500 text-sm mb-2"
            onClick={() => showAdvancedOptions(!advancedOptions)}
          >
            Advanced options ▼
          </button>
        </div>
      </label>

      {advancedOptions && (
        <div className="flex-1 flex-col mx-auto justify-center items-center w-full">
          <div className="grid sm:grid-rows-4 sm:grid-cols-1 md:grid-rows-2 lg:grid-rows-2 grid-cols-1 md:grid-cols-3 lg:grid-cols-3 items-center content-center bg-gray-50 rounded-md px-8 pt-4 pb-1 shadow mb-4">
            <div className="flex row-start-1 row-end-1  col-start-1 col-end-4 md:row-span-1 md:col-start-1 md:col-end-1 md:row-start-1 md:row-end-1 lg:row-span-1 lg:col-start-1 lg:col-end-1 lg:row-start-1 lg:row-end-1 items-center justify-center mb-4">
              <SliderElement
                onChange={onChangeSliderForNumForecasts}
                defaultValue={searchQuery.forecastsThreshold}
                displayFunction={displayFunctionNumForecasts}
              />
            </div>
            <div className="flex row-start-2 row-end-2 col-start-1 col-end-4 md:row-start-1 md:row-end-1 md:col-start-2 md:col-end-2 lg:row-start-1 lg:row-end-1 lg:col-start-2 items-center justify-center mb-4">
              <ButtonsForStars
                onChange={onChangeStars}
                value={searchQuery.starsThreshold}
              />
            </div>
            <div className="flex col-span-3 items-center justify-center">
              <MultiSelectPlatform
                platformsConfig={platformsConfig}
                value={searchQuery.forecastingPlatforms}
                onChange={onChangeSelectedPlatforms}
              />
            </div>
            <button
              className="block col-start-1 col-end-4 md:col-start-2 md:col-end-3 md:row-start-4 md:row-end-4 lg:col-start-2 lg:col-end-3 lg:row-start-4 lg:row-end-4 bg-transparent hover:bg-blue-300 text-blue-400 hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded mt-5 p-10 text-center mb-2 mr-10 ml-10 items-center justify-center"
              onClick={onChangeShowId}
            >
              Toggle show id
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
