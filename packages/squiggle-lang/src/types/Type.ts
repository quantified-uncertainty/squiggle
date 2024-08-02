import { Value } from "../value/index.js";
import { InputType } from "../value/VInput.js";

export abstract class Type<T> {
  abstract unpack(v: Value): T | undefined;
  abstract pack(v: T): Value;

  // Default to "Bool" for "TBool" class, etc.
  // Subclasses can override this method to provide a more descriptive name.
  display() {
    const className = this.constructor.name;
    if (className.startsWith("T")) {
      return className.slice(1);
    }
    // shouldn't happen, the convention is that all types start with T
    return className;
  }

  // This check is good enough for most types (VBool, VNumber, etc.)
  // More complex types, e.g. TArray and TDict, override this method to provide a more specific check.
  isSupertype(other: Type<unknown>) {
    return other instanceof this.constructor;
  }

  isTransparent() {
    return false;
  }

  defaultFormInputCode() {
    return "";
  }

  defaultFormInputType(): InputType {
    return "text";
  }
}
