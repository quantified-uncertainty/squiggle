import React from "react";
import { SquiggleEditor } from "./SquiggleEditor";
import type { SquiggleEditorProps } from "./SquiggleEditor";
import { runPartial, defaultBindings } from "@quri/squiggle-lang";
import type {
  result,
  errorValue,
  bindings as bindingsType,
} from "@quri/squiggle-lang";

function resultDefault(x: result<bindingsType, errorValue>): bindings {
  switch (x.tag) {
    case "Ok":
      return x.value;
    case "Error":
      return defaultBindings;
  }
}

export type SquiggleEditorWithImportedBindingsProps = SquiggleEditorProps & {
  bindingsImportUrl: string;
};

export const SquiggleEditorWithImportedBindings: React.FC<
  SquiggleEditorWithImportedBindingsProps
> = (props) => {
  const { bindingsImportUrl, ...editorProps } = props;
  const [bindingsResult, setBindingsResult] = React.useState({
    tag: "Ok",
    value: defaultBindings,
  } as result<bindingsType, errorValue>);
  React.useEffect(() => {
    async function retrieveBindings(fileName: string) {
      let contents = await fetch(fileName).then((response) => {
        return response.text();
      });
      setBindingsResult(runPartial(contents));
    }
    retrieveBindings(bindingsImportUrl);
  }, [bindingsImportUrl]);
  const deliveredBindings = resultDefault(bindingsResult);
  return (
    <SquiggleEditor {...{ ...editorProps, bindings: deliveredBindings }} />
  );
};
