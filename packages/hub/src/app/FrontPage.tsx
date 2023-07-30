"use client";
import { FC } from "react";
import { usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import FrontPageQueryNode, {
  FrontPageQuery,
} from "@/__generated__/FrontPageQuery.graphql";
import { FrontPageDefinitionList } from "./FrontPageDefinitionList";
import { FrontPageModelList } from "./FrontPageModelList";

import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { StyledTab } from "@quri/ui";

const Query = graphql`
  query FrontPageQuery {
    ...FrontPageModelList
    ...FrontPageDefinitionList
  }
`;

export const FrontPage: FC<{
  query: SerializablePreloadedQuery<typeof FrontPageQueryNode, FrontPageQuery>;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const data = usePreloadedQuery(Query, queryRef);

  return (
    <div className="space-y-8">
      <StyledTab.Group>
        <StyledTab.List>
          <StyledTab name="Models" />
          <StyledTab name="Definitions" />
        </StyledTab.List>
        <div className="mt-4">
          <StyledTab.Panels>
            <StyledTab.Panel>
              {<FrontPageModelList dataRef={data} />}
            </StyledTab.Panel>
            <StyledTab.Panel>
              {<FrontPageDefinitionList dataRef={data} />}
            </StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </StyledTab.Group>
    </div>
  );
};
