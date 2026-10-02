import type { AnchorHTMLAttributes } from "react";

type SafeLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Plain internal anchors avoid unsupported RSC prefetch behavior in static Sites exports. */
export default function SafeLink({ href, ...props }: SafeLinkProps) {
  return <a href={href} {...props} />;
}
