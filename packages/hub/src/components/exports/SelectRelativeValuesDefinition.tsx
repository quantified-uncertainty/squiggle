"use client";
import { FC } from "react";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import { OptionProps, SingleValueProps, components } from "react-select";
import AsyncSelect from "react-select/async";
import { fetchQuery, graphql } from "relay-runtime";

import { ControlledFormField } from "@quri/ui";

import { environment } from "@/graphql/relayEnvironment";
import {
  SelectRelativeValuesDefinitionQuery,
  SelectRelativeValuesDefinitionQuery$data,
} from "@/__generated__/SelectRelativeValuesDefinitionQuery.graphql";

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

type Option =
  SelectRelativeValuesDefinitionQuery$data["relativeValuesDefinitions"]["edges"][number]["node"];

const DefinitionInfo: FC<{ option: Option }> = ({ option }) => (
  <div>{option.slug}</div>
);

const Option = ({ children, ...props }: OptionProps<Option>) => {
  return (
    <components.Option {...props}>
      <DefinitionInfo option={props.data} />
    </components.Option>
  );
};

const SingleValue = ({
  children,
  ...props
}: SingleValueProps<Option, false>) => {
  return (
    <components.SingleValue {...props}>
      <DefinitionInfo option={props.data} />
    </components.SingleValue>
  );
};

export function SelectRelativeValuesDefinition<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
  TUserName extends FieldPath<TValues> = FieldPath<TValues>
>({
  name,
  label,
  userFieldName,
}: {
  name: TName;
  label?: string;
  userFieldName: TUserName;
}) {
  const { watch } = useFormContext();
  const username = watch(userFieldName);

  const loadOptions = async (inputValue: string): Promise<Option[]> => {
    if (!username) {
      return [];
    }
    const result = await fetchQuery<SelectRelativeValuesDefinitionQuery>(
      environment,
      Query,
      {
        input: {
          ownerUsername: username,
          slugContains: inputValue,
        },
      }
    ).toPromise();

    if (!result) {
      return [];
    }

    return result.relativeValuesDefinitions.edges.map((edge) => edge.node);
  };

  return (
    <ControlledFormField name={name} label={label} rules={{ required: true }}>
      {({ onChange }) => (
        <AsyncSelect
          components={{ SingleValue, Option }}
          loadOptions={loadOptions}
          onChange={(user) => onChange(user?.slug)}
          isDisabled={!username}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
          menuPortalTarget={document.body}
        />
      )}
    </ControlledFormField>
  );
}
