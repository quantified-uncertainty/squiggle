"use client";
import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { FrontPageQuery } from "@/__generated__/FrontPageQuery.graphql";
import { FrontPageDefinitionList } from "./FrontPageDefinitionList";
import { FrontPageModelList } from "./FrontPageModelList";

import { StyledTab } from "@quri/ui";

const Query = graphql`
  query FrontPageQuery {
    ...FrontPageModelList
    ...FrontPageDefinitionList
  }
`;

export const FrontPage: FC = () => {
  const data = useLazyLoadQuery<FrontPageQuery>(
    Query,
    {},
    { fetchPolicy: "store-and-network" }
  );

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
