import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { legacyArticleSlugs } from "./lib/articleRedirects";

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/articles\/([^/]+)$/);
  const legacySlug = match?.[1];
  const canonicalSlug = legacySlug ? legacyArticleSlugs[legacySlug] : undefined;
  if (!canonicalSlug) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/articles/${canonicalSlug}`;
  return NextResponse.redirect(url, 301);
}

export const config = { matcher: ["/articles/:path*"] };
