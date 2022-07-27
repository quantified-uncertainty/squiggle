import React from "react";
import { SquiggleEditor } from "./SquiggleEditor";
import type { SquiggleEditorProps } from "./SquiggleEditor";
import { runPartial, defaultBindings } from "@quri/squiggle-lang";
import type { result, errorValue, bindings } from "@quri/squiggle-lang";

function resultDefault(
  x: result<bindings, errorValue>,
  defaul: bindings
): bindings {
  switch (x.tag) {
    case "Ok":
      return x.value;
    case "Error":
      return defaul;
  }
}

function replaceBindings(
  props: SquiggleEditorProps,
  newBindings: bindings
): SquiggleEditorProps {
  return { ...props, bindings: newBindings };
}

export type SquiggleEditorImportedBindingsProps = SquiggleEditorProps & {
  bindingsImportFile: string;
};

export const SquiggleEditorImportedBindings: React.FC<
  SquiggleEditorImportedBindingsProps
> = (props) => {
  const [bindingsResult, setBindingsResult] = React.useState({
    tag: "Ok" as "Ok",
    value: defaultBindings,
  } as result<bindings, errorValue>);
  React.useEffect(() => {
    async function retrieveBindings(fileName: string) {
      //: Promise<result<bindings, errorValue>> {
      let contents = await fetch(fileName).then((response) => {
        return response.text();
      });
      setBindingsResult(runPartial(contents));
    }
    retrieveBindings(props.bindingsImportFile);
  }, []);
  const deliveredBindings = resultDefault(bindingsResult, {});
  const newProps = replaceBindings(props, deliveredBindings);
  return <SquiggleEditor {...newProps} />;
};
