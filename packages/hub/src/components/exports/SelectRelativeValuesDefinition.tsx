import { FC, useEffect } from "react";
import { FieldPathByValue, FieldValues, useFormContext } from "react-hook-form";
import { useRelayEnvironment } from "react-relay";
import { fetchQuery, graphql } from "relay-runtime";

import { SelectFormField } from "@quri/ui";

import {
  SelectRelativeValuesDefinitionQuery,
  SelectRelativeValuesDefinitionQuery$data,
} from "@/__generated__/SelectRelativeValuesDefinitionQuery.graphql";
import { SelectOwnerOption } from "../SelectOwner";

const Query = graphql`
  query SelectRelativeValuesDefinitionQuery(
    $input: RelativeValuesDefinitionsQueryInput!
  ) {
    relativeValuesDefinitions(input: $input) {
      edges {
        node {
          id
          slug
        }
      }
    }
  }
`;

export type SelectRelativeValuesDefinitionOption =
  SelectRelativeValuesDefinitionQuery$data["relativeValuesDefinitions"]["edges"][number]["node"];

const DefinitionInfo: FC<{ option: SelectRelativeValuesDefinitionOption }> = ({
  option,
}) => <div>{option.slug}</div>;

export function SelectRelativeValuesDefinition<
  TValues extends FieldValues = never,
>({
  name,
  label,
  ownerFieldName,
}: {
  name: FieldPathByValue<TValues, SelectRelativeValuesDefinitionOption | null>;
  label?: string;
  ownerFieldName: FieldPathByValue<TValues, SelectOwnerOption | null>;
}) {
  const { watch, resetField } = useFormContext<TValues>();
  const environment = useRelayEnvironment();
  const owner: SelectOwnerOption | null = watch(ownerFieldName);

  const loadOptions = async (
    inputValue: string
  ): Promise<SelectRelativeValuesDefinitionOption[]> => {
    if (!owner) {
      return [];
    }
    const result = await fetchQuery<SelectRelativeValuesDefinitionQuery>(
      environment,
      Query,
      {
        input: {
          owner: owner.slug,
          slugContains: inputValue,
        },
      }
    ).toPromise();

    if (!result) {
      return [];
    }

    return result.relativeValuesDefinitions.edges.map((edge) => edge.node);
  };

  useEffect(() => {
    resetField(name);
  }, [name, owner, resetField]);

  return (
    <SelectFormField<TValues, SelectRelativeValuesDefinitionOption | null>
      key={owner?.slug ?? " "} // re-render the component when owner changes; this helps with default select options on initial open
      name={name}
      label={label}
      required
      async
      loadOptions={loadOptions}
      disabled={!owner}
      renderOption={(option) => <DefinitionInfo option={option} />}
    />
  );
}
