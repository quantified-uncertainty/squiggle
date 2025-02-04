"use client";
import { FC } from "react";

import { useSearchParams } from "next/navigation";

import { defaultLimit } from "./common";
import { useUpdateSearchQuery } from "./hooks";

export const ShowMore: FC = () => {
  const updateSearchQuery = useUpdateSearchQuery();
  const searchParams = useSearchParams();
  const limit = Number(searchParams.get("limit")) || defaultLimit;

  return (
    <span
      className="cursor-pointer text-blue-800"
      onClick={() => updateSearchQuery({ limit: limit * 2 })}
    >
      {" Show more,"}
    </span>
  );
};
