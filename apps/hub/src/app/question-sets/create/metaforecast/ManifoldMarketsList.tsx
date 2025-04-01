"use client";

import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { usePaginator } from "@/lib/hooks/usePaginator";
import { Paginated } from "@/lib/types";
import { QuestionDTO } from "@/metaforecast-questions/data/manifold-questions";

export const ManifoldMarketsList: FC<{
  page: Paginated<QuestionDTO>;
}> = ({ page }) => {
  const { items: markets, loadNext } = usePaginator(page);

  return (
    <div>
      <div className="space-y-2">
        {markets.map((question) => (
          <div key={question.id}>
            <a className="text-blue-500 hover:underline" href={question.url}>
              {question.question}
            </a>
            <div className="whitespace-pre-line text-sm text-gray-500">
              {question.textDescription}
            </div>
          </div>
        ))}
      </div>
      {loadNext && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
