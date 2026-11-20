import type { Child, Db } from "@notch/db";

import { requireViewer } from "./session";

/**
 * The signed-in family's children and the selected one (from `?child=`, else the
 * oldest). Redirects to the sign-in page when nobody is signed in.
 */
export async function getCurrentChild(
  db: Db,
  childParam: string | string[] | undefined,
): Promise<{ children: Child[]; child: Child | undefined }> {
  // The children come with the viewer, read once per request.
  const { children } = await requireViewer();
  return { children, child: children.find((c) => c.id === childParam) ?? children[0] };
}
