// Retired public routes remain reachable through permanent redirects.
export const retiredSitePaths = [
  "/publications",
  "/publications/",
  "/publications.html",
] as const;

export function retiredSiteRedirect(request: Request): Response | undefined {
  const url = new URL(request.url);
  if (!retiredSitePaths.some((path) => path === url.pathname)) return;
  url.pathname = "/archive";
  return Response.redirect(url.href, 301);
}
