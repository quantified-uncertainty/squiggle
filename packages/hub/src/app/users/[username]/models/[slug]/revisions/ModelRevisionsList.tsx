import { FC } from "react";
import { useLazyLoadQuery, usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelRevisionsList$key } from "@/__generated__/ModelRevisionsList.graphql";
import { EntityInfo } from "@/components/EntityInfo";
import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/utils";
import { modelRevisionRoute } from "@/routes";
import { ModelRevisionsListQuery } from "@gen/ModelRevisionsListQuery.graphql";
import { Button } from "@quri/ui";
import { format } from "date-fns";

const RevisionsFragment = graphql`
  fragment ModelRevisionsList on Model
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "ModelRevisionsListPaginationQuery") {
    revisions(first: $count, after: $cursor)
      @connection(key: "ModelRevisionsList_revisions") {
      edges {
        node {
          id
          dbId
          createdAtTimestamp
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const ModelRevisionsListQuery = graphql`
  query ModelRevisionsListQuery($input: QueryModelInput!) {
    model(input: $input) {
      id
      ...ModelRevisionsList
    }
  }
`;

type Props = {
  username: string;
  slug: string;
};

export const ModelRevisionsList: FC<Props> = ({ username, slug }) => {
  const { model: modelRef } = useLazyLoadQuery<ModelRevisionsListQuery>(
    ModelRevisionsListQuery,
    {
      input: { ownerUsername: username, slug },
    },
    { fetchPolicy: "store-and-network" }
  );

  const { data: model, loadNext } = usePaginationFragment<
    ModelRevisionsListQuery,
    ModelRevisionsList$key
  >(RevisionsFragment, modelRef);

  return (
    <div>
      <div className="mt-4 mb-2 font-medium">Revision history</div>
      <div className="space-y-2">
        {model.revisions.edges.map((edge) => (
          <div key={edge.node.dbId}>
            <StyledLink
              href={modelRevisionRoute({
                username,
                slug,
                revisionId: edge.node.dbId,
              })}
            >
              {format(new Date(edge.node.createdAtTimestamp), commonDateFormat)}
            </StyledLink>
          </div>
        ))}
        {model.revisions.pageInfo.hasNextPage && (
          <Button onClick={() => loadNext(20)}>Load more</Button>
        )}
      </div>
    </div>
  );
};
