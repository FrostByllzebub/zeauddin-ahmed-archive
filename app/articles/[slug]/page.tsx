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
      <p className="eyebrow">{article.section} · {article.publication}</p>
      <div className="page-heading"><h1>{article.title}</h1></div>
      <div className="article-byline"><span>{article.author}</span><span>প্রকাশিত: {article.publishedAt}</span></div>
      <div className="content-columns"><div className="content-card"><p>{article.summary}</p><blockquote>{article.excerpt}</blockquote><p>{article.sourceNote}</p><a className="button button-accent" href={article.originalUrl} target="_blank" rel="noreferrer">মূল প্রকাশনায় পড়ুন <span>↗</span></a></div><aside className="admin-card"><p className="eyebrow">উৎসের তথ্য</p><dl><div><dt>প্রকাশনা</dt><dd>{article.publication}</dd></div><div><dt>বিভাগ</dt><dd>{article.section}</dd></div><div><dt>প্রকাশের তারিখ</dt><dd>{article.publishedAt}</dd></div><div><dt>সংরক্ষণ অবস্থা</dt><dd>সংক্ষিপ্তসার ও উদ্ধৃতি</dd></div></dl><p>মূল লেখাটি {article.publication}-এর ওয়েবসাইটে প্রকাশিত হয়েছে। উৎসের লিংকটি অচল হলে সম্পাদকীয় নথিতে তা আলাদাভাবে চিহ্নিত করা হবে।</p></aside></div>
    </article>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><Link href="/policies">কপিরাইট ও যোগাযোগ</Link></span></footer>
  </main>;
}
