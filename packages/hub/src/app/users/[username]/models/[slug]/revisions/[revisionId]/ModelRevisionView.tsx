import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelRevisionViewQuery } from "@gen/ModelRevisionViewQuery.graphql";
import { SquigglePlayground } from "@quri/squiggle-components";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { ModelInfo } from "@/components/ModelInfo";
import { commonDateFormat } from "@/lib/utils";
import { format } from "date-fns";
import { modelRoute } from "@/routes";
import { StyledLink } from "@/components/ui/StyledLink";

const ModelRevisionViewQuery = graphql`
  query ModelRevisionViewQuery($input: QueryModelInput!, $revisionId: ID!) {
    model(input: $input) {
      id
      revision(id: $revisionId) {
        __typename
        ... on SquiggleSnippet {
          createdAtTimestamp
          code
        }
      }
    }
  }
`;

type Props = {
  username: string;
  slug: string;
  revisionId: string;
};

export const ModelRevisionView: FC<Props> = ({
  username,
  slug,
  revisionId,
}) => {
  const data = useLazyLoadQuery<ModelRevisionViewQuery>(
    ModelRevisionViewQuery,
    {
      input: { ownerUsername: username, slug },
      revisionId,
    }
  );

  const typename = data.model.revision.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }

  return (
    <WithTopMenu>
      <div className="flex gap-4 items-baseline">
        <ModelInfo username={username} slug={slug} />
        <div className="flex gap-2">
          <div className="text-xs">
            Version from{" "}
            {format(data.model.revision.createdAtTimestamp, commonDateFormat)}
          </div>
          <StyledLink className="text-xs" href={modelRoute({ username, slug })}>
            Go to latest version
          </StyledLink>
        </div>
      </div>
      <SquigglePlayground
        code={undefined as any} // code is optional in SquigglePlayground but marked as required due to Typescript bug
        defaultCode={data.model.revision.code}
      />
    </WithTopMenu>
  );
};
