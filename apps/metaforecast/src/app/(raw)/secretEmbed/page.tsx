import React from "react";

import { SearchDocument } from "@/app/(nav)/queries.generated";
import { getPlatforms } from "@/backend/platforms/registry";
import { QuestionFragment } from "@/web/fragments.generated";
import { QuestionCard } from "@/web/questions/components/QuestionCard";
import { getUrqlRscClient } from "@/web/urql";

interface Props {
  results: QuestionFragment[];
}

export default async function ({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;
  const initialQueryParameters = {
    query: "",
    starsThreshold: 2,
    forecastsThreshold: 0,
    forecastingPlatforms: getPlatforms().map((platform) => platform.name),
    ...searchParams,
  };

  let results: QuestionFragment[] = [];
  if (initialQueryParameters.query !== "") {
    const client = getUrqlRscClient();

    const response = await client
      .query(SearchDocument, {
        input: {
          ...initialQueryParameters,
          limit: 1,
        },
      })
      .toPromise();
    if (response.data?.result) {
      results = response.data.result;
    } else {
      throw new Error("GraphQL request failed");
    }
  }

  const result = results.length ? results[0] : null;

  return (
    <div className="mb-4 mt-8 flex flex-row justify-center items-center">
      <div className="w-6/12 place-self-center">
        <div>
          <div id="secretEmbed">
            {result ? (
              <QuestionCard
                question={result}
                showTimeStamp={true}
                expandFooterToFullWidth={true}
                showExpandButton={false}
              />
            ) : null}
          </div>
          <br></br>
          <div id="secretObject">
            {result ? JSON.stringify(result, null, 4) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
