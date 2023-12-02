import { FC } from "react";
import {
  getAllFunctionNames,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";
import { FnDocumentation } from "./FnDocumentation.js";

export const ModuleDocumentation: FC<{ moduleName: string }> = ({
  moduleName,
}) => {
  const fnNames = getAllFunctionNames().slice(0, 1000);
  const foo = fnNames.map(getFunctionDocumentation);
  const item = getFunctionDocumentation("Number.floor");
  //   console.log(item);

  return (
    <div className="pb-2">
      {/* <FnDocumentation documentation={item!} /> */}
      {foo.map((e, i) =>
        e ? (
          <div className="pb-2" key={i}>
            <FnDocumentation documentation={e} />
          </div>
        ) : (
          ""
        )
      )}
    </div>
  );
};
