import {
  getModelCode,
  GraphModel,
  updateModelCommonCode,
  updateModelNode,
} from "@/model/utils";
import { SquiggleEditor } from "@quri/squiggle-components";
import clsx from "clsx";
import { FC, Fragment, PropsWithChildren, useMemo } from "react";
import { useInterfaceContext } from "../Interface/InterfaceProvider";
import { Button } from "../ui/Button";
import { EstimateProps } from "./types";

const Label: FC<PropsWithChildren<{ error?: boolean }>> = ({
  children,
  error,
}) => (
  <label
    className={clsx(
      "font-mono font-bold text-xs pt-2 text-right",
      error && "text-red-500"
    )}
  >
    {children}
  </label>
);

const Separator: FC = () => (
  <div className="col-span-full border-b border-gray-200 my-8" />
);

export const GraphModelEditor: FC<EstimateProps<GraphModel>> = ({
  model,
  setModel,
}) => {
  const { catalog } = useInterfaceContext();

  const code = useMemo(() => getModelCode(model), [model]);

  const getAnchor = (id: string) => `estimate-${id}`;

  const eject = () => setModel({ mode: "text", code, author: model.author });

  return (
    <div>
      <div
        className="grid grid-cols-2 gap-x-4"
        style={{
          gridTemplateColumns: "minmax(200px, min-content) 600px",
        }}
      >
        <div className="flex flex-col items-end mt-4">
          <Label>Common code</Label>
        </div>
        <SquiggleEditor
          code={model.commonCode}
          onCodeChange={(code) =>
            setModel(updateModelCommonCode({ model, code }))
          }
          hideViewer
          // className="w-full border border-gray-200 rounded p-1"
        />
        <Separator />

        {catalog.items.map((item) => {
          const node = model.nodes.get(item.id);

          return (
            <Fragment key={item.id}>
              <a id={getAnchor(item.id)}>
                <div className="flex flex-col items-end mt-4">
                  <Label error={model.invalidIds.has(item.id)}>{item.id}</Label>
                  {node && node.dependencies.length ? (
                    <div className="text-xs text-right mt-1">
                      Dependencies:{" "}
                      {node.dependencies.map((id, i) => (
                        <a
                          href={`#${getAnchor(id)}`}
                          className={clsx(
                            model.invalidIds.has(id) && "text-red-500"
                          )}
                        >
                          {id}
                          {i === node.dependencies.length - 1 ? "" : ", "}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </a>
              {node ? (
                <SquiggleEditor
                  code={node.code}
                  onCodeChange={(code) =>
                    setModel(
                      updateModelNode({
                        model,
                        nodeId: item.id,
                        code,
                        catalog,
                      })
                    )
                  }
                  hideViewer
                />
              ) : (
                <div className="text-red-500 col-span-2">missing node</div>
              )}
            </Fragment>
          );
        })}
        <Separator />

        <div className="flex flex-col items-end gap-2">
          <Label>Generated code</Label>
          {/* TODO - confirmation */}
          <Button onClick={eject}>Eject</Button>
        </div>
        <pre className="p-2 bg-gray-100 text-xs overflow-auto">{code}</pre>
      </div>
    </div>
  );
};
