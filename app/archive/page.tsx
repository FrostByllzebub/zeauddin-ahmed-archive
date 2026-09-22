"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { articles } from "../../lib/articles";

const filters = ["publication", "year", "type"] as const;

export default function ArchivePage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({
    publication: "সব প্রকাশনা",
    year: "সব বছর",
    type: "সব ধরনের লেখা",
  });
  const hasFilters = query.trim().length > 0 || Object.values(activeFilter).some((value) => !value.startsWith("সব"));
  const filteredArticles = useMemo(() => articles.filter((article) => {
    const haystack = `${article.title} ${article.author} ${article.publication} ${article.section}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase())
      && (activeFilter.publication === "সব প্রকাশনা" || article.publication === activeFilter.publication)
      && (activeFilter.year === "সব বছর" || article.publishedAt.startsWith(activeFilter.year))
      && (activeFilter.type === "সব ধরনের লেখা" || article.section === activeFilter.type);
  }), [activeFilter, query]);
  const resultLabel = useMemo(() => hasFilters ? `এই খোঁজে ${filteredArticles.length.toLocaleString("bn-BD")} লেখা` : `সূচি · ${filteredArticles.length.toLocaleString("bn-BD")} লেখা`, [filteredArticles.length, hasFilters]);

  return <main className="site-shell">
    <header className="site-header">
      <Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link>
      <nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/memories">স্মৃতির খাতা</Link><Link href="/about">পরিচিতি</Link></nav>
      <Link className="header-action" href="/">হোম <span>↗</span></Link>
    </header>
    <section className="page-wrap">
      <div className="page-heading"><p className="eyebrow">{resultLabel}</p><h1>প্রকাশিত লেখার<br /><em>আর্কাইভ</em></h1><p>বিষয়, প্রকাশনা, বছর বা লেখার ধরন দিয়ে খুঁজুন। যাচাই শেষ না হওয়া পর্যন্ত কোনো রেকর্ড জনসমক্ষে দেখানো হয় না।</p></div>
      <div className="archive-toolbar" role="search" aria-label="আর্কাইভ অনুসন্ধান">
        <label className="sr-only" htmlFor="archive-search">বাংলায় খুঁজুন</label>
        <input id="archive-search" aria-label="বাংলায় খুঁজুন" placeholder="শিরোনাম বা বিষয় দিয়ে খুঁজুন…" value={query} onChange={(event) => setQuery(event.target.value)} />
        {filters.map((filter) => <label className="filter-control" key={filter}><span className="sr-only">{filter}</span><select aria-label={filter} value={activeFilter[filter]} onChange={(event) => setActiveFilter((current) => ({ ...current, [filter]: event.target.value }))}><option>{filter === "publication" ? "সব প্রকাশনা" : filter === "year" ? "সব বছর" : "সব ধরনের লেখা"}</option>{filter === "publication" && <option>সংবাদ</option>}{filter === "year" && <option>২০২৬</option>}{filter === "type" && <option>মতামত</option>}</select></label>)}
      </div>
      <div className="archive-status-strip"><span className="live-dot" /> <span>শুধু যাচাইকৃত ও অনুমতিপ্রাপ্ত রেকর্ড প্রকাশিত হবে</span><span className="status-count">{filteredArticles.length.toLocaleString("bn-BD")}</span></div>
      {filteredArticles.length === 0 ? <div className="empty-panel"><div className="empty-stamp">০</div><div><p className="eyebrow">ফলাফল নেই</p><h2>এই খোঁজের সঙ্গে কোনো লেখা মেলেনি</h2><p>অন্য শব্দ বা ফিল্টার দিয়ে আবার চেষ্টা করুন। নতুন উৎস যাচাই হলে এই ফলাফল নিজে থেকেই আপডেট হবে।</p></div></div> : <div className="archive-results">{filteredArticles.map((article) => <article className="content-card" key={article.slug}><div><p className="eyebrow">{article.section} · {article.publication}</p><h2><Link href={`/articles/${article.slug}`}>{article.title}</Link></h2><p>{article.summary}</p><div className="article-meta"><span>{article.author}</span><span>{article.publishedDateLabel}</span></div></div><Link className="text-link" href={`/articles/${article.slug}`}>লেখাটি দেখুন ↗</Link></article>)}</div>}
    </section>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><Link href="/policies">কপিরাইট ও যোগাযোগ</Link></span></footer>
  </main>;
}
