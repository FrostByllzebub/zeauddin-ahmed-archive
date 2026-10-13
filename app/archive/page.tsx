"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "../../components/safe-link";
import { archiveMetadata } from "../../lib/archiveMetadata";
import { normalizeSearchText, searchTokens } from "../../lib/search-normalization";
import { matchingRecordIndexes, filterSearchRecords, loadSearchShard, readArchiveQuery, archiveUrl } from "../../lib/archive-search";
import type { SearchRecord, SearchShard } from "../../lib/archive-search";

const allPublicationsLabel = "সব প্রকাশনা";
const allYearsLabel = "সব বছর";
const bengaliDigits = "০১২৩৪৫৬৭৮৯";
function displayYear(year: string) {
  return year.replace(/\d/g, (digit) => bengaliDigits[Number(digit)]);
}

function searchScore(record: SearchRecord, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const title = normalizeSearchText(record.title);
  let score = 1;
  if (title === normalizedQuery) score += 100;
  else if (title.includes(normalizedQuery)) score += 40;
  if (normalizeSearchText(record.excerpt).includes(normalizedQuery)) score += 8;
  return score;
}

function highlight(text: string, query: string) {
  const tokens = searchTokens(query);
  if (!tokens.length) return text;
  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(`(${escaped})`, "giu");
  return text.split(pattern).map((part, index) => index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : part);
}

