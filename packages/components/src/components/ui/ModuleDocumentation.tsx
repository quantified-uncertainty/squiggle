import { FC } from "react";
import {
  getAllFunctionNames,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";
import { FnDocumentation } from "./FnDocumentation.js";

export const ModuleDocumentation: FC<{ moduleName: string }> = ({
  moduleName,
}) => {
  const fnNames = getAllFunctionNames().slice(0, 100);
  const foo = fnNames.map(getFunctionDocumentation);

  return (
    <div>
      {foo.map((e, i) =>
        e ? <FnDocumentation documentation={e} key={i} /> : ""
      )}
    </div>
  );
};
