import { vArray } from "../../value/index.js";
import { ValueTags } from "../../value/valueTags.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqArrayValue, SqValue, wrapValue } from "./index.js";

export class SqTags {
  constructor(
    private readonly tags: ValueTags,
    public context?: SqValueContext
  ) {}

  name(): string | undefined {
    return this.tags.name();
  }

  doc(): SqArrayValue | undefined {
    const doc = this.tags.doc();
    const arr = doc ? new SqArrayValue(vArray(doc), this.context) : undefined;
    if (arr) {
      arr._value = arr._value.mergeTags({ notebook: true });
    }
    return arr || undefined;
  }

  showAs(): SqValue | undefined {
    const showAs = this.tags.showAs();
    return showAs ? wrapValue(showAs, this.context) : undefined;
  }

  numberFormat(): string | undefined {
    return this.tags.numberFormat();
  }

  dateFormat(): string | undefined {
    return this.tags.dateFormat();
  }

  hidden(): boolean | undefined {
    return this.tags.hidden();
  }

  notebook(): boolean | undefined {
    return this.tags.notebook();
  }
}
