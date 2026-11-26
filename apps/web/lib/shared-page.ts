/**
 * Set by the proxy on a shared child's page (/share/<token>), so the layout shows the public
 * frame there whoever opens it: no app navigation, no demo banner. The proxy removes it from
 * every incoming request first.
 */
export const SHARED_PAGE_HEADER = "x-notch-shared-page";

export const isSharedPath = (pathname: string): boolean => pathname.startsWith("/share/");
