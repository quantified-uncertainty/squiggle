import { FC, useContext, useMemo } from "react";

import { TID } from "../../../shared/testIds.js";
import { SegmentedControl } from "../../components/SegmentedControl.js";
import { WorkspaceContext } from "../../lib/workspaceTypes.js";
import type { StudioViewContext } from "../types.js";
import {
  DEFAULT_RV_TAB,
  getRelativeValuesExports,
  RV_TABS,
  type RvTab,
  selectSpec,
  useRvFileState,
} from "./rvState.js";

// The toolbar root; the view's focuser looks for it (§4.5: the relative
// values view region is focused at its toolbar's segmented control).
export const RV_TOOLBAR_SELECTOR = "[data-rv-toolbar]";

// The relative values view's controls in the editor header (§3.6, #57): the
// spec picker (when the file has several specs) and List / Grid / Plot, the
// same segmented control as the view switcher and Output's Cards/List. The
// dashboard itself is rendered without its own tab bar or title.
export const RvToolbar: FC<{ context: StudioViewContext }> = ({ context }) => {
  const root = useContext(WorkspaceContext)?.rootInfo?.root;
  const { runOutput, filePath, embed, initial } = context;
  const [state, update] = useRvFileState(root, filePath, { initial, embed });
  const found = useMemo(
    () => (runOutput ? getRelativeValuesExports(runOutput.output) : []),
    [runOutput]
  );
  const selected = selectSpec(found, state.variable);

  return (
    // Part of the view's focus region: F6 to the view lands on the tabs.
    <div
      className="flex items-center gap-2"
      data-studio-region="view"
      data-rv-toolbar=""
    >
      {found.length > 1 && selected && (
        <select
          data-testid={TID.rvSpecPicker}
          aria-label="Relative values spec"
          title="Relative values spec"
          className="form-select h-6 w-auto max-w-[14rem] truncate rounded border-slate-300 py-0 pl-2 pr-7 text-xs text-slate-700 focus:border-slate-400 focus:ring-0"
          value={selected.name}
          onChange={(e) => update({ variable: e.target.value })}
        >
          {found.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
              {f.spec.ok ? "" : " (invalid)"}
            </option>
          ))}
        </select>
      )}
      <SegmentedControl<RvTab>
        label="Relative values tab"
        options={RV_TABS.map((tab) => ({
          value: tab.id,
          label: tab.label,
          testId: TID.rvTab,
          attrs: { "data-tab": tab.id },
        }))}
        value={state.tab ?? DEFAULT_RV_TAB}
        onChange={(tab) => update({ tab })}
      />
    </div>
  );
};
