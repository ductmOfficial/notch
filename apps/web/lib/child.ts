import { type Child, type Db, listChildren } from "@notch/db";

/** All children and the selected one (from `?child=`, else the oldest). */
export async function getCurrentChild(
  db: Db,
  childParam: string | string[] | undefined,
): Promise<{ children: Child[]; child: Child | undefined }> {
  const children = await listChildren(db);
  return { children, child: children.find((c) => c.id === childParam) ?? children[0] };
}
