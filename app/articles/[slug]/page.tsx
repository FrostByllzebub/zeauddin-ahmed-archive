import { notFound } from "next/navigation";
import Link from "next/link";
import { articles, getArticle } from "../../../lib/articles";
import { legacyArticleSlugs } from "../../../lib/articleRedirects";
import { brokenSourceUrls } from "../../../lib/brokenSourceUrls";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const replacementSlug = legacyArticleSlugs[slug];
  // Static export cannot emit server-side 307 responses. Render the canonical
  // article at legacy paths so old links remain usable in the exported site.
  const article = getArticle(replacementSlug ?? slug);
  if (!article) notFound();

  return <main className="site-shell">
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link><nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/memories">স্মৃতির খাতা</Link><Link href="/about">পরিচিতি</Link></nav><Link className="header-action" href="/archive">আর্কাইভ <span>↗</span></Link></header>
    <article className="article-page page-wrap">
      <nav className="article-breadcrumb" aria-label="লেখার অবস্থান"><Link href="/archive">← আর্কাইভে ফিরুন</Link><span aria-hidden="true">/</span><span>{article.title}</span></nav>
      <div className="page-heading"><h1>{article.title}</h1></div>
      <figure className="article-hero"><img src={article.heroImage} alt={article.title} /></figure>
       <div className="content-columns"><div className="content-card article-body">{article.body.map((section, index) => <section key={index}>{section.heading && <h2>{section.heading}</h2>}{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div><aside className="admin-card"><p className="eyebrow">লেখাটির পরিচিতি</p><dl><div><dt>প্রকাশনা</dt><dd>{article.publication}</dd></div><div><dt>লেখক</dt><dd>{article.author}</dd></div><div><dt>প্রকাশের তারিখ</dt><dd>{article.publishedDateLabel}</dd></div>{(article.displayOriginalUrl ?? article.originalUrl) && <div><dt>মূল উৎস</dt><dd><a href={article.displayOriginalUrl ?? article.originalUrl} target="_blank" rel="noreferrer noopener" aria-label={`মূল উৎস: ${article.title}`}>মূল পাতা ↗</a>{brokenSourceUrls.has(article.displayOriginalUrl ?? article.originalUrl) && <span className="source-status source-status-broken">শেষ যাচাইয়ে মূল উৎসের লিংকটি অচল পাওয়া গেছে</span>}</dd></div>}</dl></aside></div>
    </article>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><a href="/policies">কপিরাইট ও যোগাযোগ</a></span></footer>
  </main>;
}
