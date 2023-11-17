import ReactMarkdown from "react-markdown";
import { widgetRegistry } from "./registry.js";
import { truncateStr } from "./utils.js";

widgetRegistry.register("String", {
  Preview: (value) => (
    <div className="overflow-ellipsis overflow-hidden">
      {truncateStr(value.value, 20)}
    </div>
  ),
  Chart: (value) => (
    <div className="text-neutral-800 text-sm px-2 py-1 my-1">
      <ReactMarkdown className="prose max-w-4xl">{value.value}</ReactMarkdown>
    </div>
  ),
});
