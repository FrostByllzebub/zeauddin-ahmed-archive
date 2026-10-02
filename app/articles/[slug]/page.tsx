import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle } from "../../../lib/articles";
import { legacyArticleSlugs } from "../../../lib/articleRedirects";
import { brokenSourceUrls } from "../../../lib/brokenSourceUrls";

const siteOrigin = "https://zeauddinahmed.com";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

function articleDescription(article: NonNullable<ReturnType<typeof getArticle>>) {
  const firstParagraph = article.body.find((section) => section.paragraphs.length)?.paragraphs[0] ?? article.title;
  return firstParagraph.length > 160 ? `${firstParagraph.slice(0, 157)}…` : firstParagraph;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(legacyArticleSlugs[slug] ?? slug);
  if (!article) return {};
  const canonical = `/articles/${article.slug}`;
  const description = articleDescription(article);
  return { title: `${article.title} | জিয়ার কলাম`, description, authors: [{ name: article.author }], alternates: { canonical }, openGraph: { type: "article", url: canonical, title: article.title, description, publishedTime: article.publishedAt, authors: [article.author], section: article.section, images: [{ url: article.heroImage, alt: article.title }] }, twitter: { card: "summary", title: article.title, description, images: [article.heroImage] } };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(legacyArticleSlugs[slug] ?? slug);
  if (!article) notFound();
  const ordered = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title, "bn"));
  const currentIndex = ordered.findIndex((item) => item.slug === article.slug);
  const newerArticle = currentIndex > 0 ? ordered[currentIndex - 1] : undefined;
  const olderArticle = currentIndex >= 0 ? ordered[currentIndex + 1] : undefined;
  const sections = article.body.map((section, index) => ({ ...section, headingId: section.heading ? `article-section-${index}` : undefined }));
  const headings = sections.filter((section) => section.heading && section.headingId);
  const sourceUrl = article.displayOriginalUrl || article.originalUrl;
  const sourceUnavailable = brokenSourceUrls.has(article.originalUrl);
  const description = articleDescription(article);
  const structuredData = { "@context": "https://schema.org", "@type": "Article", headline: article.title, description, datePublished: article.publishedAt, author: { "@type": "Person", name: article.author }, publisher: { "@type": "Organization", name: "জিয়ার কলাম", url: siteOrigin }, isPartOf: { "@type": "WebSite", name: "জিয়ার কলাম", url: siteOrigin }, mainEntityOfPage: `${siteOrigin}/articles/${article.slug}` };

  return <main className="site-shell">
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link><nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/memories">স্মৃতির খাতা</Link><Link href="/about">পরিচিতি</Link></nav><Link className="header-action" href="/archive">আর্কাইভ <span aria-hidden="true">↗</span></Link></header>
    <article className="article-page page-wrap">
      <nav className="article-breadcrumb" aria-label="লেখার অবস্থান"><Link href="/archive">← আর্কাইভে ফিরুন</Link><span aria-hidden="true">/</span><span aria-current="page">{article.title}</span></nav>
      <div className="page-heading"><p className="eyebrow">{article.publication} · {article.publishedDateLabel}</p><h1>{article.title}</h1></div>
      <figure className="article-hero"><img src={article.heroImage} alt={article.title} /><figcaption className="sr-only">{article.heroCaption || article.title}</figcaption></figure>
      <div className="content-columns"><div className="content-card article-body">
        {headings.length > 0 && <nav className="article-toc" aria-label="এই লেখার অংশসমূহ"><p className="eyebrow">লেখার অংশ</p><ol>{headings.map((section) => <li key={section.headingId}><a href={`#${section.headingId}`}>{section.heading}</a></li>)}</ol></nav>}
        {sections.map((section, index) => <section key={index}>{section.heading && <h2 id={section.headingId}>{section.heading}</h2>}{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      </div><aside className="admin-card" aria-label="লেখাটির পরিচিতি"><p className="eyebrow">লেখাটির পরিচিতি</p><dl><div><dt>প্রকাশনা</dt><dd>{article.publication}</dd></div><div><dt>লেখক</dt><dd>{article.author}</dd></div><div><dt>প্রকাশের তারিখ</dt><dd><time dateTime={article.publishedAt}>{article.publishedDateLabel}</time></dd></div>{(sourceUrl || sourceUnavailable) && <div><dt>মূল উৎস</dt><dd>{sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer noopener" aria-label={`মূল উৎস খুলুন: ${article.title}`}>মূল পাতা <span aria-hidden="true">↗</span></a>}{sourceUnavailable && <span className="source-status source-status-broken">শেষ যাচাইয়ে মূল উৎসের লিংকটি অচল পাওয়া গেছে</span>}</dd></div>}</dl></aside></div>
      <nav className="article-neighbors" aria-label="লেখা পরিবর্তন"><div>{olderArticle && <><span className="eyebrow">আগের লেখা</span><Link href={`/articles/${olderArticle.slug}`}>← {olderArticle.title}</Link></>}</div><div>{newerArticle && <><span className="eyebrow">পরের লেখা</span><Link href={`/articles/${newerArticle.slug}`}>{newerArticle.title} →</Link></>}</div></nav>
    </article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><Link href="/policies">কপিরাইট ও যোগাযোগ</Link></span></footer>
  </main>;
}
