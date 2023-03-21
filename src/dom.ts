import { Optional } from "./types";

export interface ElementSize {
  width: number;
  height: number;
}

export interface HTMLElementProvider {
  getElementById(id: string): HTMLElement | null;
}

export interface FrameAnimationProvider {
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(requestID: number): void;
}

/**
 * calls `ready` when DOM is loaded
 *
 * @param ready the document and window global are passed as parameters
 * @param document
 * @returns
 */
export function onDocumentReady(
  ready: (
    document: Document,
    wnd: Optional<NonNullable<(typeof window)["document"]["defaultView"]>>
  ) => void,
  document: typeof window.document = window.document
) {
  // remove "nullness"
  const _window = document.defaultView ?? undefined;

  if (document.readyState === "loading") {
    return document.addEventListener("DOMContentLoaded", function () {
      return ready(document, _window);
    });
  }

  return ready(document, _window);
}

/**
 * convenience for narrowing element type
 * @param name
 * @param provider typically passed `document.getElementById`
 */
export function getElementById<T extends HTMLElement>(
  name: string,
  provider: HTMLElementProvider
): Optional<T> {
  const element = provider.getElementById(name);
  if (element === null) {
    return undefined;
  }

  return element as T;
}