export default function ArchivePage() {
  const [urlReady, setUrlReady] = useState(false);
  const [query, setQuery] = useState("");
  const [searchRecords, setSearchRecords] = useState<SearchRecord[]>([]);
  const [loadedYears, setLoadedYears] = useState<Set<string>>(new Set());
  const [indexError, setIndexError] = useState(false);
  const [activeFilter, setActiveFilter] = useState({ publication: allPublicationsLabel, year: allYearsLabel });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFilters = query.trim().length > 0 || activeFilter.publication !== allPublicationsLabel || activeFilter.year !== allYearsLabel;

  useEffect(() => {
    const state = readArchiveQuery(new URLSearchParams(window.location.search), archiveMetadata);
    setQuery(state.query);
    setActiveFilter({ publication: state.publication || allPublicationsLabel, year: state.year || allYearsLabel });
    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!query.trim() || indexError) return;
    let cancelled = false;
    setSearchRecords([]);
    setLoadedYears(new Set());
    const requestedYear = activeFilter.year === allYearsLabel ? "all" : activeFilter.year;
    const load = fetch("/search-manifest.json", { cache: "no-cache" })
      .then(response => {
        if (!response.ok) throw new Error("Search manifest unavailable");
        return response.json() as Promise<{ years: string[]; revisions: Record<string, string> }>;
      })
      .then(manifest => {
        const years = requestedYear === "all" ? manifest.years : [requestedYear];
        if (years.some(year => !manifest.years.includes(year))) throw new Error("Unknown archive year");
        return years.map(year => loadSearchShard(year, manifest.revisions[year]));
      });
    void load
      .then((requests) => Promise.all(requests))
      .then((response) => {
        const allRecords = (response as SearchShard[]).flatMap((shard) => matchingRecordIndexes(shard, query).map((index) => shard.records[index]));
        if (!cancelled) {
          setSearchRecords(allRecords);
          setLoadedYears(new Set([requestedYear]));
        }
      })
      .catch(() => { if (!cancelled) setIndexError(true); });
    return () => { cancelled = true; };
  }, [activeFilter.year, indexError, query]);

  useEffect(() => {
    if (!urlReady) return;
    const next = archiveUrl(query,
      activeFilter.publication === allPublicationsLabel ? "" : activeFilter.publication,
      activeFilter.year === allYearsLabel ? "" : activeFilter.year);
    window.history.replaceState(null, "", next);
  }, [activeFilter, query, urlReady]);

  const publications = [...new Set(archiveMetadata.map((article) => article.publication).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bn-BD"));
  const years = [...new Set(archiveMetadata.map((article) => article.publishedAt.slice(0, 4)).filter(Boolean))].sort().reverse();
  const filteredArticles = useMemo(() => {
    const queryActive = Boolean(query.trim());
    if (queryActive && !loadedYears.size) return [];
    return filterSearchRecords(queryActive ? searchRecords : archiveMetadata.map((article) => ({ ...article, excerpt: "" })),
      activeFilter.publication === allPublicationsLabel ? "" : activeFilter.publication,
      activeFilter.year === allYearsLabel ? "" : activeFilter.year)
      .map((record, index) => {
        const article = archiveMetadata.find((candidate) => candidate.slug === record.slug);
        return article ? { record, article, index } : null;
      })
      .filter((item): item is { record: SearchRecord; article: (typeof archiveMetadata)[number]; index: number } => item !== null
        && (activeFilter.publication === allPublicationsLabel || item.article.publication === activeFilter.publication)
        && (activeFilter.year === allYearsLabel || item.article.publishedAt.startsWith(activeFilter.year)),
      )
      .sort((a, b) => queryActive
        ? searchScore(b.record, query) - searchScore(a.record, query) || a.index - b.index
        : a.index - b.index);
  }, [activeFilter, loadedYears, query, searchRecords]);

  const resetFilters = () => {
    if (searchInputRef.current) searchInputRef.current.value = "";
    setIndexError(false);
    setQuery("");
    setActiveFilter({ publication: allPublicationsLabel, year: allYearsLabel });
  };
  const resultLabel = hasFilters ? `এই খোঁজে ${filteredArticles.length.toLocaleString("bn-BD")} লেখা` : `সূচি · ${archiveMetadata.length.toLocaleString("bn-BD")} লেখা`;
  const loadingSearch = Boolean(query.trim()) && !loadedYears.size && !indexError;
  const queryActive = Boolean(query.trim());

  return <main className="site-shell">
    <header className="site-header">
      <Link className="brand" href="/"><span className="brand-mark">জে</span><span><strong>জিয়ার কলাম</strong><small>বাংলা লেখার আর্কাইভ</small></span></Link>
      <nav aria-label="প্রধান নেভিগেশন"><Link href="/archive">আর্কাইভ</Link><Link href="/memories">স্মৃতির খাতা</Link><Link href="/about">পরিচিতি</Link></nav>
      <Link className="header-action" href="/">হোম <span>↗</span></Link>
    </header>
    <section className="page-wrap">
      <div className="page-heading"><p className="eyebrow">{resultLabel}</p><h1>প্রকাশিত লেখার<br /><em>আর্কাইভ</em></h1></div>
      <div className="archive-toolbar" data-ready={urlReady} role="search" aria-label="আর্কাইভ অনুসন্ধান">
        <label className="sr-only" htmlFor="archive-search">বাংলায় খুঁজুন</label>
        <input ref={searchInputRef} id="archive-search" disabled={!urlReady} type="search" inputMode="search" aria-label="শিরোনাম বা বিষয় দিয়ে খুঁজুন" placeholder="শিরোনাম বা বিষয় দিয়ে খুঁজুন…" value={query} onChange={(event) => { setIndexError(false); setQuery(event.target.value); }} />
        <label className="filter-control"><span className="sr-only">প্রকাশনা</span><select disabled={!urlReady} aria-label="প্রকাশনা" value={activeFilter.publication} onChange={(event) => setActiveFilter((current) => ({ ...current, publication: event.target.value }))}><option value={allPublicationsLabel}>{allPublicationsLabel}</option>{publications.map((publication) => <option key={publication} value={publication}>{publication}</option>)}</select></label>
        <label className="filter-control"><span className="sr-only">বছর</span><select disabled={!urlReady} aria-label="বছর" value={activeFilter.year} onChange={(event) => setActiveFilter((current) => ({ ...current, year: event.target.value }))}><option value={allYearsLabel}>{allYearsLabel}</option>{years.map((year) => <option key={year} value={year}>{displayYear(year)}</option>)}</select></label>
        {hasFilters && <button type="button" className="archive-reset" onClick={resetFilters}>সব মুছুন</button>}
      </div>
      <div className="archive-status-strip" aria-live="polite"><span className="live-dot" /> <span>{indexError ? "সার্চ ইনডেক্স লোড হয়নি" : loadingSearch ? "লেখাগুলো খোঁজা হচ্ছে…" : "শুধু যে লেখাগুলোতে খোঁজার শব্দ আছে সেগুলো দেখানো হচ্ছে"}</span><span className="status-count">{filteredArticles.length.toLocaleString("bn-BD")}</span></div>
      {indexError ? <div className="empty-panel"><div className="empty-stamp" aria-hidden="true">!</div><div><p className="eyebrow">সাময়িক সমস্যা</p><h2>সার্চ প্রস্তুত করা যাচ্ছে না</h2><p>পৃষ্ঠাটি পুনরায় লোড করে আবার চেষ্টা করুন।</p></div></div> : filteredArticles.length === 0 ? <div className="empty-panel"><div className="empty-stamp" aria-hidden="true">০</div><div><p className="eyebrow">{loadingSearch ? "খোঁজা হচ্ছে" : "ফলাফল নেই"}</p><h2>{loadingSearch ? "লেখাগুলোতে শব্দটি খোঁজা হচ্ছে" : "এই খোঁজের সঙ্গে কোনো লেখা মেলেনি"}</h2><p>{loadingSearch ? "এক মুহূর্ত অপেক্ষা করুন।" : "অন্য শব্দ বা ফিল্টার দিয়ে আবার চেষ্টা করুন।"}</p></div></div> : <div className="archive-results">{filteredArticles.map(({ article, record }) => <article className="content-card" key={article.slug}><h2><Link className="archive-article-link" href={`/articles/${article.slug}`}>{queryActive ? highlight(record.title, query) : article.title}</Link></h2>{queryActive && record.excerpt && <p className="search-excerpt">{highlight(record.excerpt, query)}</p>}<div className="article-meta"><time dateTime={article.publishedAt}>{article.publishedDateLabel}</time></div></article>)}</div>}
    </section>
    <footer className="site-footer"><span>জিয়ার কলাম আর্কাইভ</span><span><Link href="/policies">কপিরাইট ও যোগাযোগ</Link></span></footer>
  </main>;
}
