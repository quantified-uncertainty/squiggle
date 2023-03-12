import { SquiggleEditor } from "@quri/squiggle-components";
import { FC } from "react";

export const Estimate: FC<{
  code: string;
  setCode: (code: string) => void;
}> = ({ code, setCode }) => {
  return <SquiggleEditor code={code} onCodeChange={(code) => setCode(code)} />;
};
