import SiteBrand from "../components/site-brand";
import Link from "../components/safe-link";
import { articles } from "../lib/articles";

const nav = [["আর্কাইভ", "/archive"], ["স্মৃতির খাতা", "/memories"], ["পরিচিতি", "/about"]];

function excerpt(article: (typeof articles)[number]) {
  const words = (article.body.find(section => section.paragraphs.length)?.paragraphs[0] ?? "").trim().split(/\s+/);
  return words.length > 22 ? `${words.slice(0, 22).join(" ")}…` : words.join(" ");
}

export default function Home() {
  const recentArticles = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title, "bn")).slice(0, 3);
  return <main className="site-shell home-page">
    <header className="site-header">
      <SiteBrand />
      <nav aria-label="প্রধান নেভিগেশন">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    </header>
    <section className="home-hero" aria-labelledby="home-title">
      <h1 id="home-title">জিয়াউদ্দীন আহমেদের<span>কলাম ও প্রবন্ধ</span></h1>
      <div className="home-discovery">
        <p>সমাজ, রাজনীতি, অর্থনীতি ও জীবনের নানা প্রসঙ্গে প্রকাশিত লেখার সংকলন।</p>
        <form className="home-search" action="/archive" method="get" role="search" aria-label="লেখা খুঁজুন">
          <label htmlFor="home-search">শিরোনাম বা বিষয় দিয়ে খুঁজুন</label>
          <div className="home-search-controls"><input id="home-search" type="search" name="q" placeholder="বাংলায় খুঁজুন…" /><button type="submit">খুঁজুন <span aria-hidden="true">→</span></button></div>
        </form>
      </div>
    </section>
    <section className="home-recent" aria-labelledby="home-recent-title">
      <header className="home-section-header"><div><p className="home-collection-count">সংগ্রহে {articles.length.toLocaleString("bn-BD")}টি লেখা</p><h2 id="home-recent-title">সাম্প্রতিক লেখা</h2></div><Link className="text-link" href="/archive">সব লেখা দেখুন <span aria-hidden="true">↗</span></Link></header>
      <div className="home-recent-grid">{recentArticles.map(article => <article className="home-recent-item" key={article.slug}>
        <p className="home-article-meta"><span>{article.publication}</span><span aria-hidden="true"> · </span><time dateTime={article.publishedAt}>{article.publishedDateLabel}</time></p>
        <h3><Link href={`/articles/${article.slug}`}>{article.title}<span className="home-article-arrow" aria-hidden="true">↗</span></Link></h3>
        <p className="home-article-excerpt">{excerpt(article)}</p>
      </article>)}</div>
    </section>
    <footer className="site-footer"><span>জিয়ার দৃষ্টিতে</span><span>© ২০২৬ · <Link href="/policies">নীতি ও যোগাযোগ</Link></span></footer>
  </main>;
}
