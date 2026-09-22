import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle } from "../../../lib/articles";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return <main className="site-shell">
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link><nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/memories">স্মৃতির খাতা</Link><Link href="/about">পরিচিতি</Link></nav><Link className="header-action" href="/archive">আর্কাইভ <span>↗</span></Link></header>
    <article className="article-page page-wrap">
      <div className="page-heading"><h1>{article.title}</h1></div>
      <figure className="article-hero"><img src={article.heroImage} alt={article.title} /><figcaption>{article.heroCaption}</figcaption></figure>
       <div className="content-columns"><div className="content-card article-body">{article.body.map((section, index) => <section key={index}>{section.heading && <h2>{section.heading}</h2>}{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div><aside className="admin-card"><p className="eyebrow">লেখাটির পরিচিতি</p><dl><div><dt>প্রকাশনা</dt><dd>{article.publication}</dd></div><div><dt>বিভাগ</dt><dd>{article.section}</dd></div><div><dt>লেখক</dt><dd>{article.author}</dd></div><div><dt>প্রকাশের তারিখ</dt><dd>{article.publishedDateLabel}</dd></div><div><dt>সংরক্ষণ অবস্থা</dt><dd>পূর্ণ লেখা</dd></div><div className="admin-link-row"><dt>মূল প্রকাশনার URL</dt><dd><a href={article.originalUrl} target="_blank" rel="noreferrer">{article.originalUrl}</a></dd></div></dl></aside></div>
    </article>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><Link href="/policies">কপিরাইট ও যোগাযোগ</Link></span></footer>
  </main>;
}
