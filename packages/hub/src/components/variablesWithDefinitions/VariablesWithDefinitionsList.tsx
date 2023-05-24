import { useFragment } from "react-relay";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";
import { definitionRoute } from "@/routes";
import { FC } from "react";
import { VariablesWithDefinitionsFragment } from "./VariablesWithDefinitions";
import { VariablesWithDefinitions$key } from "@/__generated__/VariablesWithDefinitions.graphql";

type Props = {
  dataRef: VariablesWithDefinitions$key;
};

export const VariablesWithDefinitionsList: FC<Props> = ({ dataRef }) => {
  const { variablesWithDefinitions: list } = useFragment(
    VariablesWithDefinitionsFragment,
    dataRef
  );

  return (
    <div>
      <header className="text-lg font-bold">Variables with definitions</header>
      {list.map((pair) => (
        <div key={pair.id}>
          {pair.variable} &rarr;{" "}
          <StyledDefinitionLink
            href={definitionRoute({
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
