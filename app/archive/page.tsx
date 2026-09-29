"use client";

import { useMemo, useState } from "react";
import { articles } from "../../lib/articles";

const allPublicationsLabel = "সব প্রকাশনা";
const allYearsLabel = "সব বছর";
const bengaliDigits = "০১২৩৪৫৬৭৮৯";

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("bn-BD")
    .normalize("NFKC")
    .replace(/[\u200c\u200d]/g, "")
    .replace(/[০-৯]/g, (digit) => String(bengaliDigits.indexOf(digit)))
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function articleSearchScore(article: (typeof articles)[number], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;
  const bodyText = article.body.flatMap((section) => [section.heading ?? "", ...section.paragraphs]).join(" ");
  const title = normalizeSearchText(article.title);
  const metadata = normalizeSearchText(`${article.author} ${article.publication} ${article.section} ${article.publishedAt} ${article.publishedDateLabel} ${article.slug} ${article.originalUrl}`);
  const haystack = `${title} ${metadata} ${normalizeSearchText(bodyText)}`;
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const matchedTokens = tokens.filter((token) => haystack.includes(token));
  if (matchedTokens.length !== tokens.length) return 0;
  let score = matchedTokens.length / Math.max(tokens.length, 1);
  if (title.includes(normalizedQuery)) score += 12;
  if (metadata.includes(normalizedQuery)) score += 5;
  score += matchedTokens.filter((token) => title.includes(token)).length * 4;
  return score;
}

export default function ArchivePage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState({
    publication: allPublicationsLabel,
    year: allYearsLabel,
  });
  const hasFilters = query.trim().length > 0 || activeFilter.publication !== allPublicationsLabel || activeFilter.year !== allYearsLabel;
  const filteredArticles = useMemo(() => articles
    .map((article, index) => ({ article, index, score: articleSearchScore(article, query) }))
    .filter(({ article, score }) => (query.trim() === "" || score > 0)
      && (activeFilter.publication === allPublicationsLabel || article.publication === activeFilter.publication)
      && (activeFilter.year === allYearsLabel || article.publishedAt.startsWith(activeFilter.year)))
    .sort((a, b) => query.trim() === "" ? a.index - b.index : b.score - a.score || a.index - b.index)
    .map(({ article }) => article), [activeFilter, query]);
  const resultLabel = useMemo(() => hasFilters ? `এই খোঁজে ${filteredArticles.length.toLocaleString("bn-BD")} লেখা` : `সূচি · ${filteredArticles.length.toLocaleString("bn-BD")} লেখা`, [filteredArticles.length, hasFilters]);
  const publications = [...new Set(articles.map((article) => article.publication).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bn-BD"));
  const years = [...new Set(articles.map((article) => article.publishedAt.slice(0, 4)).filter(Boolean))].sort().reverse();
  const resetFilters = () => {
    setQuery("");
    setActiveFilter({ publication: allPublicationsLabel, year: allYearsLabel });
  };

  return <main className="site-shell">
    <header className="site-header">
      <a className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></a>
      <nav aria-label="প্রধান নেভিগেশন"><a href="/archive">আর্কাইভ</a><a href="/memories">স্মৃতির খাতা</a><a href="/about">পরিচিতি</a></nav>
      <a className="header-action" href="/">হোম <span>↗</span></a>
    </header>
    <section className="page-wrap">
      <div className="page-heading"><p className="eyebrow">{resultLabel}</p><h1>প্রকাশিত লেখার<br /><em>আর্কাইভ</em></h1></div>
      <div className="archive-toolbar" role="search" aria-label="আর্কাইভ অনুসন্ধান">
        <label className="sr-only" htmlFor="archive-search">বাংলায় খুঁজুন</label>
        <input id="archive-search" aria-label="শিরোনাম বা বিষয় দিয়ে খুঁজুন" placeholder="শিরোনাম বা বিষয় দিয়ে খুঁজুন…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <label className="filter-control"><span className="sr-only">প্রকাশনা</span><select aria-label="প্রকাশনা" value={activeFilter.publication} onChange={(event) => setActiveFilter((current) => ({ ...current, publication: event.target.value }))}><option value={allPublicationsLabel}>{allPublicationsLabel}</option>{publications.map((publication) => <option key={publication} value={publication}>{publication}</option>)}</select></label>
        <label className="filter-control"><span className="sr-only">বছর</span><select aria-label="বছর" value={activeFilter.year} onChange={(event) => setActiveFilter((current) => ({ ...current, year: event.target.value }))}><option value={allYearsLabel}>{allYearsLabel}</option>{years.map((year) => <option key={year} value={year}>{year.replace(/\d/g, (digit) => bengaliDigits[Number(digit)])}</option>)}</select></label>
        {hasFilters && <button type="button" className="archive-reset" onClick={resetFilters}>সব মুছুন</button>}
      </div>
      <div className="archive-status-strip"><span className="live-dot" /> <span>শুধু যাচাইকৃত ও অনুমতিপ্রাপ্ত রেকর্ড প্রকাশিত হবে</span><span className="status-count">{filteredArticles.length.toLocaleString("bn-BD")}</span></div>
      {filteredArticles.length === 0 ? <div className="empty-panel"><div className="empty-stamp">০</div><div><p className="eyebrow">ফলাফল নেই</p><h2>এই খোঁজের সঙ্গে কোনো লেখা মেলেনি</h2><p>অন্য শব্দ বা ফিল্টার দিয়ে আবার চেষ্টা করুন। নতুন উৎস যাচাই হলে এই ফলাফল নিজে থেকেই আপডেট হবে।</p></div></div> : <div className="archive-results">{filteredArticles.map((article) => <article className="content-card" key={article.slug}><h2><a className="archive-article-link" href={`/articles/${article.slug}`}>{article.title}</a></h2><div className="article-meta"><time dateTime={article.publishedAt}>{article.publishedDateLabel}</time></div></article>)}</div>}
    </section>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><a href="/policies">কপিরাইট ও যোগাযোগ</a></span></footer>
  </main>;
}
