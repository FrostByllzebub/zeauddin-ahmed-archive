import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { legacyArticleSlugs } from "./lib/articleRedirects";
import legacyImageRedirects from "./lib/legacyImageRedirects.json";

export function middleware(request: NextRequest) {
  const image = (legacyImageRedirects as Record<string, string>)[request.nextUrl.pathname];
  if (image) {
    const url = request.nextUrl.clone();
    url.pathname = image;
    return NextResponse.redirect(url, 301);
  }
  const match = request.nextUrl.pathname.match(/^\/articles\/([^/]+)$/);
  const legacySlug = match?.[1];
  const canonicalSlug = legacySlug ? legacyArticleSlugs[legacySlug] : undefined;
  if (!canonicalSlug) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/articles/${canonicalSlug}`;
  return NextResponse.redirect(url, 301);
}

export const config = { matcher: ["/articles/:path*"] };
