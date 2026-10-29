import SiteBrand from "../../components/site-brand";
import Link from "../../components/safe-link";
import { MemorySubmissionForm } from "../../components/memory-submission-form";
import { MemoryCollection } from "../../components/memory-collection";
import { MemoryManagement } from "../../components/memory-management";
export default function MemoriesPage() {
  return (
    <main className="site-shell memories-page">
      <header className="site-header">
        <SiteBrand />
        <nav aria-label="প্রধান নেভিগেশন">
          <Link href="/archive">আর্কাইভ</Link>
          <Link href="/memories" aria-current="page">
            স্মৃতির খাতা
          </Link>
          <Link href="/about">পরিচিতি</Link>
        </nav>
        <Link className="header-action" href="/">
          হোম ↗
        </Link>
      </header>
      <section className="memories-hero" aria-labelledby="memories-title">
        <div>
          <h1 id="memories-title">
            স্মৃতির <em>খাতা</em>
          </h1>
          <p className="memories-description">
            কিছু মানুষকে চেনা যায় অন্যের স্মৃতিতে। জিয়াউদ্দীন আহমেদের সঙ্গে
            পরিচয়, একসঙ্গে কাজ করার অভিজ্ঞতা কিংবা মনে থেকে যাওয়া কোনো
            মুহূর্ত—আপনার গল্পে সমৃদ্ধ হোক এই স্মৃতির খাতা। একটি ছোট ঘটনা বা
            একটি আলাপও মানুষটিকে চেনার আরেকটি জানালা।
          </p>
          <div className="memory-button-row">
            <a className="button button-accent" href="#write-memory">
              আপনার স্মৃতি লিখুন →
            </a>
            <a className="text-link" href="#shared-memories">
              স্মৃতিগুলো পড়ুন ↓
            </a>
          </div>
        </div>
      </section>
      <MemoryCollection />
      <section
        className="memory-writing"
        id="write-memory"
        aria-labelledby="write-title"
      >
        <div className="memory-form-panel">
          <h2 id="write-title">আপনার গল্প</h2>
          <MemorySubmissionForm />
        </div>
      </section>
      <MemoryManagement />
      <footer className="site-footer">
        <span>জিয়ার দৃষ্টিতে</span>
        <span>
          <Link href="/policies">গোপনীয়তা ও নীতি</Link> ·{" "}
          <Link href="/admin">সম্পাদকীয় কর্মক্ষেত্র</Link>
        </span>
      </footer>
    </main>
  );
}
