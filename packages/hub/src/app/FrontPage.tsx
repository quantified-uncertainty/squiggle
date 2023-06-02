"use client";
import { useSession } from "next-auth/react";
import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { FrontPageQuery } from "@/__generated__/FrontPageQuery.graphql";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { StyledLink } from "@/components/ui/StyledLink";
import { newDefinitionRoute, newModelRoute } from "@/routes";
import { FrontPageDefinitionList } from "./FrontPageDefinitionList";
import { FrontPageModelList } from "./FrontPageModelList";

const Query = graphql`
  query FrontPageQuery {
    ...FrontPageModelList
    ...FrontPageDefinitionList
  }
`;

export const FrontPage: FC = () => {
  const { data: session } = useSession();

  const data = useLazyLoadQuery<FrontPageQuery>(
    Query,
    {},
    { fetchPolicy: "store-and-network" }
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <FrontPageModelList dataRef={data} />
        {session ? (
          <div>
            <StyledLink href={newModelRoute()}>Create new model</StyledLink>
          </div>
        ) : null}
      </div>
      <div className="space-y-4">
        <FrontPageDefinitionList dataRef={data} />
        {session ? (
          <div>
            <StyledLink href={newDefinitionRoute()}>
              Create new relative values definition
            </StyledLink>
          </div>
        ) : null}
      </div>
    </div>
  );
};
