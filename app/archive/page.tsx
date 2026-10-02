"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "../../components/safe-link";
import { archiveMetadata } from "../../lib/archiveMetadata";
import { normalizeSearchText, searchTokens } from "../../lib/search-normalization";

const allPublicationsLabel = "সব প্রকাশনা";
const allYearsLabel = "সব বছর";
const bengaliDigits = "০১২৩৪৫৬৭৮৯";
type SearchRecord = { slug: string; searchText: string };

function displayYear(year: string) {
  return year.replace(/\d/g, (digit) => bengaliDigits[Number(digit)]);
}

function matchesQuery(record: SearchRecord, query: string) {
  const tokens = searchTokens(query);
  return tokens.length > 0 && tokens.every((token) => record.searchText.includes(token));
}

function searchScore(record: SearchRecord, metadata: (typeof archiveMetadata)[number], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const title = normalizeSearchText(metadata.title);
  let score = 1;
  if (title === normalizedQuery) score += 100;
  else if (title.includes(normalizedQuery)) score += 40;
  if (record.searchText.includes(normalizedQuery)) score += 8;
  return score;
}

export default function ArchivePage() {
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchRecord[] | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [activeFilter, setActiveFilter] = useState({ publication: allPublicationsLabel, year: allYearsLabel });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFilters = query.trim().length > 0 || activeFilter.publication !== allPublicationsLabel || activeFilter.year !== allYearsLabel;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // URL query state is external input; initialize it after hydration to keep
    // the server-rendered archive markup identical to the first client render.
    setQuery(params.get("q") ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveFilter({
      publication: params.get("publication") || allPublicationsLabel,
      year: params.get("year") || allYearsLabel,
    });
  }, []);

  useEffect(() => {
    if (!query.trim() || searchIndex || indexError) return;
    let cancelled = false;
    void fetch("/search-index.json", { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
        return response.json() as Promise<SearchRecord[]>;
      })
      .then((records) => { if (!cancelled) setSearchIndex(records); })
      .catch(() => { if (!cancelled) setIndexError(true); });
    return () => { cancelled = true; };
  }, [indexError, query, searchIndex]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeFilter.publication !== allPublicationsLabel) params.set("publication", activeFilter.publication);
    if (activeFilter.year !== allYearsLabel) params.set("year", activeFilter.year);
    const next = params.toString() ? `/archive?${params.toString()}` : "/archive";
    window.history.replaceState(null, "", next);
  }, [activeFilter, query]);

  const publications = [...new Set(archiveMetadata.map((article) => article.publication).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bn-BD"));
  const years = [...new Set(archiveMetadata.map((article) => article.publishedAt.slice(0, 4)).filter(Boolean))].sort().reverse();
  const filteredArticles = useMemo(() => {
    const queryActive = Boolean(query.trim());
    if (queryActive && !searchIndex) return [];
    const records = searchIndex ?? [];
    return archiveMetadata
      .map((article, index) => ({ article, index, record: records[index] }))
      .filter(({ article, record }) =>
        (!queryActive || Boolean(record && matchesQuery(record, query)))
        && (activeFilter.publication === allPublicationsLabel || article.publication === activeFilter.publication)
        && (activeFilter.year === allYearsLabel || article.publishedAt.startsWith(activeFilter.year)),
      )
      .sort((a, b) => queryActive
        ? searchScore(b.record!, b.article, query) - searchScore(a.record!, a.article, query) || a.index - b.index
        : a.index - b.index);
  }, [activeFilter, query, searchIndex]);

  const resetFilters = () => {
    if (searchInputRef.current) searchInputRef.current.value = "";
    setQuery("");
    setActiveFilter({ publication: allPublicationsLabel, year: allYearsLabel });
  };
  const resultLabel = hasFilters ? `এই খোঁজে ${filteredArticles.length.toLocaleString("bn-BD")} লেখা` : `সূচি · ${archiveMetadata.length.toLocaleString("bn-BD")} লেখা`;
  const loadingSearch = Boolean(query.trim()) && !searchIndex && !indexError;

  return <main className="site-shell">
    <header className="site-header">
      <Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link>
      <nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/memories">স্মৃতির খাতা</Link><Link href="/about">পরিচিতি</Link></nav>
      <Link className="header-action" href="/">হোম <span>↗</span></Link>
    </header>
    <section className="page-wrap">
      <div className="page-heading"><p className="eyebrow">{resultLabel}</p><h1>প্রকাশিত লেখার<br /><em>আর্কাইভ</em></h1></div>
      <div className="archive-toolbar" role="search" aria-label="আর্কাইভ অনুসন্ধান">
        <label className="sr-only" htmlFor="archive-search">বাংলায় খুঁজুন</label>
        <input ref={searchInputRef} id="archive-search" type="search" inputMode="search" aria-label="শিরোনাম বা বিষয় দিয়ে খুঁজুন" placeholder="শিরোনাম বা বিষয় দিয়ে খুঁজুন…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <label className="filter-control"><span className="sr-only">প্রকাশনা</span><select aria-label="প্রকাশনা" value={activeFilter.publication} onChange={(event) => setActiveFilter((current) => ({ ...current, publication: event.target.value }))}><option value={allPublicationsLabel}>{allPublicationsLabel}</option>{publications.map((publication) => <option key={publication} value={publication}>{publication}</option>)}</select></label>
        <label className="filter-control"><span className="sr-only">বছর</span><select aria-label="বছর" value={activeFilter.year} onChange={(event) => setActiveFilter((current) => ({ ...current, year: event.target.value }))}><option value={allYearsLabel}>{allYearsLabel}</option>{years.map((year) => <option key={year} value={year}>{displayYear(year)}</option>)}</select></label>
        {hasFilters && <button type="button" className="archive-reset" onClick={resetFilters}>সব মুছুন</button>}
      </div>
      <div className="archive-status-strip" aria-live="polite"><span className="live-dot" /> <span>{indexError ? "সার্চ ইনডেক্স লোড হয়নি" : loadingSearch ? "লেখাগুলো খোঁজা হচ্ছে…" : "শুধু যে লেখাগুলোতে খোঁজার শব্দ আছে সেগুলো দেখানো হচ্ছে"}</span><span className="status-count">{filteredArticles.length.toLocaleString("bn-BD")}</span></div>
      {indexError ? <div className="empty-panel"><div className="empty-stamp" aria-hidden="true">!</div><div><p className="eyebrow">সাময়িক সমস্যা</p><h2>সার্চ প্রস্তুত করা যাচ্ছে না</h2><p>পৃষ্ঠাটি পুনরায় লোড করে আবার চেষ্টা করুন।</p></div></div> : filteredArticles.length === 0 ? <div className="empty-panel"><div className="empty-stamp" aria-hidden="true">০</div><div><p className="eyebrow">{loadingSearch ? "খোঁজা হচ্ছে" : "ফলাফল নেই"}</p><h2>{loadingSearch ? "লেখাগুলোতে শব্দটি খোঁজা হচ্ছে" : "এই খোঁজের সঙ্গে কোনো লেখা মেলেনি"}</h2><p>{loadingSearch ? "এক মুহূর্ত অপেক্ষা করুন।" : "অন্য শব্দ বা ফিল্টার দিয়ে আবার চেষ্টা করুন।"}</p></div></div> : <div className="archive-results">{filteredArticles.map(({ article }) => <article className="content-card" key={article.slug}><h2><Link className="archive-article-link" href={`/articles/${article.slug}`}>{article.title}</Link></h2><div className="article-meta"><time dateTime={article.publishedAt}>{article.publishedDateLabel}</time></div></article>)}</div>}
    </section>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><Link href="/policies">কপিরাইট ও যোগাযোগ</Link></span></footer>
  </main>;
}
