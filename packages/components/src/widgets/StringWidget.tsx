import { SHORT_STRING_LENGTH } from "../lib/constants.js";
import MarkdownViewer from "../lib/MarkdownViewer.js";
import { widgetRegistry } from "./registry.js";
import { truncateStr } from "./utils.js";

widgetRegistry.register("String", {
  Preview: (value) => (
    <div className="overflow-ellipsis overflow-hidden">
      {truncateStr(value.value, SHORT_STRING_LENGTH)}
    </div>
  ),
  Chart: (value) => (
    <div className="text-neutral-800 px-1 py-0.5 my-1">
      <div className="max-w-4xl text-sm">
        <MarkdownViewer md={value.value} />
      </div>
    </div>
  ),
});
