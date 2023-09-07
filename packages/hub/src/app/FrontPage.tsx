"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { FrontPageQuery } from "@/__generated__/FrontPageQuery.graphql";
import { FrontPageDefinitionList } from "./FrontPageDefinitionList";
import { FrontPageModelList } from "./FrontPageModelList";

import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { StyledTab } from "@quri/ui";
import { FrontPageGroupList } from "./FrontPageGroupList";

const Query = graphql`
  query FrontPageQuery {
    ...FrontPageModelList
    ...FrontPageDefinitionList
    ...FrontPageGroupList
  }
`;

export const FrontPage: FC<{
  query: SerializablePreloadedQuery<FrontPageQuery>;
}> = ({ query }) => {
  const [data] = usePageQuery(Query, query);

  return (
    <div className="space-y-8">
      <StyledTab.Group>
        <StyledTab.List>
          <StyledTab name="Models" />
          <StyledTab name="Definitions" />
          <StyledTab name="Groups" />
        </StyledTab.List>
        <div className="mt-4">
          <StyledTab.Panels>
            <StyledTab.Panel>
              <FrontPageModelList dataRef={data} />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <FrontPageDefinitionList dataRef={data} />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <FrontPageGroupList dataRef={data} />
            </StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </StyledTab.Group>
    </div>
  );
};
