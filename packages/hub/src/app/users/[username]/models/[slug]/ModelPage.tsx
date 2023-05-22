import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";
import { useSession } from "next-auth/react";

import { DropdownMenu } from "@quri/ui";

import { EntityInfo } from "@/components/EntityInfo";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { DropdownButton } from "@/components/ui/DropdownButton";
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

type CommonProps = {
  username: string;
  slug: string;
};

const MenuButton: FC<CommonProps> = ({ username, slug }) => {
  return (
    <DropdownButton>
      {({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction
            username={username}
            slug={slug}
            close={close}
          />
          <DeleteModelAction username={username} slug={slug} close={close} />
        </DropdownMenu>
      )}
    </DropdownButton>
  );
};

type Props = PropsWithChildren<CommonProps>;

export const ModelPage: FC<Props> = ({ username, slug, children }) => {
  const { data: session } = useSession();

  return (
    <WithTopMenu>
      <div className="flex items-center gap-4 max-w-2xl mx-auto">
        <EntityInfo slug={slug} username={username} />
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
        {session?.user.username === username ? (
          <MenuButton username={username} slug={slug} />
        ) : null}
      </div>
      {children}
    </WithTopMenu>
  );
};
