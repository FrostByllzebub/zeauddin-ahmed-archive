import Link from "./safe-link";

/** Shared wordmark keeps the identity consistent across public and editorial pages. */
export default function SiteBrand() {
  return <Link className="brand" href="/" aria-label="জিয়ার দৃষ্টিতে — সমাজ, সময় ও মানুষের কথা — হোম">
    <img className="brand-pen" src="/brand-pen.svg" width="48" height="48" alt="" aria-hidden="true" />
    <span><strong>জিয়ার দৃষ্টিতে</strong><small>সমাজ, সময় ও মানুষের কথা</small></span>
  </Link>;
}
