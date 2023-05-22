import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { Button, DotsHorizontalIcon, Dropdown, DropdownMenu } from "@quri/ui";

import { ModelInfo } from "@/components/ModelInfo";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { modelEditRoute, modelRevisionsRoute, modelRoute } from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";

export const ModelPageFragment = graphql`
  fragment ModelPage on Model {
    id
    slug
    owner {
      username
    }
    ...ModelContent
  }
`;

export const ModelPageQuery = graphql`
  query ModelPageQuery($input: QueryModelInput!) {
    model(input: $input) {
      ...ModelPage
    }
  }
`;

type Props = PropsWithChildren<{
  username: string;
  slug: string;
}>;

export const ModelPage: FC<Props> = ({ username, slug, children }) => {
  return (
    <WithTopMenu>
      <div className="flex items-center gap-4 max-w-2xl mx-auto">
        <ModelInfo slug={slug} username={username} />
        <StyledTabLink.List>
          <StyledTabLink name="View" href={modelRoute({ username, slug })} />
          <StyledTabLink
            name="Edit"
            href={modelEditRoute({ username, slug })}
          />
          <StyledTabLink
            name="Revisions"
            href={modelRevisionsRoute({ username, slug })}
          />
        </StyledTabLink.List>
        <Dropdown
          render={({ close }) => (
            <DropdownMenu>
              <UpdateModelSlugAction
                username={username}
                slug={slug}
                close={close}
              />
              <DeleteModelAction
                username={username}
                slug={slug}
                close={close}
              />
            </DropdownMenu>
          )}
          tailwindSelector="squiggle-hub"
        >
          <Button>
            <DotsHorizontalIcon className="text-slate-500" />
          </Button>
        </Dropdown>
      </div>
      {children}
    </WithTopMenu>
  );
};
