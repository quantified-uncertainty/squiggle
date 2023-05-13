"use client";

import { FrontpageModelListQuery } from "@gen/FrontpageModelListQuery.graphql";
import { FC } from "react";

import { graphql, useLazyLoadQuery } from "react-relay";
import { ModelList } from "./ModelList";

const query = graphql`
  query FrontpageModelListQuery {
    models {
      ...ModelListFragment
    }
  }
`;

export const FrontpageModelList: FC = () => {
  const data = useLazyLoadQuery<FrontpageModelListQuery>(
    query,
    {},
    { fetchPolicy: "store-and-network" }
  );

  return (
    <div>
      <header className="font-bold text-2xl mb-2">All models</header>
      <ModelList connection={data.models} showOwner={true} />
    </div>
  );
};
