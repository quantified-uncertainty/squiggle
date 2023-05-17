import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelInfo } from "@/components/ModelInfo";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRevisionRoute } from "@/routes";
import { ModelRevisionsListQuery } from "@gen/ModelRevisionsListQuery.graphql";
import { format, formatDistance } from "date-fns";
import { commonDateFormat } from "@/lib/utils";

const ModelRevisionsListQuery = graphql`
  query ModelRevisionsListQuery($input: QueryModelInput!) {
    model(input: $input) {
      id
      revisions {
        edges {
          node {
            # TODO - fragment
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
  }
`;

type Props = {
  username: string;
  slug: string;
};

export const ModelRevisionsList: FC<Props> = ({ username, slug }) => {
  const data = useLazyLoadQuery<ModelRevisionsListQuery>(
    ModelRevisionsListQuery,
    {
      input: { ownerUsername: username, slug },
    }
  );

  return (
    <div>
      <ModelInfo slug={slug} username={username} />
      <div className="mt-4 mb-2 font-medium">Revision history</div>
      <div className="space-y-2">
        {data.model.revisions.edges.map((edge, i) => (
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
        {data.model.revisions.pageInfo.hasNextPage && (
          <div>{"There's more, but pagination is not implemented yet"}</div>
        )}
      </div>
    </div>
  );
};
