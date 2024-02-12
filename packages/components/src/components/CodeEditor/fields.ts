import { StateEffect, StateEffectType, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect } from "react";

import { SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";

// Helper class for turning any React prop into a CodeMirror field.
// How to use:
// 1. Create a field once statically with `ReactiveStateField.define<T>(initialValue)`
// 2. Use `myField.field` as a CodeMirror extension
// 3. Call `myField.use(view, prop)` as a hook to update the field with an effect.
class ReactiveStateField<Value> {
  effect: StateEffectType<Value>;
  field: StateField<Value>;

  private constructor(initialValue: Value) {
    this.effect = StateEffect.define<Value>();
    this.field = StateField.define<Value>({
      create: () => initialValue,
      update: (value, tr) => {
        for (const e of tr.effects) if (e.is(this.effect)) value = e.value;
        return value;
      },
    });
  }

  // `Value` can't include undefined; see
  // https://codemirror.net/docs/ref/#state.StateEffect^define (We don't use
  // position mapping so maybe it's not important right now, but might be useful
  // in the future somehow.)
  static define<Value>(initialValue: Value extends undefined ? never : Value) {
    return new ReactiveStateField<Value>(initialValue);
  }

  use(view: EditorView | undefined, prop: Value) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      view?.dispatch({
        effects: this.effect.of(prop),
      });
    }, [view, prop]);
  }
}

export const simulationField = ReactiveStateField.define<Simulation | null>(
  null
);

export const onFocusByPathField = ReactiveStateField.define<
  ((path: SqValuePath) => void) | null
>(null);
