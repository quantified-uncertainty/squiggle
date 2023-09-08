import { FC, PropsWithChildren } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RelativeValuesExportItem$key } from "@/__generated__/RelativeValuesExportItem.graphql";
import { relativeValuesRoute } from "@/routes";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";

export const RelativeValuesExportItemFragment = graphql`
  fragment RelativeValuesExportItem on RelativeValuesExport {
    id
    variableName
    definition {
      id
      owner {
        id
        slug
      }
      slug
    }
  }
`;

const Container: FC<PropsWithChildren> = ({ children }) => (
  <div className="px-4 py-2 hover:bg-slate-100">
    <div className="text-slate-600 group-hover:text-slate-900 text-sm font-medium">
      {children}
    </div>
  </div>
);

const RawItem: FC = () => <Container>Raw view</Container>;

type Props = {
  itemRef?: RelativeValuesExportItem$key;
};

const NonEmptyItem: FC<Required<Props>> = ({ itemRef }) => {
  const item = useFragment(RelativeValuesExportItemFragment, itemRef);

  return (
    <Container>
      {item.variableName} &rarr;{" "}
      <StyledDefinitionLink
        href={relativeValuesRoute({
          owner: item.definition.owner.slug,
          slug: item.definition.slug,
        })}
      >
        {item.definition.owner.slug}/{item.definition.slug}
      </StyledDefinitionLink>
    </Container>
  );
};

export const RelativeValuesExportItem: FC<Props> = ({ itemRef }) => {
  return itemRef ? <NonEmptyItem itemRef={itemRef} /> : <RawItem />;
};
