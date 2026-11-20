import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * False in the server HTML and until React has hydrated the component, then true. Lets a
 * control stay disabled while its event handlers are not attached yet.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
