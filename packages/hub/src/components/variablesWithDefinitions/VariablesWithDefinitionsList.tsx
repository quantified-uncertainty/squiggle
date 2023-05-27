import { useFragment } from "react-relay";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";
import { relativeValuesRoute, modelForDefinitionRoute } from "@/routes";
import { FC } from "react";
import { VariablesWithDefinitionsFragment } from "./VariablesWithDefinitions";
import { VariablesWithDefinitions$key } from "@/__generated__/VariablesWithDefinitions.graphql";
import { StyledLink } from "../ui/StyledLink";

type Props = {
  modelUsername: string;
  modelSlug: string;
  dataRef: VariablesWithDefinitions$key;
};

export const VariablesWithDefinitionsList: FC<Props> = ({
  dataRef,
  modelUsername,
  modelSlug,
}) => {
  const { relativeValuesExports } = useFragment(
    VariablesWithDefinitionsFragment,
    dataRef
  );

  return (
    <div>
      <header className="text-lg font-bold">Variables with definitions</header>
      {relativeValuesExports.map((pair) => (
        <div key={pair.id}>
          <StyledLink
            href={modelForDefinitionRoute({
              username: modelUsername,
              slug: modelSlug,
              definition: {
                username: pair.definition.owner.username,
                slug: pair.definition.slug,
              },
            })}
          >
            {pair.variableName}
          </StyledLink>{" "}
          &rarr;{" "}
          <StyledDefinitionLink
            href={relativeValuesRoute({
              username: pair.definition.owner.username,
              slug: pair.definition.slug,
            })}
          >
            {pair.definition.owner.username}/{pair.definition.slug}
          </StyledDefinitionLink>
        </div>
      ))}
    </div>
  );
};
