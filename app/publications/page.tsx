import Link from "../../components/safe-link";

// Static hosts cannot send HTTP redirects; Sites redirects before rendering.
export default function RetiredPublicationsPage() {
  return (
    <main className="site-shell page-wrap">
      <meta httpEquiv="refresh" content="0;url=/archive" />
      <p>
        প্রকাশনা অনুযায়ী লেখা খুঁজতে <Link href="/archive">আর্কাইভে যান →</Link>
      </p>
    </main>
  );
}
