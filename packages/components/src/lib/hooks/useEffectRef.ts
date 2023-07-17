/*
 * MIT License
 *
 * Copyright (c) 2019 Baidu EFE team
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Copied from https://github.com/ecomfe/react-hooks/blob/2dae90c2fa543f66898edf92a0fec19753776580/packages/effect-ref/src/index.ts
// (via https://github.com/KurtGokhan/rfcs/blob/main/text/0000-callback-ref-cleanup.md#existing-workarounds)
// When React 18.3 is released, this can be removed and replaced with ref cleanup functions.

import { useCallback, useRef } from "react";

export type EffectRef<E extends HTMLElement = HTMLElement> = (
  element: E | null
) => void;

export type RefCallback<E extends HTMLElement = HTMLElement> = (
  element: E
) => (() => void) | void;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export function useEffectRef<E extends HTMLElement = HTMLElement>(
  callback: RefCallback<E>
): EffectRef<E> {
  const disposeRef = useRef<() => void>(noop);
  const effect = useCallback(
    (element: E | null) => {
      disposeRef.current();
      // To ensure every dispose function is called only once.
      disposeRef.current = noop;

      if (element) {
        const dispose = callback(element);

        if (typeof dispose === "function") {
          disposeRef.current = dispose;
        }
        // Have an extra type check to work with javascript.
        else if (dispose !== undefined) {
          // eslint-disable-next-line no-console
          console.warn(
            "Effect ref callback must return undefined or a dispose function"
          );
        }
      }
    },
    [callback]
  );

  return effect;
}
